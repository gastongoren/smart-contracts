import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { z } from 'zod';
import { FirebaseGuard } from '../auth/firebase.guard';
import { S3Service } from './s3.service';

const PresignSchema = z.object({
  contentType: z.string().min(3),
  ext: z.string().optional(),
  userId: z.string().optional(),
});

class PresignDto {
  @ApiProperty({
    description: 'MIME type of the file to upload',
    example: 'application/pdf',
  })
  @IsString()
  contentType!: string;

  @ApiProperty({
    description: 'File extension (including the dot)',
    example: '.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  ext?: string;

  @ApiProperty({
    description: 'User ID to organize files by user. If not provided, uses the authenticated user\'s Firebase UID automatically.',
    example: 'user123',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

@ApiTags('s3')
@ApiBearerAuth('firebase-auth')
@ApiSecurity('tenant-header')
@Controller('s3')
@UseGuards(FirebaseGuard)
export class S3Controller {
  constructor(private s3: S3Service) {}
  
  @Post('presign')
  @ApiOperation({ 
    summary: 'Generate presigned S3 URL',
    description: 'Generate a presigned PUT URL for uploading files to Cloudflare R2 (S3-compatible). The file path is automatically organized by tenant and user. If userId is not provided, uses the authenticated user\'s Firebase UID.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Presigned URL generated successfully',
    schema: {
      example: {
        url: 'https://fc4c4ecc6e56c0ce01edda6ecbbd8554.r2.cloudflarestorage.com/smart-contract-prod/uploads/SoJczPKN4DYf.../abc-123.pdf?...',
        key: 'uploads/SoJczPKN4DYfChzWhvbiegSi0422/abc-123.pdf',
        bucket: 'smart-contract-prod',
        contentType: 'application/pdf',
        expiresIn: 300,
        tenantId: 'core',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async presign(@Body() body: PresignDto, @Req() req: any) {
    const { contentType, ext, userId } = PresignSchema.parse(body);
    // Use Firebase UID if userId not provided
    const finalUserId = userId || req.user?.uid;
    return this.s3.createPresignedPutUrl({ 
      contentType, 
      ext, 
      userId: finalUserId, 
      reqTenant: req.tenant 
    });
  }
}

