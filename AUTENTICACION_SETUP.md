## Implementación de Sistema de Autenticación y Autorización

### Cambios Realizados

#### 1. **Modelo Usuario** (`models/usuario.js`)
- ✅ Agregado campo `rol` con valores: `'usuario'` (default) o `'admin'`

#### 2. **Configuración de Sesiones** (`index.js`)
- ✅ Agregado `express-session` con configuración:
  - Secret: `process.env.SECRET_SESSION`
  - Cookie name: `sessionId`
  - Redirige al home si no hay sesión activa

#### 3. **Middlewares de Autenticación** (`middlewares/autenticacion.js`) - NUEVO
Tres middlewares creados:
- **`verificarSesion`**: Verifica que el usuario esté autenticado. Si no, redirige a `/`
- **`verificarAdmin`**: Verifica que sea administrador. Si no, redirige a `/`
- **`verificarUsuarioOAdmin`**: Verifica usuario o admin

#### 4. **Rutas Protegidas** (`routes/rutas.js`)

**GET (Páginas):**
- `/` - Pública (redirige a dashboard si está loggeado)
- `/dashboard` - ✅ Protegida con `verificarSesion`
- `/admin` - ✅ Protegida con `verificarAdmin` (solo admin)
- `/dates` - ✅ Protegida con `verificarSesion` (usuarios autenticados)
- `/manage-doctors` - ✅ Protegida con `verificarAdmin` (solo admin)
- `/find-doctors` - Pública

**POST (Formularios):**
- `/registro` - Pública
- `/login` - ✅ Ahora guarda `req.session.usuario` con id, nombre y rol
- `/citas` - ✅ Protegida con `verificarSesion`
- `/perfil` - ✅ Protegida con `verificarSesion`
- `/doctores` - ✅ Protegida con `verificarAdmin` (solo admin)
- `/doctores/actualizar/:id` - ✅ Protegida con `verificarAdmin` (solo admin)

**DELETE:**
- `/citas/:id` - ✅ Protegida con `verificarSesion`
- `/doctores/:id` - ✅ Protegida con `verificarAdmin` (solo admin)
- `/admin/citas/:id` - ✅ Protegida con `verificarAdmin` (solo admin)

**LOGOUT:**
- `/logout` - ✅ Ahora destruye la sesión completamente

### Flujo de Autenticación

1. **Registro**: Usuario se registra (rol por defecto: 'usuario')
2. **Login**: 
   - Se validan credenciales
   - Se crea `req.session.usuario` con id, nombre y rol
   - Se guardan cookies también (retrocompatibilidad)
3. **Acceso a rutas**:
   - ✅ Usuario no autenticado: no puede acceder a dashboard, dates, ni rutas de admin
   - ✅ Usuario normal: puede acceder a dashboard, dates, perfil, ver doctores
   - ✅ Admin: puede acceder a TODO (dashboard, admin, manage-doctors, etc)
4. **Logout**:
   - Se destruye `req.session`
   - Se borran cookies
   - Se redirige a home
   - Ya no puede entrar a rutas protegidas

### Consideraciones Importantes

- El middleware `verificarSesion` usa `req.session.usuario.id` en lugar de `req.cookies.usuario_id`
- El logout ahora cierra completamente la sesión
- Las rutas que necesitaban la ID del usuario ahora la obtienen de `req.session.usuario.id`
- Compatibilidad: Se mantienen las cookies por si otros componentes las usan

### Variable de Entorno Necesaria

```env
SECRET_SESSION = "CookieRafita"  # Ya configurado en .env
```

### Pruebas Recomendadas

1. Registrar nuevo usuario (verificar que rol es 'usuario')
2. Login como usuario normal:
   - Acceder a `/dashboard` ✅
   - Acceder a `/dates` ✅
   - Intentar acceder a `/admin` ❌ (redirige a home)
   - Intentar acceder a `/manage-doctors` ❌ (redirige a home)
3. Logout:
   - Sesión destruida
   - No puede acceder a `/dashboard` sin volver a loguear
