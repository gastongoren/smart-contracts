import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ISignatureRepository, CreateSignatureData } from '../signature.repository.interface';

@Injectable()
export class PrismaSignatureRepository implements ISignatureRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSignatureData) {
    return this.prisma.signature.create({
      data: {
        contractId: data.contractId,
        signerAddress: data.signerAddress,
        signerName: data.signerName,
        signerEmail: data.signerEmail,
        evidenceHash: data.evidenceHash,
        evidence: data.evidence,
        txHash: data.txHash,
      },
    });
  }

  async findByContractId(contractId: string) {
    return this.prisma.signature.findMany({
      where: { contractId },
    });
  }

  async findByContractAndSigner(contractId: string, signerAddress: string) {
    return this.prisma.signature.findUnique({
      where: {
        contractId_signerAddress: {
          contractId,
          signerAddress,
        },
      },
    });
  }
}


