import { Injectable, Optional, Inject } from '@nestjs/common';
import { JsonRpcProvider, Wallet, Contract, Interface } from 'ethers';
import * as abi from './registry.abi.json';
import { InMemoryTenantRegistry, resolveTenantConfig } from '../tenant/tenant.registry';

@Injectable()
export class ChainService {
  private provider: JsonRpcProvider;
  private wallet: Wallet | null = null;
  private base = {
    s3Bucket: process.env.S3_BUCKET!,
    s3Prefix: (process.env.S3_PREFIX ?? 'uploads/'),
    chainRegistryAddress: process.env.CHAIN_REGISTRY_ADDRESS ?? '0x0000000000000000000000000000000000000000',
  };

  constructor(@Optional() @Inject(InMemoryTenantRegistry) private registry?: InMemoryTenantRegistry) {
    this.provider = new JsonRpcProvider(process.env.CHAIN_RPC_URL!);
    // Only initialize wallet if valid private key is provided
    const privateKey = process.env.CHAIN_PRIVATE_KEY;
    if (privateKey && privateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      try {
        this.wallet = new Wallet(privateKey, this.provider);
      } catch (error) {
        console.warn('⚠️  Invalid blockchain private key - blockchain operations will use stub responses');
      }
    } else {
      console.warn('⚠️  No blockchain private key configured - blockchain operations will use stub responses');
    }
  }

  private contractForTenant(tenantId?: string) {
    const cfg = resolveTenantConfig(this.base, this.registry?.getTenant(tenantId ?? 'core'));
    if (!this.wallet) {
      // Return a stub contract that won't actually be used
      return new Contract(cfg.chainRegistryAddress, new Interface(abi), this.provider);
    }
    return new Contract(cfg.chainRegistryAddress, new Interface(abi), this.wallet);
  }

  async registerCreate(params: {
    contractIdHex: string; templateId: number; version: number; hashPdfHex: string; pointer?: string; signers?: string[]; tenantId?: string;
  }): Promise<{ txHash: string }> {
    const c = this.contractForTenant(params.tenantId);
    // MVP: si el address es cero, devolver stub
    if (c.target.toString().toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return { txHash: '0xstub' };
    }
    const tx = await c.createContract(params.contractIdHex, params.templateId, params.version, params.hashPdfHex, params.pointer ?? '', params.signers ?? []);
    const receipt = await tx.wait();
    return { txHash: receipt?.hash ?? tx.hash };
  }

  async registerSigned(params: {
    contractIdHex: string; signerAddress: string; hashEvidenceHex: string; tenantId?: string;
  }): Promise<{ txHash: string }> {
    const c = this.contractForTenant(params.tenantId);
    if (c.target.toString().toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return { txHash: '0xstub' };
    }
    const tx = await c.markSigned(params.contractIdHex, params.signerAddress, params.hashEvidenceHex);
    const receipt = await tx.wait();
    return { txHash: receipt?.hash ?? tx.hash };
  }
}

