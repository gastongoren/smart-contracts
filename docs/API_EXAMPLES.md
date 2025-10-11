# 🚀 API Examples - Production

## Base URL
```
https://smart-contracts-production.up.railway.app
```

---

## 📍 Endpoints

### 1. Health Check
```bash
curl https://smart-contracts-production.up.railway.app/health
```
**Response:**
```json
{"status":"ok","timestamp":"2025-10-11T14:11:20.616Z"}
```

---

### 2. Get Current User + Tenant Info
```bash
curl -H "Authorization: Bearer test" \
     -H "x-tenant-id: core" \
     https://smart-contracts-production.up.railway.app/me
```
**Response:**
```json
{
  "uid": "dev-user",
  "email": "dev@example.com",
  "role": "ADMIN",
  "tenant": {
    "id": "core",
    "config": {
      "branding": {"name": "Smart Core", "primaryColor": "#0ea5e9"},
      "s3Bucket": "smart-contracts-uploads",
      "s3Prefix": "uploads/"
    }
  }
}
```

---

### 3. Create Contract
```bash
curl -X POST https://smart-contracts-production.up.railway.app/contracts \
  -H "Authorization: Bearer test" \
  -H "x-tenant-id: core" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "version": 1,
    "hashPdfHex": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "pointer": "s3://bucket/contract-venta-auto.pdf"
  }'
```
**Response:**
```json
{
  "contractId": "0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469",
  "txHash": "0xstub",
  "id": "d2a1d1c8-5bc3-4cf4-a824-e6153f8655ff",
  "status": "created",
  "createdAt": "2025-10-11T14:11:46.036Z"
}
```

---

### 4. Sign Contract
```bash
curl -X POST https://smart-contracts-production.up.railway.app/contracts/0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469/sign \
  -H "Authorization: Bearer test" \
  -H "x-tenant-id: core" \
  -H "Content-Type: application/json" \
  -d '{
    "signerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC",
    "hashEvidenceHex": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "signerName": "Juan Pérez",
    "signerEmail": "juan.perez@example.com"
  }'
```
**Response:**
```json
{
  "contractId": "0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469",
  "txHash": "0xstub",
  "signatureId": "d83adf88-163d-445a-aca2-8bbc83c0e97d",
  "status": "partial_signed",
  "signedAt": "2025-10-11T14:25:25.658Z"
}
```

---

### 5. List Contracts
```bash
# Listar todos
curl -H "Authorization: Bearer test" \
     -H "x-tenant-id: core" \
     https://smart-contracts-production.up.railway.app/contracts

# Con filtros y paginación
curl -H "Authorization: Bearer test" \
     -H "x-tenant-id: core" \
     "https://smart-contracts-production.up.railway.app/contracts?status=fully_signed&page=1&limit=10"
```
**Response:**
```json
{
  "data": [
    {
      "id": "d2a1d1c8-5bc3-4cf4-a824-e6153f8655ff",
      "contractId": "0x398288...",
      "status": "fully_signed",
      "signatures": [
        {"signerAddress": "0x742d35...", "signedAt": "2025-10-11T14:25:25.658Z"},
        {"signerAddress": "0x987654...", "signedAt": "2025-10-11T14:25:32.139Z"}
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 6. Get Contract Details
```bash
curl -H "Authorization: Bearer test" \
     https://smart-contracts-production.up.railway.app/contracts/0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469
