#!/bin/bash

# Script para probar rechazo de usuario no autorizado
set -e

TOKEN="${1:-eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MTg5MTkxMTA3NjA1NDM0NGUxNWUyNTY0MjViYjQyNWVlYjNhNWMiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjoiQURNSU4iLCJ0ZW5hbnRJZCI6ImNvcmUiLCJ0ZW5hbnRzIjpbImNvcmUiLCJtdXR1YWwtc2FubWFydGluIl0sImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zbWFydC1jb250cmFjdHMtYjAyZTUiLCJhdWQiOiJzbWFydC1jb250cmFjdHMtYjAyZTUiLCJhdXRoX3RpbWUiOjE3NjUwNjEwNzIsInVzZXJfaWQiOiJTb0pjelBLTjREWWZDaHpXaHZiaWVnU2kwNDIyIiwic3ViIjoiU29KY3pQS040RFlmQ2h6V2h2YmllZ1NpMDQyMiIsImlhdCI6MTc2NTA2MTA3MiwiZXhwIjoxNzY1MDY0NjcyLCJlbWFpbCI6InRlc3RAY29udHJhY3RzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ0ZXN0QGNvbnRyYWN0cy5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.eF2NeMwEkZ5KnrR2jkzPOavHpFLVa9DwgT570asixeidoFm2jr0ZWPXJBc8EzE1hEjluZvqs9aVLfdrwMkRKnSBZETpkDGTU8VK6t2SwX3kHqD1ar3chC_x9Ow-wRaN2yGGcCLrOtARfXNpCtkP8Q8dm7PZICKco_yRrLS2lRnzjaY2qx-OLdDWShNmOUhlNcPrWeDm9DpnZijm2-GI6Lac8fB1_8Cuh1kxmSCVNQwmaXXpImuBSCdlJoOqUO0KkiLkKCPhpbVXelxJ9z8VSIF0EVbdFNNYkGKZdhWz0Z68oDTfB_BklT62RnKUkG2RJVPXT0IQ-G0gsRJW71BKFfA}"
BASE_URL="${2:-http://localhost:3000}"
TENANT_ID="${3:-core}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Prueba de Rechazo de Usuario No Autorizado${NC}"
echo "=========================================="
echo ""

# Función helper
hash_json() {
  echo -n "$1" | openssl dgst -sha256 -binary | xxd -p -c 256 | awk '{print "0x"$1}'
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
%%EOF" > /tmp/test-contract-unauth.pdf

# 2️⃣ Calcular hash del PDF
HASH_PDF=$(openssl dgst -sha256 -binary /tmp/test-contract-unauth.pdf | xxd -p -c 256 | awk '{print "0x"$1}')
echo -e "${GREEN}✅ Hash PDF: $HASH_PDF${NC}"

# 3️⃣ Crear contrato con requiredSigners (SOLO buyer@example.com, NO test@contracts.com)
echo -e "${YELLOW}2️⃣ Creando contrato con firmantes requeridos (SOLO buyer@example.com)...${NC}"
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"templateId\": 5,
    \"version\": 1,
    \"hashPdfHex\": \"$HASH_PDF\",
    \"requiredSignatures\": 1,
    \"requiredSigners\": [
      {\"email\":\"buyer@example.com\",\"fullName\":\"Buyer User\",\"documentNumber\":\"87654321\",\"role\":\"BUYER\"}
    ]
  }" \
  "$BASE_URL/contracts")

CONTRACT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"contractId":"[^"]*"' | cut -d'"' -f4)
if [ -z "$CONTRACT_ID" ]; then
  echo -e "${RED}❌ Error al crear contrato${NC}"
  echo "$CREATE_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Contrato creado: $CONTRACT_ID${NC}"
echo "$CREATE_RESPONSE"

# 4️⃣ Intentar firmar con test@contracts.com (NO está en requiredSigners - debe fallar)
echo -e "${YELLOW}3️⃣ Intentando firmar con test@contracts.com (NO autorizado - debe fallar con 403)...${NC}"
EVIDENCE='{"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'", "ip": "192.168.1.100", "biometric": "face_id_verified", "documentNumber": "12345678"}'
HASH_EVIDENCE=$(hash_json "$EVIDENCE")

SIGN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"signerAddress\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC\",
    \"hashEvidenceHex\": \"$HASH_EVIDENCE\",
    \"signerName\": \"Test User\",
    \"signerEmail\": \"test@contracts.com\",
    \"evidence\": $EVIDENCE
  }" \
  "$BASE_URL/contracts/$CONTRACT_ID/sign")

HTTP_CODE=$(echo "$SIGN_RESPONSE" | tail -1)
BODY=$(echo "$SIGN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "403" ]; then
  echo -e "${GREEN}✅ Correctamente rechazado (HTTP 403)${NC}"
  echo "$BODY"
else
  echo -e "${RED}❌ ERROR: Debería haber sido rechazado con 403, pero obtuvo HTTP $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

# 5️⃣ Verificar que el contrato sigue sin firmas
echo -e "${YELLOW}4️⃣ Verificando que el contrato sigue sin firmas...${NC}"
CONTRACT_DETAILS=$(curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-Id: $TENANT_ID" "$BASE_URL/contracts/$CONTRACT_ID")
SIGNATURE_COUNT=$(echo "$CONTRACT_DETAILS" | grep -o '"signatures":\[[^]]*\]' | grep -o 'signerAddress' | wc -l | tr -d ' ')
if [ "$SIGNATURE_COUNT" = "0" ]; then
  echo -e "${GREEN}✅ Correcto: El contrato no tiene firmas${NC}"
else
  echo -e "${RED}❌ ERROR: El contrato tiene $SIGNATURE_COUNT firma(s) cuando debería tener 0${NC}"
fi

echo ""
echo -e "${GREEN}✅ Prueba completada exitosamente${NC}"


