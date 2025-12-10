# ⚖️ KYC Externo como Valor Probatorio

## ¿Qué es el KYC Externo?

Servicios como **Veriff** o **Onfido** verifican la identidad de usuarios mediante:
1. **Documento de identidad** (DNI, pasaporte, licencia)
2. **Selfie en vivo** (comparación facial)
3. **Verificación de autenticidad** del documento
4. **Comparación biométrica** (selfie vs foto del documento)

**Resultado:** Certificación de que la persona es quien dice ser.

---

## 📋 Qué Información se Guarda

### En tu Base de Datos

```typescript
// Tabla: users
{
  verified: true,                    // ✅ KYC completado
  verifiedAt: "2025-12-05T10:30:00Z", // Fecha de verificación
  verificationId: "veriff-abc123",    // ID único de Veriff/Onfido
  verificationProvider: "veriff",     // "veriff" o "onfido"
  documentNumber: "12345678",        // DNI extraído del KYC
  fullName: "JUAN CARLOS PEREZ",     // Nombre extraído del DNI
  documentType: "DNI"                // Tipo de documento
}
```

### En la Evidencia de Firma

```json
{
  "kyc": {
    "provider": "veriff",
    "verificationId": "veriff-abc123",
    "verifiedAt": "2025-12-05T10:30:00.000Z",
    "status": "approved",
    "documentNumber": "12345678",
    "documentType": "DNI",
    "fullName": "JUAN CARLOS PEREZ"
  }
}
```

**⚠️ Importante:** NO guardas las fotos (DNI, selfie). Veriff/Onfido las guardan y cumplen GDPR.

---

## 🔍 Cómo Obtener Información Detallada del KYC

### API de Veriff/Onfido

Ambos servicios ofrecen APIs para obtener detalles de la verificación:

#### Veriff API

```typescript
// Obtener detalles de verificación
GET https://station.veriff.com/v1/sessions/{verificationId}

Response:
{
  "status": "success",
  "verification": {
    "id": "veriff-abc123",
    "status": "approved",  // approved, declined, resubmission_requested
    "code": 9001,          // Código de estado
    "person": {
      "firstName": "JUAN CARLOS",
      "lastName": "PEREZ",
      "dateOfBirth": "1990-01-15"
    },
    "document": {
      "type": "driving_license",
      "number": "12345678",
      "country": "AR",
      "validFrom": "2020-01-01",
      "validUntil": "2030-01-01"
    },
    "face": {
      "similarity": 0.98,  // Similitud selfie vs documento
      "match": true
    },
    "createdAt": "2025-12-05T10:30:00Z",
    "decision": {
      "status": "approved",
      "reason": "Document verified successfully"
    }
  }
}
```

#### Onfido API

```typescript
// Obtener detalles de verificación
GET https://api.onfido.com/v3.6/checks/{checkId}

Response:
{
  "id": "onfido-xyz789",
  "status": "clear",  // clear, consider, unidentified
  "result": "clear",
  "created_at": "2025-12-05T10:30:00Z",
  "type": "express",
  "reports": [
    {
      "id": "report-123",
      "name": "identity_verification",
      "status": "clear",
      "result": "clear",
      "sub_result": "passed",
      "breakdown": {
        "document_authenticity": {
          "result": "clear",
          "properties": {
            "document_number": "12345678",
            "date_of_birth": "1990-01-15",
            "first_name": "JUAN CARLOS",
            "last_name": "PEREZ"
          }
        },
        "facial_similarity": {
          "result": "clear",
          "properties": {
            "score": 0.98  // Similitud facial
          }
        }
      }
    }
  ]
}
```

---

## ⚖️ Cómo Presentarlo como Evidencia Legal

### 1. **Declaración de Verificación KYC**

