import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ChainModule } from '../chain/chain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [ChainModule, PrismaModule, S3Module],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}

