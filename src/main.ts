import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TenantInterceptor } from './tenant/tenant.interceptor';
import { InMemoryTenantRegistry } from './tenant/tenant.registry';
import * as admin from 'firebase-admin';
import helmet from 'helmet';

async function bootstrap() {
  // Initialize Firebase Admin (optional for development)
  if (!admin.apps.length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      
      // Only initialize if valid credentials are provided
      if (projectId && privateKey && clientEmail && 
          projectId !== 'your-project-id' && 
          !privateKey.includes('MOCK_KEY')) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        console.log('✅ Firebase Admin initialized successfully');
      } else {
        console.warn('⚠️  Firebase Admin not initialized - using mock credentials');
        console.warn('   Authentication guards will not work properly');
      }
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error.message);
      console.warn('   Continuing without Firebase - authentication will not work');
    }
  }

  const app = await NestFactory.create(AppModule);

  // Security: Helmet
  app.use(helmet());

  // CORS
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert strings to numbers automatically
      },
    }),
  );
  
  // Tenant interceptor
  const registry = app.get(InMemoryTenantRegistry);
  app.useGlobalInterceptors(new TenantInterceptor({
    registry,
    base: {
      s3Bucket: process.env.S3_BUCKET!,
      s3Prefix: (process.env.S3_PREFIX ?? 'uploads/'),
      chainRegistryAddress: process.env.CHAIN_REGISTRY_ADDRESS ?? '0x0000000000000000000000000000000000000000',
    },
    defaultTenantId: process.env.TENANT_DEFAULT_ID ?? 'core',
    // hostMap: { 'api.sanmartin.local': 'mutual-sanmartin' }
  }));
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
}
bootstrap();

