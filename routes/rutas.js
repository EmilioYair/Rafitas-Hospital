// routes/rutas.js
const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const { registrarUsuario, loginUsuario, obtenerUsuarioPorId, actualizarUsuario, obtenerTodosLosUsuarios, promoverAAdmin, descensoDeAdmin, eliminarUsuario } = require('../bd/usuariosBD');
const { obtenerCitasPorUsuario, crearCita, cancelarCita, obtenerTodasLasCitas, obtenerCitasPendientes, borrarCitaAdmin } = require('../bd/citasBD');
const { crearDoctor, obtenerDoctores, actualizarDoctor, borrarDoctor } = require('../bd/doctoresBD');
const { verificarSesion, verificarAdmin, verificarUsuarioOAdmin } = require('../middlewares/autenticacion');

// Simulación de Días No Disponibles (Ej. fines de semana y festivos)
const diasNoDisponibles = ['2025-10-18', '2025-10-19', '2025-10-25', '2025-10-26']; 

// --- RUTAS GET (Para mostrar páginas) ---

// --- RUTA RAÍZ (Home Page Pública) ---
router.get('/', async (req, res) => {
    try {
        let especialidades = [];
        
        // Si el usuario está loggeado, mostrar especialidades
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


// --- RUTA DEL PANEL DE CONTROL (DASHBOARD) ---
router.get('/dashboard', verificarSesion, async (req, res) => {
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
        diasNoDisponibles: diasNoDisponibles // <-- AÑADIDO
    });
});
// --- RUTA GET DE ADMIN (CORREGIDA PARA CONTEO) ---
router.get('/admin', verificarAdmin, async (req, res) => {
    try {
        const [citas, doctores] = await Promise.all([
            obtenerTodasLasCitas(),
            obtenerDoctores()
        ]);

        // --- CÓDIGO CORREGIDO: CALCULAR CITAS PENDIENTES ---
        const pendientesCalculadas = citas.filter(cita => cita.estado === 'Pendiente').length;
        
        res.render('pages/admin', { 
            pageTitle: 'Panel de Admin',
            cookies: req.cookies,
            citas: citas,
            conteoCitas: citas.length,
            conteoDoctores: doctores.length,
            conteoPendientes: pendientesCalculadas // <-- VALOR CORREGIDO
        });
    } catch (error) {
        console.error("Error al cargar la página de admin:", error);
        res.redirect('/');
    }
});

router.get('/dates', verificarSesion, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const [citasDelUsuario, doctoresDisponibles] = await Promise.all([
            obtenerCitasPorUsuario(usuarioId),
            obtenerDoctores()
        ]);        res.render('pages/dates', { 
            pageTitle: 'Agendar Cita',
            cookies: req.cookies,
            citas: citasDelUsuario,
            doctores: doctoresDisponibles,
            diasNoDisponibles: diasNoDisponibles // <-- AÑADIDO
        });
    } catch (error) {
        console.error("Error al cargar la página de citas:", error);
        res.redirect('/');
    }
});

router.get('/find-doctors', verificarSesion, async (req, res) => {
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
});router.get('/manage-doctors', verificarAdmin, async (req, res) => {
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
// --- RUTAS POST (Autenticación y Formularios) ---

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
});router.post('/citas', async (req, res) => {
    if (!req.cookies.usuario_id) return res.status(401).json({ error: 'No autorizado' });
    try {
        const datosCita = { ...req.body, usuario: req.session.usuario.id };
        const nuevaCita = await crearCita(datosCita);
        res.status(201).json({ mensaje: 'Cita agendada exitosamente', cita: nuevaCita });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al agendar la cita' });
    }
});

router.post('/perfil', async (req, res) => {
    if (!req.cookies.usuario_id) return res.status(401).json({ error: 'No autorizado' });
    try {
        const usuarioId = req.session.usuario.id;
        const datosActualizados = req.body;
        const usuarioActualizado = await actualizarUsuario(usuarioId, datosActualizados);
        if (datosActualizados.nombre && datosActualizados.nombre !== req.cookies.usuario_nombre) {
            res.cookie('usuario_nombre', usuarioActualizado.nombre, { httpOnly: true, maxAge: 3600000 });
        }
        res.status(200).json({ mensaje: 'Perfil actualizado exitosamente', usuario: usuarioActualizado });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al actualizar el perfil' });
    }
});

