import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePublicUrlDto {
  @ApiPropertyOptional({
    description: 'URL expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)',
    example: 3600,
    minimum: 60,
    maximum: 604800,
  })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(604800)
  expiresIn?: number = 3600; // 1 hour default
}

