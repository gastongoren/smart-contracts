import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // If Firebase is not initialized (dev mode), use mock user
    if (!admin.apps.length) {
      console.warn('⚠️  FirebaseGuard: Firebase not initialized, using mock user');
      req.user = {
        uid: 'dev-user',
        email: 'dev@example.com',
        role: 'ADMIN',
        customClaims: { role: 'ADMIN' }
      };
      return true;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      return true;
    } catch (error) {
      // In development, allow test tokens
      if (process.env.NODE_ENV !== 'production' && token === 'test') {
        console.warn('⚠️  FirebaseGuard: Using test token in development mode');
        req.user = {
          uid: 'test-user',
          email: 'test@example.com',
          role: 'ADMIN',
          customClaims: { role: 'ADMIN' }
        };
        return true;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}

