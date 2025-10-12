import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleRegisterDto {
  @ApiProperty({
    description: 'Firebase ID token from Google Sign-In',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkZD...',
  })
  @IsString()
  idToken!: string;

  @ApiProperty({
    description: 'DNI (Documento Nacional de Identidad) - 7 or 8 digits',
    example: '12345678',
    pattern: '^\\d{7,8}$',
  })
  @IsString()
  @Matches(/^\d{7,8}$/, { message: 'DNI debe tener 7-8 dígitos' })
  documentNumber!: string;

  @ApiPropertyOptional({
    description: 'Phone number in international format',
    example: '+5491112345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Document type (default: DNI)',
    example: 'DNI',
    enum: ['DNI', 'CUIT', 'Pasaporte'],
  })
  @IsOptional()
  @IsString()
  documentType?: string;
}

