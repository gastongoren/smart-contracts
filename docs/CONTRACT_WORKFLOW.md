# Contract Creation and Signing Workflow

## Overview

This document explains the complete workflow for creating and signing contracts in the Smart Contracts API.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────>│   Backend   │────────>│ Cloudflare  │
│   (React)   │         │   (NestJS)  │         │     R2      │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │                        │
       │                       │                        │
       │                       v                        v
       │                ┌─────────────┐         ┌─────────────┐
       └───────────────>│ PostgreSQL  │         │ Blockchain  │
                        └─────────────┘         │  (Sepolia)  │
                                                └─────────────┘
```

## Workflow Steps

### 1. User Authentication

First, authenticate with Firebase:

```typescript
// Frontend: Get Firebase JWT token
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(
  auth, 
  'test@contracts.com', 
  'Test1234'
);
const token = await userCredential.user.getIdToken();
```

### 2. Generate Contract PDF

Generate the contract PDF using any PDF library (e.g., `pdfmake`, `jsPDF`, `react-pdf`):

```typescript
import pdfMake from 'pdfmake/build/pdfmake';

const docDefinition = {
  content: [
    { text: 'CONTRATO DE COMPRAVENTA DE VEHÍCULO', style: 'header' },
    { text: '\n' },
    { text: `Vendedor: ${sellerName}` },
    { text: `Comprador: ${buyerName}` },
    { text: `Vehículo: ${vehicle}` },
    { text: `Precio: USD ${price}` },
    { text: `Fecha: ${new Date().toLocaleDateString()}` },
  ],
  styles: {
    header: { fontSize: 18, bold: true }
  }
};

const pdfDocGenerator = pdfMake.createPdf(docDefinition);
const pdfBlob = await new Promise<Blob>((resolve) => {
  pdfDocGenerator.getBlob(resolve);
});
```

### 3. Upload PDF and Create Contract (ONE STEP!)

**This is the recommended approach.** The backend handles everything:

```typescript
const formData = new FormData();
formData.append('file', pdfBlob, 'contrato.pdf');
formData.append('templateId', '5');
formData.append('version', '1');

const response = await fetch('https://api.example.com/contracts/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': 'mutual-sanmartin'
  },
  body: formData
});

const contract = await response.json();
// {
//   contractId: "0x24b6800b...",
//   txHash: "0xabc123...",
//   id: "8cbc748f-e6c0-4f79-aa5d-a6fd9f9b441c",
//   status: "created",
//   hashPdf: "0x76e3bdccc52b395b...",
//   pdfUrl: "https://r2.cloudflarestorage.com/...",
//   pdfKey: "sanmartin/userId/filename.pdf",
//   createdAt: "2025-10-11T18:26:03.641Z"
// }
```

**What the backend does automatically:**
1. ✅ Calculates SHA-256 hash of the PDF
2. ✅ Uploads PDF to Cloudflare R2
3. ✅ Registers contract on blockchain
4. ✅ Saves metadata to PostgreSQL
5. ✅ Returns complete contract details

### 4. Sign the Contract (First Signature)

```typescript
const signResponse1 = await fetch(
  `https://api.example.com/contracts/${contract.contractId}/sign`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': 'mutual-sanmartin',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      signerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC',
      hashEvidenceHex: '0x1111...', // Hash of signature evidence (image, video, etc.)
      signerName: 'Juan Pérez',
      signerEmail: 'juan.perez@example.com'
    })
  }
);

const signature1 = await signResponse1.json();
// {
//   contractId: "0x24b6800b...",
//   txHash: "0xdef456...",
//   signatureId: "f2d6ec7f-e11e-40ce-b209-bffcd17a761b",
//   status: "partial_signed",  // ← Changed from "created"
//   signedAt: "2025-10-11T18:26:53.582Z"
// }
```

### 5. Sign the Contract (Second Signature)

```typescript
const signResponse2 = await fetch(
  `https://api.example.com/contracts/${contract.contractId}/sign`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': 'mutual-sanmartin',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      signerAddress: '0x9876543210abcdef9876543210abcdef98765432',
      hashEvidenceHex: '0x2222...',
      signerName: 'María García',
      signerEmail: 'maria.garcia@example.com'
    })
  }
);

