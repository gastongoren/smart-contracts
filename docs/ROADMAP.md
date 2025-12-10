# 🗺️ Roadmap de Implementación

Plan de desarrollo por fases para el sistema de contratos inteligentes.

---

## 📊 Estado Actual

### ✅ Completado (Semanas 1-3)

- [x] Backend base con NestJS + TypeScript
- [x] Base de datos PostgreSQL con Prisma ORM
- [x] Firebase Authentication integrado
- [x] Multi-tenancy básico (`TenantModule`, `TenantInterceptor`)
- [x] Almacenamiento de PDFs en Cloudflare R2
- [x] Integración con blockchain (Ethereum/Polygon)
- [x] Endpoints básicos de contratos:
  - `POST /contracts` - Crear contrato
  - `POST /contracts/upload` - Upload PDF y crear contrato
  - `POST /contracts/:id/sign` - Firmar contrato
  - `GET /contracts` - Listar contratos
  - `GET /contracts/:id` - Obtener contrato
  - `GET /contracts/:id/download` - Descargar PDF
- [x] Campo `requiredSignatures` configurable
- [x] Swagger documentation completa
- [x] Deploy en Railway
- [x] `POST /auth/token` - Login público
- [x] Registro con Email/Password + DNI (`POST /auth/register/email`)
- [x] Registro con Google Sign-In + DNI (`POST /auth/register/google`)
- [x] Trust score automático para Google Sign-In
- [x] Device fingerprinting básico
- [x] Rate limiting básico
- [x] **Sistema de Auditoría de Integridad** (Semana 2-3)
  - `GET /contracts/:id/verify` - Verificar integridad del contrato
  - Re-cálculo de hashes SHA-256 de PDFs y evidencias
  - Comparación con valores almacenados en base de datos
  - Verificación de transacciones en blockchain
  - Reporte completo de integridad (`ContractIntegrityReport`)
  - Validación de cadena de custodia (chain of custody)
- [x] **Sistema de Firmantes Autorizados** (Semana 3)
  - Tabla `required_signers` en base de datos
  - Validación de autorización al firmar
  - Validación de KYC antes de firmar
  - Prevención de doble firma
  - `GET /contracts/mine` - Ver contratos pendientes de firma

### 📋 Documentación

- [x] `README.md` profesional
- [x] `CONTRIBUTING.md`
- [x] `docs/ARCHITECTURE.md` - Arquitectura completa del sistema
- [x] `docs/API_EXAMPLES.md` - Ejemplos de uso de la API
- [x] `docs/QUICKSTART.md` - Guía rápida de inicio
- [x] `docs/CONTRACT_WORKFLOW.md` - Flujo de trabajo de contratos
- [x] `docs/USER_REGISTRATION_GUIDE.md` - Guía de registro de usuarios
- [x] `docs/ENVIRONMENT_VARIABLES.md` - Variables de entorno
- [x] `docs/AUDIT_INTEGRITY.md` - Sistema de auditoría de integridad
- [x] `docs/HOW_TO_PRESENT_AUDIT_EVIDENCE.md` - Cómo presentar evidencia de auditoría
- [x] `docs/HOW_TO_SIGN_CONTRACT.md` - Guía de firma de contratos
- [x] `docs/SIGNER_IDENTITY_VERIFICATION.md` - Verificación de identidad del firmante
- [x] `docs/BIOMETRIC_EVIDENCE_AND_PRIVACY.md` - Evidencia biométrica y privacidad

---

## ✅ Fase 2: Sistema de Firmantes Autorizados + Auditoría de Integridad (Semana 3)

**Objetivo:** Implementar lista de firmantes requeridos, validación de autorización y sistema de auditoría de integridad.

### Backend Tasks - Firmantes Autorizados

- [x] **Crear tabla `required_signers`**
  - Campos: contractId, email, fullName, documentNumber, role, userId, signed, signedAt
  - Migración de Prisma (`20241206000000_add_required_signers`)
  - Modelo en `prisma/schema.prisma`

- [x] **Actualizar `POST /contracts/upload`**
  - Agregar campo `requiredSigners` al DTO (`UploadContractDto`)
  - Crear registros en `required_signers` al crear contrato
  - Validar que `requiredSignatures` == length de `requiredSigners`

- [x] **Actualizar `POST /contracts`**
  - Agregar campo `requiredSigners` al DTO (`CreateContractDto`)
  - Crear registros en `required_signers` al crear contrato
  - Validar que `requiredSignatures` == length de `requiredSigners`

