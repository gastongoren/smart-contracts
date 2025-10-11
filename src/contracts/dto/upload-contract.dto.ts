import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

