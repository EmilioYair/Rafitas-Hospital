# Resumen de Cambios - Sistema de Autenticación y Autorización

## Archivos Modificados

### 1. **models/usuario.js**
Se agregó un campo `rol` al modelo de Usuario:
```javascript
rol: {
    type: String,
    enum: ['usuario', 'admin'],
    default: 'usuario'
}
```

### 2. **bd/usuariosBD.js**
Modificada la función `loginUsuario` para retornar también el `rol`:
```javascript
return {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol  // ← Agregado
};
```

### 3. **index.js**
Agregado `express-session`:
- Importado: `const session = require('express-session')`
- Configurado con:
  - Secret desde `.env`
  - Cookie name: `sessionId`
  - Opciones: `resave: true`, `saveUninitialized: true`

### 4. **middlewares/autenticacion.js** (NUEVO ARCHIVO)
Creados 3 middlewares de protección:
```javascript
- verificarSesion      // Verifica si está loggeado
- verificarAdmin       // Verifica si es admin
- verificarUsuarioOAdmin // Verifica usuario o admin
```

### 5. **routes/rutas.js**
Principales cambios:

**Importación:**
```javascript
const { verificarSesion, verificarAdmin, verificarUsuarioOAdmin } 
    = require('../middlewares/autenticacion');
```

**Rutas protegidas con middlewares:**

| Ruta | Antes | Después |
|------|-------|---------|
| GET `/dashboard` | `async (req, res)` | `verificarSesion, async (req, res)` |
| GET `/admin` | `async (req, res)` | `verificarAdmin, async (req, res)` |
| GET `/dates` | `async (req, res)` | `verificarSesion, async (req, res)` |
| GET `/manage-doctors` | `async (req, res)` | `verificarAdmin, async (req, res)` |
| POST `/login` | Guarda en cookies | Guarda en `req.session.usuario` |
| POST `/citas` | Verifica `req.cookies.usuario_id` | `verificarSesion` + usa `req.session.usuario.id` |
| POST `/perfil` | Verifica `req.cookies.usuario_id` | `verificarSesion` + usa `req.session.usuario.id` |
| POST `/doctores` | Sin protección | `verificarAdmin` |
| POST `/doctores/actualizar/:id` | Sin protección | `verificarAdmin` |
| DELETE `/citas/:id` | Verifica `req.cookies.usuario_id` | `verificarSesion` + usa `req.session.usuario.id` |
| DELETE `/doctores/:id` | Sin protección | `verificarAdmin` |
| DELETE `/admin/citas/:id` | Sin protección | `verificarAdmin` |
| GET `/logout` | Limpia cookies | Destruye sesión + limpia cookies |

## Funcionalidades Implementadas

✅ **Requisito a)** - No cualquier usuario puede entrar a rutas de usuarios ni admin
- Middleware `verificarSesion` redirige al home si no hay sesión

✅ **Requisito b)** - Usuario normal accede a sus rutas pero no a admin
- `/dashboard`, `/dates`, `/perfil` - Protegidas con `verificarSesion`
- `/admin`, `/manage-doctors` - Protegidas con `verificarAdmin` (redirige si intenta)

✅ **Requisito c)** - Admin accede a cualquier ruta
- Middleware `verificarAdmin` permite todo al rol `'admin'`

✅ **Requisito d)** - Al cerrar sesión no puede acceder a rutas excepto home
- `req.session.destroy()` elimina completamente la sesión
- Las rutas protegidas redirigen a `/` si no hay sesión

## Variables de Entorno

Ya está configurado en `.env`:
```env
SECRET_SESSION = "CookieRafita"
```

## Pasos Siguientes (Opcional)

1. **Para crear un admin desde la BD**: 
   - Ejecutar: `db.collection('usuarios').updateOne({email: 'admin@example.com'}, {$set: {rol: 'admin'}})`

2. **Para migrar usuarios existentes**:
   - Ejecutar: `db.collection('usuarios').updateMany({}, {$set: {rol: 'usuario'}})`

3. **Pruebas recomendadas**:
   - Usuario normal intenta acceder a `/admin` → Redirige a home
   - Usuario normal intenta POST a `/doctores` → Error 401
   - Admin puede acceder a todo
   - Logout destruye sesión completamente