const signature2 = await signResponse2.json();
// {
//   contractId: "0x24b6800b...",
//   txHash: "0xghi789...",
//   signatureId: "cd5ff2f2-d56d-489b-9c85-563f315087ba",
//   status: "fully_signed",  // ← Changed from "partial_signed"
//   signedAt: "2025-10-11T18:26:56.239Z"
// }
```

### 6. Retrieve Contract Details

```typescript
const contractDetails = await fetch(
  `https://api.example.com/contracts/${contract.contractId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': 'mutual-sanmartin'
    }
  }
);

const fullContract = await contractDetails.json();
// {
//   id: "8cbc748f-e6c0-4f79-aa5d-a6fd9f9b441c",
//   contractId: "0x24b6800b...",
//   status: "fully_signed",
//   hashPdf: "0x76e3bdccc52b395b...",
//   pointer: "sanmartin/userId/filename.pdf",
//   signatures: [
//     {
//       id: "f2d6ec7f-e11e-40ce-b209-bffcd17a761b",
//       signerAddress: "0x742d35...",
//       signerName: "Juan Pérez",
//       signerEmail: "juan.perez@example.com",
//       signedAt: "2025-10-11T18:26:53.582Z",
//       txHash: "0xdef456..."
//     },
//     {
//       id: "cd5ff2f2-d56d-489b-9c85-563f315087ba",
//       signerAddress: "0x987654...",
//       signerName: "María García",
//       signerEmail: "maria.garcia@example.com",
//       signedAt: "2025-10-11T18:26:56.239Z",
//       txHash: "0xghi789..."
//     }
//   ]
// }
```

## Contract States

| State | Description |
|-------|-------------|
| `created` | Contract created, no signatures yet |
| `partial_signed` | Contract has at least one signature, but not all |
| `fully_signed` | Contract has all required signatures |

**State transitions are automatic** based on the number of signatures.

## Alternative: Manual Workflow (Advanced)

If you need more control over the upload process, you can use the manual workflow:

### Step 1: Get Presigned URL

```typescript
const presignResponse = await fetch('https://api.example.com/s3/presign', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': 'mutual-sanmartin',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contentType: 'application/pdf',
    ext: '.pdf'
    // userId is automatically set from Firebase UID
  })
});

const { url, key } = await presignResponse.json();
```

### Step 2: Upload PDF to R2

```typescript
await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/pdf'
  },
  body: pdfBlob
});
```

### Step 3: Calculate Hash

```typescript
const arrayBuffer = await pdfBlob.arrayBuffer();
const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

### Step 4: Create Contract

```typescript
const response = await fetch('https://api.example.com/contracts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': 'mutual-sanmartin',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    templateId: 5,
    version: 1,
    hashPdfHex: hashHex,
    pointer: key
  })
});
```

## Security Considerations

1. **PDF Hash**: The SHA-256 hash of the PDF is calculated server-side to ensure integrity.
2. **Firebase Authentication**: All endpoints require valid Firebase JWT tokens.
3. **Tenant Isolation**: Multi-tenant architecture ensures data isolation.
4. **Blockchain Immutability**: Contract hashes and signatures are registered on-chain.
5. **Role-Based Access**: Only users with `ADMIN` or `SELLER` roles can create contracts.

## Testing

You can test the complete workflow using the Swagger UI:

https://smart-contracts-production.up.railway.app/api-docs

Or using curl:

```bash
# 1. Create contract with PDF upload
curl -X POST "https://smart-contracts-production.up.railway.app/contracts/upload" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "x-tenant-id: mutual-sanmartin" \
  -F "file=@contract.pdf" \
  -F "templateId=5" \
  -F "version=1"

# 2. Sign contract
curl -X POST "https://smart-contracts-production.up.railway.app/contracts/CONTRACT_ID/sign" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "x-tenant-id: mutual-sanmartin" \
  -H "Content-Type: application/json" \
  -d '{
    "signerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC",
    "hashEvidenceHex": "0x1111...",
    "signerName": "Juan Pérez",
    "signerEmail": "juan.perez@example.com"
  }'
```

## FAQ

### Q: Can I upload files other than PDF?

A: No, only PDF files are accepted. The backend validates the MIME type.

### Q: What happens if I upload the same PDF twice?

A: Each upload generates a unique filename, so you'll have two separate contracts with different IDs but potentially the same hash.

### Q: Can I retrieve the original PDF?

A: Yes, use the `pdfUrl` returned in the response to download the PDF from Cloudflare R2.

### Q: What is the maximum PDF size?

A: The default limit is 10MB. This can be configured in the backend.

### Q: How many signatures are required?

A: The status changes to `fully_signed` after 2 signatures, but you can add more if needed.

