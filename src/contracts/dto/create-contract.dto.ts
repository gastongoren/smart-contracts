import { IsNumber, IsString, Matches, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequiredSignerDto } from './required-signer.dto';

export class CreateContractDto {
  @ApiPropertyOptional({
    description: 'Optional custom contract ID (UUID or bytes32 hex). If not provided, a random UUID will be generated and hashed to bytes32.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiProperty({
    description: 'Template ID for the contract type (e.g., 1=Sale Agreement, 2=Rental, 5=Vehicle Sale)',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  templateId!: number;

  @ApiProperty({
    description: 'Version of the contract template',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  version!: number;

  @ApiProperty({
    description: 'SHA-256 hash of the PDF contract document in bytes32 hex format (0x + 64 hex characters)',
    example: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/, {
    message: 'hashPdfHex must be a valid bytes32 hex string (0x + 64 hex characters)'
  })
  hashPdfHex!: string;

  @ApiPropertyOptional({
    description: 'Pointer to the contract document (S3 key, IPFS hash, or URL)',
    example: 's3://bucket/contracts/venta-auto-toyota-2015.pdf',
  })
  @IsOptional()
  @IsString()
  pointer?: string;

  @ApiPropertyOptional({
    description: 'Number of signatures required for completion (default: 2). Must match the length of requiredSigners if provided.',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  requiredSignatures?: number;

  @ApiPropertyOptional({
    description: 'List of required signers for this contract. If provided, requiredSignatures must equal the length of this array.',
    type: [RequiredSignerDto],
    example: [
      { email: 'vendedor@example.com', fullName: 'Juan Pérez', documentNumber: '12345678', role: 'SELLER' },
      { email: 'comprador@example.com', fullName: 'María García', documentNumber: '87654321', role: 'BUYER' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredSignerDto)
  requiredSigners?: RequiredSignerDto[];
}

