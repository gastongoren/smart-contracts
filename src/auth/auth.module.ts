import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaUserRepository } from './repositories/prisma/user.repository';
import { IUserRepository } from './repositories/user.repository.interface';

@Module({
  imports: [PrismaModule],
  providers: [
    AuthService,
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    PrismaUserRepository,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

