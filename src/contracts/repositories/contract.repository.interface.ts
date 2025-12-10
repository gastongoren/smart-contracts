import { Contract, Prisma } from '@prisma/client';

export interface CreateContractData {
  contractId: string;
  tenantId: string;
  templateId: number;
  version: number;
  hashPdf: string;
  pointer?: string;
  createdBy: string;
  txHash?: string;
  status: string;
  requiredSignatures: number;
  requiredSigners?: Array<{
    email: string;
    fullName: string;
    documentNumber: string;
    role?: string;
  }>;
}

export interface UpdateContractData {
  status?: string;
  txHash?: string;
}

export interface ContractFilters {
  tenantId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface IContractRepository {
  create(data: CreateContractData): Promise<Contract & { signatures: any[]; requiredSigners: any[] }>;
  findById(id: string, tenantId?: string): Promise<(Contract & { signatures: any[]; requiredSigners: any[] }) | null>;
  findByContractId(contractId: string, tenantId?: string): Promise<(Contract & { signatures: any[]; requiredSigners: any[] }) | null>;
  findMany(filters: ContractFilters): Promise<{
    contracts: (Contract & { signatures: any[] })[];
    total: number;
  }>;
  update(id: string, data: UpdateContractData): Promise<Contract>;
}


