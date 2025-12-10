import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class StartKycDto {
  @ApiProperty({
    description: 'Return URL after verification (optional)',
    example: 'https://yourapp.com/kyc/callback',
    required: false,
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

