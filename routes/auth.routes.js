const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario } = require('../bd/usuariosBD');

// --- RUTAS POST (Autenticación) ---

router.post('/registro', async (req, res) => {
    try {
        const nuevoUsuario = await registrarUsuario(req.body);
        res.status(201).json({ mensaje: '¡Usuario registrado exitosamente!', usuario: nuevoUsuario });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al registrar el usuario' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await loginUsuario(email, password);
        req.session.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol
        };
        res.cookie('usuario_id', usuario.id, { httpOnly: true, maxAge: 3600000 });
        res.cookie('usuario_nombre', usuario.nombre, { httpOnly: true, maxAge: 3600000 });
        res.cookie('usuario_rol', usuario.rol, { httpOnly: true, maxAge: 3600000 });
        res.status(200).json({ mensaje: 'Inicio de sesión exitoso', usuario: usuario });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Credenciales incorrectas' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al destruir sesión:", err);
        }
        res.clearCookie('usuario_id');
        res.clearCookie('usuario_nombre');
        res.clearCookie('usuario_rol');
        res.clearCookie('sessionId');
        res.redirect('/');
    });
});

module.exports = router;
