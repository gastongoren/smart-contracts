import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { IStorageService } from './interfaces/storage.service.interface';

@Module({
  providers: [
    S3Service,
    {
      provide: 'IStorageService',
      useClass: S3Service,
    },
  ],
  exports: [S3Service, 'IStorageService'],
})
export class S3Module {}

