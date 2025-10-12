import { Injectable, ConflictException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { GoogleRegisterDto } from './dto/google-register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async registerUser(dto: RegisterUserDto) {
    // Check if user already exists in DB
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid: dto.firebaseUid },
    });

    if (existing) {
      throw new ConflictException('User already registered');
    }

    // Set custom claims in Firebase
    const tenants = dto.tenants || [dto.tenantId];
    await admin.auth().setCustomUserClaims(dto.firebaseUid, {
      role: dto.role,
      tenantId: dto.tenantId,
      tenants,
    });

    // Save user in database
    const user = await this.prisma.user.create({
      data: {
        firebaseUid: dto.firebaseUid,
        email: dto.email,
        tenantId: dto.tenantId,
        role: dto.role,
        tenants,
        metadata: dto.metadata,
      },
    });

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      tenants: user.tenants,
      createdAt: user.createdAt,
    };
  }

  async getUser(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Public method to get Firebase token (no authentication required)
  async getToken(email: string, password: string) {
    try {
      // Call Firebase REST API to sign in
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new UnauthorizedException(data.error?.message || 'Authentication failed');
      }

      // Get user info from Firebase Admin SDK
      const userRecord = await admin.auth().getUser(data.localId);

      return {
        token: data.idToken,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        },
        expiresIn: parseInt(data.expiresIn),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async updateUserRole(firebaseUid: string, role: string) {
    const user = await this.prisma.user.update({
      where: { firebaseUid },
      data: { role },
    });

    // Update custom claims in Firebase
    const firebaseUser = await admin.auth().getUser(firebaseUid);
    const currentClaims = firebaseUser.customClaims || {};
    
    await admin.auth().setCustomUserClaims(firebaseUid, {
      ...currentClaims,
      role,
    });

    return user;
  }

  async listUsers(tenantId?: string) {
    const users = await this.prisma.user.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        tenantId: true,
        role: true,
        tenants: true,
        active: true,
        createdAt: true,
      },
    });

    return users;
  }

  // ============================================
  // NEW REGISTRATION METHODS (with DNI support)
  // ============================================

  /**
   * Register user with Email/Password
   */
  async registerWithEmail(dto: EmailRegisterDto, req: any) {
    // 1. Validate reCAPTCHA (for now, just log - implement later)
    if (!dto.captchaToken) {
      throw new BadRequestException('reCAPTCHA token is required');
    }
    // TODO: Implement actual reCAPTCHA validation
    console.log('⚠️  reCAPTCHA validation not implemented yet');

    // 2. Check rate limiting (basic check)
    const recentUsers = await this.prisma.user.count({
      where: {
        deviceIp: req.ip,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (recentUsers >= 5) {
      throw new BadRequestException('Demasiados registros desde esta IP. Intenta más tarde.');
    }

    // 3. Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // 4. Create user in Firebase
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.fullName,
        emailVerified: false,
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('El email ya está registrado en Firebase');
      }
      throw new BadRequestException(`Error creating Firebase user: ${error.message}`);
    }

    // 5. Send email verification
    try {
      const verificationLink = await admin.auth().generateEmailVerificationLink(dto.email);
      // TODO: Send email with verificationLink
      console.log('📧 Email verification link:', verificationLink);
    } catch (error) {
      console.warn('⚠️  Failed to generate email verification link:', error.message);
    }

    // 6. Save user in database
    const user = await this.prisma.user.create({
      data: {
        uid: firebaseUser.uid,
        email: dto.email,
        fullName: dto.fullName,
        documentType: dto.documentType || 'DNI',
        documentNumber: dto.documentNumber,
        phoneNumber: dto.phoneNumber,
        provider: 'email',
        emailVerified: false,
        verified: false,
        tenantId: 'core',
        role: 'BUYER',
        // Device fingerprint
        deviceIp: req.ip,
        deviceUserAgent: req.headers['user-agent'],
      },
    });

    return {
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        emailVerified: false,
      },
      message: 'Registro exitoso. Por favor verifica tu email.',
    };
  }

  /**
   * Register user with Google Sign-In
   */
  async registerWithGoogle(dto: GoogleRegisterDto, req: any) {
    // 1. Verify Google/Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(dto.idToken);
    } catch (error) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    // 2. Get Firebase user details
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);

    // 3. Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: firebaseUser.email },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya está registrado');
    }

    // 4. Calculate account age and trust score
    const accountCreatedAt = new Date(firebaseUser.metadata.creationTime);
    const accountAgeInDays = Math.floor(
      (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate trust score
    let trustScore = 50; // Base score
    if (firebaseUser.emailVerified) trustScore += 20;
    if (accountAgeInDays > 365) trustScore += 30;
    else if (accountAgeInDays > 30) trustScore += 15;
    
    const emailDomain = firebaseUser.email?.split('@')[1];
    if (emailDomain && emailDomain !== 'gmail.com' && emailDomain !== 'hotmail.com') {
      trustScore += 20; // Corporate email
    }
    if (firebaseUser.photoURL) trustScore += 10;

    // 5. Save user in database
    const user = await this.prisma.user.create({
      data: {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        fullName: firebaseUser.displayName || '',
        documentType: dto.documentType || 'DNI',
        documentNumber: dto.documentNumber,
        phoneNumber: dto.phoneNumber,
        photoUrl: firebaseUser.photoURL,
        provider: 'google',
        emailVerified: true, // Google already verified
        verified: false, // KYC not done yet
        tenantId: 'core',
        role: 'BUYER',
        // Google metadata
        googleName: firebaseUser.displayName,
        accountCreatedAt: accountCreatedAt,
        accountAgeInDays: accountAgeInDays,
        trustScore: trustScore,
        // Device fingerprint
        deviceIp: req.ip,
        deviceUserAgent: req.headers['user-agent'],
      },
    });

    // 6. Warn if suspicious
    if (accountAgeInDays < 1) {
      console.warn(`⚠️  Cuenta de Google muy reciente: ${firebaseUser.email} (${accountAgeInDays} días)`);
    }

    return {
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        emailVerified: true,
        trustScore: user.trustScore,
      },
      message: 'Registro exitoso con Google',
    };
  }
}

