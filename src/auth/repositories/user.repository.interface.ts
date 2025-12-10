import { User, Prisma } from '@prisma/client';

export interface CreateUserData {
  firebaseUid?: string;
  uid?: string;
  email: string;
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  phoneNumber?: string;
  photoUrl?: string;
  provider?: string;
  emailVerified?: boolean;
  verified?: boolean;
  tenantId?: string;
  role?: string;
  tenants?: string[];
  metadata?: Prisma.JsonValue;
  deviceIp?: string;
  deviceUserAgent?: string;
  googleName?: string;
  accountCreatedAt?: Date;
  accountAgeInDays?: number;
  trustScore?: number;
}

export interface UpdateUserData {
  role?: string;
  tenantId?: string;
  tenants?: string[];
  verified?: boolean;
  emailVerified?: boolean;
  metadata?: Prisma.JsonValue;
}

export interface UserFilters {
  tenantId?: string;
  role?: string;
  verified?: boolean;
}

export interface IUserRepository {
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUid(uid: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(firebaseUid: string, data: UpdateUserData): Promise<User>;
  updateById(id: string, data: UpdateUserData): Promise<User>;
  findMany(filters?: UserFilters): Promise<Array<Pick<User, 'id' | 'firebaseUid' | 'email' | 'tenantId' | 'role' | 'tenants' | 'active' | 'createdAt'>>>;
  count(filters?: UserFilters): Promise<number>;
  countByDeviceIp(deviceIp: string, since: Date): Promise<number>;
}

