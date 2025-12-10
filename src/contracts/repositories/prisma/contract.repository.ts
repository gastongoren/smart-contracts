import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IContractRepository, CreateContractData, UpdateContractData, ContractFilters } from '../contract.repository.interface';

@Injectable()
export class PrismaContractRepository implements IContractRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateContractData) {
    return this.prisma.contract.create({
      data: {
        contractId: data.contractId,
        tenantId: data.tenantId,
        templateId: data.templateId,
        version: data.version,
        hashPdf: data.hashPdf,
        pointer: data.pointer,
        createdBy: data.createdBy,
        txHash: data.txHash,
        status: data.status,
        requiredSignatures: data.requiredSignatures,
        requiredSigners: data.requiredSigners
          ? {
              create: data.requiredSigners.map((rs) => ({
                email: rs.email,
                fullName: rs.fullName,
                documentNumber: rs.documentNumber,
                role: rs.role,
              })),
            }
          : undefined,
      },
      include: {
        signatures: true,
        requiredSigners: true,
      },
    });
  }

  async findById(id: string, tenantId?: string) {
    return this.prisma.contract.findFirst({
      where: {
        contractId: id,
        ...(tenantId && { tenantId }),
      },
      include: {
        signatures: true,
        requiredSigners: true,
      },
    });
  }

  async findByContractId(contractId: string, tenantId?: string) {
    return this.prisma.contract.findFirst({
      where: {
        contractId,
        ...(tenantId && { tenantId }),
      },
      include: {
        signatures: true,
        requiredSigners: true,
      },
    });
  }

  async findMany(filters: ContractFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.tenantId && { tenantId: filters.tenantId }),
      ...(filters.status && { status: filters.status }),
    };

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        include: {
          signatures: {
            select: {
              signerAddress: true,
              signedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return { contracts, total };
  }

  async update(id: string, data: UpdateContractData) {
    return this.prisma.contract.update({
      where: { id },
      data,
    });
  }
}


