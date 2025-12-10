# ✍️ Cómo Firmar un Contrato

## Proceso Completo de Firma

### Paso 1: Preparar la Evidencia de Firma

Antes de llamar al endpoint, necesitás preparar la **evidencia de firma**. Esta evidencia puede incluir:

```json
{
  "timestamp": "2025-12-06T22:51:45.269Z",
  "ip": "192.168.1.100",
  "geolocation": { "lat": -34.6037, "lng": -58.3816 },
  "biometric": "face_id_verified",
  "signatureImage": "data:image/png;base64,...",
  "idPhoto": "data:image/jpeg;base64,...",
  "deviceId": "device-123",
  "userAgent": "Mozilla/5.0..."
}
```

**Importante:** La evidencia puede contener cualquier información que quieras guardar como prueba de la firma.

### Paso 2: Calcular el Hash de la Evidencia

El hash se calcula como **SHA-256 del JSON serializado** de la evidencia:

```javascript
// Ejemplo en JavaScript/Node.js
const crypto = require('crypto');
const evidence = {
  timestamp: "2025-12-06T22:51:45.269Z",
  ip: "192.168.1.100",
  biometric: "face_id_verified"
};

const jsonString = JSON.stringify(evidence);
const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
const hashEvidenceHex = '0x' + hash; // Resultado: 0x4f59a17a571e1468ca2dc17e4e16d25c7c79f24bc01dc8427d846c7917604dc7
```

**⚠️ Importante:** El hash debe calcularse **exactamente igual** que en el backend. El backend usa `JSON.stringify(evidence)`, así que:
- El orden de las propiedades importa
- Los espacios y formato del JSON importan
- Debe ser el mismo JSON que vas a enviar en el campo `evidence`

### Paso 3: Llamar al Endpoint de Firma

**Endpoint:** `POST /contracts/:contractId/sign`

**Headers requeridos:**
```
Authorization: Bearer <token>
X-Tenant-Id: core
Content-Type: application/json
```

**Body del request:**
```json
{
  "signerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC",
  "hashEvidenceHex": "0x4f59a17a571e1468ca2dc17e4e16d25c7c79f24bc01dc8427d846c7917604dc7",
  "signerName": "Juan Pérez",
  "signerEmail": "juan@example.com",
  "evidence": {
    "timestamp": "2025-12-06T22:51:45.269Z",
    "ip": "192.168.1.100",
    "biometric": "face_id_verified"
  }
}
```

**Campos:**
- `signerAddress` (requerido): Dirección de wallet Ethereum del firmante (0x + 40 caracteres hex)
- `hashEvidenceHex` (requerido): Hash SHA-256 de la evidencia en formato bytes32 (0x + 64 caracteres hex)
- `signerName` (opcional): Nombre del firmante
- `signerEmail` (opcional): Email del firmante
- `evidence` (opcional): Objeto JSON completo con toda la evidencia de la firma

### Paso 4: Qué Pasa Internamente

Cuando el backend recibe la firma:

1. **Valida el contrato:**
   - Busca el contrato por `contractId`
   - Verifica que existe

2. **Valida el hash:**
   - Convierte `hashEvidenceHex` a formato bytes32
   - No valida que coincida con la evidencia (eso se hace en auditoría)

3. **Registra en blockchain:**
   ```typescript
   await this.chain.registerSigned({
     contractIdHex: id,
     signerAddress: dto.signerAddress,
     hashEvidenceHex: hashEvidence,
     tenantId,
   });
   ```
   - Llama al smart contract `markSigned()`
   - Obtiene el `txHash` de la transacción

4. **Guarda en base de datos:**
   ```typescript
   await this.prisma.signature.create({
     data: {
       contractId: contract.id,
       signerAddress: dto.signerAddress,
       signerName: dto.signerName,
       signerEmail: dto.signerEmail,
       evidenceHash: hashEvidence,
       evidence: dto.evidence,  // Guarda el JSON completo
       txHash: res.txHash,
     },
   });
   ```

5. **Actualiza el estado del contrato:**
   - Cuenta las firmas existentes + 1 nueva
   - Si `signatureCount >= requiredSignatures` → `status = "fully_signed"`
   - Si no → `status = "partial_signed"`

### Paso 5: Respuesta del Endpoint

**Éxito (201):**
```json
{
  "contractId": "0x7ca32d47437827ccb15727c70322a02c08e9a88e5d0851c1b1a5d3f465597f7b",
  "txHash": "0xabc123...",
  "signatureId": "797f0537-6d0c-43cf-aad5-41fb659e9b87",
  "status": "partial_signed",
  "signedAt": "2025-12-06T22:51:45.269Z"
}
```

**Errores posibles:**
- `404`: Contrato no encontrado
- `400`: Datos inválidos (hash mal formateado, address inválido)
- `401`: No autenticado
- `403`: Sin permisos (requiere rol ADMIN o SELLER)

---

## Ejemplo Completo

### Desde el Frontend (JavaScript)

```javascript
async function signContract(contractId, signerAddress, evidence) {
  // 1. Calcular hash de evidencia
  const evidenceJson = JSON.stringify(evidence);
  const hashBuffer = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(evidenceJson)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const hashEvidenceHex = '0x' + hashHex;

  // 2. Preparar request
  const response = await fetch(`http://localhost:3000/contracts/${contractId}/sign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Id': 'core',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signerAddress,
      hashEvidenceHex,
      signerName: 'Juan Pérez',
      signerEmail: 'juan@example.com',
      evidence, // El mismo objeto que usaste para calcular el hash
    }),
  });

  const result = await response.json();
  console.log('Contrato firmado:', result);
  return result;
}

