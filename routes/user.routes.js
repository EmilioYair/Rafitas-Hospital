const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { obtenerUsuarioPorId, actualizarUsuario } = require('../bd/usuariosBD');
const { obtenerCitasPorUsuario, crearCita, cancelarCita, obtenerCitasPendientes } = require('../bd/citasBD');
const { obtenerDoctores } = require('../bd/doctoresBD');
const { verificarSesion } = require('../middlewares/autenticacion');

// Simulación de Días No Disponibles
const diasNoDisponibles = ['2025-10-18', '2025-10-19', '2025-10-25', '2025-10-26'];

// Configuración de Multer para subida de archivos
let uploadsDir = null;
let isUploadEnabled = false;

try {
    uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    isUploadEnabled = true;
} catch (err) {
    console.warn('⚠ Local file storage disabled:', err.message);
    isUploadEnabled = false;
}

const memoryStorage = multer.memoryStorage();
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        try {
            const usuarioId = req.session && req.session.usuario ? req.session.usuario.id : 'anon';
            const ext = path.extname(file.originalname);
            const filename = `${usuarioId}-${Date.now()}${ext}`;
            cb(null, filename);
        } catch (err) {
            cb(err);
        }
    }
});

const upload = multer({
    storage: isUploadEnabled ? diskStorage : memoryStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif/;
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeOk = allowed.test(file.mimetype);
        const extOk = allowed.test(ext);
        if (mimeOk && extOk) return cb(null, true);
        cb(new Error('Tipo de archivo no permitido. Solo imágenes JPG/PNG/GIF.'));
    }
});

// Todas las rutas requieren verificarSesion
router.use(verificarSesion);

router.get('/dashboard', async (req, res) => {
    let usuario = null;
    let citasPendientes = [];

    try {
        const usuarioId = req.session.usuario.id;
        const [datosUsuario, listaCitas] = await Promise.all([
            obtenerUsuarioPorId(usuarioId),
            obtenerCitasPendientes(usuarioId)
        ]);

        usuario = datosUsuario;
        citasPendientes = listaCitas;
    } catch (error) {
        console.error("Error al cargar dashboard:", error);
        return res.redirect('/logout');
    }

    res.render('pages/dashboard', {
        pageTitle: 'Panel de Control',
        cookies: req.cookies,
        usuario: usuario,
        citasPendientes: citasPendientes,
        diasNoDisponibles: diasNoDisponibles
    });
});

router.get('/dates', async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const [citasDelUsuario, doctoresDisponibles] = await Promise.all([
            obtenerCitasPorUsuario(usuarioId),
            obtenerDoctores()
        ]);
        res.render('pages/dates', {
            pageTitle: 'Agendar Cita',
            cookies: req.cookies,
            citas: citasDelUsuario,
            doctores: doctoresDisponibles,
            diasNoDisponibles: diasNoDisponibles
        });
    } catch (error) {
        console.error("Error al cargar la página de citas:", error);
        res.redirect('/');
    }
});

router.post('/citas', async (req, res) => {
    try {
        const datosCita = { ...req.body, usuario: req.session.usuario.id };
        const nuevaCita = await crearCita(datosCita);
        res.status(201).json({ mensaje: 'Cita agendada exitosamente', cita: nuevaCita });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al agendar la cita' });
    }
});

router.delete('/citas/:id', async (req, res) => {
    try {
        const citaId = req.params.id;
        const usuarioId = req.session.usuario.id;
        await cancelarCita(citaId, usuarioId);
        res.status(200).json({ mensaje: 'Cita cancelada exitosamente' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al cancelar la cita' });
    }
});

// --- PERFIL Y UPLOADS ---

router.post('/perfil', upload.single('foto'), async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const datosActualizados = { ...req.body };

        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const filename = `${usuarioId}-${Date.now()}${ext}`;
            datosActualizados.foto = filename;

            if (isUploadEnabled) {
                try {
                    const filePath = path.join(uploadsDir, filename);
                    fs.writeFileSync(filePath, req.file.buffer);
                } catch (err) {
                    console.warn('Could not save avatar to disk:', err.message);
                }
            }
        }

        const usuarioPrev = await obtenerUsuarioPorId(usuarioId);
        const usuarioActualizado = await actualizarUsuario(usuarioId, datosActualizados);

        if (req.file && isUploadEnabled && usuarioPrev && usuarioPrev.foto && usuarioPrev.foto !== usuarioActualizado.foto) {
            try {
                const oldPath = path.join(uploadsDir, usuarioPrev.foto);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            } catch (err) {
                console.error('Error deleting old avatar:', err.message);
            }
        }

        if (datosActualizados.nombre && datosActualizados.nombre !== req.cookies.usuario_nombre) {
            res.cookie('usuario_nombre', usuarioActualizado.nombre, { httpOnly: true, maxAge: 3600000 });
        }

        res.status(200).json({ mensaje: 'Perfil actualizado exitosamente', usuario: usuarioActualizado });
    } catch (error) {
        console.error('Profile update error:', error.message);
        res.status(400).json({ error: error.message || 'Error al actualizar el perfil' });
    }
});

router.delete('/perfil/foto', async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const usuario = await obtenerUsuarioPorId(usuarioId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (!usuario.foto) return res.status(400).json({ error: 'El usuario no tiene una foto' });

        if (isUploadEnabled) {
            try {
                const filePath = path.join(uploadsDir, usuario.foto);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (err) {
                console.error('Error al borrar archivo:', err.message);
            }
        }

        const usuarioActualizado = await actualizarUsuario(usuarioId, { foto: null });
        res.status(200).json({ mensaje: 'Foto de perfil eliminada', usuario: usuarioActualizado });
    } catch (error) {
        console.error('Error al eliminar foto de perfil:', error.message);
        res.status(400).json({ error: error.message || 'Error al eliminar foto' });
    }
});

module.exports = router;
