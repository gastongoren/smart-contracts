import { Controller, Post, Get, Body, Req, UseGuards, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { FirebaseGuard } from '../auth/firebase.guard';
import { KycService } from './kyc.service';
import { StartKycDto } from './dto/start-kyc.dto';
import { VeriffWebhookDto } from './dto/kyc-webhook.dto';

@ApiTags('kyc')
@Controller('kyc')
export class KycController {
  constructor(private kycService: KycService) {}

  @Post('start')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth('firebase-auth')
  @ApiSecurity('tenant-header')
  @ApiOperation({
    summary: 'Start KYC verification',
    description: 'Creates a new KYC verification session with Veriff and returns the verification URL',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC session created successfully',
    schema: {
      example: {
        verificationUrl: 'https://station.veriff.com/v/...',
        sessionId: 'abc123-def456-ghi789',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'User already verified or missing required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async startVerification(@Req() req: any, @Body() dto: StartKycDto) {
    return this.kycService.startVerification(req.user.uid, dto);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Veriff webhook endpoint',
    description: 'Receives verification results from Veriff. This endpoint should be configured in Veriff dashboard.',
  })
  @ApiBody({ type: VeriffWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Body() payload: VeriffWebhookDto,
    @Headers('x-signature') signature?: string,
  ) {
    await this.kycService.handleWebhook(payload, signature);
    return { success: true };
  }

  @Get('status')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth('firebase-auth')
  @ApiSecurity('tenant-header')
  @ApiOperation({
    summary: 'Get KYC status',
    description: 'Returns the current KYC verification status for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC status retrieved successfully',
    schema: {
      example: {
        verified: true,
        verifiedAt: '2024-12-06T12:00:00Z',
        verificationId: 'abc123-def456',
        verificationProvider: 'veriff',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getKycStatus(@Req() req: any) {
    return this.kycService.getKycStatus(req.user.uid);
  }
}

