export type TenantId = string;

export interface TenantBranding {
  name: string;
  primaryColor?: string;
  logoUrl?: string;
}

export interface TenantOverrides {
  s3Bucket?: string;
  s3Prefix?: string;
  chainRegistryAddress?: string;
}

export interface TenantConfig {
  id: TenantId;
  branding: TenantBranding;
  overrides?: TenantOverrides;
}

export interface TenantResolvedConfig {
  id: TenantId;
  branding: TenantBranding;
  s3Bucket: string;
  s3Prefix: string;
  chainRegistryAddress: string;
}

