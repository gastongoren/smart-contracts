# 👥 Guía de Registro de Usuarios

## 🔄 Flujo Completo de Registro

### Paso 1: Crear Usuario en Firebase (Frontend)

```javascript
// En tu frontend (React, Next.js, etc.)
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

// Usuario completa formulario de registro
const userCredential = await createUserWithEmailAndPassword(
  auth,
  'juan.perez@sanmartin.com',
  'password123'
);

const firebaseUid = userCredential.user.uid;
console.log('Firebase UID:', firebaseUid);
// Ej: "abc123def456ghi789"
```

---

### Paso 2: Registrar Usuario en tu Sistema (Frontend → Tu API)

```javascript
// Inmediatamente después de crear el usuario en Firebase
const response = await fetch('https://smart-contracts-production.up.railway.app/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    firebaseUid: firebaseUid,  // Del paso 1
    email: 'juan.perez@sanmartin.com',
    tenantId: 'mutual-sanmartin',  // Tenant del usuario
    role: 'SELLER',  // ADMIN, SELLER, o BUYER
    tenants: ['mutual-sanmartin'],  // Opcional: múltiples tenants
    metadata: {  // Opcional
      department: 'Sales',
      phone: '+54911234567'
    }
  }),
});

const userData = await response.json();
console.log('User registered:', userData);
```

**Response:**
```json
{
  "id": "uuid-123",
  "firebaseUid": "abc123def456ghi789",
  "email": "juan.perez@sanmartin.com",
  "tenantId": "mutual-sanmartin",
  "role": "SELLER",
  "tenants": ["mutual-sanmartin"],
  "createdAt": "2025-10-11T15:00:00Z"
}
```

---

### Paso 3: Login (Cada vez que el usuario vuelve)

```javascript
// Usuario ingresa email y password
const userCredential = await signInWithEmailAndPassword(
  auth,
  'juan.perez@sanmartin.com',
  'password123'
);

// Obtener token JWT (ya incluye tenant y rol en custom claims)
const token = await userCredential.user.getIdToken();

// Guardar para usar en requests
localStorage.setItem('authToken', token);
```

---

### Paso 4: Usar el Token en Requests

```javascript
// Crear contrato
const response = await fetch('https://smart-contracts-production.up.railway.app/contracts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,  // ← Token del paso 3
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    templateId: 5,
    version: 1,
    hashPdfHex: '0xaaa...',
  }),
});
```

El backend automáticamente sabe:
- ✅ Quién es el usuario (uid, email)
- ✅ Qué rol tiene (SELLER)
- ✅ A qué tenant pertenece (mutual-sanmartin)
- ✅ Filtra contratos por su tenant

---

## 📋 Ejemplos con cURL

### Registrar Usuario Vendedor

```bash
curl -X POST https://smart-contracts-production.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "abc123def456",
    "email": "vendedor@sanmartin.com",
    "tenantId": "mutual-sanmartin",
    "role": "SELLER",
    "tenants": ["mutual-sanmartin"]
  }'
```

### Registrar Admin Multi-tenant

```bash
curl -X POST https://smart-contracts-production.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "xyz789abc123",
    "email": "admin@smartcore.com",
    "tenantId": "core",
    "role": "ADMIN",
    "tenants": ["core", "mutual-sanmartin"]
  }'
```

### Listar Usuarios (requiere ADMIN)

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://smart-contracts-production.up.railway.app/auth/users
```

### Ver Usuario Específico

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://smart-contracts-production.up.railway.app/auth/users/abc123def456
```

### Actualizar Rol de Usuario

```bash
curl -X PATCH https://smart-contracts-production.up.railway.app/auth/users/abc123def456/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

---

## 🏢 Escenarios de Uso

### Escenario 1: Usuario Único por Tenant

**Juan (Vendedor en Mutual San Martín):**
```json
{
  "firebaseUid": "user_juan",
  "email": "juan@sanmartin.com",
  "tenantId": "mutual-sanmartin",
  "role": "SELLER",
  "tenants": ["mutual-sanmartin"]
}
```

- ✅ Solo ve contratos de mutual-sanmartin
- ✅ Puede crear y firmar contratos
- ❌ No puede ver contratos de otros tenants

---

### Escenario 2: Admin Multi-tenant

**María (Admin de múltiples tenants):**
```json
{
  "firebaseUid": "user_maria",
  "email": "maria@smartcore.com",
  "tenantId": "core",
  "role": "ADMIN",
  "tenants": ["core", "mutual-sanmartin"]
}
```

- ✅ Puede cambiar tenant con header `x-tenant-id`
- ✅ Ve contratos de todos sus tenants
- ✅ Puede gestionar usuarios

---

### Escenario 3: Comprador

**Carlos (Comprador):**
```json
{
  "firebaseUid": "user_carlos",
  "email": "carlos@example.com",
  "tenantId": "core",
  "role": "BUYER",
  "tenants": ["core"]
}
```

- ✅ Puede ver contratos
- ✅ Puede firmar contratos
- ❌ NO puede crear contratos

---

## 🔐 Roles Disponibles

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Todo - gestionar usuarios, ver todos los tenants |
| **SELLER** | Crear contratos, firmar, ver del tenant |
| **BUYER** | Ver contratos, firmar (no crear) |

---

## 🎯 Nuevos Endpoints Disponibles

```
POST   /auth/register              Registrar usuario con tenant/rol
GET    /auth/users                 Listar usuarios (requiere ADMIN)
GET    /auth/users/:firebaseUid    Ver usuario específico
PATCH  /auth/users/:firebaseUid/role  Actualizar rol (requiere ADMIN)
```

---

## 📊 Datos en PostgreSQL

Tabla `users`:
```sql
| id | firebaseUid | email | tenantId | role | tenants | active |
|----|-------------|-------|----------|------|---------|--------|
| uuid-1 | abc123 | juan@... | mutual-sanmartin | SELLER | ["mutual-sanmartin"] | true |
| uuid-2 | xyz789 | maria@... | core | ADMIN | ["core","mutual-sanmartin"] | true |
```

---

## 🔄 Token JWT Incluye Todo

Cuando el usuario hace login, el token JWT incluye:

```json
{
  "uid": "abc123def456",
  "email": "juan@sanmartin.com",
  "role": "SELLER",  // ← Custom claim
  "tenantId": "mutual-sanmartin",  // ← Custom claim
  "tenants": ["mutual-sanmartin"],  // ← Custom claim
  "exp": 1728595200
}
```

Tu backend decodifica esto automáticamente y sabe quién es, qué rol tiene y a qué tenant pertenece! ✅

---

## 🚀 Siguiente: Deployment

Railway está deployando estos cambios ahora (~3-4 minutos).

Cuando termine:
1. ✅ Tabla `users` creada
2. ✅ Endpoints de registro disponibles
3. ✅ Firebase configurado correctamente
4. ✅ Swagger documentado

¡Listo para crear usuarios reales! 🎉

