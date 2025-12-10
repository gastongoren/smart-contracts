import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequiredSignerDto {
  @ApiProperty({
    description: 'Email address of the required signer',
    example: 'vendedor@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Full name of the required signer',
    example: 'Juan Pérez',
  })
  @IsString()
  fullName!: string;

  @ApiProperty({
    description: 'Document number (DNI, CUIT, etc.) of the required signer',
    example: '12345678',
  })
  @IsString()
  documentNumber!: string;

  @ApiPropertyOptional({
    description: 'Role of the signer in the contract (e.g., SELLER, BUYER, WITNESS)',
    example: 'SELLER',
    enum: ['SELLER', 'BUYER', 'WITNESS', 'GUARANTOR', 'OTHER'],
  })
  @IsOptional()
  @IsString()
  role?: string;
}


