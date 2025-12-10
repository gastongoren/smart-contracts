# 🔐 Biometría y Privacidad: Qué Guardar y Cómo Presentarlo como Prueba

## 📸 ¿Debería Guardar la Foto del DNI?

### Opciones y Consideraciones

#### Opción 1: **Guardar Foto Completa** (Máxima Evidencia)

**Pros:**
- ✅ Evidencia visual directa de identidad
- ✅ Puede compararse con selfie/foto de perfil
- ✅ Máxima validez legal

**Contras:**
- ❌ **Problemas de privacidad** (GDPR, LGPD)
- ❌ **Almacenamiento costoso** (fotos ocupan mucho espacio)
- ❌ **Riesgo de filtración** (si hay breach, se exponen documentos)
- ❌ **Retención de datos** (¿cuánto tiempo guardar?)

**Recomendación:** ⚠️ **Solo si es absolutamente necesario** y con consentimiento explícito del usuario.

#### Opción 2: **Guardar Solo Hash de la Foto** (Balance Privacidad/Evidencia)

**Pros:**
- ✅ No guarda datos sensibles
- ✅ Puede verificarse que la foto existió
- ✅ Cumple con privacidad

**Contras:**
- ❌ No se puede ver la foto después
- ❌ Menos evidencia visual directa

**Implementación:**
```json
{
  "idPhotoHash": "0xabc123...",  // SHA-256 de la foto
  "idPhotoSize": 245678,        // Tamaño en bytes
  "idPhotoFormat": "jpeg"       // Formato
}
```

#### Opción 3: **No Guardar Foto, Solo Referencia** (Máxima Privacidad)

**Pros:**
- ✅ Máxima privacidad
- ✅ Cumple GDPR/LGPD fácilmente
- ✅ Sin riesgo de filtración

**Contras:**
- ❌ Menos evidencia directa
- ❌ Depende de otros factores (KYC, biometría)

**Implementación:**
```json
{
  "idVerified": true,
  "idVerificationProvider": "veriff",
  "verificationId": "veriff-12345",
  "idVerifiedAt": "2025-12-06T22:51:45.269Z"
}
```

**Recomendación:** ✅ **Esta es la mejor opción** si tenés KYC implementado.

---

## 📱 ¿Cómo Funciona la Biometría del Dispositivo como Evidencia?

### Lo que NO se Guarda (Importante)

**❌ NO se guarda:**
- Template biométrico (huella digital, Face ID template)
- Datos biométricos raw
- Imágenes de huella/cara

**Razón:** Los sistemas biométricos modernos (Face ID, Touch ID) **nunca salen del dispositivo**. El chip seguro (Secure Enclave) procesa la biometría localmente y solo devuelve un **resultado booleano** (éxito/fallo).

### Lo que SÍ se Guarda (Evidencia)

**✅ Se guarda:**
```json
{
  "biometric": {
    "type": "face_id",           // Tipo: "face_id", "touch_id", "webauthn"
    "verified": true,            // Resultado: true/false
    "timestamp": "2025-12-06T22:51:45.269Z",
    "deviceId": "iPhone-13-Pro-Max-ABC123",
    "deviceModel": "iPhone 13 Pro Max",
    "osVersion": "iOS 17.1",
    "biometricProof": "0xdef456..."  // Hash criptográfico del resultado
  }
}
```

### Cómo Funciona Técnicamente

#### iOS (Face ID / Touch ID)

```javascript
// En el frontend (React Native / iOS)
import * as LocalAuthentication from 'expo-local-authentication';

async function signWithBiometric() {
  // 1. Solicitar autenticación biométrica
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Autentica para firmar el contrato',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });

  if (result.success) {
    // 2. Crear "proof" criptográfico
    const proof = createBiometricProof({
      timestamp: new Date().toISOString(),
      deviceId: await getDeviceId(),
      result: result.success,
      // Hash de: timestamp + deviceId + contractId + userUid
    });

    // 3. Enviar al backend
    return {
      biometric: {
        type: result.biometryType, // "FaceID" o "TouchID"
        verified: result.success,
        timestamp: new Date().toISOString(),
        deviceId: await getDeviceId(),
        biometricProof: proof,  // Hash criptográfico
      }
    };
  }
}
```

