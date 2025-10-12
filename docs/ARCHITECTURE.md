# 🏗️ Arquitectura del Sistema de Contratos Inteligentes

## 📋 Índice

1. [Visión General](#visión-general)
2. [Autenticación y Registro](#autenticación-y-registro)
3. [Verificación de Identidad (KYC)](#verificación-de-identidad-kyc)
4. [Sistema de Firmas](#sistema-de-firmas)
5. [Validez Legal](#validez-legal)
6. [Multi-Tenancy](#multi-tenancy)
7. [Stack Tecnológico](#stack-tecnológico)
8. [Seguridad](#seguridad)
9. [Roadmap de Implementación](#roadmap-de-implementación)

---

## Visión General

Sistema de firma de contratos digitales con validación biométrica, registro en blockchain y multi-tenancy.

### Características Principales

- ✅ Registro con Google Sign-In o Email/Password
- ✅ Verificación de identidad biométrica (KYC) just-in-time
- ✅ Firmas electrónicas con validez legal (Ley 25.506 Argentina)
- ✅ Registro inmutable en blockchain (Ethereum/Polygon)
- ✅ Almacenamiento de PDFs en Cloudflare R2
- ✅ Multi-tenancy para diferentes organizaciones
- ✅ Sistema de roles y permisos

---

## Autenticación y Registro

### Flujo de Registro en 2 Niveles

#### **Nivel 1: Registro Básico** (Inmediato)

**Propósito:** Permitir acceso a la app sin fricción excesiva.

**Datos recolectados:**
- Email
- Nombre completo
- DNI (sin verificar)
- Password (si no usa Google)

**Permite:**
- ✅ Ver contratos pendientes donde figura como firmante
- ✅ Leer documentos
- ✅ Explorar la aplicación

**NO permite:**
- ❌ Firmar contratos (requiere KYC)

#### **Nivel 2: KYC Biométrico** (Just-in-Time, al firmar)

**Propósito:** Verificar identidad real solo cuando el usuario va a firmar.

**Validaciones:**
- Foto de DNI (frente + dorso)
- Selfie en vivo
- Liveness detection (no foto de foto)
- Comparación facial DNI vs selfie
- Validación que DNI en KYC == DNI en registro

**Resultado:**
- Usuario queda marcado como `verified: true`
- Puede firmar contratos
- Solo se hace una vez

### Opciones de Registro

#### **Opción A: Google Sign-In** ⭐ (Recomendado)

**Flujo:**
```
1. Usuario hace click en "Continuar con Google"
2. Popup de Google (automático)
3. Google devuelve: email verificado, nombre, foto
4. Usuario solo ingresa: DNI
5. Registro completo
```

**Datos obtenidos de Google:**
- Email (verificado automáticamente)
- Nombre completo
- Foto de perfil
- Antigüedad de cuenta (para trust score)
- Email corporativo (si aplica)

**Ventajas:**
- Email verificado desde el inicio
- Menos campos a llenar (solo DNI)
- Trust score basado en antigüedad de Google
- Detección de cuentas nuevas (sospechosas)
- Mayor conversión (70-85%)

**Certeza de identidad:** ⭐⭐⭐⭐ (75%)

#### **Opción B: Email/Password** (Fallback)

**Flujo:**
```
1. Usuario llena formulario:
   - Nombre completo
   - DNI
   - Email
   - Password
   - reCAPTCHA
2. Firebase envía email de verificación
3. Usuario hace click en link
4. Email verificado
```

**Validaciones:**
- reCAPTCHA (anti-bots)
- Formato de email válido
- Formato de DNI (7-8 dígitos)
- Password mínimo 6 caracteres
- Rate limiting por IP
- Device fingerprinting

**Certeza de identidad:** ⭐⭐⭐ (60%)

### Endpoints de Autenticación

#### `POST /auth/register`
Registro con email/password.

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "SecurePass123",
  "fullName": "Juan Pérez",
  "documentNumber": "12345678",
  "phoneNumber": "+5491112345678",
  "captchaToken": "..."
}
```

**Response:**
```json
{
  "user": {
    "uid": "firebase-uid",
    "email": "juan@example.com",
    "fullName": "Juan Pérez",
    "emailVerified": false
  },
  "message": "Registro exitoso. Por favor verifica tu email."
}
```

#### `POST /auth/register/google`
Registro con Google Sign-In.

**Request:**
```json
{
  "idToken": "google-firebase-token",
  "documentNumber": "12345678",
  "phoneNumber": "+5491112345678"
}
```

**Response:**
```json
{
  "user": {
    "uid": "firebase-uid",
    "email": "juan@gmail.com",
    "fullName": "Juan Pérez",
    "emailVerified": true
  },
  "message": "Registro exitoso con Google"
}
```

#### `POST /auth/token`
Obtener token JWT para usuarios existentes (público).

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "user": {
    "uid": "firebase-uid",
    "email": "juan@example.com",
    "displayName": "Juan Pérez"
  },
  "expiresIn": 3600
}
```

### Validaciones Gratuitas en Registro

| Validación | Costo | Certeza | Descripción |
|---|---|---|---|
| Email verificado (Firebase) | $0 | ⭐⭐⭐ 60% | Confirma acceso al email |
| Formato DNI válido | $0 | ⭐⭐ 40% | Evita DNIs inventados |
| Device fingerprinting | $0 | ⭐⭐⭐ 50% | Detecta registros masivos |
| Google reCAPTCHA v3 | $0 | ⭐⭐⭐⭐ 70% | Bloquea bots |

### Validaciones Económicas (Opcionales)

| Validación | Costo | Certeza | Cuándo |
|---|---|---|---|
| SMS Verification | $0.05 | ⭐⭐⭐⭐⭐ 85% | Contratos >$10k |
| KYC Biométrico | $1-3 | ⭐⭐⭐⭐⭐ 95% | Al firmar (obligatorio) |
| RENAPER API | Variable | ⭐⭐⭐⭐⭐ 95% | Contratos >$100k |

---

## Verificación de Identidad (KYC)

### Just-in-Time KYC

**Estrategia:** KYC solo cuando el usuario intenta firmar su primer contrato.

**Beneficios:**
- ✅ Alta conversión en registro (sin fricción)
- ✅ Costo optimizado (solo usuarios activos)
- ✅ Usuario comprometido (menor abandono)
- ✅ Experiencia contextual ("Para firmar, verifica tu identidad")

### Servicios de KYC Recomendados

| Servicio | Costo/Verificación | Regiones | Implementación | Rating |
|---|---|---|---|---|
| **Veriff** | $1-3 | Global (190+ países) | 1-2 días | ⭐⭐⭐⭐⭐ |
| **Onfido** | $1-2 | Global (2500+ docs) | 1-2 días | ⭐⭐⭐⭐⭐ |
| Stripe Identity | $1.50 | 40+ países | 1 día | ⭐⭐⭐⭐ |
| Persona | $0.75-1.50 | LATAM focus | 1 día | ⭐⭐⭐⭐ |
| Sumsub | $0.50-2 | Global | 1-2 días | ⭐⭐⭐⭐ |
| **RENAPER** (Argentina) | Variable | Solo Argentina | 2-4 semanas | ⭐⭐⭐⭐⭐ |

**Recomendación:** Veriff u Onfido (mejor balance costo/UX/validez legal).

### Flujo de KYC

```
1. Usuario intenta firmar contrato
   ↓
2. Sistema detecta: user.verified = false
   ↓
3. Modal: "Debes verificar tu identidad"
   ↓
4. Usuario sube DNI + selfie (2 minutos)
   ↓
5. Veriff/Onfido procesa (30 segundos)
   ↓
6. Sistema valida:
   - DNI es real
   - Nombre coincide
   - Foto coincide con selfie
   - DNI en KYC == DNI en registro
   ↓
7. user.verified = true
   ↓
8. Usuario puede firmar ✅
```

### Validaciones Cruzadas

**Triple verificación de nombres:**

1. **Nombre en Google:** "Juan Carlos Pérez"
2. **Nombre ingresado por usuario:** "Juan Perez"
3. **Nombre en DNI (KYC):** "JUAN CARLOS PEREZ" ← El real

**Backend valida:**
- Similitud entre Google y KYC ≥ 70%
- Similitud entre usuario y KYC ≥ 70%
- Si no coinciden → Rechazar KYC

### Biometría del Teléfono (Firmas Posteriores)

**Después de KYC:** Solo se requiere biometría del dispositivo.

**Tecnologías:**
- **iOS:** FaceID / TouchID (LocalAuthentication API)
- **Android:** BiometricPrompt API
- **Web:** WebAuthn API

**Flujo:**
```
1. Usuario hace click en "Firmar"
2. Sistema: user.verified = true ✓
3. App solicita FaceID/TouchID (1 segundo)
4. Usuario pone huella/cara
5. Firma registrada ✅
```

**Beneficios:**
- ⚡ UX perfecta (1 segundo)
- 💰 Costo: $0
- 🔒 Seguridad alta

---

## Sistema de Firmas

### Firmas Configurables

Cada contrato puede especificar cuántas firmas necesita.

**Campo:** `requiredSignatures` (default: 2, máximo: 10)

**Ejemplo:**
```json
POST /contracts/upload
{
  "templateId": 5,
  "version": 1,
  "requiredSignatures": 3
}
```

**Estados automáticos:**
- `created`: 0 firmas
- `partial_signed`: < requiredSignatures
- `fully_signed`: >= requiredSignatures

### Firmantes Requeridos

Cada contrato define **quién** debe firmar.

**Tabla:** `required_signers`

```sql
CREATE TABLE required_signers (
  id              UUID PRIMARY KEY,
  contract_id     VARCHAR NOT NULL,
  email           VARCHAR NOT NULL,
  full_name       VARCHAR NOT NULL,
  document_number VARCHAR NOT NULL,
  role            VARCHAR,  -- 'SELLER', 'BUYER', etc.
  user_id         VARCHAR,  -- NULL hasta que firme
  signed          BOOLEAN DEFAULT FALSE,
  signed_at       TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);
```

**Ejemplo de creación:**
```json
POST /contracts/upload
{
  "templateId": 5,
  "version": 1,
  "requiredSignatures": 2,
  "requiredSigners": [
    {
      "email": "vendedor@example.com",
      "fullName": "Juan Pérez",
      "documentNumber": "12345678",
      "role": "SELLER"
    },
    {
      "email": "comprador@example.com",
      "fullName": "María García",
      "documentNumber": "87654321",
      "role": "BUYER"
    }
  ]
}
```

### Validación al Firmar

**Backend verifica:**

1. ✅ Usuario está autenticado
2. ✅ Usuario está verificado (KYC completo)
3. ✅ Usuario está en la lista de `required_signers`
4. ✅ Email o DNI coincide con firmante requerido
5. ✅ No ha firmado previamente
6. ✅ Biometría del dispositivo (opcional pero recomendado)

**Si todo OK:**
- Crear registro en tabla `signatures`
- Actualizar `required_signers.signed = true`
- Registrar firma en blockchain
- Actualizar `contract.status` si todas las firmas están completas

### Endpoint de Firma

#### `POST /contracts/:id/sign`

**Request:**
```json
{
  "signerName": "Juan Pérez",
  "signerEmail": "juan@example.com",
  "evidence": "Firmado desde iPhone, IP: 190.123.45.67"
}
```

**Headers:**
```
Authorization: Bearer <firebase-token>
X-Biometric-Proof: <biometric-signature>
X-Biometric-Type: touchid | faceid
```

**Response:**
```json
{
  "contractId": "0x398288...",
  "signatureId": "uuid",
  "txHash": "0xabc123...",
  "status": "partial_signed",
  "signedAt": "2025-10-12T14:30:00Z"
}
```

---

## Validez Legal

### Marco Legal en Argentina

**Ley 25.506 - Firma Digital (2001)**

Define 3 tipos de firma:

1. **Firma Manuscrita:** Tradicional en papel, validez plena
2. **Firma Digital:** Con certificado PKI + AFIP, validez plena
3. **Firma Electrónica (Art. 5):** Todo método electrónico que identifique al firmante

**Nuestro sistema = Firma Electrónica**

### Validez de Firma Electrónica

#### ✅ VÁLIDA PARA:

- Contratos privados entre particulares
  - Venta de autos
  - Alquileres
  - Prestación de servicios
- Transacciones comerciales B2B
- Contratos laborales (en algunos casos)
- Acuerdos comerciales
- NDAs y contratos de confidencialidad

#### ❌ NO VÁLIDA PARA:

- Escrituras públicas (compra/venta de inmuebles)
- Documentos que requieran notario
- Contratos con el Estado
- Licitaciones públicas
- Testamentos, poderes generales

### Fuerza Probatoria (Art. 5)

Firma electrónica tiene valor probatorio si:

1. ✅ **Método confiable** para identificar al firmante
   → Email verificado + DNI + KYC biométrico

2. ✅ **Control exclusivo** del firmante
   → Password + biometría del dispositivo

3. ✅ **Detecta alteraciones**
   → Hash del PDF en blockchain
   → Timestamp inmutable

4. ✅ **Registro auditable**
   → Logs en DB
   → Transacciones en blockchain
   → IP address, user agent, device ID

### Comparación: Firma Electrónica vs Firma Digital

| | Firma Electrónica (Nuestro sistema) | Firma Digital AFIP |
|---|---|---|
| **Validez legal** | ⭐⭐⭐ Limitada | ⭐⭐⭐⭐⭐ Plena |
| **Costo** | $1-3 (una vez) | $5,000-15,000/año |
| **Complejidad** | Baja | Alta |
| **UX** | Excelente | Mala (token físico) |
| **Contratos privados** | ✅ Sí | ✅ Sí |
| **Escrituras públicas** | ❌ No | ✅ Sí |
| **Blockchain compatible** | ✅ Sí | ✅ Sí |

### Recomendaciones Legales

#### Incluir en cada contrato:

**Cláusula de aceptación:**
```
"Las partes acuerdan que la firma electrónica mediante email verificado, 
DNI y verificación biométrica constituye expresión válida de su voluntad 
y consentimiento para los fines del presente contrato, de conformidad 
con lo dispuesto en el Art. 5 de la Ley 25.506."
```

#### Términos y Condiciones:

```
"Al registrarme, acepto que mi firma electrónica (email + DNI + 
verificación biométrica) tiene validez legal para suscribir contratos 
en esta plataforma, con las limitaciones establecidas por la Ley 25.506."
```

#### Disclaimer:

```
⚠️ IMPORTANTE: Este método de firma NO es válido para:
- Escrituras públicas (inmuebles)
- Contratos con el Estado
- Documentos que requieren intervención notarial

Para estos casos, consulte con un escribano.
```

### Registro de Evidencia

**Por cada firma, guardar:**

- ✅ Hash del PDF en blockchain (inmutable)
- ✅ Timestamp exacto de la firma
- ✅ IP address del firmante
- ✅ User-agent del navegador
- ✅ Device ID
- ✅ Tipo de biometría usada (FaceID/TouchID)
- ✅ Email de confirmación enviado
- ✅ Resultado de KYC (verification ID)

---

## Multi-Tenancy

### Arquitectura

**Modelo:** Shared database con `tenantId` discriminator.

**Configuración por tenant:**
```typescript
interface TenantConfig {
  id: string;
  name: string;
  branding: {
    logo: string;
    primaryColor: string;
    domain?: string;
  };
  s3Bucket: string;
  s3Prefix: string;
  chainRegistryAddress: string;
}
```

### Resolución de Tenant

**Orden de prioridad:**

1. Header `x-tenant-id`
2. Host mapping (ej: `empresa.contracts.com` → `empresa`)
3. Default tenant (`core`)

**Implementación:** `TenantInterceptor` (global)

### Tenant "core"

**Tenant por defecto** para usuarios sin tenant específico.

**Configuración:**
```typescript
{
  id: 'core',
  name: 'Smart Contracts Core',
  s3Bucket: process.env.S3_BUCKET,
  s3Prefix: 'uploads/',
  chainRegistryAddress: process.env.CHAIN_REGISTRY_ADDRESS
}
```

---

## Stack Tecnológico

### Backend

- **Framework:** NestJS (TypeScript)
- **Base de datos:** PostgreSQL (Railway)
- **ORM:** Prisma
- **Autenticación:** Firebase Authentication
- **Storage:** Cloudflare R2 (S3-compatible)
- **Blockchain:** Ethereum/Polygon (ethers.js)
- **API Docs:** Swagger/OpenAPI

### Frontend (Pendiente)

- **Framework:** React / React Native
- **Estado:** React Query / Zustand
- **UI:** TailwindCSS / shadcn/ui
- **Biometría:** expo-local-authentication / WebAuthn

### Infraestructura

- **Hosting Backend:** Railway
- **Hosting DB:** Railway (PostgreSQL)
- **Storage:** Cloudflare R2
- **Blockchain:** Sepolia Testnet (dev) → Polygon (prod)
- **KYC:** Veriff/Onfido
- **CI/CD:** GitHub Actions

### Servicios Externos

| Servicio | Propósito | Costo |
|---|---|---|
| Firebase Auth | Autenticación | Gratis (50k MAU) |
| Cloudflare R2 | Storage de PDFs | $0.015/GB |
| Veriff/Onfido | KYC biométrico | $1-3/verificación |
| Polygon | Blockchain | ~$0.01/tx |
| Railway | Hosting | ~$5-20/mes |

---

## Seguridad

### Capas de Seguridad

#### 1. Autenticación (Firebase)
- JWT con expiración
- Email verificado
- 2FA opcional

#### 2. Autorización (NestJS Guards)
- Roles: `ADMIN`, `SELLER`, `BUYER`
- Permisos por endpoint
- Multi-tenancy isolation

#### 3. Verificación de Identidad (KYC)
- Documento real
- Liveness detection
- Comparación facial

#### 4. Validación de Firmantes
- Solo usuarios autorizados
- Email + DNI coinciden
- No firmó previamente

#### 5. Biometría del Dispositivo
- FaceID/TouchID
- Confirma identidad en cada firma

#### 6. Registro en Blockchain
- Hash inmutable
- Timestamp certificado
- No-repudio

#### 7. Evidencia Auditable
- IP, user-agent, device ID
- Logs completos
- Trazabilidad total

### Protección contra Fraude

**Detección automática:**

- 🚩 Cuenta de Google < 24 horas
- 🚩 Múltiples registros desde misma IP
- 🚩 Nombre en Google ≠ nombre en KYC
- 🚩 DNI en KYC ≠ DNI en registro
- 🚩 Email temporal/desechable
- 🚩 reCAPTCHA score bajo

**Acciones:**
- Marcar como `suspiciousRegistration: true`
- Requerir validaciones adicionales
- Revisión manual si es crítico

### Rate Limiting

- **Registro:** 5 por IP cada 24 horas
- **Login:** 10 intentos por hora
- **API calls:** 100 req/min por usuario
- **Presigned URLs:** 50 por hora

---

## Roadmap de Implementación

### Fase 1: MVP (Semanas 1-2) ✅

- [x] Backend base (NestJS + Prisma)
- [x] Firebase Authentication
- [x] Multi-tenancy básico
- [x] S3 para PDFs (Cloudflare R2)
- [x] Blockchain integration (Ethereum)
- [x] Endpoints básicos de contratos
- [x] Swagger documentation
- [x] Deploy en Railway

### Fase 2: Registro Mejorado (Semana 3) ⏳

- [ ] Endpoint `POST /auth/register/google`
- [ ] Actualizar `POST /auth/register` con DNI + reCAPTCHA
- [ ] Tabla `required_signers`
- [ ] Validación de firmantes autorizados
- [ ] Device fingerprinting
- [ ] Email verification flow
- [ ] Trust score calculation

### Fase 3: KYC Biométrico (Semana 4)

- [ ] Integración con Veriff/Onfido
- [ ] Módulo KYC (`src/kyc/`)
- [ ] Endpoint `POST /kyc/start`
- [ ] Webhook para resultado de KYC
- [ ] Validación cruzada de nombres/DNI
- [ ] Biometría del teléfono (LocalAuthentication)
- [ ] WebAuthn para web

### Fase 4: Frontend (Semanas 5-8)

- [ ] React app básica
- [ ] Pantallas de registro (Email + Google)
- [ ] Vista de contratos pendientes
- [ ] Flujo de firma con KYC
- [ ] Integración biométrica (FaceID/TouchID)
- [ ] React Native app (opcional)

### Fase 5: Mejoras de Seguridad (Semana 9)

- [ ] SMS verification (Twilio)
- [ ] Rate limiting avanzado
- [ ] Audit logs mejorados
- [ ] Revisión manual de registros sospechosos
- [ ] Panel de administración

### Fase 6: Producción (Semana 10+)

- [ ] Testing completo (Jest + E2E)
- [ ] CI/CD con GitHub Actions
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Deploy a Polygon mainnet
- [ ] Custom domain en R2
- [ ] Performance optimization
- [ ] Security audit

---

## Métricas de Éxito

### Conversión
- **Registro con Google:** 70-85%
- **Registro con Email:** 40-60%
- **Completado de KYC:** 60-75%
- **Firmas completas:** 95%+

### Costos
- **Por usuario registrado:** $0 (con Google)
- **Por usuario verificado:** $1-3 (KYC)
- **Por firma adicional:** $0 (biometría gratis)
- **Costo mensual infra:** $5-20

### Performance
- **Registro:** < 3 segundos
- **KYC:** < 2 minutos
- **Firma (post-KYC):** < 5 segundos
- **API response time:** < 500ms

### Seguridad
- **Certeza de identidad:** 95% (con KYC)
- **Fraudes detectados:** > 90%
- **False positives:** < 5%

---

## Conclusión

Este sistema implementa un balance óptimo entre:

- ✅ **UX excelente:** Registro simple, KYC just-in-time
- ✅ **Seguridad alta:** Triple verificación, biometría, blockchain
- ✅ **Costo optimizado:** $1-3 por usuario activo
- ✅ **Validez legal:** Suficiente para contratos privados
- ✅ **Escalabilidad:** Multi-tenancy, arquitectura modular

**Estrategia clave:** Minimizar fricción en registro, maximizar seguridad en firma.

---

**Fecha:** 12 de Octubre, 2025
**Versión:** 1.0
**Autor:** Sistema de Contratos Inteligentes

