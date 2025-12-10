import { RequiredSigner } from '@prisma/client';

export interface CreateRequiredSignerData {
  contractId: string;
  email: string;
  fullName: string;
  documentNumber: string;
  role?: string;
}

export interface UpdateRequiredSignerData {
  signed?: boolean;
  signedAt?: Date;
  userId?: string;
}

export interface IRequiredSignerRepository {
  createMany(data: CreateRequiredSignerData[]): Promise<RequiredSigner[]>;
  findByContractId(contractId: string): Promise<RequiredSigner[]>;
  findByEmailOrDocument(email: string, documentNumber: string, contractId: string): Promise<RequiredSigner | null>;
  update(id: string, data: UpdateRequiredSignerData): Promise<RequiredSigner>;
  findByUser(email?: string, documentNumber?: string, userId?: string): Promise<Array<RequiredSigner & { contract: any }>>;
}

