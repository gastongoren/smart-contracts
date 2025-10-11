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
    description: 'User ID to organize files by user',
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
    description: 'Generate a presigned PUT URL for uploading files to S3. The file path is automatically organized by tenant and user.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Presigned URL generated successfully',
    schema: {
      example: {
        url: 'https://s3.us-east-1.amazonaws.com/smart-contracts-uploads/uploads/u1/abc-123.pdf?...',
        key: 'uploads/u1/abc-123.pdf',
        bucket: 'smart-contracts-uploads',
        contentType: 'application/pdf',
        expiresIn: 300,
        tenantId: 'core',
        mock: true,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async presign(@Body() body: PresignDto, @Req() req: any) {
    const { contentType, ext, userId } = PresignSchema.parse(body);
    return this.s3.createPresignedPutUrl({ contentType, ext, userId, reqTenant: req.tenant });
  }
}

