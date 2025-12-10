import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository, CreateUserData, UpdateUserData, UserFilters } from '../user.repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUid(uid: string) {
    return this.prisma.user.findFirst({
      where: { uid },
    });
  }

  async create(data: CreateUserData) {
    return this.prisma.user.create({
      data: {
        firebaseUid: data.firebaseUid,
        uid: data.uid,
        email: data.email,
        fullName: data.fullName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        phoneNumber: data.phoneNumber,
        photoUrl: data.photoUrl,
        provider: data.provider,
        emailVerified: data.emailVerified,
        verified: data.verified,
        tenantId: data.tenantId,
        role: data.role,
        tenants: data.tenants,
        metadata: data.metadata,
        deviceIp: data.deviceIp,
        deviceUserAgent: data.deviceUserAgent,
        googleName: data.googleName,
        accountCreatedAt: data.accountCreatedAt,
        accountAgeInDays: data.accountAgeInDays,
        trustScore: data.trustScore,
      },
    });
  }

  async update(firebaseUid: string, data: UpdateUserData) {
    return this.prisma.user.update({
      where: { firebaseUid },
      data,
    });
  }

  async updateById(id: string, data: UpdateUserData) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findMany(filters?: UserFilters) {
    const where: any = {};
    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }
    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.verified !== undefined) {
      where.verified = filters.verified;
    }

    return this.prisma.user.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
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
  }

  async count(filters?: UserFilters) {
    const where: any = {};
    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }
    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.verified !== undefined) {
      where.verified = filters.verified;
    }

    return this.prisma.user.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  async countByDeviceIp(deviceIp: string, since: Date) {
    return this.prisma.user.count({
      where: {
        deviceIp,
        createdAt: {
          gte: since,
        },
      },
    });
  }
}