- [x] **Actualizar `POST /contracts/:id/sign`**
  - Validar que `req.user.email` o `req.user.documentNumber` esté en `required_signers`
  - Verificar que no haya firmado previamente (previene doble firma)
  - Actualizar `required_signers.signed = true` y `signed_at`
  - Verificar que `req.user.verified = true` (KYC completado)
  - Mensajes de error claros: 403 Forbidden si no está autorizado, 409 Conflict si ya firmó

- [x] **Nuevo endpoint `GET /contracts/mine`**
  - Buscar contratos donde el usuario aparece en `required_signers`
  - Filtrar por email, documentNumber, o userId
  - Mostrar estado: `signed`, `pending`
  - Incluir información del contrato y rol del firmante

### Backend Tasks - Auditoría de Integridad

- [x] **Nuevo servicio `ContractAuditService`**
  - Re-cálculo de hash SHA-256 del PDF desde S3/R2
  - Re-cálculo de hash SHA-256 de evidencias de firma
  - Comparación con valores almacenados en base de datos
  - Decodificación de transacciones blockchain para verificación
  - Generación de reporte completo de integridad

- [x] **Nuevo endpoint `GET /contracts/:id/verify`**
  - Retorna `ContractIntegrityReport` con:
    - Estado general: `ok` o `attention-needed`
    - Resumen de checks: ok, mismatch, error, skipped
    - Verificación de hash del PDF
    - Verificación de hash en blockchain
    - Verificación de cada firma (hash de evidencia + blockchain)
    - Cadena de custodia (chain of custody)
    - Metadata del contrato y evidencia legal

- [x] **Extensión de servicios existentes**
  - `S3Service.getObjectBuffer()` - Para descargar PDFs como Buffer
  - `ChainService.decodeTransaction()` - Para leer datos de transacciones blockchain

### Entregables

- [x] Tabla `required_signers` en producción
- [x] Endpoints actualizados y documentados en Swagger
- [x] Sistema de auditoría completo
- [x] Tests end-to-end con scripts de prueba
- [x] Documentación de auditoría y verificación de identidad

**Duración real:** 3 días (completado)

---

## 🔐 Fase 3: KYC Biométrico (Semana 4)

**Objetivo:** Integrar verificación de identidad con Veriff o Onfido.

### Preparación

- [ ] **Crear cuenta en Veriff o Onfido**
  - Obtener API keys
  - Configurar webhook URL
  - Plan: Pay-as-you-go

- [ ] **Agregar variables de entorno**
  ```bash
  VERIFF_API_KEY="..."
  VERIFF_API_SECRET="..."
  APP_URL="https://yourapp.com"
  ```

### Backend Tasks

- [ ] **Crear módulo KYC**
  - `src/kyc/kyc.module.ts`
  - `src/kyc/kyc.service.ts`
  - `src/kyc/kyc.controller.ts`

- [ ] **Instalar dependencias**
  ```bash
  npm install @veriff/node-sdk
  # o
  npm install onfido-node
  ```

- [ ] **Endpoint `POST /kyc/start`**
  - Crear sesión de verificación en Veriff/Onfido
  - Devolver URL de verificación
  - Requiere autenticación

- [ ] **Endpoint `POST /kyc/webhook`**
  - Recibir resultado de verificación
  - Validar que DNI en KYC == DNI en registro
  - Validar que nombre en KYC == nombre en registro (70%+ similitud)
  - Actualizar `user.verified = true`
  - Guardar `verificationId` y `verificationProvider`

- [ ] **Actualizar `POST /contracts/:id/sign`**
  - Verificar `user.verified = true` antes de permitir firma
  - Retornar error `KYC_REQUIRED` si no está verificado

- [ ] **Endpoint `GET /me/kyc-status`**
  - Verificar si usuario tiene KYC completo
  - Devolver información de verificación

### Frontend Tasks (Básico)

- [ ] **Pantalla de verificación KYC**
  - Botón "Verificar identidad"
  - Abrir iframe/ventana de Veriff
  - Mostrar estado de verificación

- [ ] **Modal en firma de contrato**
  - Si `user.verified = false` → mostrar modal KYC
  - Opción "Verificar ahora" o "Más tarde"

### Entregables

- Integración completa con Veriff/Onfido
- KYC funcional en staging
- Usuario puede verificarse y firmar
- Documentación actualizada

**Duración estimada:** 5-7 días  
**Costo:** $1-3 por verificación (solo usuarios que firman)

---

## 📱 Fase 4: Biometría del Dispositivo (Semana 5)

**Objetivo:** Implementar autenticación biométrica para firmas.

### Backend Tasks

