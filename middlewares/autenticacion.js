// middlewares/autenticacion.js

/**
 * Middleware: Verifica si el usuario está autenticado
 * Si no lo está, redirige a home
 */
const verificarSesion = (req, res, next) => {
    if (req.session.usuario || req.cookies.usuario_id) {
        return next();
    }
    res.redirect('/');
};

/**
 * Middleware: Verifica si el usuario es administrador
 * Si no lo es, redirige a home
 */
const verificarAdmin = (req, res, next) => {
    if ((req.session.usuario && req.session.usuario.rol === 'admin') || (req.cookies.usuario_rol === 'admin')) {
        return next();
    }
    res.redirect('/');
};

/**
 * Middleware: Verifica si es usuario normal o admin
 * Bloquea solo a usuarios no autenticados
 */
const verificarUsuarioOAdmin = (req, res, next) => {
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