#### Android (BiometricPrompt)

```javascript
// Similar proceso en Android
const biometricPrompt = new BiometricPrompt({
  title: 'Firmar contrato',
  subtitle: 'Autentica con tu huella',
});

biometricPrompt.authenticate({
  onSuccess: () => {
    // Crear proof y enviar
  }
});
```

#### Web (WebAuthn)

```javascript
// WebAuthn API
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array(32),
    rp: { name: "Smart Contracts" },
    user: {
      id: new Uint8Array(16),
      name: user.email,
      displayName: user.name,
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    authenticatorSelection: {
      authenticatorAttachment: "platform",  // Dispositivo local
      userVerification: "required",
    },
  },
});

// Guardar credential.id y credential.response
```

---

## 🎯 Cómo Declarar la Biometría como Prueba

### Evidencia de Biometría del Dispositivo

**Qué demuestra:**
1. **Autenticación del dispositivo:** Solo el dueño del dispositivo puede usar Face ID/Touch ID
2. **Consentimiento explícito:** El usuario tuvo que autenticarse activamente
3. **Timestamp verificable:** Momento exacto de la autenticación
4. **Device binding:** La autenticación está vinculada a un dispositivo específico

### Declaración Legal de Biometría

```
EVIDENCIA DE AUTENTICACIÓN BIOMÉTRICA

1. TIPO DE BIOMETRÍA
   - Tipo: Face ID (iPhone)
   - Dispositivo: iPhone 13 Pro Max (ABC123)
   - OS: iOS 17.1

2. RESULTADO DE AUTENTICACIÓN
   - Estado: Verificado exitosamente
   - Timestamp: 2025-12-06T22:51:45.269Z
   - Proof criptográfico: 0xdef456...

3. VALOR PROBATORIO
   Face ID/Touch ID requiere:
   - Configuración previa del usuario en el dispositivo
   - Autenticación biométrica en el momento de la firma
   - Procesamiento local en Secure Enclave (no puede ser falsificado)
   - Resultado criptográficamente firmado

4. CONCLUSIÓN
   La autenticación biométrica demuestra que:
   - El usuario tenía control físico del dispositivo
   - El usuario autenticó activamente (no fue automático)
   - La autenticación ocurrió en el momento de la firma
   - El dispositivo está vinculado a la cuenta del usuario
```

---

## 💡 Mejores Prácticas Recomendadas

### Para Fotos de DNI

**Recomendación: NO guardar la foto directamente**

**Alternativas:**
1. **Usar KYC externo** (Veriff, Onfido)
   - Ellos guardan la foto (cumplen GDPR)
   - Vos solo guardas el `verificationId`
   - Evidencia legal: "Usuario verificó identidad con Veriff (ID: veriff-12345)"

2. **Guardar solo hash**
   ```json
   {
     "idPhotoHash": "0xabc123...",
     "idPhotoVerifiedAt": "2025-12-06T22:51:45.269Z"
   }
   ```

3. **Guardar referencia a KYC**
   ```json
   {
     "kycProvider": "veriff",
     "kycVerificationId": "veriff-12345",
     "kycVerifiedAt": "2025-12-06T22:51:45.269Z",
     "kycStatus": "approved"
   }
   ```

### Para Biometría

**Recomendación: Guardar resultado + proof criptográfico**

```json
{
  "biometric": {
    "type": "face_id",
    "verified": true,
    "timestamp": "2025-12-06T22:51:45.269Z",
    "deviceId": "iPhone-13-Pro-Max-ABC123",
    "deviceModel": "iPhone 13 Pro Max",
    "osVersion": "iOS 17.1",
    "biometricProof": "0xdef456...",  // Hash de: timestamp + deviceId + contractId + userUid
    "biometricSignature": "base64..."  // Si usas WebAuthn, guarda la signature
  }
}
```

