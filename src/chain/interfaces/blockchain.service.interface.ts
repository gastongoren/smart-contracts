export interface RegisterCreateParams {
  contractIdHex: string;
  templateId: number;
  version: number;
  hashPdfHex: string;
  pointer?: string;
  signers?: string[];
  tenantId?: string;
}

export interface RegisterSignedParams {
  contractIdHex: string;
  signerAddress: string;
  hashEvidenceHex: string;
  tenantId?: string;
}

export interface TransactionResult {
  txHash: string;
}

export interface DecodedTransaction {
  name: string;
  args: Record<string, any>;
}

export interface IBlockchainService {
  registerCreate(params: RegisterCreateParams): Promise<TransactionResult>;
  registerSigned(params: RegisterSignedParams): Promise<TransactionResult>;
  decodeTransaction(txHash: string): Promise<DecodedTransaction>;
}


