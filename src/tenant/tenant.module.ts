import { DynamicModule, Global, Module } from '@nestjs/common';
import { InMemoryTenantRegistry } from './tenant.registry';

export interface TenantModuleOptions {
  tenants?: Array<{
    id: string;
    branding: { name: string; primaryColor?: string; logoUrl?: string };
    overrides?: { s3Bucket?: string; s3Prefix?: string; chainRegistryAddress?: string };
  }>;
}

@Global()
@Module({})
export class TenantModule {
  static register(opts?: TenantModuleOptions): DynamicModule {
    const registry = new InMemoryTenantRegistry(opts?.tenants);
    return {
      module: TenantModule,
      providers: [{ provide: InMemoryTenantRegistry, useValue: registry }],
      exports: [InMemoryTenantRegistry],
    };
  }
}

