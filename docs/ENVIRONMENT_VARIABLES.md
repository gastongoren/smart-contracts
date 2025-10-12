# 🔐 Environment Variables

This document lists all environment variables required for the Smart Contracts system.

## Database

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

## Firebase Configuration

```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_API_KEY="AIzaSy..."
```

## AWS S3 / Cloudflare R2 Configuration

```bash
AWS_REGION="auto"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_ENDPOINT_URL="https://accountid.r2.cloudflarestorage.com"
S3_BUCKET="smart-contract-prod"
R2_PUBLIC_DOMAIN="pub-xxxxx.r2.dev"
```

## Blockchain Configuration

```bash
CHAIN_RPC_URL="https://rpc.sepolia.org"
CHAIN_PRIVATE_KEY="0x..."
CHAIN_REGISTRY_ADDRESS="0x..."
```

## Multi-tenancy

```bash
TENANT_DEFAULT_ID="core"
```

## CORS

```bash
CORS_ORIGINS="http://localhost:3000,https://yourapp.com"
```

## KYC Configuration (Optional - for future)

```bash
# Veriff
VERIFF_API_KEY="your-veriff-api-key"
VERIFF_API_SECRET="your-veriff-secret"

# Or Onfido
ONFIDO_API_KEY="your-onfido-api-key"
```

## reCAPTCHA (Optional - for future)

```bash
RECAPTCHA_SECRET_KEY="your-recaptcha-secret"
RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
```

## SMS Verification (Optional - for future)

```bash
# Twilio
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Or AWS SNS
AWS_SNS_REGION="us-east-1"
```

## Application Settings

```bash
APP_URL="http://localhost:3000"
PORT=3000
NODE_ENV="development"
```

---

## Railway Configuration

For Railway deployment, add these variables in the Railway dashboard:

### Required Variables

- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ENDPOINT_URL`
- `S3_BUCKET`
- `R2_PUBLIC_DOMAIN`
- `CHAIN_RPC_URL`
- `CHAIN_PRIVATE_KEY`
- `CHAIN_REGISTRY_ADDRESS`

### Optional Variables (for future features)

- `VERIFF_API_KEY`
- `RECAPTCHA_SECRET_KEY`
- `TWILIO_ACCOUNT_SID`

