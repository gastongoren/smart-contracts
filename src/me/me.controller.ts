import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FirebaseGuard } from '../auth/firebase.guard';

@Controller('me')
@UseGuards(FirebaseGuard)
export class MeController {
  @Get()
  getMe(@Req() req: any) {
    return {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role || req.user.customClaims?.role,
      tenant: req.tenant,
    };
  }
}

