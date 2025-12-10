import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StartKycDto } from './dto/start-kyc.dto';
import { VeriffWebhookDto } from './dto/kyc-webhook.dto';

// Veriff SDK types (we'll install the package)
interface VeriffSession {
  id: string;
  url: string;
}

@Injectable()
export class KycService {
  private veriffApiKey: string;
  private veriffApiSecret: string;
  private appUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.veriffApiKey = this.config.get<string>('VERIFF_API_KEY') || '';
    this.veriffApiSecret = this.config.get<string>('VERIFF_API_SECRET') || '';
    this.appUrl = this.config.get<string>('APP_URL') || 'http://localhost:3000';
  }

  /**
   * Start KYC verification session for a user
   */
  async startVerification(userId: string, dto: StartKycDto): Promise<{ verificationUrl: string; sessionId: string }> {
    // Find user
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { uid: userId },
          { firebaseUid: userId },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.documentNumber || !user.fullName) {
      throw new BadRequestException('User must have documentNumber and fullName before starting KYC');
    }

    // Check if already verified
    if (user.verified) {
      throw new BadRequestException('User is already verified');
    }

    // Initialize Veriff SDK (we'll install @veriff/node-sdk)
    // For now, we'll create a mock implementation
    let veriffSession: VeriffSession;

    if (!this.veriffApiKey || !this.veriffApiSecret) {
      // Development mode: return mock session
      console.warn('⚠️  Veriff API keys not configured. Using mock session.');
      veriffSession = {
        id: `mock-session-${Date.now()}`,
        url: `${this.appUrl}/kyc/mock?sessionId=mock-session-${Date.now()}`,
      };
    } else {
      // Production: use real Veriff SDK
      // TODO: Install @veriff/node-sdk and uncomment
      /*
      const Veriff = require('@veriff/node-sdk');
      const veriff = new Veriff({
        apiKey: this.veriffApiKey,
        apiSecret: this.veriffApiSecret,
      });

      const session = await veriff.session.create({
        verification: {
          callback: `${this.appUrl}/api/kyc/webhook`,
          person: {
            firstName: user.fullName?.split(' ')[0] || '',
            lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
          },
          document: {
            type: 'PASSPORT', // or 'ID_CARD', 'DRIVERS_LICENSE'
            country: 'AR', // Argentina
          },
        },
      });

      veriffSession = {
        id: session.verification.id,
        url: session.verification.url,
      };
      */
      throw new BadRequestException('Veriff SDK not yet installed. Please install @veriff/node-sdk');
    }

    // Store session ID in user metadata (temporary, until webhook confirms)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...(user.metadata as object || {}),
          pendingKycSessionId: veriffSession.id,
        },
      },
    });

    return {
      verificationUrl: veriffSession.url,
      sessionId: veriffSession.id,
    };
  }

  /**
   * Handle Veriff webhook callback
   */
  async handleWebhook(payload: VeriffWebhookDto, signature?: string): Promise<void> {
    // Verify webhook signature (if provided)
    if (signature && this.veriffApiSecret) {
      // TODO: Implement signature verification
      // const isValid = veriff.webhook.verify(payload, signature, this.veriffApiSecret);
      // if (!isValid) throw new UnauthorizedException('Invalid webhook signature');
    }

    const verificationId = payload.id;
    const status = payload.status;
    const code = payload.code || payload.verification?.code;

    // Find user by pending session ID
    const user = await this.prisma.user.findFirst({
      where: {
        metadata: {
          path: ['pendingKycSessionId'],
          equals: verificationId,
        },
      },
    });

    if (!user) {
      console.warn(`⚠️  KYC webhook received for unknown session: ${verificationId}`);
      return;
    }

    // Check verification status
    if (status === 'success' || code === 9001) {
      // Verification successful
      // Validate that DNI matches
      const documentNumber = payload.person?.idNumber || payload.document?.number;
      const firstName = payload.person?.firstName || '';
      const lastName = payload.person?.lastName || '';
      const fullNameFromKyc = `${firstName} ${lastName}`.trim();

      // Validate DNI matches
      if (documentNumber && user.documentNumber) {
        const normalizedKycDoc = documentNumber.replace(/\D/g, '');
        const normalizedUserDoc = user.documentNumber.replace(/\D/g, '');

        if (normalizedKycDoc !== normalizedUserDoc) {
          console.error(`❌ KYC DNI mismatch: User ${user.id} - KYC: ${normalizedKycDoc}, User: ${normalizedUserDoc}`);
          // Don't verify user if DNI doesn't match
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              metadata: {
                ...(user.metadata as object || {}),
                kycRejected: true,
                kycRejectionReason: 'DNI mismatch',
              },
            },
          });
          return;
        }
      }

      // Validate name similarity (70%+ similarity)
      if (user.fullName && fullNameFromKyc) {
        const similarity = this.calculateNameSimilarity(user.fullName, fullNameFromKyc);
        if (similarity < 0.7) {
          console.warn(`⚠️  Name similarity low: ${similarity}% for user ${user.id}`);
          // Still verify, but log warning
        }
      }

      // Update user as verified
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
          verificationId: verificationId,
          verificationProvider: 'veriff',
          metadata: {
            ...(user.metadata as object || {}),
            pendingKycSessionId: undefined,
            kycRejected: undefined,
          },
        },
      });

      console.log(`✅ User ${user.id} (${user.email}) verified via KYC`);
    } else {
      // Verification failed or rejected
      const reason = payload.verification?.reason || payload.verification?.reasonCode || 'Unknown reason';
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...(user.metadata as object || {}),
            pendingKycSessionId: undefined,
            kycRejected: true,
            kycRejectionReason: reason,
          },
        },
      });

      console.log(`❌ KYC verification failed for user ${user.id}: ${reason}`);
    }
  }

  /**
   * Get KYC status for current user
   */
  async getKycStatus(userId: string): Promise<{
    verified: boolean;
    verifiedAt?: Date;
    verificationId?: string;
    verificationProvider?: string;
    pendingSessionId?: string;
  }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { uid: userId },
          { firebaseUid: userId },
        ],
      },
      select: {
        verified: true,
        verifiedAt: true,
        verificationId: true,
        verificationProvider: true,
        metadata: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const metadata = user.metadata as any || {};

    return {
      verified: user.verified,
      verifiedAt: user.verifiedAt || undefined,
      verificationId: user.verificationId || undefined,
      verificationProvider: user.verificationProvider || undefined,
      pendingSessionId: metadata.pendingKycSessionId || undefined,
    };
  }

  /**
   * Calculate name similarity using Levenshtein distance
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (n1 === n2) return 1.0;

    const maxLen = Math.max(n1.length, n2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(n1, n2);
    return 1 - distance / maxLen;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

