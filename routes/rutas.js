// routes/rutas.js
const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario, obtenerUsuarioPorId, actualizarUsuario } = require('../bd/usuariosBD');
const { obtenerCitasPorUsuario, crearCita, cancelarCita, obtenerTodasLasCitas, obtenerCitasPendientes, borrarCitaAdmin } = require('../bd/citasBD');
const { crearDoctor, obtenerDoctores, actualizarDoctor, borrarDoctor } = require('../bd/doctoresBD');

// Simulación de Días No Disponibles (Ej. fines de semana y festivos)
const diasNoDisponibles = ['2025-10-18', '2025-10-19', '2025-10-25', '2025-10-26']; 

// --- RUTAS GET (Para mostrar páginas) ---

// --- RUTA RAÍZ (Home Page Pública) ---
router.get('/', async (req, res) => {
    // Si el usuario ya está loggeado, se recomienda redirigir al dashboard
    if (req.cookies.usuario_id) {
        return res.redirect('/dashboard');
    }
    
    try {
        const doctores = await obtenerDoctores();
        const especialidadesUnicas = [...new Set(doctores.map(doc => doc.especialidad))];

        res.render('pages/home', { 
            pageTitle: 'Bienvenido - Rafita\'s Hospital',
            cookies: req.cookies,
            especialidades: especialidadesUnicas
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
router.get('/dashboard', async (req, res) => {
    // 1. Si no hay cookie de usuario, redirigimos a la página de inicio
    if (!req.cookies.usuario_id) {
        return res.redirect('/');
    }

    let usuario = null;
    let citasPendientes = [];
    
    try {
        const usuarioId = req.cookies.usuario_id;
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
router.get('/admin', async (req, res) => {
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

router.get('/dates', async (req, res) => {
    if (!req.cookies.usuario_id) {
        return res.redirect('/');
    }
    try {
        const usuarioId = req.cookies.usuario_id;
        const [citasDelUsuario, doctoresDisponibles] = await Promise.all([
            obtenerCitasPorUsuario(usuarioId),
            obtenerDoctores()
        ]);
        
        res.render('pages/dates', { 
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
        res.cookie('usuario_id', usuario.id, { httpOnly: true, maxAge: 3600000 });
        res.cookie('usuario_nombre', usuario.nombre, { httpOnly: true, maxAge: 3600000 });
        res.status(200).json({ mensaje: 'Inicio de sesión exitoso', usuario: usuario });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Credenciales incorrectas' });
    }
});

router.post('/citas', async (req, res) => {
    if (!req.cookies.usuario_id) return res.status(401).json({ error: 'No autorizado' });
    try {
        const datosCita = { ...req.body, usuario: req.cookies.usuario_id };
        const nuevaCita = await crearCita(datosCita);
        res.status(201).json({ mensaje: 'Cita agendada exitosamente', cita: nuevaCita });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al agendar la cita' });
    }
});

router.post('/perfil', async (req, res) => {
    if (!req.cookies.usuario_id) return res.status(401).json({ error: 'No autorizado' });
    try {
        const usuarioId = req.cookies.usuario_id;
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


// --- RUTAS DELETE ---

router.get('/logout', (req, res) => {
    res.clearCookie('usuario_id');
    res.clearCookie('usuario_nombre');
    res.redirect('/');
});

router.delete('/citas/:id', async (req, res) => {
    if (!req.cookies.usuario_id) return res.status(401).json({ error: 'No autorizado' });
    try {
        const citaId = req.params.id;
        const usuarioId = req.cookies.usuario_id;
        await cancelarCita(citaId, usuarioId);
        res.status(200).json({ mensaje: 'Cita cancelada exitosamente' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al cancelar la cita' });
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

// --- RUTA DELETE PARA ADMIN (NUEVA) ---
router.delete('/admin/citas/:id', async (req, res) => {
    // (Aquí debería ir una validación de rol de admin)
    try {
        const citaId = req.params.id;
        await borrarCitaAdmin(citaId);
        res.status(200).json({ mensaje: 'Cita eliminada por el administrador' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar la cita' });
    }
});

module.exports = router;