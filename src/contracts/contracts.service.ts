import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { ChainService } from '../chain/chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';

function toBytes32(hex: string) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) throw new Error('Invalid bytes32 hex');
  return hex;
}
function uuidToBytes32(u?: string) {
  const id = u ?? randomUUID();
  const h = createHash('sha256').update(id).digest('hex');
  return ('0x' + h) as string;
}

@Injectable()
export class ContractsService {
  constructor(
    private chain: ChainService,
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateContractDto, user: any, tenantId?: string) {
    const contractId = (dto.contractId && /^0x/.test(dto.contractId)) 
      ? dto.contractId 
      : uuidToBytes32(dto.contractId);
    const hashPdf = toBytes32(dto.hashPdfHex);
    
    // Register on blockchain
    const res = await this.chain.registerCreate({
      contractIdHex: contractId,
      templateId: dto.templateId,
      version: dto.version,
      hashPdfHex: hashPdf,
      pointer: dto.pointer,
      signers: [],
      tenantId,
    });

    // Save to database
    const contract = await this.prisma.contract.create({
      data: {
        contractId,
        tenantId: tenantId || 'core',
        templateId: dto.templateId,
        version: dto.version,
        hashPdf: hashPdf,
        pointer: dto.pointer,
        createdBy: user?.uid || 'system',
        txHash: res.txHash,
        status: 'created',
      },
      include: {
        signatures: true,
      },
    });

    return {
      contractId: contract.contractId,
      txHash: contract.txHash,
      id: contract.id,
      status: contract.status,
      createdAt: contract.createdAt,
    };
  }

  async sign(id: string, dto: SignContractDto, user: any, tenantId?: string) {
    // Find contract in database
    const contract = await this.prisma.contract.findUnique({
      where: { contractId: id },
      include: { signatures: true },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    const hashEvidence = toBytes32(dto.hashEvidenceHex);
    
    // Register signature on blockchain
    const res = await this.chain.registerSigned({
      contractIdHex: id,
      signerAddress: dto.signerAddress,
      hashEvidenceHex: hashEvidence,
      tenantId,
    });

    // Save signature to database
    const signature = await this.prisma.signature.create({
      data: {
        contractId: contract.id,
        signerAddress: dto.signerAddress,
        signerName: dto.signerName,
        signerEmail: dto.signerEmail,
        evidenceHash: hashEvidence,
        evidence: dto.evidence,
        txHash: res.txHash,
      },
    });

    // Update contract status
    const signatureCount = contract.signatures.length + 1;
    const newStatus = signatureCount >= 2 ? 'fully_signed' : 'partial_signed';
    
    await this.prisma.contract.update({
      where: { id: contract.id },
      data: { status: newStatus },
    });

    return {
      contractId: contract.contractId,
      txHash: res.txHash,
      signatureId: signature.id,
      status: newStatus,
      signedAt: signature.signedAt,
    };
  }

  // New: Get contract by ID
  async findOne(contractId: string, tenantId?: string) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        contractId,
        ...(tenantId && { tenantId }),
      },
      include: {
        signatures: {
          select: {
            id: true,
            signerAddress: true,
            signerName: true,
            signerEmail: true,
            signedAt: true,
            evidenceHash: true,
            txHash: true,
            // evidence is excluded for privacy
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    return contract;
  }

  // New: List contracts
  async findAll(tenantId?: string, options?: { status?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(tenantId && { tenantId }),
      ...(options?.status && { status: options.status }),
    };

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: {
          signatures: {
            select: {
              signerAddress: true,
              signedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      data: contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