**Qué incluir en el proof:**
```javascript
function createBiometricProof(biometricData) {
  const proofData = {
    timestamp: biometricData.timestamp,
    deviceId: biometricData.deviceId,
    contractId: contractId,
    userUid: user.uid,
    biometricType: biometricData.type,
    verified: biometricData.verified,
  };
  
  return '0x' + crypto.createHash('sha256')
    .update(JSON.stringify(proofData))
    .digest('hex');
}
```

---

## 📋 Ejemplo Completo de Evidencia Recomendada

```json
{
  "timestamp": "2025-12-06T22:51:45.269Z",
  "ip": "192.168.1.100",
  "geolocation": { "lat": -34.6037, "lng": -58.3816 },
  
  // Biometría del dispositivo
  "biometric": {
    "type": "face_id",
    "verified": true,
    "timestamp": "2025-12-06T22:51:45.269Z",
    "deviceId": "iPhone-13-Pro-Max-ABC123",
    "deviceModel": "iPhone 13 Pro Max",
    "osVersion": "iOS 17.1",
    "biometricProof": "0xdef456..."
  },
  
  // KYC (no guardar foto, solo referencia)
  "kyc": {
    "provider": "veriff",
    "verificationId": "veriff-12345",
    "verifiedAt": "2025-12-05T10:30:00.000Z",
    "status": "approved",
    "documentNumber": "12345678",  // Solo el número, no la foto
    "documentType": "DNI"
  },
  
  // Device fingerprint
  "device": {
    "id": "iPhone-13-Pro-Max-ABC123",
    "model": "iPhone 13 Pro Max",
    "os": "iOS 17.1",
    "userAgent": "Mozilla/5.0..."
  },
  
  // NO incluir:
  // - idPhoto (foto del DNI)
  // - signatureImage (foto de firma manuscrita, opcional)
  // - selfie (solo si es absolutamente necesario)
}
```

---

## ⚖️ Validez Legal de la Biometría

### ¿Es Válida como Prueba?

**Sí, pero con matices:**

1. **Autenticación del dispositivo:** ✅ Válida
   - Demuestra que el usuario tenía control del dispositivo
   - Demuestra consentimiento activo

2. **Identificación de la persona:** ⚠️ Limitada
   - Face ID/Touch ID solo autentica el dispositivo
   - No identifica quién es la persona (necesita KYC para eso)

3. **Combinación con otros factores:** ✅ Muy válida
   - Biometría + KYC + Email verificado = Evidencia fuerte
   - Biometría + DNI verificado + Timestamp = Evidencia legal sólida

### Comparación con Firma Digital

| Aspecto | Biometría Dispositivo | Firma Digital AFIP |
|---------|----------------------|-------------------|
| **Autenticación** | ✅ Dispositivo | ✅ Persona |
| **Identificación** | ⚠️ Requiere KYC | ✅ Certificado PKI |
| **Validez legal** | ⭐⭐⭐ Limitada | ⭐⭐⭐⭐⭐ Plena |
| **Costo** | $0 | $5,000-15,000/año |
| **UX** | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐ Mala |

---

## 🎯 Recomendación Final

### Para Máxima Evidencia Legal:

1. **NO guardar foto del DNI** directamente
   - Usar KYC externo (Veriff/Onfido)
   - Guardar solo `verificationId` y `documentNumber`

2. **SÍ guardar biometría del dispositivo**
   - Tipo, resultado, timestamp, deviceId
   - Proof criptográfico del resultado

3. **Combinar múltiples factores:**
   - Email verificado (Firebase)
   - KYC completado (Veriff/Onfido)
   - Biometría del dispositivo (Face ID/Touch ID)
   - Timestamp verificable
   - Registro en blockchain

Esta combinación proporciona evidencia legal sólida sin comprometer la privacidad del usuario.


