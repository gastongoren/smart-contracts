import { Body, Controller, Get, Param, Post, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException, Res, ValidationPipe, UsePipes } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiSecurity, ApiConsumes } from '@nestjs/swagger';
import { FirebaseGuard } from '../auth/firebase.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContractsService } from './contracts.service';
import { ContractIntegrityReport } from './audit/contract-audit.types';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { UploadContractDto } from './dto/upload-contract.dto';
import { GeneratePublicUrlDto } from './dto/generate-public-url.dto';

@ApiTags('contracts')
@ApiBearerAuth('firebase-auth')
@ApiSecurity('tenant-header')
@Controller('contracts')
@UseGuards(FirebaseGuard, RolesGuard)
export class ContractsController {
  constructor(private svc: ContractsService) {}

  @Post('upload')
  @Roles('ADMIN', 'SELLER')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true }))
  @ApiOperation({ 
    summary: 'Upload PDF and create contract (RECOMMENDED)',
    description: '🚀 ONE-STEP: Upload PDF → Calculate hash → Upload to R2 → Register on blockchain → Save to DB. This is the recommended way to create contracts.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Contract uploaded and created successfully',
    schema: {
      example: {
        contractId: '0x3a5f8d7c9e1b4a6f8e2d9c7b5a3f1e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3',
        txHash: '0xabc123...',
        id: 1,
        status: 'created',
        hashPdf: '0x456...',
        uploadUrl: 'https://r2.cloudflarestorage.com/...',
        pdfKey: 'uploads/user123/contract.pdf',
        createdAt: '2025-10-11T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input or file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  async uploadAndCreate(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    let requiredSigners: any = undefined;
    if (body.requiredSigners) {
      if (typeof body.requiredSigners === 'string') {
        try {
          requiredSigners = JSON.parse(body.requiredSigners);
        } catch (error) {
          throw new BadRequestException(`Invalid JSON in requiredSigners: ${error.message}`);
        }
      } else {
        requiredSigners = body.requiredSigners;
      }
    }

    const dto: UploadContractDto = {
      templateId: parseInt(body.templateId),
      version: parseInt(body.version),
      requiredSignatures: body.requiredSignatures ? parseInt(body.requiredSignatures) : undefined,
      requiredSigners: requiredSigners,
      contractId: body.contractId,
      file: file,
    };

    return this.svc.uploadAndCreate(dto, file, req.user, req.tenant?.id);
  }

  @Post()
  @Roles('ADMIN', 'SELLER')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }))
  @ApiOperation({ 
    summary: 'Create a new contract (manual)',
    description: 'Creates a new smart contract with pre-uploaded PDF. You need to upload PDF and calculate hash manually. Use POST /contracts/upload for easier workflow.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Contract created successfully',
    schema: {
      example: {
        contractId: '0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469',
        txHash: '0xstub',
        id: 'd2a1d1c8-5bc3-4cf4-a824-e6153f8655ff',
        status: 'created',
        createdAt: '2025-10-11T14:11:46.036Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  create(@Body() body: CreateContractDto, @Req() req: any) {
    return this.svc.create(body, req.user, req.tenant?.id);
  }

  @Get('mine')
  @Roles('ADMIN', 'SELLER', 'BUYER')
  @ApiOperation({ 
    summary: 'Get my contracts',
    description: 'Get all contracts where the current user is a required signer. Shows contract status and whether you have signed it.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of contracts where user is a required signer',
    schema: {
      example: [
        {
          contractId: '0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469',
          tenantId: 'core',
          templateId: 5,
          version: 1,
          status: 'partial_signed',
          requiredSignatures: 2,
          currentSignatures: 1,
          myStatus: 'pending',
          signedAt: null,
          role: 'BUYER',
          createdAt: '2025-10-11T14:11:46.036Z',
          contractCreatedAt: '2025-10-11T14:11:46.036Z',
        },
        {
          contractId: '0x11f940016530d405a18aa8189fc7ba405f374b3ed95ce955e0c71de17e5ff1ad',
          tenantId: 'core',
          templateId: 1,
          version: 1,
          status: 'fully_signed',
          requiredSignatures: 2,
          currentSignatures: 2,
          myStatus: 'signed',
          signedAt: '2025-10-11T14:25:25.658Z',
          role: 'SELLER',
          createdAt: '2025-10-11T14:11:46.036Z',
          contractCreatedAt: '2025-10-11T14:11:46.036Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findMine(@Req() req: any) {
    return this.svc.findMine(req.user, req.tenant?.id);
  }

  @Get()
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ 
    summary: 'List all contracts',
    description: 'Get a paginated list of contracts for the current tenant. Supports filtering by status.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['created', 'partial_signed', 'fully_signed'], description: 'Filter by contract status' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of contracts with pagination',
    schema: {
      example: {
        data: [
          {
            id: 'd2a1d1c8-5bc3-4cf4-a824-e6153f8655ff',
            contractId: '0x398288...',
            status: 'fully_signed',
            signatures: [
              { signerAddress: '0x742d35...', signedAt: '2025-10-11T14:25:25.658Z' },
            ],
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll(req.tenant?.id, {
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ 
    summary: 'Get contract details',
    description: 'Retrieve full details of a specific contract including all signatures',
  })
  @ApiParam({ name: 'id', description: 'Contract ID (bytes32 hex)', example: '0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contract details',
    schema: {
      example: {
        id: 'd2a1d1c8-5bc3-4cf4-a824-e6153f8655ff',
        contractId: '0x398288...',
        status: 'fully_signed',
        signatures: [
          {
            signerAddress: '0x742d35...',
            signerName: 'Juan Pérez',
            signedAt: '2025-10-11T14:25:25.658Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.svc.findOne(id, req.tenant?.id);
  }

  @Post(':id/sign')
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ 
    summary: 'Sign a contract',
    description: 'Add a signature to an existing contract. The signature is registered on blockchain and stored in the database. Status automatically updates from "created" → "partial_signed" → "fully_signed".',
  })
  @ApiParam({ name: 'id', description: 'Contract ID (bytes32 hex)', example: '0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469' })
  @ApiResponse({ 
    status: 201, 
    description: 'Contract signed successfully',
    schema: {
      example: {
        contractId: '0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469',
        txHash: '0xstub',
        signatureId: 'd83adf88-163d-445a-aca2-8bbc83c0e97d',
        status: 'partial_signed',
        signedAt: '2025-10-11T14:25:25.658Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 400, description: 'Invalid signature data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  sign(@Param('id') id: string, @Body() body: SignContractDto, @Req() req: any) {
    return this.svc.sign(id, body, req.user, req.tenant?.id);
  }

  @Get(':id/download')
  @Roles('ADMIN', 'SELLER', 'BUYER')
  @ApiOperation({ 
    summary: 'Download contract PDF',
    description: 'Generates a temporary secure URL to download the contract PDF. URL expires after specified time (default: 1 hour). This is the RECOMMENDED way to access PDFs.',
  })
  @ApiParam({ name: 'id', description: 'Contract ID (bytes32 hex)' })
  @ApiQuery({ 
    name: 'expiresIn', 
    required: false, 
    type: Number, 
    example: 3600,
    description: 'URL expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)' 
  })
  @ApiResponse({ 
    status: 302, 
    description: 'Redirects to temporary PDF download URL',
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async download(
    @Param('id') id: string, 
    @Query('expiresIn') expiresIn: string | undefined,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const downloadUrl = await this.svc.generateDownloadUrl(
      id, 
      req.tenant?.id,
      expiresIn ? parseInt(expiresIn) : undefined
    );
    return res.redirect(downloadUrl);
  }

  @Post(':id/public-url')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Generate public URL for contract PDF (Admin only)',
    description: 'Generates a temporary public URL for sharing the PDF externally. Only admins can generate public URLs. Use this for sharing contracts via email, WhatsApp, etc.',
  })
  @ApiParam({ name: 'id', description: 'Contract ID (bytes32 hex)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Public URL generated',
    schema: {
      example: {
        contractId: '0x398288...',
        publicUrl: 'https://r2.cloudflarestorage.com/...?signature=...',
        expiresIn: 3600,
        expiresAt: '2025-10-11T19:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async generatePublicUrl(
    @Param('id') id: string,
    @Body() dto: GeneratePublicUrlDto,
    @Req() req: any,
  ) {
    return this.svc.generatePublicUrl(id, req.tenant?.id, dto.expiresIn);
  }

  @Get(':id/verify')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Verify contract integrity',
    description: 'Recomputes contract and signature hashes, compares against database and blockchain records, and returns a detailed integrity report.',
  })
  @ApiParam({ name: 'id', description: 'Contract ID (bytes32 hex)', example: '0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469' })
  @ApiResponse({
    status: 200,
    description: 'Integrity report generated',
    schema: {
      example: {
        contractId: '0x398288...',
        status: 'ok',
        summary: {
          ok: 4,
          mismatch: 0,
          error: 0,
          skipped: 1,
          totalChecks: 5,
        },
        issues: [],
        contract: {
          pdfHash: { status: 'ok', expected: '0xabc...', actual: '0xabc...' },
          blockchain: { status: 'ok', expected: '0xabc...', actual: '0xabc...' },
        },
        signatures: [
          {
            signatureId: 'd83adf88-163d-445a-aca2-8bbc83c0e97d',
            signerAddress: '0x742d35...',
            evidenceHash: '0xbbbb...',
            checks: {
              evidenceHash: { status: 'ok', expected: '0xbbbb...', actual: '0xbbbb...' },
              blockchain: { status: 'ok', expected: '0xbbbb...', actual: '0xbbbb...' },
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async verify(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ContractIntegrityReport> {
    return this.svc.verifyIntegrity(id, req.tenant?.id);
  }
}