// Uso
const evidence = {
  timestamp: new Date().toISOString(),
  ip: '192.168.1.100',
  biometric: 'face_id_verified',
  signatureImage: 'data:image/png;base64,...',
};

await signContract(
  '0x7ca32d47437827ccb15727c70322a02c08e9a88e5d0851c1b1a5d3f465597f7b',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC',
  evidence
);
```

### Desde cURL

```bash
# 1. Calcular hash (requiere Node.js)
EVIDENCE='{"timestamp":"2025-12-06T22:51:45.269Z","ip":"192.168.1.100","biometric":"face_id_verified"}'
HASH=$(node -e "const crypto=require('crypto');const e=$EVIDENCE;const h=crypto.createHash('sha256').update(JSON.stringify(e)).digest('hex');console.log('0x'+h);")

# 2. Firmar
curl -X POST http://localhost:3000/contracts/0x7ca32d47437827ccb15727c70322a02c08e9a88e5d0851c1b1a5d3f465597f7b/sign \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: core" \
  -H "Content-Type: application/json" \
  -d "{
    \"signerAddress\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC\",
    \"hashEvidenceHex\": \"$HASH\",
    \"signerName\": \"Juan Pérez\",
    \"signerEmail\": \"juan@example.com\",
    \"evidence\": $EVIDENCE
  }"
```

---

## ⚠️ Validación de Identidad del Firmante

**✅ ACTUALIZADO:** El sistema **SÍ valida automáticamente** que la persona que firma sea quien debe firmar (implementado en Fase 2). Si el contrato tiene `requiredSigners`, el sistema valida que el email o DNI del usuario coincida con la lista de firmantes autorizados.

**Validaciones automáticas:**
- ✅ Verifica que el email o DNI del usuario coincida con `requiredSigners`
- ✅ Requiere KYC completado (`user.verified = true`)
- ✅ Previene doble firma (error 409 si ya firmó)
- ✅ Retorna error 403 si el usuario no está autorizado

**Evidencia adicional guardada:**
- Email del usuario autenticado (`signerEmail`)
- DNI en la evidencia (`documentNumber`)
- Biometría del dispositivo (`biometric`)
- Timestamp, IP, y otros metadatos

Ver documentación completa en: `docs/SIGNER_IDENTITY_VERIFICATION.md`

## Puntos Importantes

### 1. **El Hash Debe Coincidir**
El `hashEvidenceHex` que envías debe ser el hash SHA-256 del JSON exacto que envías en `evidence`. Si no coinciden, la auditoría fallará.

### 2. **Evidencia Opcional pero Recomendada**
El campo `evidence` es opcional, pero **altamente recomendado** porque:
- Permite verificar la integridad de la firma
- Proporciona contexto legal (timestamp, IP, biometría)
- Es necesario para pasar la auditoría de integridad

### 3. **Estado del Contrato**
El estado se actualiza automáticamente:
- `created` → Primera firma → `partial_signed`
- `partial_signed` → Última firma requerida → `fully_signed`

### 4. **Registro en Blockchain**
Cada firma genera una transacción blockchain separada:
- `txHash` único por cada firma
- Registro inmutable del hash de evidencia
- Verificable públicamente en exploradores de blockchain

### 5. **Prevención de Doble Firma**
El sistema tiene un constraint único en la base de datos:
```prisma
@@unique([contractId, signerAddress])
```
Esto previene que la misma dirección firme dos veces el mismo contrato.

---

## Flujo Visual

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. Prepara evidencia
       │    (timestamp, IP, biometría, etc.)
       │
       │ 2. Calcula hash SHA-256
       │    hashEvidenceHex = SHA256(JSON.stringify(evidence))
       │
       │ 3. POST /contracts/:id/sign
       │    { signerAddress, hashEvidenceHex, evidence, ... }
       │
       ▼
┌─────────────────┐
│  Backend API    │
└────────┬────────┘
         │
         │ 4. Valida contrato existe
         │
         │ 5. Registra en blockchain
         │    chain.registerSigned()
         │    → Obtiene txHash
         │
         │ 6. Guarda en DB
         │    - signature (con evidence)
         │    - evidenceHash
         │    - txHash
         │
         │ 7. Actualiza estado contrato
         │    partial_signed → fully_signed?
         │
         ▼
┌─────────────────┐
│   Respuesta     │
│ { contractId,   │
│   txHash,       │
│   signatureId,  │
│   status }      │
└─────────────────┘
```

---

## Troubleshooting

### Error: "hashEvidenceHex must be a valid bytes32 hex string"
- Asegurate de que el hash tenga formato `0x` + 64 caracteres hex
- Ejemplo correcto: `0x4f59a17a571e1468ca2dc17e4e16d25c7c79f24bc01dc8427d846c7917604dc7`

### Error: "signerAddress must be a valid Ethereum address"
- Debe ser formato `0x` + 40 caracteres hex
- Ejemplo correcto: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC`

### Auditoría muestra "mismatch" en evidenceHash
- El hash que calculaste no coincide con el que se guardó
- Verifica que uses `JSON.stringify()` con el mismo orden de propiedades
- Asegurate de enviar el mismo JSON en `evidence` que usaste para calcular el hash

### El contrato no cambia a "fully_signed"
- Verifica que `requiredSignatures` sea correcto
- Cuenta las firmas: debe haber exactamente `requiredSignatures` firmas únicas

