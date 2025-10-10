# 🔐 Configuración de GitHub para este Proyecto

## ✅ Ya configurado:

1. Usuario y email local del proyecto:
   - Nombre: Gaston Goren
   - Email: gastongoren@gmail.com

2. Remote configurado con HTTPS:
   - origin: https://github.com/gastongoren/smart-contracts.git

## 📋 Próximos pasos:

### 1. Hacer commit de todos los cambios
```bash
git add .
git commit -m "feat: add database persistence and deployment configuration"
```

### 2. Hacer push (te pedirá credenciales)
```bash
git push -u origin main
```

Cuando te pida credenciales:
- **Username:** gastongoren
- **Password:** [PEGA TU TOKEN AQUÍ - NO tu password de GitHub]

El token se verá algo así:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Guardar credenciales (opcional)

Para que no te pida el token cada vez:
```bash
git config --local credential.helper osxkeychain
```

La próxima vez que hagas push, las credenciales se guardarán automáticamente.

## 🔄 Cambiar entre cuentas en el futuro

Para proyectos del trabajo:
```bash
cd /path/to/work/project
git config --local user.email "gaston.goren@osanasalud.com"
git remote set-url origin git@github.com:gaston-goren-osanasalud/project.git
```

Para proyectos personales:
```bash
cd /path/to/personal/project
git config --local user.email "gastongoren@gmail.com"  
git remote set-url origin https://github.com/gastongoren/project.git
```

## 📚 Referencias

- Crear tokens: https://github.com/settings/tokens
- Docs de Git credentials: https://git-scm.com/docs/gitcredentials
