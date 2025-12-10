import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { ChainService } from '../chain/chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { UploadContractDto } from './dto/upload-contract.dto';
import { RequiredSignerDto } from './dto/required-signer.dto';
import { ContractAuditService } from './audit/contract-audit.service';
import { ContractIntegrityReport } from './audit/contract-audit.types';
import { IContractRepository } from './repositories/contract.repository.interface';
import { ISignatureRepository } from './repositories/signature.repository.interface';
import { IRequiredSignerRepository } from './repositories/required-signer.repository.interface';
import { toBytes32, uuidToBytes32, hashBuffer } from './utils/contract.utils';

@Injectable()
export class ContractsService {
  constructor(
    private chain: ChainService,
    @Inject('IContractRepository') private contractRepo: IContractRepository,
    @Inject('ISignatureRepository') private signatureRepo: ISignatureRepository,
    @Inject('IRequiredSignerRepository') private requiredSignerRepo: IRequiredSignerRepository,
    private prisma: PrismaService, // Solo para queries complejas de User (findMine)
    private s3: S3Service,
    private audit: ContractAuditService,
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

    const requiredSignatures = dto.requiredSignatures || (dto.requiredSigners?.length ?? 2);
    if (dto.requiredSigners && dto.requiredSigners.length !== requiredSignatures) {
      throw new BadRequestException(
        `requiredSignatures (${requiredSignatures}) must match the length of requiredSigners (${dto.requiredSigners.length})`
      );
    }

    const contract = await this.contractRepo.create({
      contractId,
      tenantId: tenantId || 'core',
      templateId: dto.templateId,
      version: dto.version,
      hashPdf: hashPdf,
      pointer: dto.pointer,
      createdBy: user?.uid || 'system',
      txHash: res.txHash,
      status: 'created',
      requiredSignatures,
      requiredSigners: dto.requiredSigners,
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
    const contract = await this.contractRepo.findByContractId(id, tenantId);

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    // Validate signer authorization if requiredSigners exist
    if (contract.requiredSigners.length > 0) {
      // Get user from database to check email and documentNumber
      const dbUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { uid: user?.uid },
            { firebaseUid: user?.uid },
            { email: user?.email },
          ],
        },
      });

      if (!dbUser) {
        throw new ForbiddenException('User not found in database. Please complete registration first.');
      }

      if (!dbUser.verified) {
        throw new ForbiddenException(
          'KYC verification required before signing contracts. Please complete identity verification first.'
        );
      }

      const requiredSigner = await this.requiredSignerRepo.findByEmailOrDocument(
        dbUser.email || '',
        dbUser.documentNumber || '',
        contract.id,
      );

      if (!requiredSigner) {
        throw new ForbiddenException(
          'You are not authorized to sign this contract. ' +
          `Your email (${dbUser.email}) or DNI (${dbUser.documentNumber}) must be in the required signers list.`
        );
      }

