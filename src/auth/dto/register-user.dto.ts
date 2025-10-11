import { IsString, IsEmail, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  BUYER = 'BUYER',
}

export class RegisterUserDto {
  @ApiProperty({
    description: 'Firebase UID of the user (obtained after creating user in Firebase)',
    example: 'abc123def456ghi789',
  })
  @IsString()
  firebaseUid!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Primary tenant ID for the user',
    example: 'mutual-sanmartin',
  })
  @IsString()
  tenantId!: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.SELLER,
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    description: 'Array of tenant IDs the user has access to (for multi-tenant users)',
    example: ['core', 'mutual-sanmartin'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenants?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { department: 'Sales', phone: '+54911...' },
  })
  @IsOptional()
  metadata?: any;
}

