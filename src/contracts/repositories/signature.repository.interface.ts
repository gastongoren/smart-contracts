import { Signature } from '@prisma/client';

export interface CreateSignatureData {
  contractId: string;
  signerAddress: string;
  signerName?: string;
  signerEmail?: string;
  evidenceHash: string;
  evidence?: any;
  txHash?: string;
}

export interface ISignatureRepository {
  create(data: CreateSignatureData): Promise<Signature>;
  findByContractId(contractId: string): Promise<Signature[]>;
  findByContractAndSigner(contractId: string, signerAddress: string): Promise<Signature | null>;
}


