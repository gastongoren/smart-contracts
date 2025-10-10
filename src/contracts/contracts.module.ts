import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [ChainModule],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}

