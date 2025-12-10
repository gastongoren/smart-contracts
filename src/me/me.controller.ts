import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { FirebaseGuard } from '../auth/firebase.guard';
import { KycService } from '../kyc/kyc.service';

@ApiTags('auth')
@ApiBearerAuth('firebase-auth')
@ApiSecurity('tenant-header')
@Controller('me')
@UseGuards(FirebaseGuard)
export class MeController {
  constructor(private kycService: KycService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get current user',
    description: 'Get the current authenticated user information along with their tenant configuration and KYC status',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current user and tenant info',
    schema: {
      example: {
        uid: 'dev-user',
        email: 'dev@example.com',
        role: 'ADMIN',
        tenant: {
          id: 'core',
          config: {
            branding: { name: 'Smart Core', primaryColor: '#0ea5e9' },
            s3Bucket: 'smart-contracts-uploads',
            s3Prefix: 'uploads/',
          },
        },
        kyc: {
          verified: true,
          verifiedAt: '2024-12-06T12:00:00Z',
          verificationProvider: 'veriff',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getMe(@Req() req: any) {
    const kycStatus = await this.kycService.getKycStatus(req.user.uid);
    return {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role || req.user.customClaims?.role,
      tenant: req.tenant,
      kyc: kycStatus,
    };
  }
}