```
VERIFICACIÓN DE IDENTIDAD MEDIANTE KYC EXTERNO

1. SERVICIO DE VERIFICACIÓN
   - Proveedor: Veriff (servicio certificado internacionalmente)
   - Verification ID: veriff-abc123
   - Fecha de verificación: 2025-12-05T10:30:00Z
   - Estado: Aprobado

2. PROCESO DE VERIFICACIÓN
   El usuario completó un proceso de verificación de identidad que incluyó:
   - Subida de documento de identidad (DNI)
   - Selfie en vivo
   - Verificación de autenticidad del documento
   - Comparación biométrica (selfie vs foto del documento)

3. RESULTADO DE VERIFICACIÓN
   - Documento: DNI 12345678
   - Nombre verificado: JUAN CARLOS PEREZ
   - Similitud facial: 98% (umbral mínimo: 70%)
   - Estado: Aprobado
   - Razón: "Document verified successfully"

4. VALIDEZ DEL SERVICIO
   Veriff es un proveedor certificado que:
   - Cumple con estándares internacionales (ISO 27001)
   - Está regulado en múltiples jurisdicciones
   - Procesa millones de verificaciones anualmente
   - Sus resultados son aceptados como evidencia en procesos legales

5. VERIFICABILIDAD
   La verificación puede ser consultada en cualquier momento:
   - API de Veriff: https://station.veriff.com/v1/sessions/veriff-abc123
   - (Requiere credenciales de API para acceso)
```

### 2. **Evidencia en el Contexto de la Firma**

```
EVIDENCIA COMPLETA DE IDENTIDAD DEL FIRMANTE

Contrato: 0x7ca32d47437827ccb15727c70322a02c08e9a88e5d0851c1b1a5d3f465597f7b
Firma ID: 797f0537-6d0c-43cf-aad5-41fb659e9b87

1. VERIFICACIÓN KYC (Pre-firma)
   ✅ Usuario verificó identidad con Veriff
   - Verification ID: veriff-abc123
   - Fecha: 2025-12-05T10:30:00Z (1 día antes de la firma)
   - Documento verificado: DNI 12345678
   - Nombre verificado: JUAN CARLOS PEREZ
   - Similitud facial: 98%
   - Estado: Aprobado

2. AUTENTICACIÓN AL FIRMAR
   ✅ Usuario autenticado con Firebase
   - Email: juan@example.com
   - Firebase UID: SoJczPKN4DYfChzWhvbiegSi0422
   - Token JWT válido

3. BIOMETRÍA DEL DISPOSITIVO
   ✅ Face ID verificado
   - Dispositivo: iPhone 13 Pro Max
   - Timestamp: 2025-12-06T22:51:45.269Z
   - Proof: 0xdef456...

4. REGISTRO EN BLOCKCHAIN
   ✅ Firma registrada on-chain
   - Transaction Hash: 0xabc123...
   - Verificable en: https://polygonscan.com/tx/0xabc123...

5. CONCLUSIÓN
   La combinación de:
   - KYC externo (Veriff) → Identidad verificada
   - Autenticación Firebase → Email verificado
   - Biometría dispositivo → Control del dispositivo
   - Registro blockchain → Inmutabilidad
   
   Demuestra que JUAN CARLOS PEREZ (DNI 12345678) fue quien
   firmó el contrato el 2025-12-06T22:51:45.269Z.
```

---

## 🎯 Valor Probatorio del KYC Externo

### Fortalezas

1. **✅ Tercero Independiente**
   - Veriff/Onfido son empresas certificadas
   - No tienen interés en el resultado
   - Sus procesos son auditables

2. **✅ Estándares Internacionales**
   - Cumplen ISO 27001 (seguridad de información)
   - Regulados en múltiples jurisdicciones
   - Sus resultados son aceptados legalmente

3. **✅ Verificación Biométrica**
   - Comparación facial automatizada
   - Detección de documentos falsos
   - Análisis de autenticidad del documento

4. **✅ Trazabilidad**
   - Cada verificación tiene un ID único
   - Timestamp verificable
   - Resultado consultable vía API

5. **✅ Evidencia Visual (si se requiere)**
   - Veriff/Onfido guardan las fotos (cumplen GDPR)
   - Pueden ser obtenidas mediante API si es necesario
   - Solo con consentimiento explícito del usuario

### Limitaciones

