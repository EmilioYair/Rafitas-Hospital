// index.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const conectarBD = require('./bd/bd');
const app = express();
const port = 3000;

// Conectar a la Base de Datos
conectarBD();

// Configuración del motor de plantillas (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SECRET_SESSION || 'tu_secreto_aqui',
    name: 'sessionId',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        path: "/"
    }
}));

// Middleware para reconstruir sesión en Vercel (Serverless)
app.use((req, res, next) => {
    if (!req.session.usuario && req.cookies.usuario_id) {
        req.session.usuario = {
            id: req.cookies.usuario_id,
            nombre: req.cookies.usuario_nombre,
            rol: req.cookies.usuario_rol
        };
    }
    next();
});

// Rutas
// Rutas
app.use('/', require('./routes/public.routes'));
app.use('/', require('./routes/auth.routes'));
app.use('/', require('./routes/user.routes'));
app.use('/admin', require('./routes/admin.routes'));

// Iniciar el servidor
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Servidor de Rafita's Hospital corriendo en http://localhost:${port}`);
    });
}

module.exports = app;
