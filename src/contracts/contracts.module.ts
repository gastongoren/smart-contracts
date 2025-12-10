import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ChainModule } from '../chain/chain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { ContractAuditService } from './audit/contract-audit.service';
import { PrismaContractRepository } from './repositories/prisma/contract.repository';
import { PrismaSignatureRepository } from './repositories/prisma/signature.repository';
import { PrismaRequiredSignerRepository } from './repositories/prisma/required-signer.repository';
import { IContractRepository } from './repositories/contract.repository.interface';
import { ISignatureRepository } from './repositories/signature.repository.interface';
import { IRequiredSignerRepository } from './repositories/required-signer.repository.interface';

@Module({
  imports: [ChainModule, PrismaModule, S3Module],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    ContractAuditService,
    {
      provide: 'IContractRepository',
      useClass: PrismaContractRepository,
    },
    {
      provide: 'ISignatureRepository',
      useClass: PrismaSignatureRepository,
    },
    {
      provide: 'IRequiredSignerRepository',
      useClass: PrismaRequiredSignerRepository,
    },
    PrismaContractRepository,
    PrismaSignatureRepository,
    PrismaRequiredSignerRepository,
  ],
  exports: [ContractsService, ContractAuditService],
})
export class ContractsModule {}

