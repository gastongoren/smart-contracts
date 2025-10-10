import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { FirebaseGuard } from '../auth/firebase.guard';
import { S3Service } from './s3.service';

const PresignSchema = z.object({
  contentType: z.string().min(3),
  ext: z.string().optional(),
  userId: z.string().optional(),
});

@Controller('s3')
@UseGuards(FirebaseGuard)
export class S3Controller {
  constructor(private s3: S3Service) {}
  
  @Post('presign')
  async presign(@Body() body: unknown, @Req() req: any) {
    const { contentType, ext, userId } = PresignSchema.parse(body);
    return this.s3.createPresignedPutUrl({ contentType, ext, userId, reqTenant: req.tenant });
  }
}

