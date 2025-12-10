#!/bin/bash

# Script de prueba para validación de firmantes autorizados
set -e

TOKEN="${1:-eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MTg5MTkxMTA3NjA1NDM0NGUxNWUyNTY0MjViYjQyNWVlYjNhNWMiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjoiQURNSU4iLCJ0ZW5hbnRJZCI6ImNvcmUiLCJ0ZW5hbnRzIjpbImNvcmUiLCJtdXR1YWwtc2FubWFydGluIl0sImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zbWFydC1jb250cmFjdHMtYjAyZTUiLCJhdWQiOiJzbWFydC1jb250cmFjdHMtYjAyZTUiLCJhdXRoX3RpbWUiOjE3NjUwNjEwNzIsInVzZXJfaWQiOiJTb0pjelBLTjREWWZDaHpXaHZiaWVnU2kwNDIyIiwic3ViIjoiU29KY3pQS040RFlmQ2h6V2h2YmllZ1NpMDQyMiIsImlhdCI6MTc2NTA2MTA3MiwiZXhwIjoxNzY1MDY0NjcyLCJlbWFpbCI6InRlc3RAY29udHJhY3RzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ0ZXN0QGNvbnRyYWN0cy5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.eF2NeMwEkZ5KnrR2jkzPOavHpFLVa9DwgT570asixeidoFm2jr0ZWPXJBc8EzE1hEjluZvqs9aVLfdrwMkRKnSBZETpkDGTU8VK6t2SwX3kHqD1ar3chC_x9Ow-wRaN2yGGcCLrOtARfXNpCtkP8Q8dm7PZICKco_yRrLS2lRnzjaY2qx-OLdDWShNmOUhlNcPrWeDm9DpnZijm2-GI6Lac8fB1_8Cuh1kxmSCVNQwmaXXpImuBSCdlJoOqUO0KkiLkKCPhpbVXelxJ9z8VSIF0EVbdFNNYkGKZdhWz0Z68oDTfB_BklT62RnKUkG2RJVPXT0IQ-G0gsRJW71BKFfA}"
BASE_URL="${2:-http://localhost:3000}"
TENANT_ID="${3:-core}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Prueba de Validación de Firmantes Autorizados${NC}"
echo "=========================================="
echo ""

# Función helper para hash JSON (sin jq)
hash_json() {
  # Normalizar JSON manualmente (básico, asume formato simple)
  local json="$1"
  # Remover espacios extra y ordenar keys básicamente
  echo -n "$json" | openssl dgst -sha256 -binary | xxd -p -c 256 | awk '{print "0x"$1}'
}

# 1️⃣ Crear PDF de prueba
echo -e "${YELLOW}1️⃣ Creando PDF de prueba...${NC}"
echo "%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
179
%%EOF" > /tmp/test-contract.pdf

# 2️⃣ Crear contrato CON requiredSigners
echo -e "${YELLOW}2️⃣ Creando contrato con firmantes requeridos...${NC}"
# Crear JSON temporal para requiredSigners (como string)
REQUIRED_SIGNERS_JSON='[{"email":"test@contracts.com","fullName":"Test User","documentNumber":"12345678","role":"SELLER"},{"email":"buyer@example.com","fullName":"Buyer User","documentNumber":"87654321","role":"BUYER"}]'

UPLOAD_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -F "file=@/tmp/test-contract.pdf" \
  -F "templateId=5" \
  -F "version=1" \
  -F "requiredSignatures=2" \
  -F "requiredSigners=$REQUIRED_SIGNERS_JSON" \
  "$BASE_URL/contracts/upload")

# Extraer contractId sin jq
CONTRACT_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"contractId":"[^"]*"' | cut -d'"' -f4)
if [ -z "$CONTRACT_ID" ]; then
  echo -e "${RED}❌ Error al crear contrato${NC}"
  echo "$UPLOAD_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Contrato creado: $CONTRACT_ID${NC}"
echo "$UPLOAD_RESPONSE"

# 3️⃣ Verificar GET /contracts/mine (debe mostrar el contrato)
echo -e "${YELLOW}3️⃣ Probando GET /contracts/mine...${NC}"
MINE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-Id: $TENANT_ID" "$BASE_URL/contracts/mine")
echo "$MINE_RESPONSE"

# 4️⃣ Intentar firmar con usuario autorizado (test@contracts.com)
echo -e "${YELLOW}4️⃣ Intentando firmar con usuario autorizado (test@contracts.com)...${NC}"
EVIDENCE_1='{"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'", "ip": "192.168.1.100", "biometric": "face_id_verified", "documentNumber": "12345678"}'
HASH_EVIDENCE_1=$(hash_json "$EVIDENCE_1")

SIGN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"signerAddress\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC\",
    \"hashEvidenceHex\": \"$HASH_EVIDENCE_1\",
    \"signerName\": \"Test User\",
    \"signerEmail\": \"test@contracts.com\",
    \"evidence\": $EVIDENCE_1
  }" \
  "$BASE_URL/contracts/$CONTRACT_ID/sign")

HTTP_CODE=$(echo "$SIGN_RESPONSE" | tail -n1)
BODY=$(echo "$SIGN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Firma exitosa${NC}"
  echo "$BODY"
else
  echo -e "${RED}❌ Error al firmar (HTTP $HTTP_CODE)${NC}"
  echo "$BODY"
fi

# 5️⃣ Intentar firmar con usuario NO autorizado (debe fallar)
echo -e "${YELLOW}5️⃣ Intentando firmar con usuario NO autorizado (debe fallar)...${NC}"
EVIDENCE_2='{"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'", "ip": "192.168.1.101", "biometric": "touch_id_verified", "documentNumber": "99999999"}'
HASH_EVIDENCE_2=$(hash_json "$EVIDENCE_2")

SIGN_RESPONSE_2=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"signerAddress\": \"0x9876543210abcdef9876543210abcdef98765432\",
    \"hashEvidenceHex\": \"$HASH_EVIDENCE_2\",
    \"signerName\": \"Unauthorized User\",
    \"signerEmail\": \"unauthorized@example.com\",
    \"evidence\": $EVIDENCE_2
  }" \
  "$BASE_URL/contracts/$CONTRACT_ID/sign")

HTTP_CODE_2=$(echo "$SIGN_RESPONSE_2" | tail -n1)
BODY_2=$(echo "$SIGN_RESPONSE_2" | head -n-1)

if [ "$HTTP_CODE_2" = "403" ]; then
  echo -e "${GREEN}✅ Correctamente rechazado (HTTP 403)${NC}"
  echo "$BODY_2"
else
  echo -e "${RED}❌ ERROR: Debería haber sido rechazado con 403, pero obtuvo HTTP $HTTP_CODE_2${NC}"
  echo "$BODY_2"
fi

# 6️⃣ Verificar detalles del contrato
echo -e "${YELLOW}6️⃣ Verificando detalles del contrato...${NC}"
CONTRACT_DETAILS=$(curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-Id: $TENANT_ID" "$BASE_URL/contracts/$CONTRACT_ID")
echo "$CONTRACT_DETAILS"

echo ""
echo -e "${GREEN}✅ Pruebas completadas${NC}"