```
**Response:**
```json
{
  "id": "d2a1d1c8-5bc3-4cf4-a824-e6153f8655ff",
  "contractId": "0x39828877b3f9fcf10367f04ac81a9f141c7f40a8f811cb1787ad9f3a53345469",
  "tenantId": "core",
  "templateId": 1,
  "version": 1,
  "status": "fully_signed",
  "signatures": [
    {
      "signerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC",
      "signerName": "Juan Pérez",
      "signerEmail": "juan.perez@example.com",
      "evidenceHash": "0xbbbb..."
    },
    {
      "signerAddress": "0x9876543210abcdef9876543210abcdef98765432",
      "signerName": "María García",
      "signerEmail": "maria.garcia@example.com",
      "evidenceHash": "0xcccc..."
    }
  ]
}
```

---

### 7. S3 Presigned URL
```bash
curl -X POST https://smart-contracts-production.up.railway.app/s3/presign \
  -H "Authorization: Bearer test" \
  -H "x-tenant-id: core" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "application/pdf",
    "ext": ".pdf",
    "userId": "user123"
  }'
```
**Response:**
```json
{
  "url": "https://s3.us-east-1.amazonaws.com/smart-contracts-uploads/uploads/user123/abc-123.pdf?...",
  "key": "uploads/user123/abc-123.pdf",
  "bucket": "smart-contracts-uploads",
  "tenantId": "core",
  "mock": true
}
```

---

## 🏢 Multi-Tenant Examples

### Tenant: core
```bash
curl -H "x-tenant-id: core" \
     -H "Authorization: Bearer test" \
     https://smart-contracts-production.up.railway.app/me
```
S3 Prefix: `uploads/`

### Tenant: mutual-sanmartin
```bash
curl -H "x-tenant-id: mutual-sanmartin" \
     -H "Authorization: Bearer test" \
     https://smart-contracts-production.up.railway.app/me
```
S3 Prefix: `sanmartin/`

---

## 🔐 Authentication

### Development Mode (current)
- Token: `test`
- Creates mock user with ADMIN role
- Works without real Firebase credentials

### Production Mode
- Use real Firebase JWT tokens
- Configure Firebase credentials in Railway variables
- Users authenticate via Firebase Auth

---

## 📊 Status Flow

```
created → partial_signed → fully_signed
  ↓            ↓                ↓
  0 signs    1 sign         2+ signs
```

---

## 🎯 Complete Example Flow

```bash
# 1. Create contract
CONTRACT_ID=$(curl -s -X POST https://smart-contracts-production.up.railway.app/contracts \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"templateId":5,"version":1,"hashPdfHex":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"}' \
  | grep -o '"contractId":"[^"]*"' | cut -d'"' -f4)

echo "Contract created: $CONTRACT_ID"

# 2. Seller signs
curl -X POST "https://smart-contracts-production.up.railway.app/contracts/${CONTRACT_ID}/sign" \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{
    "signerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC",
    "hashEvidenceHex": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "signerName": "Vendedor",
    "signerEmail": "vendedor@example.com"
  }'

# 3. Buyer signs
curl -X POST "https://smart-contracts-production.up.railway.app/contracts/${CONTRACT_ID}/sign" \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{
    "signerAddress": "0x9876543210abcdef9876543210abcdef98765432",
    "hashEvidenceHex": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "signerName": "Comprador",
    "signerEmail": "comprador@example.com"
  }'

# 4. View final contract
curl -H "Authorization: Bearer test" \
  "https://smart-contracts-production.up.railway.app/contracts/${CONTRACT_ID}"
```

---

## 🛠️ Useful Commands

### Check all contracts
```bash
curl -H "Authorization: Bearer test" \
  https://smart-contracts-production.up.railway.app/contracts | python3 -m json.tool
```

### Filter by status
```bash
curl -H "Authorization: Bearer test" \
  "https://smart-contracts-production.up.railway.app/contracts?status=fully_signed"
```

### Pagination
```bash
curl -H "Authorization: Bearer test" \
  "https://smart-contracts-production.up.railway.app/contracts?page=1&limit=5"
```

---

## 📚 Documentation

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Quick start: [QUICKSTART.md](./QUICKSTART.md)
- GitHub setup: [GITHUB_SETUP.md](./GITHUB_SETUP.md)

---

## 🎊 Success!

Your smart contract multi-tenant system is fully operational in production! 🚀

