import { IsNumber, IsString, Matches, IsOptional, Min } from 'class-validator';

export class CreateContractDto {
  @IsOptional()
  @IsString()
  contractId?: string;

  @IsNumber()
  @Min(1)
  templateId!: number;

  @IsNumber()
  @Min(1)
  version!: number;

  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/, {
    message: 'hashPdfHex must be a valid bytes32 hex string (0x + 64 hex characters)'
  })
  hashPdfHex!: string;

  @IsOptional()
  @IsString()
  pointer?: string;
}