router.post('/doctores', verificarAdmin, async (req, res) => {
    try {
        const nuevoDoctor = await crearDoctor(req.body);
        res.status(201).json({ mensaje: 'Doctor añadido exitosamente', doctor: nuevoDoctor });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al añadir doctor' });
    }
});

router.post('/doctores/actualizar/:id', verificarAdmin, async (req, res) => {
    try {
        const doctorId = req.params.id;
        const datosDoctor = req.body;
        const doctorActualizado = await actualizarDoctor(doctorId, datosDoctor);
        res.status(200).json({ mensaje: 'Doctor actualizado exitosamente', doctor: doctorActualizado });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al actualizar doctor' });
    }
});


// --- RUTAS DELETE ---

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
});router.delete('/citas/:id', async (req, res) => {
    if (!req.cookies.usuario_id) return res.status(401).json({ error: 'No autorizado' });
    try {
        const citaId = req.params.id;
        const usuarioId = req.session.usuario.id;
        await cancelarCita(citaId, usuarioId);
        res.status(200).json({ mensaje: 'Cita cancelada exitosamente' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al cancelar la cita' });
    }
});

router.delete('/doctores/:id', verificarAdmin, async (req, res) => {
    try {
        const doctorId = req.params.id;
        await borrarDoctor(doctorId);
        res.status(200).json({ mensaje: 'Doctor eliminado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar doctor' });
    }
});

// --- RUTA DELETE PARA ADMIN (NUEVA) ---
router.delete('/admin/citas/:id', verificarAdmin, async (req, res) => {
    // (Aquí debería ir una validación de rol de admin)
    try {
        const citaId = req.params.id;
        await borrarCitaAdmin(citaId);
        res.status(200).json({ mensaje: 'Cita eliminada por el administrador' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar la cita' });
    }
});

// --- RUTAS PARA GESTIÓN DE USUARIOS (ADMIN ONLY) ---

// GET: Ver página de gestión de usuarios
router.get('/manage-users', verificarAdmin, async (req, res) => {
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

// POST: Promover usuario a admin
router.post('/usuarios/:id/promover-admin', verificarAdmin, async (req, res) => {
    try {
        const usuarioId = req.params.id;
        // Prevenir que un admin se degrade a sí mismo
        if (usuarioId === req.cookies.usuario_id) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }
        const usuarioActualizado = await promoverAAdmin(usuarioId);
        res.status(200).json({ mensaje: 'Usuario promovido a administrador', usuario: usuarioActualizado });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al promover usuario' });
    }
});

// POST: Remover permisos de admin
router.post('/usuarios/:id/remover-admin', verificarAdmin, async (req, res) => {
    try {
        const usuarioId = req.params.id;
        // Prevenir que un admin se degrade a sí mismo
        if (usuarioId === req.cookies.usuario_id) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }
        const usuarioActualizado = await descensoDeAdmin(usuarioId);
        res.status(200).json({ mensaje: 'Permisos de administrador removidos', usuario: usuarioActualizado });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al remover permisos' });
    }
});

// POST: Eliminar usuario
router.post('/usuarios/:id/eliminar', verificarAdmin, async (req, res) => {
    try {
        const usuarioId = req.params.id;
        // Prevenir que un admin se elimine a sí mismo
        if (usuarioId === req.cookies.usuario_id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }
        const resultado = await eliminarUsuario(usuarioId);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar usuario' });
    }
});

// --- RUTA DE SETUP (SOLO PARA INICIALIZACIÓN) ---
// Esta ruta solo funciona si no hay admins en el sistema
router.get('/setup-admin/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        // Verificar si ya existe algún admin
        const usuarioAdmin = await Usuario.findOne({ rol: 'admin' });
        if (usuarioAdmin) {
            return res.status(403).json({ error: 'Ya existe un administrador en el sistema. Usa /manage-users' });
        }
        
        // Buscar el usuario por email
        const usuarioParaPromocion = await Usuario.findOne({ email: email });
        if (!usuarioParaPromocion) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Promover a admin
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