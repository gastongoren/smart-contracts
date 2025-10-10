import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    const region = process.env.AWS_REGION!;
    try {
      // Try to initialize S3Client - will fail if no AWS credentials
      this.client = new S3Client({
        region,
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        } : undefined,
      });
    } catch (error) {
      console.warn('⚠️  S3Service: AWS credentials not configured - using mock responses');
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
}

