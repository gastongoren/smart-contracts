#!/bin/bash

# Script completo de pruebas para todos los endpoints de contratos
# Requiere: curl, un token válido de Firebase Admin

set -e

TOKEN="${1:-eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MTg5MTkxMTA3NjA1NDM0NGUxNWUyNTY0MjViYjQyNWVlYjNhNWMiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjoiQURNSU4iLCJ0ZW5hbnRJZCI6ImNvcmUiLCJ0ZW5hbnRzIjpbImNvcmUiLCJtdXR1YWwtc2FubWFydGluIl0sImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zbWFydC1jb250cmFjdHMtYjAyZTUiLCJhdWQiOiJzbWFydC1jb250cmFjdHMtYjAyZTUiLCJhdXRoX3RpbWUiOjE3NjUwNjEwNzIsInVzZXJfaWQiOiJTb0pjelBLTjREWWZDaHpXaHZiaWVnU2kwNDIyIiwic3ViIjoiU29KY3pQS040RFlmQ2h6V2h2YmllZ1NpMDQyMiIsImlhdCI6MTc2NTA2MTA3MiwiZXhwIjoxNzY1MDY0NjcyLCJlbWFpbCI6InRlc3RAY29udHJhY3RzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ0ZXN0QGNvbnRyYWN0cy5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.eF2NeMwEkZ5KnrR2jkzPOavHpFLVa9DwgT570asixeidoFm2jr0ZWPXJBc8EzE1hEjluZvqs9aVLfdrwMkRKnSBZETpkDGTU8VK6t2SwX3kHqD1ar3chC_x9Ow-wRaN2yGGcCLrOtARfXNpCtkP8Q8dm7PZICKco_yRrLS2lRnzjaY2qx-OLdDWShNmOUhlNcPrWeDm9DpnZijm2-GI6Lac8fB1_8Cuh1kxmSCVNQwmaXXpImuBSCdlJoOqUO0KkiLkKCPhpbVXelxJ9z8VSIF0EVbdFNNYkGKZdhWz0Z68oDTfB_BklT62RnKUkG2RJVPXT0IQ-G0gsRJW71BKFfA}"
BASE_URL="${2:-http://localhost:3000}"
TENANT_ID="${3:-core}"

echo "🚀 Iniciando pruebas completas de endpoints de contratos"
echo "=================================================="
echo "Base URL: $BASE_URL"
echo "Tenant ID: $TENANT_ID"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para hacer requests y mostrar resultados
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local file="$5"
    
    echo -e "${YELLOW}📋 Test: $name${NC}"
    echo "  $method $url"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" -H "X-Tenant-Id: $TENANT_ID" "$url")
    elif [ "$method" = "POST" ] && [ -n "$file" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: Bearer $TOKEN" \
            -H "X-Tenant-Id: $TENANT_ID" \
            -F "file=@$file" \
            -F "templateId=1" \
            -F "version=1" \
            -F "requiredSignatures=2" \
            "$url")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: Bearer $TOKEN" \
            -H "X-Tenant-Id: $TENANT_ID" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✅ Success (HTTP $http_code)${NC}"
        echo "$body" | head -c 200
        echo ""
        echo "$body"
        return 0
    else
        echo -e "  ${RED}❌ Failed (HTTP $http_code)${NC}"
        echo "$body"
        return 1
    fi
    echo ""
}

# Crear PDF de prueba
echo -e "${YELLOW}📄 Creando PDF de prueba...${NC}"
TEST_PDF="/tmp/test-contract-$(date +%s).pdf"
cat > "$TEST_PDF" << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Contract Document) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000306 00000 n 
0000000400 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
492
%%EOF
EOF

echo -e "${GREEN}✅ PDF creado: $TEST_PDF${NC}"
echo ""

# 1. Subir contrato (POST /contracts/upload)
echo "=================================================="
echo "1️⃣  TEST: Subir contrato (POST /contracts/upload)"
echo "=================================================="
UPLOAD_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -F "file=@$TEST_PDF" \
    -F "templateId=1" \
    -F "version=1" \
    -F "requiredSignatures=2" \
    "$BASE_URL/contracts/upload")

