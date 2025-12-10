import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequiredSignerDto {
  @ApiProperty({
    description: 'Email of the required signer',
    example: 'juan.perez@example.com',
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
    description: 'Document number (DNI) of the required signer',
    example: '12345678',
  })
  @IsString()
  documentNumber!: string;

  @ApiPropertyOptional({
    description: 'Role of the signer in the contract',
    example: 'SELLER',
    enum: ['SELLER', 'BUYER', 'WITNESS', 'OTHER'],
  })
  @IsOptional()
  @IsString()
  role?: string;
}