- [ ] **Actualizar tabla `signatures`**
  - Agregar campos: `biometricUsed`, `biometricType`, `deviceId`
  - Migración de Prisma

- [ ] **Actualizar `POST /contracts/:id/sign`**
  - Leer headers `X-Biometric-Proof` y `X-Biometric-Type`
  - Guardar información de biometría en `signatures`
  - Opcional: validar proof (firma criptográfica del dispositivo)

### Frontend Tasks

- [ ] **React Native: LocalAuthentication**
  ```bash
  npm install expo-local-authentication
  ```
  - Implementar `authenticateAsync()` antes de firmar
  - Enviar proof al backend

- [ ] **Web: WebAuthn API**
  - Implementar autenticación biométrica para navegadores
  - Registrar credencial biométrica
  - Usar credencial al firmar

### Entregables

- Firmas con biometría del dispositivo
- UX mejorada (1 segundo para firmar)
- Evidencia auditable de biometría

**Duración estimada:** 3-5 días  
**Costo:** $0

---

## 🎨 Fase 5: Frontend Completo (Semanas 6-8)

**Objetivo:** Aplicación web y móvil completa.

### Web App (React)

- [ ] **Configuración inicial**
  - Create React App / Vite
  - TailwindCSS + shadcn/ui
  - React Query para API calls
  - Zustand para state management

- [ ] **Pantallas de autenticación**
  - Login (Email/Password)
  - Login con Google
  - Registro con Email
  - Registro con Google
  - Verificación de email
  - Recuperación de contraseña

- [ ] **Dashboard**
  - Lista de contratos pendientes
  - Lista de contratos firmados
  - Estadísticas (total contratos, firmados, pendientes)

- [ ] **Vista de contrato**
  - Visor de PDF
  - Información del contrato
  - Lista de firmantes y estado
  - Botón "Firmar"

- [ ] **Flujo de firma**
  - Modal de confirmación
  - Integración con KYC (si no verificado)
  - Autenticación biométrica (WebAuthn)
  - Confirmación de firma exitosa

- [ ] **Perfil de usuario**
  - Información personal
  - Estado de verificación
  - Historial de firmas
  - Botón "Verificar identidad"

### Mobile App (React Native) - Opcional

- [ ] **Configuración inicial**
  - Expo / React Native CLI
  - React Navigation
  - NativeWind (TailwindCSS)

- [ ] **Pantallas principales**
  - Login / Registro
  - Dashboard
  - Vista de contrato
  - Perfil

- [ ] **Features móviles**
  - Push notifications
  - FaceID / TouchID nativo
  - Compartir contratos
  - Firma offline (sync después)

### Entregables

- Web app funcional en producción
- Mobile app en TestFlight/Play Store Beta (opcional)
- Documentación de usuario

**Duración estimada:** 15-20 días

---

## 🔒 Fase 6: Seguridad Avanzada (Semana 9)

**Objetivo:** Implementar medidas de seguridad adicionales.

### Tasks

- [ ] **reCAPTCHA v3 implementación completa**
  - Validar token en backend
  - Score mínimo configurable
  - Logging de scores

- [ ] **SMS Verification (Twilio)**
  - Enviar código de verificación
  - Validar código
  - 2FA opcional para acciones críticas

- [ ] **Email Service**
  - Integración con SendGrid o AWS SES
  - Templates de emails:
    - Verificación de email
    - Confirmación de firma
    - Notificación de nuevo contrato
    - Resumen diario/semanal

- [ ] **Rate Limiting avanzado**
  - Por endpoint
  - Por IP y por usuario
  - Diferentes límites según rol
  - Dashboard de métricas

- [ ] **Audit Logs mejorados**
  - Log de todas las acciones críticas
  - Retención de 7 años (compliance)
  - Búsqueda y filtrado
  - Exportación a CSV/JSON

- [ ] **Panel de revisión manual**
  - Lista de usuarios sospechosos
  - Información completa de registro
  - Aprobar/rechazar manualmente
  - Bloquear usuarios

### Entregables

- Sistema de seguridad robusto
- Panel de administración
- Compliance mejorado

**Duración estimada:** 5-7 días

---

## 🚀 Fase 7: Producción (Semana 10)

**Objetivo:** Preparar sistema para producción.

### Testing

- [ ] **Tests unitarios (Jest)**
  - Servicios: AuthService, ContractsService, ChainService
  - Cobertura > 80%

- [ ] **Tests de integración**
  - Flujos completos (registro → firma → blockchain)
  - Tests de API (supertest)

- [ ] **Tests E2E (Playwright/Cypress)**
  - Flujo completo de usuario
  - Multi-browser testing

