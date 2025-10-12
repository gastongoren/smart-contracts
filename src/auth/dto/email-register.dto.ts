import { IsString, IsEmail, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailRegisterDto {
  @ApiProperty({
    description: 'Email address',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'SecurePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password debe tener al menos 6 caracteres' })
  password!: string;

  @ApiProperty({
    description: 'Full name',
    example: 'Juan Pérez',
    minLength: 3,
  })
  @IsString()
  @MinLength(3, { message: 'Nombre completo debe tener al menos 3 caracteres' })
  fullName!: string;

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

  @ApiProperty({
    description: 'reCAPTCHA token from Google reCAPTCHA v3',
    example: '03AGdBq25...',
  })
  @IsString()
  captchaToken!: string;

  @ApiPropertyOptional({
    description: 'Document type (default: DNI)',
    example: 'DNI',
    enum: ['DNI', 'CUIT', 'Pasaporte'],
  })
  @IsOptional()
  @IsString()
  documentType?: string;
}

