import { ApiProperty } from '@nestjs/swagger';

export class VeriffWebhookDto {
  @ApiProperty({ description: 'Verification ID' })
  id: string;

  @ApiProperty({ description: 'Verification status' })
  status: string;

  @ApiProperty({ description: 'Verification code', required: false })
  code?: number;

  @ApiProperty({ description: 'Person information', required: false })
  person?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    idNumber?: string;
  };

  @ApiProperty({ description: 'Document information', required: false })
  document?: {
    type?: string;
    number?: string;
    country?: string;
  };

  @ApiProperty({ description: 'Verification decision', required: false })
  verification?: {
    code?: number;
    status?: string;
    reason?: string;
    reasonCode?: string;
  };
}

