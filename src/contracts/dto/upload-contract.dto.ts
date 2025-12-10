import { IsNumber, IsOptional, IsString, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequiredSignerDto } from './required-signer.dto';

export class UploadContractDto {
  @ApiProperty({
    description: 'Template ID for the contract type',
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
    description: 'List of required signers for this contract (JSON string). If provided, requiredSignatures must equal the length of this array. Example: [{"email":"vendedor@example.com","fullName":"Juan Pérez","documentNumber":"12345678","role":"SELLER"}]',
    type: String,
    example: '[{"email":"vendedor@example.com","fullName":"Juan Pérez","documentNumber":"12345678","role":"SELLER"},{"email":"comprador@example.com","fullName":"María García","documentNumber":"87654321","role":"BUYER"}]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Allow both string and array, transform array to string for consistency
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return value;
  })
  @IsString()
  requiredSigners?: string; // JSON string, will be parsed in service

  @ApiPropertyOptional({
    description: 'Optional custom contract ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'PDF file of the contract',
  })
  file!: any; // Will be handled by multer
}

