import { Controller, Post, Get, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { FirebaseGuard } from './firebase.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register user with tenant and role',
    description: 'Register a Firebase user in the system with specific tenant and role. This sets custom claims in Firebase and saves user data in PostgreSQL.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        id: 'uuid-123',
        firebaseUid: 'abc123def456',
        email: 'juan@example.com',
        tenantId: 'mutual-sanmartin',
        role: 'SELLER',
        tenants: ['mutual-sanmartin'],
        createdAt: '2025-10-11T14:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'User already registered' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
  }

  @Get('users')
  @UseGuards(FirebaseGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('firebase-auth')
  @ApiSecurity('tenant-header')
  @ApiOperation({
    summary: 'List all users',
    description: 'List all users in the system. Admins can see users from all tenants.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      example: [
        {
          id: 'uuid-123',
          firebaseUid: 'abc123',
          email: 'juan@example.com',
          tenantId: 'mutual-sanmartin',
          role: 'SELLER',
          active: true,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  async listUsers(@Req() req: any) {
    // Admins can see all users, others only their tenant
    const tenantId = req.user?.role === 'ADMIN' ? undefined : req.tenant?.id;
    return this.authService.listUsers(tenantId);
  }

  @Patch('users/:firebaseUid/role')
  @UseGuards(FirebaseGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('firebase-auth')
  @ApiSecurity('tenant-header')
  @ApiOperation({
    summary: 'Update user role',
    description: 'Update a user\'s role. Updates both PostgreSQL and Firebase custom claims.',
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  async updateRole(
    @Param('firebaseUid') firebaseUid: string,
    @Body('role') role: string,
  ) {
    return this.authService.updateUserRole(firebaseUid, role);
  }

  @Get('users/:firebaseUid')
  @UseGuards(FirebaseGuard)
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Get user details',
    description: 'Get details of a specific user by Firebase UID',
  })
  @ApiResponse({
    status: 200,
    description: 'User details',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUser(@Param('firebaseUid') firebaseUid: string) {
    return this.authService.getUser(firebaseUid);
  }
}

