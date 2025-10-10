import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InMemoryTenantRegistry, resolveTenantConfig } from './tenant.registry';

export interface TenantInterceptorOptions {
  registry: InMemoryTenantRegistry;
  base: { s3Bucket: string; s3Prefix: string; chainRegistryAddress: string };
  defaultTenantId?: string;
  hostMap?: Record<string, string>; // opcional host -> tenantId
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private opts: TenantInterceptorOptions) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    // Resolución simple de tenant: header -> hostMap -> default
    const fromHeader = (req.headers['x-tenant-id'] as string | undefined)?.trim();
    const fromHost = this.opts.hostMap?.[String(req.headers['host']).toLowerCase()];
    const tenantId = fromHeader || fromHost || this.opts.defaultTenantId || 'core';

    const tcfg = this.opts.registry.getTenant(tenantId);
    req.tenant = {
      id: tenantId,
      config: resolveTenantConfig(this.opts.base, tcfg),
    };
    return next.handle();
  }
}

