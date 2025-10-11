import { IsString, Matches, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignContractDto {
  @ApiProperty({
    description: 'Ethereum wallet address of the signer (0x + 40 hex characters)',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC',
    pattern: '^0x[0-9a-fA-F]{40}$',
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{40}$/, {
    message: 'signerAddress must be a valid Ethereum address (0x + 40 hex characters)'
  })
  signerAddress!: string;

  @ApiProperty({
    description: 'SHA-256 hash of the signature evidence (biometrics, photo, timestamp, etc.) in bytes32 hex format',
    example: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    pattern: '^0x[0-9a-fA-F]{64}$',
  })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{64}$/, {
    message: 'hashEvidenceHex must be a valid bytes32 hex string (0x + 64 hex characters)'
  })
  hashEvidenceHex!: string;

  @ApiPropertyOptional({
    description: 'Name of the signer',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  signerName?: string;

  @ApiPropertyOptional({
    description: 'Email of the signer',
    example: 'juan.perez@example.com',
  })
  @IsOptional()
  @IsEmail()
  signerEmail?: string;

  @ApiPropertyOptional({
    description: 'Full evidence object (stored off-chain for privacy). Contains biometrics, photos, timestamps, etc.',
    example: {
      timestamp: '2025-10-11T14:30:00Z',
      ip: '192.168.1.100',
      geolocation: { lat: -34.6037, lng: -58.3816 },
      signatureImage: 'data:image/png;base64,...',
      idPhoto: 'data:image/jpeg;base64,...',
    },
  })
  @IsOptional()
  evidence?: any; // JSON object with full evidence
}

