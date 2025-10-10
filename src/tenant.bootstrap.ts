import { InMemoryTenantRegistry } from './tenant/tenant.registry';

export function buildTenantRegistry() {
  // MVP: un solo tenant "core" con branding y sin overrides
  return new InMemoryTenantRegistry([
    {
      id: 'core',
      branding: { name: 'Smart Core', primaryColor: '#0ea5e9' },
      overrides: {
        // opcional: s3Bucket: 'smart-uploads-dev',
        // opcional: chainRegistryAddress: '0x000...'
      }
    }
  ]);
}

