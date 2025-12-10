# 🔍 Sistema de Verificación de Integridad

## ¿Qué Verifica el Sistema?

El sistema de auditoría verifica **4 aspectos críticos** de cada contrato:

### 1. **Integridad del PDF Original** (`contract.pdfHash`)
- **Qué hace:** Descarga el PDF desde R2/S3, recalcula su hash SHA-256 y lo compara con el hash guardado en la base de datos.
- **Qué demuestra:** Que el PDF no ha sido alterado desde que se subió originalmente.
- **Estado:**
  - ✅ `ok`: El PDF actual coincide exactamente con el original
  - ❌ `mismatch`: El PDF fue modificado (hash diferente)
  - ⚠️ `error`: No se pudo descargar o procesar el PDF
  - ⏭️ `skipped`: No hay PDF disponible para verificar

### 2. **Registro en Blockchain** (`contract.blockchain`)
- **Qué hace:** Decodifica la transacción blockchain (`txHash`) y verifica que el hash del PDF registrado on-chain coincide con el de la base de datos.
- **Qué demuestra:** Que el contrato fue registrado correctamente en la blockchain y que nadie puede alterar ese registro.
- **Estado:**
  - ✅ `ok`: Hash on-chain coincide con hash en DB
  - ❌ `mismatch`: Hash on-chain difiere (posible manipulación)
  - ⚠️ `error`: No se pudo decodificar la transacción
  - ⏭️ `skipped`: No hay transacción blockchain (modo stub o no configurado)

### 3. **Integridad de la Evidencia de Firma** (`signatures[].checks.evidenceHash`)
- **Qué hace:** Recalcula el hash SHA-256 del JSON de evidencia guardado y lo compara con el hash almacenado.
- **Qué demuestra:** Que la evidencia de cada firma (biometría, timestamp, IP, etc.) no fue alterada.
- **Estado:**
  - ✅ `ok`: Hash de evidencia coincide
  - ❌ `mismatch`: La evidencia fue modificada
  - ⚠️ `error`: Error al recalcular hash
  - ⏭️ `skipped`: No hay evidencia guardada

### 4. **Registro de Firma en Blockchain** (`signatures[].checks.blockchain`)
- **Qué hace:** Decodifica la transacción blockchain de cada firma y verifica que el hash de evidencia on-chain coincide.
- **Qué demuestra:** Que cada firma fue registrada correctamente en la blockchain y es inmutable.
- **Estado:**
  - ✅ `ok`: Hash on-chain coincide
  - ❌ `mismatch`: Hash on-chain difiere
  - ⚠️ `error`: Error al decodificar transacción
  - ⏭️ `skipped`: No hay transacción blockchain

---

## ¿Cómo Presentarlo como Prueba?

### 1. **Reporte de Integridad (JSON)**
El endpoint `GET /contracts/:id/verify` devuelve un reporte completo en JSON que incluye:
- Estado general (`ok` o `attention-needed`)
- Resumen de checks (cuántos pasaron, fallaron, etc.)
- Detalles de cada verificación con hashes esperados vs actuales
- Lista de issues encontrados

### 2. **Evidencia Legal**
Para presentarlo como prueba en un contexto legal, el reporte demuestra:

#### **Cadena de Custodia Digital:**
1. **PDF Original** → Hash SHA-256 guardado en DB
2. **Registro Blockchain** → Hash del PDF registrado on-chain (inmutable)
3. **Evidencia de Firma** → Hash de cada evidencia guardado
4. **Registro de Firma** → Hash de evidencia registrado on-chain

#### **Valor Probatorio:**
- ✅ **Inmutabilidad:** Los hashes en blockchain no pueden ser alterados
- ✅ **Trazabilidad:** Cada transacción tiene un `txHash` único y verificable
- ✅ **Integridad:** Cualquier alteración del PDF o evidencia se detecta inmediatamente
- ✅ **Temporalidad:** Los timestamps en blockchain prueban cuándo ocurrió cada evento

### 3. **Formato Presentable**
El reporte incluye:
- **Contract ID:** Identificador único del contrato
- **Hashes:** Valores esperados vs actuales para comparación
- **Transacciones Blockchain:** `txHash` verificables en cualquier explorador de blockchain
- **Timestamps:** Fechas de creación y firma
- **Estado:** Resumen claro de integridad

---

## Ejemplo de Uso como Prueba

### Escenario: Demostrar que un contrato no fue alterado

1. **Obtener reporte de integridad:**
   ```bash
   GET /contracts/0x.../verify
   ```

2. **Verificar estado:**
   - Si `status: "ok"` → Todo está intacto
   - Si `status: "attention-needed"` → Revisar `issues` para detalles

3. **Presentar como evidencia:**
   - **PDF Hash:** Demuestra que el PDF actual es idéntico al original
   - **Blockchain Hash:** Demuestra que el registro on-chain coincide
   - **Transaction Hashes:** Links verificables a la blockchain pública
   - **Timestamps:** Prueba de cuándo ocurrió cada evento

### Escenario: Detectar Alteración

Si el reporte muestra `mismatch`:
- **PDF Hash mismatch:** El PDF fue modificado después de subirse
- **Blockchain mismatch:** El hash on-chain no coincide (posible error o manipulación)
- **Evidence Hash mismatch:** La evidencia de firma fue alterada

---

## Limitaciones

1. **Blockchain Stub:** Si `txHash = "0xstub"`, no hay registro real en blockchain (modo desarrollo)
2. **Evidencia Faltante:** Si no se guardó la evidencia completa, no se puede verificar
3. **PDF Faltante:** Si el PDF fue eliminado de R2/S3, no se puede verificar integridad

---

## Mejores Prácticas

1. **Siempre guardar evidencia completa** al firmar contratos
2. **Habilitar blockchain** en producción para registro inmutable
3. **Ejecutar auditorías periódicas** para detectar alteraciones temprano
4. **Exportar reportes** y guardarlos como evidencia adicional
5. **Documentar txHash** en sistemas externos para trazabilidad


