const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const { obtenerDoctores } = require('../bd/doctoresBD');

// --- RUTA RAÍZ (Home Page Pública) ---
router.get('/', async (req, res) => {
    try {
        let especialidades = [];

        if (req.session.usuario) {
            const doctores = await obtenerDoctores();
            especialidades = [...new Set(doctores.map(doc => doc.especialidad))];
        }

        res.render('pages/home', {
            pageTitle: 'Bienvenido - Rafita\'s Hospital',
            cookies: req.cookies,
            especialidades: especialidades
        });
    } catch (error) {
        console.error("Error al cargar la home page:", error);
        res.render('pages/home', {
            pageTitle: 'Bienvenido - Error',
            cookies: req.cookies,
            especialidades: []
        });
    }
});

router.get('/find-doctors', async (req, res) => {
    try {
        const { nombre, especialidad } = req.query;
        let doctores = await obtenerDoctores();
        const especialidadesUnicas = [...new Set(doctores.map(doc => doc.especialidad))];
        if (nombre) {
            doctores = doctores.filter(doc =>
                doc.nombreCompleto.toLowerCase().includes(nombre.toLowerCase())
            );
        }
        if (especialidad) {
            doctores = doctores.filter(doc =>
                doc.especialidad === especialidad
            );
        }
        res.render('pages/find-doctors', {
            pageTitle: 'Buscar Doctores',
            cookies: req.cookies,
            doctores: doctores,
            especialidades: especialidadesUnicas,
            filtros: req.query
        });
    } catch (error) {
        console.error("Error al cargar la página de buscar doctores:", error);
        res.redirect('/');
    }
});

// --- RUTA DE SETUP (SOLO PARA INICIALIZACIÓN) ---
router.get('/setup-admin/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const usuarioAdmin = await Usuario.findOne({ rol: 'admin' });
        if (usuarioAdmin) {
            return res.status(403).json({ error: 'Ya existe un administrador en el sistema. Usa /manage-users' });
        }

        const usuarioParaPromocion = await Usuario.findOne({ email: email });
        if (!usuarioParaPromocion) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        usuarioParaPromocion.rol = 'admin';
        await usuarioParaPromocion.save();

        res.status(200).json({
            mensaje: 'Usuario promovido a administrador correctamente',
            usuario: {
                nombre: usuarioParaPromocion.nombre,
                email: usuarioParaPromocion.email,
                rol: usuarioParaPromocion.rol
            }
        });
    } catch (error) {
        console.error('Error en setup-admin:', error);
        res.status(400).json({ error: error.message || 'Error al promover usuario' });
    }
});

module.exports = router;
