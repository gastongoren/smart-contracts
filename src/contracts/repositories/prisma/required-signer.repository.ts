import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IRequiredSignerRepository, CreateRequiredSignerData, UpdateRequiredSignerData } from '../required-signer.repository.interface';

@Injectable()
export class PrismaRequiredSignerRepository implements IRequiredSignerRepository {
  constructor(private prisma: PrismaService) {}

  async createMany(data: CreateRequiredSignerData[]) {
    const results = await Promise.all(
      data.map((rs) =>
        this.prisma.requiredSigner.create({
          data: {
            contractId: rs.contractId,
            email: rs.email,
            fullName: rs.fullName,
            documentNumber: rs.documentNumber,
            role: rs.role,
          },
        })
      )
    );
    return results;
  }

  async findByContractId(contractId: string) {
    return this.prisma.requiredSigner.findMany({
      where: { contractId },
    });
  }

  async findByEmailOrDocument(email: string, documentNumber: string, contractId: string) {
    return this.prisma.requiredSigner.findFirst({
      where: {
        contractId,
        OR: [
          { email: email.toLowerCase() },
          { documentNumber },
        ],
      },
    });
  }

  async update(id: string, data: UpdateRequiredSignerData) {
    return this.prisma.requiredSigner.update({
      where: { id },
      data,
    });
  }

  async findByUser(email?: string, documentNumber?: string, userId?: string) {
    const whereConditions: any[] = [];
    if (email) {
      whereConditions.push({ email });
    }
    if (documentNumber) {
      whereConditions.push({ documentNumber });
    }
    if (userId) {
      whereConditions.push({ userId });
    }

    if (whereConditions.length === 0) {
      return [];
    }

    return this.prisma.requiredSigner.findMany({
      where: {
        OR: whereConditions,
      },
      include: {
        contract: {
          include: {
            signatures: true,
            requiredSigners: true,
          },
        },
      },
    });
  }
}


