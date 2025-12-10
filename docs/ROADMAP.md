# 🗺️ Roadmap de Implementación

Plan de desarrollo por fases para el sistema de contratos inteligentes.

---

## 📊 Estado Actual

### ✅ Completado (Semanas 1-2)

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

### 📋 Documentación

- [x] `README.md` profesional
- [x] `CONTRIBUTING.md`
- [x] `docs/ARCHITECTURE.md` - Arquitectura completa del sistema
- [x] `docs/API_EXAMPLES.md` - Ejemplos de uso de la API
- [x] `docs/QUICKSTART.md` - Guía rápida de inicio
- [x] `docs/CONTRACT_WORKFLOW.md` - Flujo de trabajo de contratos
- [x] `docs/USER_REGISTRATION_GUIDE.md` - Guía de registro de usuarios
- [x] `docs/ENVIRONMENT_VARIABLES.md` - Variables de entorno

---

## 🚧 Fase 2: Sistema de Firmantes Autorizados (Semana 3)

**Objetivo:** Implementar lista de firmantes requeridos y validación de autorización.

### Backend Tasks

- [ ] **Crear tabla `required_signers`**
  - Campos: contractId, email, fullName, documentNumber, role, userId, signed, signedAt
  - Migración de Prisma
  - Modelo en `prisma/schema.prisma`

- [ ] **Actualizar `POST /contracts/upload`**
  - Agregar campo `requiredSigners` al DTO
  - Crear registros en `required_signers` al crear contrato
  - Validar que `requiredSignatures` == length de `requiredSigners`

- [ ] **Actualizar `POST /contracts/:id/sign`**
  - Validar que `req.user.email` o `req.user.documentNumber` esté en `required_signers`
  - Verificar que no haya firmado previamente
  - Actualizar `required_signers.signed = true` y `signed_at`
  - Verificar que `req.user.verified = true` (KYC completado)

- [ ] **Nuevo endpoint `GET /contracts/mine`**
  - Buscar contratos donde el usuario aparece en `required_signers`
  - Filtrar por email, documentNumber, o userId
  - Mostrar estado: `signed`, `pending`, `not_involved`

- [ ] **Tests unitarios**
  - Validación de firmantes autorizados
  - Prevención de doble firma
  - Búsqueda de contratos por usuario

### Entregables

- Tabla `required_signers` en producción
- Endpoints actualizados y documentados en Swagger
- Tests pasando

**Duración estimada:** 5-7 días

---

## ✅ Fase 3: KYC Biométrico (Semana 4) - COMPLETADO

**Objetivo:** Integrar verificación de identidad con Veriff o Onfido.

### Preparación

- [x] **Crear cuenta en Veriff o Onfido**
  - Obtener API keys
  - Configurar webhook URL
  - Plan: Pay-as-you-go

- [x] **Agregar variables de entorno**
  ```bash
  VERIFF_API_KEY="..."
  VERIFF_API_SECRET="..."
  APP_URL="https://yourapp.com"
  ```

### Backend Tasks

- [x] **Crear módulo KYC**
  - `src/kyc/kyc.module.ts`
  - `src/kyc/kyc.service.ts`
  - `src/kyc/kyc.controller.ts`

- [x] **Instalar dependencias**
  ```bash
  npm install @veriff/node-sdk
  # o
  npm install onfido-node
  ```
  **Nota:** La integración está lista, pero el SDK se instalará cuando se configure Veriff en producción. El código funciona en modo mock sin las API keys.

- [x] **Endpoint `POST /kyc/start`**
  - Crear sesión de verificación en Veriff/Onfido
  - Devolver URL de verificación
  - Requiere autenticación

- [x] **Endpoint `POST /kyc/webhook`**
  - Recibir resultado de verificación
  - Validar que DNI en KYC == DNI en registro
  - Validar que nombre en KYC == nombre en registro (70%+ similitud usando Levenshtein)
  - Actualizar `user.verified = true`
  - Guardar `verificationId` y `verificationProvider`

- [x] **Actualizar `POST /contracts/:id/sign`**
  - Verificar `user.verified = true` antes de permitir firma
  - Retornar error `ForbiddenException` si no está verificado

- [x] **Endpoint `GET /me/kyc-status`**
  - Verificar si usuario tiene KYC completo
  - Devolver información de verificación
  - También incluido en `GET /me` (endpoint principal de usuario)

### Frontend Tasks (Básico) - Pendiente para Fase 5

- [ ] **Pantalla de verificación KYC**
  - Botón "Verificar identidad"
  - Abrir iframe/ventana de Veriff
  - Mostrar estado de verificación

- [ ] **Modal en firma de contrato**
  - Si `user.verified = false` → mostrar modal KYC
  - Opción "Verificar ahora" o "Más tarde"

### Entregables

- ✅ Integración completa con Veriff (backend)
- ✅ KYC funcional en modo mock (sin API keys) o producción (con API keys)
- ✅ Usuario puede verificarse y firmar (backend listo)
- ✅ Documentación actualizada
- ⏳ Frontend pendiente para Fase 5

**Duración estimada:** 5-7 días  
**Costo:** $1-3 por verificación (solo usuarios que firman)  
**Estado:** Backend completado, Frontend pendiente

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
Semana 3:    🚧 Firmantes autorizados
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

### Semana 3: Firmantes Autorizados

**Prioridad ALTA:**

1. Crear tabla `required_signers`
2. Actualizar `POST /contracts/upload` con `requiredSigners`
3. Validar firmantes en `POST /contracts/:id/sign`
4. Endpoint `GET /contracts/mine`

**Por qué es prioridad:**
- Cierra el agujero de seguridad actual (cualquiera puede firmar)
- Permite buscar contratos por usuario
- Requerido para MVP funcional

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

### Fase 2 (Firmantes Autorizados)
- ✅ 0% de firmas no autorizadas
- ✅ 100% de contratos con firmantes definidos
- ✅ Usuarios pueden ver sus contratos pendientes

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

1. **Desplegar migraciones actuales a Railway**
   - Nuevos campos en `users`
   - Campo `requiredSignatures` en `contracts`

2. **Probar endpoints nuevos de registro**
   - `POST /auth/register/email`
   - `POST /auth/register/google`

3. **Iniciar Fase 2: Firmantes autorizados**
   - Diseñar tabla `required_signers`
   - Actualizar DTOs

### Próxima semana:

1. **Completar Fase 2**
2. **Iniciar Fase 3: Evaluación de Veriff vs Onfido**

---

**Última actualización:** 12 de Octubre, 2025  
**Versión:** 1.0