1. **⚠️ Dependencia de Terceros**
   - Si Veriff/Onfido cierran, perdés acceso a detalles
   - Solución: Guardar información esencial en tu DB

2. **⚠️ Costo por Verificación**
   - $1-3 por verificación
   - Solo verificar cuando sea necesario (al firmar)

3. **⚠️ No es Firma Digital AFIP**
   - KYC verifica identidad, no es firma digital
   - Para validez plena legal, necesitarías firma digital AFIP

---

## 🔧 Cómo Implementar Verificación de KYC

### 1. Guardar Información Esencial

```typescript
// Al recibir webhook de Veriff/Onfido
async handleKycWebhook(verificationData: VeriffWebhook) {
  // 1. Validar que DNI coincide
  const user = await this.prisma.user.findUnique({
    where: { documentNumber: verificationData.document.number }
  });
  
  if (!user) {
    throw new Error('DNI no encontrado en registro');
  }
  
  // 2. Validar nombre (70%+ similitud)
  const nameSimilarity = calculateSimilarity(
    user.fullName,
    verificationData.person.firstName + ' ' + verificationData.person.lastName
  );
  
  if (nameSimilarity < 0.7) {
    throw new Error('Nombre no coincide');
  }
  
  // 3. Guardar información esencial
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      verified: verificationData.status === 'approved',
      verifiedAt: new Date(verificationData.createdAt),
      verificationId: verificationData.id,
      verificationProvider: 'veriff',
      documentNumber: verificationData.document.number,
      fullName: verificationData.person.firstName + ' ' + verificationData.person.lastName,
    }
  });
}
```

### 2. Incluir en Evidencia de Firma

```typescript
// Al firmar, incluir información de KYC
async sign(contractId: string, dto: SignContractDto, user: any) {
  // Verificar que KYC está completo
  if (!user.verified) {
    throw new ForbiddenException('KYC verification required');
  }
  
  // Obtener detalles de KYC (opcional, para evidencia)
  const kycDetails = await this.getKycDetails(user.verificationId, user.verificationProvider);
  
  // Incluir en evidencia
  const evidence = {
    timestamp: new Date().toISOString(),
    kyc: {
      provider: user.verificationProvider,
      verificationId: user.verificationId,
      verifiedAt: user.verifiedAt.toISOString(),
      status: kycDetails.status,
      documentNumber: user.documentNumber,
      documentType: user.documentType,
      fullName: user.fullName,
      // Opcional: similitud facial si está disponible
      facialSimilarity: kycDetails.face?.similarity,
    },
    biometric: {
      // ... biometría del dispositivo
    }
  };
  
  // ... resto del proceso de firma
}
```

### 3. Endpoint para Obtener Detalles de KYC

```typescript
@Get('kyc/details')
async getKycDetails(@Req() req: any) {
  const user = await this.prisma.user.findUnique({
    where: { uid: req.user.uid }
  });
  
  if (!user.verified || !user.verificationId) {
    throw new NotFoundException('KYC not completed');
  }
  
  // Llamar a API de Veriff/Onfido
  const kycDetails = await this.kycService.getVerificationDetails(
    user.verificationId,
    user.verificationProvider
  );
  
  return {
    verified: user.verified,
    verifiedAt: user.verifiedAt,
    verificationId: user.verificationId,
    provider: user.verificationProvider,
    documentNumber: user.documentNumber,
    fullName: user.fullName,
    details: {
      status: kycDetails.status,
      facialSimilarity: kycDetails.face?.similarity,
      documentType: kycDetails.document?.type,
      // No incluir fotos por privacidad
    }
  };
}
```

---

## 📊 Comparación: KYC vs Otras Evidencias

| Evidencia | Valor Probatorio | Costo | Privacidad | Implementación |
|-----------|------------------|-------|------------|----------------|
| **KYC Externo** | ⭐⭐⭐⭐⭐ 95% | $1-3 | ✅ Buena | Media |
| **Foto DNI propia** | ⭐⭐⭐⭐ 80% | $0 | ❌ Mala | Fácil |
| **Email verificado** | ⭐⭐⭐ 60% | $0 | ✅ Excelente | Fácil |
| **Biometría dispositivo** | ⭐⭐⭐ 70% | $0 | ✅ Excelente | Media |
| **Firma Digital AFIP** | ⭐⭐⭐⭐⭐ 100% | $5k-15k/año | ✅ Buena | Difícil |