echo "$UPLOAD_RESPONSE"
CONTRACT_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"contractId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CONTRACT_ID" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener contractId de la respuesta${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contrato creado: $CONTRACT_ID${NC}"
echo ""

# 2. Obtener contrato (GET /contracts/:id)
echo "=================================================="
echo "2️⃣  TEST: Obtener contrato (GET /contracts/:id)"
echo "=================================================="
test_endpoint "Obtener detalles del contrato" "GET" "$BASE_URL/contracts/$CONTRACT_ID"
echo ""

# Función para calcular hash SHA-256 de evidencia
calculate_evidence_hash() {
    local evidence_json="$1"
    # Usar node si está disponible, sino openssl
    if command -v node &> /dev/null; then
        node -e "const crypto=require('crypto');const e=$evidence_json;const h=crypto.createHash('sha256').update(JSON.stringify(e)).digest('hex');console.log('0x'+h);"
    else
        echo "$evidence_json" | openssl dgst -sha256 -binary | xxd -p -c 256 | awk '{print "0x"$1}'
    fi
}

# 3. Firmar contrato (POST /contracts/:id/sign) - Primera firma
echo "=================================================="
echo "3️⃣  TEST: Firmar contrato - Firma 1 (POST /contracts/:id/sign)"
echo "=================================================="
EVIDENCE1='{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","ip":"192.168.1.100","biometric":"face_id_verified"}'
HASH1=$(calculate_evidence_hash "$EVIDENCE1")
SIGN1_DATA=$(cat <<EOF
{
  "signerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC",
  "hashEvidenceHex": "$HASH1",
  "signerName": "Juan Pérez",
  "signerEmail": "juan@example.com",
  "evidence": $EVIDENCE1
}
EOF
)
test_endpoint "Firmar contrato (firma 1)" "POST" "$BASE_URL/contracts/$CONTRACT_ID/sign" "$SIGN1_DATA"
echo ""

# 4. Firmar contrato - Segunda firma
echo "=================================================="
echo "4️⃣  TEST: Firmar contrato - Firma 2 (POST /contracts/:id/sign)"
echo "=================================================="
EVIDENCE2='{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","ip":"192.168.1.101","biometric":"fingerprint_verified"}'
HASH2=$(calculate_evidence_hash "$EVIDENCE2")
SIGN2_DATA=$(cat <<EOF
{
  "signerAddress": "0x9876543210abcdef9876543210abcdef98765432",
  "hashEvidenceHex": "$HASH2",
  "signerName": "María García",
  "signerEmail": "maria@example.com",
  "evidence": $EVIDENCE2
}
EOF
)
test_endpoint "Firmar contrato (firma 2)" "POST" "$BASE_URL/contracts/$CONTRACT_ID/sign" "$SIGN2_DATA"
echo ""

# 5. Verificar integridad (GET /contracts/:id/verify)
echo "=================================================="
echo "5️⃣  TEST: Verificar integridad (GET /contracts/:id/verify)"
echo "=================================================="
test_endpoint "Verificar integridad del contrato" "GET" "$BASE_URL/contracts/$CONTRACT_ID/verify"
echo ""

# 6. Listar contratos (GET /contracts)
echo "=================================================="
echo "6️⃣  TEST: Listar contratos (GET /contracts)"
echo "=================================================="
test_endpoint "Listar todos los contratos" "GET" "$BASE_URL/contracts"
echo ""

# 7. Listar contratos con filtro (GET /contracts?status=fully_signed)
echo "=================================================="
echo "7️⃣  TEST: Listar contratos filtrados (GET /contracts?status=fully_signed)"
echo "=================================================="
test_endpoint "Listar contratos filtrados" "GET" "$BASE_URL/contracts?status=fully_signed"
echo ""

# 8. Generar URL de descarga (GET /contracts/:id/download)
echo "=================================================="
echo "8️⃣  TEST: Generar URL de descarga (GET /contracts/:id/download)"
echo "=================================================="
DOWNLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" -I \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-Id: $TENANT_ID" \
    "$BASE_URL/contracts/$CONTRACT_ID/download?expiresIn=3600")
HTTP_CODE=$(echo "$DOWNLOAD_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 302 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Success (HTTP $HTTP_CODE) - Redirect a URL de descarga${NC}"
    echo "$DOWNLOAD_RESPONSE" | head -n 10
else
    echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$DOWNLOAD_RESPONSE"
fi
echo ""

# 9. Generar URL pública (POST /contracts/:id/public-url)
echo "=================================================="
echo "9️⃣  TEST: Generar URL pública (POST /contracts/:id/public-url)"
echo "=================================================="
PUBLIC_URL_DATA='{"expiresIn":3600}'
test_endpoint "Generar URL pública" "POST" "$BASE_URL/contracts/$CONTRACT_ID/public-url" "$PUBLIC_URL_DATA"
echo ""

# Limpiar
rm -f "$TEST_PDF"

echo "=================================================="
echo -e "${GREEN}✅ Todas las pruebas completadas${NC}"
echo "=================================================="
echo "Contract ID usado: $CONTRACT_ID"
echo "Puedes verificar el contrato en: $BASE_URL/contracts/$CONTRACT_ID"

