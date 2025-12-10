import { Module } from '@nestjs/common';
import { ChainService } from './chain.service';
import { IBlockchainService } from './interfaces/blockchain.service.interface';

@Module({
  providers: [
    ChainService,
    {
      provide: 'IBlockchainService',
      useClass: ChainService,
    },
  ],
  exports: [ChainService, 'IBlockchainService'],
})
export class ChainModule {}