---

## 🎯 Mejores Prácticas

### 1. **Guardar Información Esencial**
- ✅ `verificationId`: ID único de Veriff/Onfido
- ✅ `verifiedAt`: Timestamp de verificación
- ✅ `documentNumber`: DNI verificado
- ✅ `fullName`: Nombre extraído del DNI
- ❌ NO guardar fotos (Veriff/Onfido las guardan)

### 2. **Validar Coherencia**
- Verificar que DNI en KYC == DNI en registro
- Verificar que nombre coincide (70%+ similitud)
- Verificar que email del usuario coincide

### 3. **Incluir en Evidencia de Firma**
- Siempre incluir `verificationId` en la evidencia
- Incluir timestamp de verificación
- Incluir similitud facial si está disponible

### 4. **Documentar el Proceso**
- Explicar qué servicio se usó (Veriff/Onfido)
- Mencionar certificaciones del servicio
- Incluir link a documentación del servicio

### 5. **Backup de Información**
- Guardar información esencial en tu DB
- No depender 100% de APIs externas
- Considerar exportar detalles importantes periódicamente

---

## 📝 Ejemplo de Declaración Legal Completa

```
DECLARACIÓN DE IDENTIDAD Y FIRMA

CONTRATO: 0x7ca32d47437827ccb15727c70322a02c08e9a88e5d0851c1b1a5d3f465597f7b
FIRMA ID: 797f0537-6d0c-43cf-aad5-41fb659e9b87

1. VERIFICACIÓN DE IDENTIDAD (KYC)
   
   El usuario completó verificación de identidad mediante Veriff,
   un servicio certificado internacionalmente (ISO 27001).
   
   Detalles de verificación:
   - Verification ID: veriff-abc123
   - Fecha: 2025-12-05T10:30:00Z
   - Documento: DNI 12345678
   - Nombre: JUAN CARLOS PEREZ
   - Similitud facial: 98%
   - Estado: Aprobado
   
   Verificación consultable en:
   https://station.veriff.com/v1/sessions/veriff-abc123
   (Requiere credenciales API de Veriff)

2. AUTENTICACIÓN AL FIRMAR
   
   - Email: juan@example.com (verificado en Firebase)
   - Firebase UID: SoJczPKN4DYfChzWhvbiegSi0422
   - Token JWT válido emitido por Google/Firebase

3. BIOMETRÍA DEL DISPOSITIVO
   
   - Tipo: Face ID
   - Dispositivo: iPhone 13 Pro Max
   - Timestamp: 2025-12-06T22:51:45.269Z
   - Resultado: Verificado exitosamente

4. REGISTRO EN BLOCKCHAIN
   
   - Transaction Hash: 0xabc123...
   - Verificable en: https://polygonscan.com/tx/0xabc123...
   - Hash de evidencia registrado on-chain

5. CONCLUSIÓN
   
   La combinación de:
   - Verificación KYC externa (Veriff) → Identidad certificada
   - Autenticación Firebase → Email verificado
   - Biometría dispositivo → Control del dispositivo
   - Registro blockchain → Inmutabilidad
   
   Demuestra de manera concluyente que:
   
   JUAN CARLOS PEREZ (DNI 12345678, juan@example.com)
   fue quien firmó el contrato el 2025-12-06T22:51:45.269Z.
   
   La verificación de identidad fue realizada por Veriff,
   un servicio certificado internacionalmente, y puede ser
   consultada en cualquier momento mediante el Verification ID
   veriff-abc123.
```

---

## 🔗 Recursos

- **Veriff API Docs:** https://developers.veriff.com/
- **Onfido API Docs:** https://documentation.onfido.com/
- **Veriff Compliance:** https://www.veriff.com/compliance
- **Onfido Compliance:** https://onfido.com/compliance/


