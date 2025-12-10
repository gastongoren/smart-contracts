import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ChainService } from '../../chain/chain.service';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../s3/s3.service';
import {
  AuditCheckResult,
  AuditSignatureResult,
  ContractIntegrityReport,
} from './contract-audit.types';

@Injectable()
export class ContractAuditService {
  constructor(
    private readonly chain: ChainService,
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  private hashBuffer(buffer: Buffer): string {
    return ('0x' + createHash('sha256').update(buffer).digest('hex')) as string;
  }

  private hashEvidence(evidence: unknown): string {
    if (evidence === undefined || evidence === null) {
      throw new Error('Evidence payload is empty');
    }

    if (typeof evidence === 'string') {
      return this.hashBuffer(Buffer.from(evidence));
    }

    return this.hashBuffer(Buffer.from(JSON.stringify(evidence)));
  }

  private hashesEqual(a?: string | null, b?: string | null): boolean {
    if (!a || !b) {
      return false;
    }
    return a.toLowerCase() === b.toLowerCase();
  }

  async verify(contractId: string, tenantId?: string): Promise<ContractIntegrityReport> {
    const contract = await this.prisma.contract.findFirst({
      where: {
        contractId,
        ...(tenantId && { tenantId }),
      },
      include: {
        signatures: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const summary = { ok: 0, mismatch: 0, error: 0, skipped: 0, totalChecks: 0 };
    const issues: string[] = [];

    const contractChecks: { pdfHash: AuditCheckResult; blockchain: AuditCheckResult } = {
      pdfHash: {
        status: 'skipped',
        expected: contract.hashPdf,
        message: 'Pointer not available for this contract',
      },
      blockchain: {
        status: 'skipped',
        expected: contract.hashPdf,
        message: 'No blockchain transaction recorded',
      },
    };

    const signatureChecks: AuditSignatureResult[] = [];

    const register = (result: AuditCheckResult) => {
      summary.totalChecks += 1;
      if (result.status === 'ok') summary.ok += 1;
      else if (result.status === 'mismatch') summary.mismatch += 1;
      else if (result.status === 'error') summary.error += 1;
      else summary.skipped += 1;

      if (result.status === 'mismatch' || result.status === 'error') {
        issues.push(result.message ?? 'Integrity check reported an issue');
      }
    };

    if (contract.pointer) {
      try {
        const buffer = await this.s3.getObjectBuffer({
          key: contract.pointer,
          reqTenant: { id: tenantId || contract.tenantId },
        });
        const computed = this.hashBuffer(buffer);
        const matches = this.hashesEqual(computed, contract.hashPdf);
        contractChecks.pdfHash = {
          status: matches ? 'ok' : 'mismatch',
          expected: contract.hashPdf,
          actual: computed,
          message: matches ? undefined : 'Recomputed PDF hash does not match stored hash',
        };
      } catch (error) {
        contractChecks.pdfHash = {
          status: 'error',
          expected: contract.hashPdf,
          message: `Failed to download or hash contract PDF: ${error.message}`,
        };
      }
    }
    register(contractChecks.pdfHash);

    let blockchainTxHash: string | undefined;
    let blockchainExplorerUrl: string | undefined;
    
    if (contract.txHash && contract.txHash !== '0xstub') {
      blockchainTxHash = contract.txHash;
      // Generate blockchain explorer URL (Polygon/Ethereum)
      const rpcUrl = process.env.CHAIN_RPC_URL || '';
      if (rpcUrl.includes('polygon') || rpcUrl.includes('matic')) {
        blockchainExplorerUrl = `https://polygonscan.com/tx/${contract.txHash}`;
      } else if (rpcUrl.includes('sepolia') || rpcUrl.includes('ethereum')) {
        blockchainExplorerUrl = `https://sepolia.etherscan.io/tx/${contract.txHash}`;
      } else if (rpcUrl.includes('mainnet')) {
        blockchainExplorerUrl = `https://etherscan.io/tx/${contract.txHash}`;
      }
      
      try {
        const decoded = await this.chain.decodeTransaction(contract.txHash);
        if (decoded.name !== 'createContract') {
          contractChecks.blockchain = {
            status: 'mismatch',
            expected: contract.hashPdf,
            actual: decoded.name,
            message: `Unexpected function "${decoded.name}" invoked for contract creation`,
            txHash: blockchainTxHash,
            blockchainExplorerUrl,
            timestamp: contract.createdAt,
          };
        } else {
          const onChainHash = decoded.args?.hashPdf?.toString?.() ?? String(decoded.args?.hashPdf ?? '');
          const matches = this.hashesEqual(onChainHash, contract.hashPdf);
          contractChecks.blockchain = {
            status: matches ? 'ok' : 'mismatch',
            expected: contract.hashPdf,
            actual: onChainHash,
            message: matches ? undefined : 'On-chain hash differs from stored hash',
            txHash: blockchainTxHash,
            blockchainExplorerUrl,
            timestamp: contract.createdAt,
          };
        }
      } catch (error) {
        contractChecks.blockchain = {
          status: 'error',
          expected: contract.hashPdf,
          message: `Failed to decode blockchain transaction ${contract.txHash}: ${error.message}`,
          txHash: blockchainTxHash,
          blockchainExplorerUrl,
          timestamp: contract.createdAt,
        };
      }
    } else if (!contract.txHash) {
      contractChecks.blockchain = {
        status: 'skipped',
        expected: contract.hashPdf,
        message: 'No blockchain transaction hash stored for this contract',
      };
    } else {
      contractChecks.blockchain = {
        status: 'skipped',
        expected: contract.hashPdf,
        message: 'Contract recorded while blockchain integration was disabled (stubbed transaction)',
      };
    }
    register(contractChecks.blockchain);

    for (const signature of contract.signatures) {
      const signatureResult: AuditSignatureResult = {
        signatureId: signature.id,
        signerAddress: signature.signerAddress,
        evidenceHash: signature.evidenceHash,
        checks: {
          evidenceHash: {
            status: 'skipped',
            expected: signature.evidenceHash,
            message: 'No evidence payload stored to recompute hash',
          },
          blockchain: {
            status: 'skipped',
            expected: signature.evidenceHash,
            message: 'No blockchain transaction recorded for this signature',
          },
        },
      };

      if (signature.evidence) {
        try {
          const computedEvidenceHash = this.hashEvidence(signature.evidence);
          const matches = this.hashesEqual(computedEvidenceHash, signature.evidenceHash);
          signatureResult.checks.evidenceHash = {
            status: matches ? 'ok' : 'mismatch',
            expected: signature.evidenceHash,
            actual: computedEvidenceHash,
            message: matches ? undefined : 'Recomputed evidence hash does not match stored hash',
          };
        } catch (error) {
          signatureResult.checks.evidenceHash = {
            status: 'error',
            expected: signature.evidenceHash,
            message: `Failed to recompute evidence hash: ${error.message}`,
          };
        }
      }
      register(signatureResult.checks.evidenceHash);

      if (signature.txHash && signature.txHash !== '0xstub') {
        try {
          const decoded = await this.chain.decodeTransaction(signature.txHash);
          if (decoded.name !== 'markSigned') {
            signatureResult.checks.blockchain = {
              status: 'mismatch',
              expected: signature.evidenceHash,
              actual: decoded.name,
              message: `Unexpected function "${decoded.name}" invoked for signature`,
            };
          } else {
            const onChainEvidence = decoded.args?.hashEvidence?.toString?.() ?? String(decoded.args?.hashEvidence ?? '');
            const matches = this.hashesEqual(onChainEvidence, signature.evidenceHash);
            signatureResult.checks.blockchain = {
              status: matches ? 'ok' : 'mismatch',
              expected: signature.evidenceHash,
              actual: onChainEvidence,
              message: matches ? undefined : 'On-chain evidence hash differs from stored hash',
              txHash: signature.txHash,
              timestamp: signature.signedAt,
            };
            signatureResult.chainOfCustody = {
              txHash: signature.txHash,
              timestamp: signature.signedAt,
              signerAddress: signature.signerAddress,
            };
          }
        } catch (error) {
          signatureResult.checks.blockchain = {
            status: 'error',
            expected: signature.evidenceHash,
            message: `Failed to decode blockchain transaction ${signature.txHash}: ${error.message}`,
            txHash: signature.txHash,
            timestamp: signature.signedAt,
          };
        }
      } else if (!signature.txHash) {
        signatureResult.checks.blockchain = {
          status: 'skipped',
          expected: signature.evidenceHash,
          message: 'No blockchain transaction hash stored for this signature',
        };
      } else {
        signatureResult.checks.blockchain = {
          status: 'skipped',
          expected: signature.evidenceHash,
          message: 'Signature recorded while blockchain integration was disabled (stubbed transaction)',
        };
      }
      register(signatureResult.checks.blockchain);
      signatureChecks.push(signatureResult);
    }

    const status = summary.error > 0 || summary.mismatch > 0 ? 'attention-needed' : 'ok';

    // Build legal evidence section
    const pdfIntegrity = contractChecks.pdfHash.status === 'ok';
    const blockchainRegistered = contractChecks.blockchain.status === 'ok';
    const allSignaturesVerified = signatureChecks.every(sig => 
      sig.checks.evidenceHash.status === 'ok' && sig.checks.blockchain.status === 'ok'
    );

    const chainOfCustody = {
      pdfUploaded: contract.createdAt.toISOString(),
      blockchainRegistered: contract.txHash && contract.txHash !== '0xstub' 
        ? contract.createdAt.toISOString() 
        : undefined,
      signatures: contract.signatures.map(sig => ({
        signerAddress: sig.signerAddress,
        signedAt: sig.signedAt.toISOString(),
        blockchainRegistered: sig.txHash && sig.txHash !== '0xstub' 
          ? sig.signedAt.toISOString() 
          : undefined,
      })),
    };

    return {
      contractId: contract.contractId,
      tenantId: contract.tenantId,
      status,
      auditTimestamp: new Date(),
      contractMetadata: {
        createdAt: contract.createdAt.toISOString(),
        createdBy: contract.createdBy,
        status: contract.status,
        requiredSignatures: contract.requiredSignatures,
        currentSignatures: contract.signatures.length,
      },
      summary,
      issues,
      contract: contractChecks,
      signatures: signatureChecks,
      legalEvidence: {
        pdfIntegrity,
        blockchainRegistered,
        allSignaturesVerified,
        chainOfCustody,
      },
    };
  }
}

