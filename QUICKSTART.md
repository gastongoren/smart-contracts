# 🚀 Quick Start Guide

## Desarrollo Local (5 minutos)

### 1️⃣ Clonar el repositorio
```bash
git clone <your-repo-url>
cd smart-contracts
```

### 2️⃣ Instalar dependencias
```bash
npm install
```

### 3️⃣ Configurar variables de entorno
```bash
cp .env.development.example .env
```

Editar `.env` y actualizar `DATABASE_URL` si es necesario.

### 4️⃣ Iniciar PostgreSQL con Docker
```bash
docker-compose up -d
```

Esto inicia PostgreSQL en `localhost:5432` con:
- Usuario: `smart`
- Password: `smart123`
- Database: `smart_contracts_dev`

### 5️⃣ Correr migraciones
```bash
npx prisma migrate dev --name init
```

### 6️⃣ Iniciar el servidor
```bash
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000` 🎉

---

## Verificar que funciona

```bash
# Health check
curl http://localhost:3000/health

# Debería devolver: {"status":"ok","timestamp":"..."}
```

---

## Comandos útiles

```bash
# Ver base de datos en el navegador
npm run prisma:studio

# Crear nuevo tenant en runtime (ver código)
# Editar src/app.module.ts y agregar en tenants[]

# Detener PostgreSQL
docker-compose down

# Detener y borrar datos
docker-compose down -v
```

---

## Próximo paso: Deployment

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones de deployment a Railway.

---

## Troubleshooting

### Error: "Port 5432 already in use"
Tienes PostgreSQL corriendo localmente. Opciones:
1. Detener PostgreSQL local: `brew services stop postgresql`
2. Cambiar el puerto en docker-compose.yml: `"5433:5432"`

### Error: "Can't reach database server"
1. Verificar que Docker está corriendo
2. Verificar que PostgreSQL está arriba: `docker-compose ps`
3. Ver logs: `docker-compose logs postgres`

### Error de migraciones
```bash
# Reset base de datos
npx prisma migrate reset
npx prisma migrate dev --name init
```

