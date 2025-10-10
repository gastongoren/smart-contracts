import { IsString, Matches, IsOptional, IsEmail } from 'class-validator';

export class SignContractDto {
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{40}$/, {
    message: 'signerAddress must be a valid Ethereum address (0x + 40 hex characters)'
  })
  signerAddress!: string;

  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/, {
    message: 'hashEvidenceHex must be a valid bytes32 hex string (0x + 64 hex characters)'
  })
  hashEvidenceHex!: string;

  @IsOptional()
  @IsString()
  signerName?: string;

  @IsOptional()
  @IsEmail()
  signerEmail?: string;

  @IsOptional()
  evidence?: any; // JSON object with full evidence
}

