const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const { obtenerTodosLosUsuarios, promoverAAdmin, descensoDeAdmin, eliminarUsuario } = require('../bd/usuariosBD');
const { obtenerTodasLasCitas, borrarCitaAdmin } = require('../bd/citasBD');
const { crearDoctor, obtenerDoctores, actualizarDoctor, borrarDoctor } = require('../bd/doctoresBD');
const { verificarAdmin } = require('../middlewares/autenticacion');

// Todas las rutas de este archivo requieren verificarAdmin
router.use(verificarAdmin);

// --- RUTA GET DE ADMIN (DASHBOARD) ---
router.get('/', async (req, res) => {
    try {
        const [citas, doctores] = await Promise.all([
            obtenerTodasLasCitas(),
            obtenerDoctores()
        ]);

        const pendientesCalculadas = citas.filter(cita => cita.estado === 'Pendiente').length;

        res.render('pages/admin', {
            pageTitle: 'Panel de Admin',
            cookies: req.cookies,
            citas: citas,
            conteoCitas: citas.length,
            conteoDoctores: doctores.length,
            conteoPendientes: pendientesCalculadas
        });
    } catch (error) {
        console.error("Error al cargar la página de admin:", error);
        res.redirect('/');
    }
});

// --- GESTIÓN DE DOCTORES ---

router.get('/manage-doctors', async (req, res) => {
    try {
        const doctores = await obtenerDoctores();
        res.render('pages/manage-doctors', {
            pageTitle: 'Gestionar Doctores',
            cookies: req.cookies,
            doctores: doctores
        });
    } catch (error) {
        console.error("Error al cargar doctores:", error);
        res.redirect('/admin');
    }
});

router.post('/doctores', async (req, res) => {
    try {
        const nuevoDoctor = await crearDoctor(req.body);
        res.status(201).json({ mensaje: 'Doctor añadido exitosamente', doctor: nuevoDoctor });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al añadir doctor' });
    }
});

router.post('/doctores/actualizar/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const datosDoctor = req.body;
        const doctorActualizado = await actualizarDoctor(doctorId, datosDoctor);
        res.status(200).json({ mensaje: 'Doctor actualizado exitosamente', doctor: doctorActualizado });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al actualizar doctor' });
    }
});

router.delete('/doctores/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        await borrarDoctor(doctorId);
        res.status(200).json({ mensaje: 'Doctor eliminado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar doctor' });
    }
});

// --- GESTIÓN DE CITAS (ADMIN) ---

router.delete('/citas/:id', async (req, res) => {
    try {
        const citaId = req.params.id;
        await borrarCitaAdmin(citaId);
        res.status(200).json({ mensaje: 'Cita eliminada por el administrador' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar la cita' });
    }
});

// --- GESTIÓN DE USUARIOS ---

router.get('/manage-users', async (req, res) => {
    try {
        const usuarios = await obtenerTodosLosUsuarios();
        res.render('pages/manage-users', {
            pageTitle: 'Gestionar Usuarios',
            cookies: req.cookies,
            usuarios: usuarios
        });
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        res.redirect('/admin');
    }
});

router.post('/usuarios/:id/promover-admin', async (req, res) => {
    try {
        const usuarioId = req.params.id;
        if (usuarioId === req.cookies.usuario_id) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }
        const usuarioActualizado = await promoverAAdmin(usuarioId);
        res.status(200).json({ mensaje: 'Usuario promovido a administrador', usuario: usuarioActualizado });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al promover usuario' });
    }
});

router.post('/usuarios/:id/remover-admin', async (req, res) => {
    try {
        const usuarioId = req.params.id;
        if (usuarioId === req.cookies.usuario_id) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }
        const usuarioActualizado = await descensoDeAdmin(usuarioId);
        res.status(200).json({ mensaje: 'Permisos de administrador removidos', usuario: usuarioActualizado });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al remover permisos' });
    }
});

router.post('/usuarios/:id/eliminar', async (req, res) => {
    try {
        const usuarioId = req.params.id;
        if (usuarioId === req.cookies.usuario_id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }
        const resultado = await eliminarUsuario(usuarioId);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar usuario' });
    }
});

module.exports = router;
