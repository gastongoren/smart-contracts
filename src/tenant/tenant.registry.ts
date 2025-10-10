import { TenantConfig, TenantResolvedConfig } from './tenant.types';

export class InMemoryTenantRegistry {
  private tenants = new Map<string, TenantConfig>();

  constructor(initial?: TenantConfig[]) {
    initial?.forEach(t => this.tenants.set(t.id, t));
  }

  getTenant(id: string): TenantConfig | undefined {
    return this.tenants.get(id);
  }

  list(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }
}

export function resolveTenantConfig(
  base: { s3Bucket: string; s3Prefix: string; chainRegistryAddress: string; },
  tenant?: TenantConfig
): TenantResolvedConfig {
  const id = tenant?.id ?? 'core';
  const branding = tenant?.branding ?? { name: 'Core' };
  const ov = tenant?.overrides ?? {};
  return {
    id,
    branding,
    s3Bucket: ov.s3Bucket ?? base.s3Bucket,
    s3Prefix: (ov.s3Prefix ?? base.s3Prefix).replace(/\/?$/, '/'),
    chainRegistryAddress: ov.chainRegistryAddress ?? base.chainRegistryAddress,
  };
}

