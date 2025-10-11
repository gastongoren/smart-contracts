import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'test@contracts.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'Test1234',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
