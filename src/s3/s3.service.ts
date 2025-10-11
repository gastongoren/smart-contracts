import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { InMemoryTenantRegistry, resolveTenantConfig } from '../tenant/tenant.registry';

@Injectable({ scope: Scope.DEFAULT })
export class S3Service {
  private client: S3Client | null = null;
  private base = {
    s3Bucket: process.env.S3_BUCKET!,
    s3Prefix: (process.env.S3_PREFIX ?? 'uploads/'),
    chainRegistryAddress: process.env.CHAIN_REGISTRY_ADDRESS ?? '0x0',
  };

  constructor(@Optional() @Inject(InMemoryTenantRegistry) private registry?: InMemoryTenantRegistry) {
    const region = process.env.AWS_REGION || 'auto';
    try {
      // Initialize S3Client with support for custom endpoints (Cloudflare R2, MinIO, etc.)
      const config: any = {
        region,
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        } : undefined,
      };

      // Support for Cloudflare R2 or other S3-compatible services
      if (process.env.AWS_ENDPOINT_URL) {
        config.endpoint = process.env.AWS_ENDPOINT_URL;
        config.forcePathStyle = true; // Required for R2
        console.log(`✅ S3Service: Using custom endpoint: ${process.env.AWS_ENDPOINT_URL}`);
      }

      this.client = new S3Client(config);
      console.log('✅ S3Service: Client initialized successfully');
    } catch (error) {
      console.warn('⚠️  S3Service: Failed to initialize - using mock responses');
      console.warn('   Error:', error.message);
    }
  }

  // Direct upload from backend (buffer → R2)
  async uploadFile(params: {
    buffer: Buffer;
    contentType: string;
    ext?: string;
    userId?: string;
    reqTenant?: { id: string };
  }): Promise<{ key: string; bucket: string; url: string; tenantId: string }> {
    const { buffer, contentType, ext = '', userId, reqTenant } = params;
    const tenantCfg = resolveTenantConfig(this.base, this.registry?.getTenant(reqTenant?.id ?? 'core'));
    const key = `${tenantCfg.s3Prefix}${userId ? `${userId}/` : ''}${randomUUID()}${ext}`;

    // If no S3 client (dev mode), return mock response
    if (!this.client) {
      let mockUrl;
      if (process.env.R2_PUBLIC_DOMAIN) {
        mockUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
      } else {
        mockUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${tenantCfg.s3Bucket}/${key}`;
      }
      console.log('⚠️  S3: Mock upload (no credentials)');
      return { key, bucket: tenantCfg.s3Bucket, url: mockUrl, tenantId: reqTenant?.id ?? 'core' };
    }

    try {
      // Upload directly to R2/S3
      await this.client.send(
        new PutObjectCommand({
          Bucket: tenantCfg.s3Bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      // Build public URL (adjust based on your R2 configuration)
      let publicUrl;
      if (process.env.R2_PUBLIC_DOMAIN) {
        publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
      } else if (process.env.AWS_ENDPOINT_URL) {
        publicUrl = `${process.env.AWS_ENDPOINT_URL}/${tenantCfg.s3Bucket}/${key}`;
      } else {
        publicUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${tenantCfg.s3Bucket}/${key}`;
      }

      return { key, bucket: tenantCfg.s3Bucket, url: publicUrl, tenantId: reqTenant?.id ?? 'core' };
    } catch (error) {
      console.error('❌ S3 upload failed:', error);
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }
  }

  // reqTenant: pasar desde controller (req.tenant)
  async createPresignedPutUrl(params: {
    contentType: string;
    ext?: string;
    userId?: string;
    reqTenant?: { id: string };
  }) {
    const { contentType, ext = '', userId, reqTenant } = params;
    const tenantCfg = resolveTenantConfig(this.base, this.registry?.getTenant(reqTenant?.id ?? 'core'));
    const key = `${tenantCfg.s3Prefix}${userId ? `${userId}/` : ''}${randomUUID()}${ext}`;
    
    // If no S3 client (dev mode), return mock response
    if (!this.client) {
      const mockUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${tenantCfg.s3Bucket}/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=MOCK`;
      return { 
        url: mockUrl, 
        key, 
        bucket: tenantCfg.s3Bucket, 
        contentType, 
        expiresIn: 300, 
        tenantId: reqTenant?.id ?? 'core',
        mock: true 
      };
    }
    
    try {
      const cmd = new PutObjectCommand({ Bucket: tenantCfg.s3Bucket, Key: key, ContentType: contentType });
      const url = await getSignedUrl(this.client, cmd, { expiresIn: 300 });
      return { url, key, bucket: tenantCfg.s3Bucket, contentType, expiresIn: 300, tenantId: reqTenant?.id ?? 'core' };
    } catch (error) {
      // Fallback to mock if AWS call fails
      console.warn('⚠️  S3 presigned URL generation failed, returning mock URL');
      const mockUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${tenantCfg.s3Bucket}/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=MOCK`;
      return { 
        url: mockUrl, 
        key, 
        bucket: tenantCfg.s3Bucket, 
        contentType, 
        expiresIn: 300, 
        tenantId: reqTenant?.id ?? 'core',
        mock: true 
      };
    }
  }

  // Generate presigned GET URL for downloading files
  async createPresignedGetUrl(params: {
    key: string;
    expiresIn?: number;
    reqTenant?: { id: string };
  }): Promise<{ url: string; expiresIn: number; bucket: string }> {
    const { key, expiresIn = 3600, reqTenant } = params;
    const tenantCfg = resolveTenantConfig(this.base, this.registry?.getTenant(reqTenant?.id ?? 'core'));

    // If R2.dev public domain is configured, return public URL
    if (process.env.R2_PUBLIC_DOMAIN) {
      const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
      return { url: publicUrl, expiresIn: 0, bucket: tenantCfg.s3Bucket };
    }

    // If no S3 client (dev mode), return mock response
    if (!this.client) {
      const mockUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${tenantCfg.s3Bucket}/${key}`;
      return { url: mockUrl, expiresIn, bucket: tenantCfg.s3Bucket };
    }

    try {
      const cmd = new GetObjectCommand({ Bucket: tenantCfg.s3Bucket, Key: key });
      const url = await getSignedUrl(this.client, cmd, { expiresIn });
      return { url, expiresIn, bucket: tenantCfg.s3Bucket };
    } catch (error) {
      console.warn('⚠️  S3 presigned GET URL generation failed, returning mock URL');
      const mockUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${tenantCfg.s3Bucket}/${key}`;
      return { url: mockUrl, expiresIn, bucket: tenantCfg.s3Bucket };
    }
  }
}