      if (requiredSigner.signed) {
        throw new ConflictException('You have already signed this contract');
      }
    }

    const hashEvidence = toBytes32(dto.hashEvidenceHex);
    const res = await this.chain.registerSigned({
      contractIdHex: id,
      signerAddress: dto.signerAddress,
      hashEvidenceHex: hashEvidence,
      tenantId,
    });

    const signature = await this.signatureRepo.create({
      contractId: contract.id,
      signerAddress: dto.signerAddress,
      signerName: dto.signerName,
      signerEmail: dto.signerEmail,
      evidenceHash: hashEvidence,
      evidence: dto.evidence,
      txHash: res.txHash,
    });

    if (contract.requiredSigners.length > 0) {
      const dbUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { uid: user?.uid },
            { firebaseUid: user?.uid },
            { email: user?.email },
          ],
        },
      });

      if (dbUser) {
        const requiredSigner = contract.requiredSigners.find(
          (rs) => 
            rs.email.toLowerCase() === (dbUser.email?.toLowerCase() ?? '') ||
            rs.documentNumber === dbUser.documentNumber
        );

        if (requiredSigner) {
          await this.requiredSignerRepo.update(requiredSigner.id, {
            signed: true,
            signedAt: new Date(),
            userId: dbUser.uid || dbUser.firebaseUid,
          });
        }
      }
    }

    // Update contract status
    const signatureCount = contract.signatures.length + 1;
    const requiredSignatures = contract.requiredSignatures;
    const newStatus = signatureCount >= requiredSignatures ? 'fully_signed' : 'partial_signed';
    
    await this.contractRepo.update(contract.id, { status: newStatus });

    return {
      contractId: contract.contractId,
      txHash: res.txHash,
      signatureId: signature.id,
      status: newStatus,
      signedAt: signature.signedAt,
    };
  }

  async findOne(contractId: string, tenantId?: string) {
    const contract = await this.contractRepo.findByContractId(contractId, tenantId);

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    return {
      ...contract,
      signatures: contract.signatures.map((sig) => ({
        id: sig.id,
        signerAddress: sig.signerAddress,
        signerName: sig.signerName,
        signerEmail: sig.signerEmail,
        signedAt: sig.signedAt,
        evidenceHash: sig.evidenceHash,
        txHash: sig.txHash,
      })),
    };
  }

  async findAll(tenantId?: string, options?: { status?: string; page?: number; limit?: number }) {
    const result = await this.contractRepo.findMany({
      tenantId,
      status: options?.status,
      page: options?.page,
      limit: options?.limit,
    });

    const page = options?.page || 1;
    const limit = options?.limit || 10;

    return {
      data: result.contracts,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  // New: Upload PDF and create contract in one step
  async uploadAndCreate(
    dto: UploadContractDto,
    file: Express.Multer.File,
    user: any,
    tenantId?: string,
  ) {
    // 1. Calculate hash of PDF
    const hashPdfHex = hashBuffer(file.buffer);

    // 2. Upload PDF directly to R2 (server-side)
    const uploadResult = await this.s3.uploadFile({
      buffer: file.buffer,
      contentType: file.mimetype,
      ext: '.pdf',
      userId: user?.uid,
      reqTenant: { id: tenantId || 'core' },
    });

    const contractId = (dto.contractId && /^0x/.test(dto.contractId))
      ? dto.contractId
      : uuidToBytes32(dto.contractId);

    const txResult = await this.chain.registerCreate({
      contractIdHex: contractId,
      templateId: dto.templateId,
      version: dto.version,
      hashPdfHex: hashPdfHex,
      pointer: uploadResult.key,
      signers: [],
      tenantId,
    });

    let parsedRequiredSigners: RequiredSignerDto[] | undefined;
    if (dto.requiredSigners) {
      if (typeof dto.requiredSigners === 'string') {
        try {
          parsedRequiredSigners = JSON.parse(dto.requiredSigners);
        } catch (error) {
          throw new BadRequestException(`Invalid JSON in requiredSigners: ${error.message}`);
        }
      } else {
        parsedRequiredSigners = dto.requiredSigners as any;
      }
    }

    const requiredSignatures = dto.requiredSignatures || (parsedRequiredSigners?.length ?? 2);
    if (parsedRequiredSigners && parsedRequiredSigners.length !== requiredSignatures) {
      throw new BadRequestException(
        `requiredSignatures (${requiredSignatures}) must match the length of requiredSigners (${parsedRequiredSigners.length})`
      );
    }
    const contract = await this.contractRepo.create({
      contractId,
      tenantId: tenantId || 'core',
      templateId: dto.templateId,
      version: dto.version,
      hashPdf: hashPdfHex,
      pointer: uploadResult.key,
      createdBy: user?.uid || 'system',
      txHash: txResult.txHash,
      status: 'created',
      requiredSignatures,
      requiredSigners: parsedRequiredSigners,
    });

    return {
      contractId: contract.contractId,
      txHash: contract.txHash,
      id: contract.id,
      status: contract.status,
      hashPdf: hashPdfHex,
      pdfUrl: uploadResult.url,
      pdfKey: uploadResult.key,
      createdAt: contract.createdAt,
    };
  }

  async generateDownloadUrl(
    contractId: string,
    tenantId?: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const contract = await this.contractRepo.findByContractId(contractId, tenantId || 'core');

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    // Generate presigned URL for download
    const result = await this.s3.createPresignedGetUrl({
      key: contract.pointer,
      expiresIn,
      reqTenant: { id: tenantId || 'core' },
    });

    return result.url;
  }

  // Generate public URL (admin only)
  async generatePublicUrl(
    contractId: string,
    tenantId?: string,
    expiresIn: number = 3600,
  ) {
    // Find contract
    const contract = await this.prisma.contract.findFirst({
      where: {
        contractId,
        tenantId: tenantId || 'core',
      },
      include: {
        signatures: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    // Generate presigned URL
    const result = await this.s3.createPresignedGetUrl({
      key: contract.pointer,
      expiresIn,
      reqTenant: { id: tenantId || 'core' },
    });

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Log in audit log (optional)
    await this.prisma.auditLog.create({
      data: {
        action: 'GENERATE_PUBLIC_URL',
        entityType: 'CONTRACT',
        entityId: contract.id,
        tenantId: tenantId || 'core',
        metadata: {
          expiresIn,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return {
      contractId: contract.contractId,
      publicUrl: result.url,
      expiresIn: result.expiresIn,
      expiresAt,
      status: contract.status,
      signatures: contract.signatures.length,
    };
  }

  async verifyIntegrity(contractId: string, tenantId?: string): Promise<ContractIntegrityReport> {
    return this.audit.verify(contractId, tenantId);
  }

  // Get contracts where user is a required signer
  async findMine(user: any, tenantId?: string) {
    // Get user from database
    const dbUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { uid: user?.uid },
          { firebaseUid: user?.uid },
          { email: user?.email },
        ],
      },
    });

    if (!dbUser) {
      return [];
    }

    const whereConditions: any[] = [];
    if (dbUser.email) {
      whereConditions.push({ email: dbUser.email });
    }
    if (dbUser.documentNumber) {
      whereConditions.push({ documentNumber: dbUser.documentNumber });
    }
    if (dbUser.uid || dbUser.firebaseUid) {
      whereConditions.push({ userId: dbUser.uid || dbUser.firebaseUid });
    }

    if (whereConditions.length === 0) {
      return [];
    }

    const requiredSigners = await this.requiredSignerRepo.findByUser(
      dbUser.email,
      dbUser.documentNumber,
      dbUser.uid || dbUser.firebaseUid,
    );

    const filtered = tenantId
      ? requiredSigners.filter((rs) => rs.contract.tenantId === tenantId)
      : requiredSigners;

    return filtered.map((rs) => ({
      contractId: rs.contract.contractId,
      tenantId: rs.contract.tenantId,
      templateId: rs.contract.templateId,
      version: rs.contract.version,
      status: rs.contract.status,
      requiredSignatures: rs.contract.requiredSignatures,
      currentSignatures: rs.contract.signatures.length,
      myStatus: rs.signed ? 'signed' : 'pending',
      signedAt: rs.signedAt,
      role: rs.role,
      createdAt: rs.contract.createdAt,
      contractCreatedAt: rs.contract.createdAt,
    }));
  }
}

