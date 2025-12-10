export type AuditCheckStatus = 'ok' | 'mismatch' | 'error' | 'skipped';

export interface AuditCheckResult {
  status: AuditCheckStatus;
  expected?: string;
  actual?: string;
  message?: string;
  txHash?: string;
  timestamp?: Date;
  blockchainExplorerUrl?: string;
}

export interface AuditSignatureResult {
  signatureId: string;
  signerAddress: string;
  evidenceHash: string;
  checks: {
    evidenceHash: AuditCheckResult;
    blockchain: AuditCheckResult;
  };
  chainOfCustody?: {
    txHash: string;
    timestamp: Date;
    signerAddress: string;
  };
}

export interface ContractIntegrityReport {
  auditTimestamp: Date;
  contractId: string;
  tenantId: string;
  status: 'ok' | 'attention-needed';
  summary: {
    ok: number;
    mismatch: number;
    error: number;
    skipped: number;
    totalChecks: number;
  };
  issues: string[];
  contractMetadata: {
    createdAt: string;
    createdBy: string;
    status: string;
    requiredSignatures: number;
    currentSignatures: number;
  };
  legalEvidence: {
    pdfIntegrity: boolean;
    blockchainRegistered: boolean;
    allSignaturesVerified: boolean;
    chainOfCustody: {
      pdfUploaded: string;
      blockchainRegistered?: string;
      signatures: Array<{
        signerAddress: string;
        signedAt: string;
        blockchainRegistered?: string;
      }>;
    };
  };
  blockchainExplorerUrl?: string;
  contract: {
    pdfHash: AuditCheckResult;
    blockchain: AuditCheckResult;
  };
  signatures: AuditSignatureResult[];
}

