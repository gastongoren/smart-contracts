# Smart Contracts Core Library

Multi-tenant smart contract management system built with NestJS, AWS S3, and Ethereum.

## Features

- 🏢 **Multi-Tenant Architecture** - Support multiple tenants with isolated configurations
- ⛓️ **Blockchain Integration** - Ethereum smart contract registry with ethers.js
- 📦 **S3 Storage** - Tenant-specific S3 buckets and prefixes
- 🔐 **Firebase Authentication** - JWT-based authentication with role-based access control
- 🎨 **Tenant Branding** - Custom branding per tenant (name, colors, logos)

## Getting Started

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:
- `TENANT_DEFAULT_ID` - Default tenant ID (default: `core`)
- `AWS_REGION`, `S3_BUCKET`, `S3_PREFIX` - AWS S3 configuration
- `CHAIN_RPC_URL`, `CHAIN_PRIVATE_KEY`, `CHAIN_REGISTRY_ADDRESS` - Blockchain settings
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` - Firebase credentials

### Running the App

```bash
# Development
npm run start:dev

# Production
npm run build
npm start
```

The server will start on `http://localhost:3000`

## Multi-Tenant System

### Tenant Resolution

Tenants are resolved in the following order:
1. `X-Tenant-Id` header
2. Host mapping (configurable in `main.ts`)
3. Default tenant ID from environment

### Tenant Configuration

Configure tenants in `src/app.module.ts`:

```typescript
TenantModule.register({ 
  tenants: [
    { 
      id: 'core', 
      branding: { 
        name: 'Smart Core', 
        primaryColor: '#0ea5e9' 
      },
      overrides: {
        s3Bucket: 'custom-bucket',  // Optional
        s3Prefix: 'custom-prefix/', // Optional
        chainRegistryAddress: '0x...' // Optional
      }
    }
  ]
})
```

### Using Tenant Context

In controllers:

```typescript
@Controller('example')
export class ExampleController {
  @Get()
  getData(@Req() req: any) {
    const tenantId = req.tenant?.id;
    const config = req.tenant?.config;
    // ...
  }
}
```

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Get Current User (requires authentication)
```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     -H "X-Tenant-Id: core" \
     http://localhost:3000/me
```

### Create Contract (requires authentication + ADMIN/SELLER role)
```bash
curl -X POST http://localhost:3000/contracts \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-Tenant-Id: core" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "version": 1,
    "hashPdfHex": "0x1234567890abcdef...",
    "pointer": "s3://bucket/key"
  }'
```

### Sign Contract (requires authentication + ADMIN/SELLER role)
```bash
curl -X POST http://localhost:3000/contracts/{contractId}/sign \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-Tenant-Id: core" \
  -H "Content-Type: application/json" \
  -d '{
    "signerAddress": "0x...",
    "hashEvidenceHex": "0x..."
  }'
```

### Get S3 Presigned URL (requires authentication)
```bash
curl -X POST http://localhost:3000/s3/presign \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-Tenant-Id: core" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "application/pdf",
    "ext": ".pdf",
    "userId": "user123"
  }'
```

## Project Structure

```
src/
├── auth/                  # Authentication guards and decorators
│   ├── firebase.guard.ts
│   ├── roles.guard.ts
│   └── roles.decorator.ts
├── tenant/                # Multi-tenant system
│   ├── tenant.types.ts
│   ├── tenant.registry.ts
│   ├── tenant.module.ts
│   ├── tenant.interceptor.ts
│   └── tenant.decorator.ts
├── s3/                    # S3 service for file storage
│   ├── s3.service.ts
│   ├── s3.module.ts
│   └── s3.controller.ts
├── chain/                 # Blockchain integration
│   ├── chain.service.ts
│   ├── chain.module.ts
│   └── registry.abi.json
├── contracts/             # Contract management
│   ├── contracts.service.ts
│   ├── contracts.module.ts
│   ├── contracts.controller.ts
│   └── dto/
├── health/                # Health check endpoint
├── me/                    # User profile endpoint
├── app.module.ts          # Main application module
└── main.ts                # Application bootstrap
```

## Development Notes

- Firebase authentication is optional in development (configure valid credentials to enable)
- Blockchain operations use stub responses when no valid private key is configured
- The zero address (`0x0000000000000000000000000000000000000000`) in `CHAIN_REGISTRY_ADDRESS` will return stub transaction hashes

## License

MIT