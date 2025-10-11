import { Body, Controller, Get, Param, Post, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { FirebaseGuard } from '../auth/firebase.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';

@ApiTags('contracts')
@ApiBearerAuth('firebase-auth')
@ApiSecurity('tenant-header')
@Controller('contracts')
@UseGuards(FirebaseGuard, RolesGuard)
export class ContractsController {
  constructor(private svc: ContractsService) {}

  @Post()
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ 
    summary: 'Create a new contract',
    description: 'Creates a new smart contract and registers it on the blockchain. Requires ADMIN or SELLER role.',
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
}

