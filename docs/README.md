# Documentation

## Guides

- [API Examples](./API_EXAMPLES.md) - Complete API usage examples with cURL commands
- [User Registration Guide](./USER_REGISTRATION_GUIDE.md) - How to register and manage users
- [Quick Start Guide](./QUICKSTART.md) - Get started with local development

## Main Documentation

- [README](../README.md) - Project overview and features
- [Deployment Guide](../DEPLOYMENT.md) - Deploy to Railway (production)

## API Reference

- **Swagger UI:** https://smart-contracts-production.up.railway.app/api-docs
- **OpenAPI JSON:** https://smart-contracts-production.up.railway.app/api-docs-json

## Architecture

The system follows a clean architecture pattern with:

- **Controllers** - HTTP request handling
- **Services** - Business logic
- **Repositories** - Data access (Prisma)
- **Guards** - Authentication & authorization
- **Interceptors** - Tenant resolution
- **DTOs** - Data validation

## Key Concepts

### Multi-Tenancy
Each tenant has isolated data and configuration. Tenant resolution happens automatically via headers, user claims, or defaults.

### Authentication Flow
1. User registers/logs in via Firebase
2. Backend assigns custom claims (role, tenantId)
3. User receives JWT token with claims
4. Token used in all API requests
5. Backend validates and extracts user/tenant info

### Contract Lifecycle
1. **Created** - Initial creation, registered on blockchain
2. **Partial Signed** - At least one signature
3. **Fully Signed** - All parties have signed

### Storage Organization
```
bucket/
├── {tenant-prefix}/
│   └── {user-uid}/
│       └── {uuid}.{ext}
```

Example: `sanmartin/SoJczPKN4DYfChzWhvbiegSi0422/contract.pdf`

