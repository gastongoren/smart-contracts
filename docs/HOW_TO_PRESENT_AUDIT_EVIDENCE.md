# 📋 Cómo Presentar el Reporte de Integridad como Evidencia Legal

## Formato del Reporte

El endpoint `GET /contracts/:id/verify` ahora devuelve un reporte completo con información legal:

```json
{
  "contractId": "0x...",
  "tenantId": "core",
  "status": "ok",
  "auditTimestamp": "2025-12-06T22:52:30.000Z",
  "contractMetadata": {
    "createdAt": "2025-12-06T22:51:43.171Z",
    "createdBy": "SoJczPKN4DYfChzWhvbiegSi0422",
    "status": "fully_signed",
    "requiredSignatures": 2,
    "currentSignatures": 2
  },
  "summary": {
    "ok": 4,
    "mismatch": 0,
    "error": 0,
    "skipped": 2,
    "totalChecks": 6
  },
  "issues": [],
  "contract": {
    "pdfHash": {
      "status": "ok",
      "expected": "0xbf0d7ed643d71ac821af18732c66c639d1261fc953249f1cd404fd2595deb667",
      "actual": "0xbf0d7ed643d71ac821af18732c66c639d1261fc953249f1cd404fd2595deb667"
    },
    "blockchain": {
      "status": "ok",
      "expected": "0xbf0d7ed643d71ac821af18732c66c639d1261fc953249f1cd404fd2595deb667",
      "actual": "0xbf0d7ed643d71ac821af18732c66c639d1261fc953249f1cd404fd2595deb667",
      "txHash": "0xabc123...",
      "blockchainExplorerUrl": "https://polygonscan.com/tx/0xabc123..."
    }
  },
  "signatures": [...],
  "legalEvidence": {
    "pdfIntegrity": true,
    "blockchainRegistered": true,
    "allSignaturesVerified": true,
    "chainOfCustody": {
      "pdfUploaded": "2025-12-06T22:51:43.171Z",
      "blockchainRegistered": "2025-12-06T22:51:43.171Z",
      "signatures": [
        {
          "signerAddress": "0x742d35...",
          "signedAt": "2025-12-06T22:51:45.269Z",
          "blockchainRegistered": "2025-12-06T22:51:45.269Z"
        }
      ]
    }
  }
}
```

## Cómo Presentarlo como Prueba

### 1. **Evidencia de Integridad del Documento**

**Campo:** `contract.pdfHash.status === "ok"`

**Qué demuestra:**
- El PDF actual es idéntico al que se subió originalmente
- No ha sido alterado, modificado o corrompido
- El hash SHA-256 coincide exactamente

**Cómo presentarlo:**
```
"El documento PDF del contrato fue verificado el [auditTimestamp]. 
El hash SHA-256 recalculado (0x...) coincide exactamente con el hash 
guardado en la base de datos (0x...), demostrando que el documento 
no ha sido alterado desde su creación."
```

### 2. **Evidencia de Registro en Blockchain**

**Campo:** `contract.blockchain.status === "ok"` + `blockchainExplorerUrl`

**Qué demuestra:**
- El contrato fue registrado en la blockchain (inmutable)
- El hash del PDF en blockchain coincide con el de la base de datos
- Cualquiera puede verificar la transacción públicamente

**Cómo presentarlo:**
```
"El contrato fue registrado en la blockchain [Polygon/Ethereum] 
el [fecha]. La transacción puede ser verificada públicamente en:
[blockchainExplorerUrl]

El hash del PDF registrado on-chain (0x...) coincide con el hash 
en nuestra base de datos, demostrando que el registro es auténtico 
y no ha sido manipulado."
```

### 3. **Evidencia de Cadena de Custodia**

**Campo:** `legalEvidence.chainOfCustody`

**Qué demuestra:**
- Timeline completo de eventos (subida, registro, firmas)
- Timestamps verificables de cada acción
- Trazabilidad completa del documento