### CI/CD

- [ ] **GitHub Actions**
  - Pipeline de CI: lint + test
  - Pipeline de CD: deploy automático a Railway
  - Deploy preview para PRs

### Monitoring

- [ ] **Error tracking (Sentry)**
  - Configurar Sentry SDK
  - Alertas por email/Slack

- [ ] **Application monitoring**
  - LogRocket / FullStory (session replay)
  - Performance metrics
  - User behavior analytics

- [ ] **Infrastructure monitoring**
  - Railway metrics
  - Database performance
  - API response times

### Optimización

- [ ] **Performance**
  - Caching con Redis (opcional)
  - Query optimization
  - Image optimization
  - Code splitting (frontend)

- [ ] **Security audit**
  - Penetration testing
  - Dependency audit
  - OWASP compliance check

### Deploy

- [ ] **Smart contract en Polygon mainnet**
  - Deploy de ContractRegistry
  - Verificar contrato en PolygonScan
  - Actualizar `CHAIN_REGISTRY_ADDRESS`

- [ ] **Custom domain para R2**
  - Configurar dominio personalizado
  - SSL certificate
  - Actualizar `R2_PUBLIC_DOMAIN`

- [ ] **Dominio personalizado**
  - DNS configuration
  - SSL certificate
  - CDN (Cloudflare)

### Entregables

- Sistema en producción
- 99.9% uptime
- Monitoreo completo
- Tests automatizados

**Duración estimada:** 7-10 días

---

## 🎯 Fase 8: Features Avanzadas (Semanas 11+)

**Objetivo:** Agregar funcionalidades premium y mejoras.

### Features Opcionales

#### 1. SMS Notifications
- Notificar por SMS cuando hay contrato pendiente
- Recordatorios de firma
- Confirmación de firma exitosa
- **Duración:** 2-3 días
- **Costo:** $0.05 por SMS

#### 2. Email Templates Profesionales
- Diseño HTML profesional
- Branding por tenant
- Tracking de apertura
- **Duración:** 3-5 días

#### 3. Stamping de Firmas en PDF
- Agregar página de firmas al PDF
- Visualización de quién firmó y cuándo
- Librería: `pdf-lib`
- **Duración:** 3-5 días

#### 4. Sistema de Templates
- Tabla `contract_templates`
- Templates predefinidos por tenant
- Editor de templates
- **Duración:** 5-7 días

#### 5. Workflow de Aprobación
- Flujo multi-nivel (draft → review → approved → signed)
- Aprobadores específicos
- Notificaciones automáticas
- **Duración:** 7-10 días

#### 6. Integración con Firma Digital AFIP
- Para contratos que requieren validez legal plena
- Feature premium
- **Duración:** 10-15 días
- **Costo:** $5,000-15,000/año

#### 7. Integración con RENAPER
- Validación de DNI contra base oficial
- Para contratos de alto valor
- **Duración:** 15-20 días (incluye homologación)

#### 8. Panel de Analytics
- Métricas de contratos
- Conversión de firmas
- Tiempo promedio de firma
- Dashboard con gráficos
- **Duración:** 5-7 días

#### 9. API Pública para Partners
- API keys
- Rate limiting personalizado
- Webhooks
- Documentación extendida
- **Duración:** 7-10 días

#### 10. White Label
- Branding completo por tenant
- Custom domains
- Custom emails
- Logo personalizado en PDFs
- **Duración:** 5-7 días

---

## 📅 Timeline Completo

```
Semana 1-2:  ✅ MVP Backend (completado)
Semana 3:    ✅ Firmantes autorizados + Auditoría de integridad (completado)
Semana 4:    ⏳ KYC biométrico
Semana 5:    ⏳ Biometría del dispositivo
Semana 6-8:  ⏳ Frontend completo
Semana 9:    ⏳ Seguridad avanzada
Semana 10:   ⏳ Producción
Semana 11+:  ⏳ Features avanzadas
```

---

## 💰 Costos Estimados

### Desarrollo (Mes 1-3)

| Item | Costo |
|---|---|
| Hosting (Railway) | $5-20/mes |
| PostgreSQL (Railway) | Incluido |
| Firebase Auth | Gratis (< 50k MAU) |
| Cloudflare R2 | ~$1-5/mes (primeros GB gratis) |
| Polygon (testnet) | Gratis |
| Veriff/Onfido (desarrollo) | Gratis (sandbox) |

**Total mes 1-3:** ~$10-30/mes

### Producción (Mes 4+)

