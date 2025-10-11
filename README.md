# Smart Contracts Multi-Tenant API

Enterprise-grade multi-tenant smart contract management system with blockchain integration, built with NestJS.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🏢 **Multi-Tenant Architecture** - Complete tenant isolation with custom branding and configuration
- ⛓️ **Blockchain Integration** - Ethereum smart contract registry with immutable signatures
- 🔐 **Firebase Authentication** - JWT-based auth with role-based access control
- 📦 **Cloud Storage** - Cloudflare R2 (S3-compatible) with tenant-specific organization
- 🗄️ **PostgreSQL Database** - Persistent storage with Prisma ORM
- 📚 **OpenAPI Documentation** - Complete Swagger/OpenAPI 3.0 specification
- 🛡️ **Production-Ready** - Security headers, rate limiting, validation, CORS

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Firebase project
- Cloudflare R2 bucket (or AWS S3)

### Installation

```bash
# Clone repository
git clone https://github.com/gastongoren/smart-contracts.git
cd smart-contracts

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start PostgreSQL (Docker)
docker-compose up -d

# Run migrations
npx prisma migrate deploy

# Start development server
npm run start:dev
```

Server runs on `http://localhost:3000`

## API Documentation

Once running, access interactive API documentation at:
- **Swagger UI:** http://localhost:3000/api-docs
- **OpenAPI JSON:** http://localhost:3000/api-docs-json

## Architecture

### Tech Stack

- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Authentication:** Firebase Auth with JWT
- **Storage:** Cloudflare R2 (S3-compatible)
- **Blockchain:** Ethereum (ethers.js v6)
- **Deployment:** Railway

### Multi-Tenant Design

Each tenant can have isolated:
- Branding (name, colors, logo)
- Storage buckets and prefixes
- Blockchain registry addresses
- User access controls

Tenant resolution order:
1. `x-tenant-id` header
2. User's custom claims
3. Host mapping
4. Default tenant

## API Endpoints

### Authentication
- `POST /auth/register` - Register user with tenant and role
- `GET /me` - Get current user info

### Contracts
- `POST /contracts` - Create contract
- `GET /contracts` - List contracts (paginated)
- `GET /contracts/:id` - Get contract details
- `POST /contracts/:id/sign` - Sign contract

### Storage
- `POST /s3/presign` - Generate presigned upload URL

### Users (Admin only)
- `GET /auth/users` - List all users
- `PATCH /auth/users/:uid/role` - Update user role

See full documentation in [docs/API_EXAMPLES.md](docs/API_EXAMPLES.md)

## Configuration

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Cloudflare R2
AWS_REGION=auto
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ENDPOINT_URL=https://xxx.r2.cloudflarestorage.com
S3_BUCKET=your-bucket-name
S3_PREFIX=uploads/

# Blockchain
CHAIN_RPC_URL=https://rpc.ankr.com/eth_sepolia
CHAIN_PRIVATE_KEY=0x...
CHAIN_REGISTRY_ADDRESS=0x...

# Tenant
TENANT_DEFAULT_ID=core
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide to Railway.

Quick deploy:
1. Push to GitHub
2. Connect Railway to repository
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy automatically

## Development

```bash
# Start PostgreSQL
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start dev server with hot reload
npm run start:dev

# View database
npx prisma studio

# Run build
npm run build

# Start production
npm run start:prod
```

## Project Structure

```
src/
├── auth/          # Authentication & user management
├── tenant/        # Multi-tenant system
├── contracts/     # Smart contract operations
├── s3/            # Cloud storage (R2/S3)
├── chain/         # Blockchain integration
├── prisma/        # Database service
├── health/        # Health checks
└── me/            # User profile

prisma/
├── schema.prisma
└── migrations/

docs/              # Additional documentation
```

## Security

- **Authentication:** Firebase JWT tokens with custom claims
- **Authorization:** Role-based access control (RBAC)
- **Data Isolation:** Automatic tenant filtering in all queries
- **Rate Limiting:** 20 requests/minute per IP
- **Input Validation:** class-validator on all DTOs
- **Security Headers:** Helmet.js configured
- **CORS:** Configurable allowed origins

## Multi-Tenant Features

### Tenant Configuration

```typescript
TenantModule.register({
  tenants: [
    {
      id: 'acme-corp',
      branding: {
        name: 'Acme Corporation',
        primaryColor: '#0ea5e9',
        logoUrl: 'https://...'
      },
      overrides: {
        s3Bucket: 'acme-uploads',
        s3Prefix: 'acme/',
        chainRegistryAddress: '0x...'
      }
    }
  ]
})
```

### User-Tenant Assignment

Users can belong to one or multiple tenants:

```json
{
  "firebaseUid": "abc123",
  "email": "user@example.com",
  "tenantId": "acme-corp",
  "role": "SELLER",
  "tenants": ["acme-corp", "other-tenant"]
}
```

## License

MIT

## Documentation

- [API Examples](docs/API_EXAMPLES.md)
- [User Registration Guide](docs/USER_REGISTRATION_GUIDE.md)
- [Quick Start Guide](docs/QUICKSTART.md)
- [Deployment Guide](DEPLOYMENT.md)
