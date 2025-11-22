// middlewares/autenticacion.js

/**
 * Helper: Reconstruye la sesión desde las cookies si no existe en memoria.
 * Esto es necesario para entornos serverless (Vercel) donde la memoria no persiste.
 */
const reconstruirSesionDeCookies = (req) => {
    if (!req.session.usuario && req.cookies.usuario_id) {
        req.session.usuario = {
            id: req.cookies.usuario_id,
            nombre: req.cookies.usuario_nombre,
            rol: req.cookies.usuario_rol
        };
    }
};

/**
 * Middleware: Verifica si el usuario está autenticado
 * Si no lo está, redirige a home
 */
const verificarSesion = (req, res, next) => {
    reconstruirSesionDeCookies(req);

    if (req.session.usuario) {
        return next();
    }
    res.redirect('/');
};

/**
 * Middleware: Verifica si el usuario es administrador
 * Si no lo es, redirige a home
 */
const verificarAdmin = (req, res, next) => {
    reconstruirSesionDeCookies(req);

    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        return next();
    }
    res.redirect('/');
};

/**
 * Middleware: Verifica si es usuario normal o admin
 * Bloquea solo a usuarios no autenticados
 */
const verificarUsuarioOAdmin = (req, res, next) => {
    reconstruirSesionDeCookies(req);

    if (req.session.usuario && (req.session.usuario.rol === 'usuario' || req.session.usuario.rol === 'admin')) {
        return next();
    }
    res.redirect('/');
};

module.exports = {
    verificarSesion,
    verificarAdmin,
    verificarUsuarioOAdmin
};