| Item | Costo |
|---|---|
| Hosting (Railway Pro) | $20-50/mes |
| Cloudflare R2 | $0.015/GB + $0.36/millón requests |
| Polygon mainnet | ~$0.01/tx (~$10-50/mes) |
| KYC (Veriff/Onfido) | $1-3 por usuario que firma |
| Sentry | $26/mes (Team plan) |
| SendGrid | $15/mes (40k emails) |
| Domain + SSL | $12/año |

**Total mes 4+:** ~$70-150/mes + $1-3 por usuario verificado

### Proyección de costos por volumen

**Escenario 1: 100 usuarios/mes, 50 firman**
- Infraestructura: $70/mes
- KYC: $50-150/mes
- **Total: $120-220/mes**

**Escenario 2: 1000 usuarios/mes, 500 firman**
- Infraestructura: $150/mes
- KYC: $500-1500/mes
- **Total: $650-1650/mes**

**Escenario 3: 10,000 usuarios/mes, 5000 firman**
- Infraestructura: $500/mes
- KYC: $5,000-15,000/mes
- **Total: $5,500-15,500/mes**

**Nota:** KYC es el único costo variable significativo. Biometría del teléfono es gratis para firmas posteriores.

---

## 🎯 Prioridades Inmediatas (Próximas 2 semanas)

### Semana 3: Firmantes Autorizados + Auditoría - ✅ COMPLETADO

**Prioridad ALTA:**

1. ✅ Crear tabla `required_signers`
2. ✅ Actualizar `POST /contracts/upload` con `requiredSigners`
3. ✅ Actualizar `POST /contracts` con `requiredSigners`
4. ✅ Validar firmantes en `POST /contracts/:id/sign` (autorización + KYC)
5. ✅ Endpoint `GET /contracts/mine`
6. ✅ Sistema de auditoría de integridad (`GET /contracts/:id/verify`)

**Por qué era prioridad:**
- ✅ Cierra el agujero de seguridad (cualquiera puede firmar) - RESUELTO
- ✅ Permite buscar contratos por usuario - IMPLEMENTADO
- ✅ Requerido para MVP funcional - COMPLETADO
- ✅ Auditoría de integridad para evidencia legal - IMPLEMENTADO

### Semana 4: KYC Biométrico

**Prioridad ALTA:**

1. Crear cuenta en Veriff
2. Implementar módulo KYC
3. Endpoint `/kyc/start` y webhook
4. Validación en firma

**Por qué es prioridad:**
- Valida identidad real (requerido para validez legal)
- Diferenciador clave del producto
- Aumenta confianza de usuarios

---

## 📈 Métricas de Éxito

### Fase 2 (Firmantes Autorizados + Auditoría) - ✅ COMPLETADA
- ✅ 0% de firmas no autorizadas (validación implementada y probada)
- ✅ 100% de contratos pueden tener firmantes definidos
- ✅ Usuarios pueden ver sus contratos pendientes (`GET /contracts/mine`)
- ✅ Sistema de auditoría de integridad completo
- ✅ Verificación de hashes en base de datos y blockchain
- ✅ Reportes de integridad para evidencia legal

### Fase 3 (KYC)
- ✅ Tasa de completado de KYC: > 60%
- ✅ Tiempo promedio de verificación: < 3 minutos
- ✅ Tasa de aprobación: > 90%

### Fase 4 (Biometría)
- ✅ Tiempo de firma (post-KYC): < 5 segundos
- ✅ Tasa de éxito biométrico: > 95%

### Fase 7 (Producción)
- ✅ Uptime: > 99.9%
- ✅ API response time: < 500ms (p95)
- ✅ 0 vulnerabilidades críticas
- ✅ Test coverage: > 80%

---

## 🤝 Próximos Pasos Inmediatos

### Esta semana:

1. **✅ Completado: Fase 2 - Firmantes Autorizados + Auditoría**
   - ✅ Tabla `required_signers` creada y migrada
   - ✅ Validación de autorización implementada
   - ✅ Sistema de auditoría de integridad completo
   - ✅ Endpoint `GET /contracts/mine` funcionando
   - ✅ Tests end-to-end pasando

2. **Iniciar Fase 3: KYC Biométrico**
   - Evaluar Veriff vs Onfido
   - Crear cuenta en proveedor seleccionado
   - Implementar módulo KYC
   - Endpoints `/kyc/start` y webhook

### Próxima semana:

1. **Completar Fase 3: KYC Biométrico**
2. **Iniciar Fase 4: Biometría del dispositivo**

---

**Última actualización:** 6 de Diciembre, 2025  
**Versión:** 1.1