**Cómo presentarlo:**
```
"CADENA DE CUSTODIA DIGITAL:

1. PDF subido: [pdfUploaded]
2. Registrado en blockchain: [blockchainRegistered]
3. Firmas:
   - Firma 1 por [signerAddress] el [signedAt]
   - Firma 2 por [signerAddress] el [signedAt]

Todos los eventos están registrados con timestamps verificables 
y hashes criptográficos que garantizan la integridad."
```

### 4. **Evidencia de Firmas Verificadas**

**Campo:** `legalEvidence.allSignaturesVerified === true`

**Qué demuestra:**
- Cada firma tiene evidencia completa y verificable
- Los hashes de evidencia coinciden
- Las firmas están registradas en blockchain

**Cómo presentarlo:**
```
"Todas las firmas del contrato han sido verificadas:

- Evidencia de firma: Hash SHA-256 verificado
- Registro blockchain: Transacción verificable en [explorer URL]
- Integridad: La evidencia no ha sido alterada

Cada firma incluye timestamp, dirección del firmante, y hash 
de evidencia registrado en blockchain."
```

## Ejemplo de Declaración Legal

```
DECLARACIÓN DE INTEGRIDAD DEL CONTRATO

Contrato ID: 0x7ca32d47437827ccb15727c70322a02c08e9a88e5d0851c1b1a5d3f465597f7b
Fecha de Auditoría: 2025-12-06T22:52:30.000Z

1. INTEGRIDAD DEL DOCUMENTO
   ✅ El PDF del contrato fue verificado y su hash SHA-256 
      (0xbf0d7ed643d71ac821af18732c66c639d1261fc953249f1cd404fd2595deb667) 
      coincide exactamente con el hash original, demostrando que el 
      documento no ha sido alterado.

2. REGISTRO EN BLOCKCHAIN
   ✅ El contrato fue registrado en la blockchain Polygon el 
      2025-12-06T22:51:43.171Z. La transacción puede ser verificada 
      públicamente en: https://polygonscan.com/tx/0xabc123...
   
   ✅ El hash del PDF registrado on-chain coincide con el hash 
      en nuestra base de datos.

3. FIRMAS VERIFICADAS
   ✅ Todas las firmas (2/2) han sido verificadas:
      - Firma 1: 0x742d35... el 2025-12-06T22:51:45.269Z
      - Firma 2: 0x987654... el 2025-12-06T22:51:46.204Z
   
   ✅ Cada firma tiene evidencia completa y hash verificado.
   ✅ Cada firma está registrada en blockchain.

4. CONCLUSIÓN
   El contrato cumple con todos los requisitos de integridad:
   - Documento intacto ✅
   - Registrado en blockchain ✅
   - Firmas verificadas ✅
   - Cadena de custodia completa ✅

Este reporte puede ser reproducido en cualquier momento ejecutando:
GET /contracts/0x.../verify
```

## Validez Legal

### Fortalezas del Sistema:

1. **Inmutabilidad Blockchain:** Los registros on-chain no pueden ser alterados
2. **Verificación Pública:** Cualquiera puede verificar las transacciones en exploradores públicos
3. **Hashes Criptográficos:** SHA-256 es un estándar reconocido internacionalmente
4. **Timestamps:** Fechas verificables en múltiples sistemas (DB, blockchain)
5. **Trazabilidad Completa:** Cada acción está registrada con evidencia

### Limitaciones:

1. **Blockchain Stub:** Si `txHash = "0xstub"`, no hay registro real (solo desarrollo)
2. **Dependencia de Servicios:** Requiere acceso a R2/S3 y blockchain para verificar
3. **Evidencia Faltante:** Si no se guardó evidencia completa, no se puede verificar

## Mejores Prácticas

1. **Ejecutar auditorías periódicas** y guardar los reportes
2. **Exportar reportes en formato PDF** para archivo permanente
3. **Documentar txHash** en sistemas externos para backup
4. **Mantener logs de auditoría** con timestamps
5. **Presentar reportes completos** incluyendo todos los campos de `legalEvidence`


