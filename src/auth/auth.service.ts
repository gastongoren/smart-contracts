import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';

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
}

