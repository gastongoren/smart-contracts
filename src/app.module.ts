import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { S3Module } from './s3/s3.module';
import { ContractsModule } from './contracts/contracts.module';
import { ChainModule } from './chain/chain.module';
import { TenantModule } from './tenant/tenant.module';
import { HealthController } from './health/health.controller';
import { MeController } from './me/me.controller';
import { S3Controller } from './s3/s3.controller';
import { ContractsController } from './contracts/contracts.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 20, // 20 requests per minute
    }]),
    PrismaModule,
    AuthModule,
    TenantModule.register({ 
      tenants: [
        { 
          id: 'core', 
          branding: { name: 'Smart Core', primaryColor: '#0ea5e9' } 
        },
        {
          id: 'mutual-sanmartin',
          branding: { 
            name: 'Mutual San Martín', 
            primaryColor: '#dc2626',
            logoUrl: 'https://example.com/logo-sanmartin.png'
          },
          overrides: {
            s3Prefix: 'sanmartin/',
            // s3Bucket: 'sanmartin-uploads',  // Opcional: bucket específico
          }
        }
      ]
    }),
    S3Module,
    ChainModule,
    ContractsModule,
  ],
  controllers: [HealthController, MeController, S3Controller, ContractsController],
})
export class AppModule {}

