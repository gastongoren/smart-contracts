import { Body, Controller, Get, Param, Post, Query, UseGuards, Req } from '@nestjs/common';
import { FirebaseGuard } from '../auth/firebase.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';

@Controller('contracts')
@UseGuards(FirebaseGuard, RolesGuard)
export class ContractsController {
  constructor(private svc: ContractsService) {}

  @Post()
  @Roles('ADMIN', 'SELLER')
  create(@Body() body: CreateContractDto, @Req() req: any) {
    return this.svc.create(body, req.user, req.tenant?.id);
  }

  @Get()
  @Roles('ADMIN', 'SELLER')
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
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.svc.findOne(id, req.tenant?.id);
  }

  @Post(':id/sign')
  @Roles('ADMIN', 'SELLER')
  sign(@Param('id') id: string, @Body() body: SignContractDto, @Req() req: any) {
    return this.svc.sign(id, body, req.user, req.tenant?.id);
  }
}

