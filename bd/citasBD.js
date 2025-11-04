// bd/citasBD.js
const Cita = require('../models/cita.js');

/**
 * Obtiene todas las citas de un usuario específico
 */
const obtenerCitasPorUsuario = async (usuarioId) => {
    try {
        const citas = await Cita.find({ usuario: usuarioId }).sort({ fecha: 1 });
        return citas;
    } catch (error) {
        console.error("Error al obtener las citas:", error.message);
        throw error;
    }
};

/**
 * Crea una nueva cita en la base de datos
 */
const crearCita = async (datosCita) => {
    try {
        const nuevaCita = new Cita(datosCita);
        await nuevaCita.save();
        console.log("Cita creada exitosamente:", nuevaCita);
        return nuevaCita;
    } catch (error) {
        console.error("Error al crear la cita:", error.message);
        throw error;
    }
};

/**
 * Cancela (elimina) una cita de la base de datos (para un usuario)
 */
const cancelarCita = async (citaId, usuarioId) => {
    try {
        const resultado = await Cita.findOneAndDelete({ 
            _id: citaId, 
            usuario: usuarioId 
        });
        if (!resultado) {
            throw new Error('Cita no encontrada o no autorizado para borrarla');
        }
        console.log("Cita cancelada exitosamente:", resultado);
        return resultado;
    } catch (error) {
        console.error("Error al cancelar la cita:", error.message);
        throw error;
    }
};

/**
 * Obtiene TODAS las citas de la base de datos (para el Admin)
 */
const obtenerTodasLasCitas = async () => {
    try {
        const citas = await Cita.find({})
            .populate('usuario', 'nombre email') 
            .sort({ fecha: -1 });
        return citas;
    } catch (error) {
        console.error("Error al obtener todas las citas:", error.message);
        throw error;
    }
};

/**
 * Obtiene solo las citas 'Pendientes' de un usuario
 */
const obtenerCitasPendientes = async (usuarioId) => {
    try {
        const citas = await Cita.find({ 
            usuario: usuarioId,
            estado: 'Pendiente'
        }).sort({ fecha: 1 });
        return citas;
    } catch (error) {
        console.error("Error al obtener citas pendientes:", error.message);
        throw error;
    }
};

// --- FUNCIÓN NUEVA ---
/**
 * Borra una cita por su ID (función de Admin)
 */
const borrarCitaAdmin = async (citaId) => {
    try {
        const citaBorrada = await Cita.findByIdAndDelete(citaId);
        if (!citaBorrada) {
            throw new Error('Cita no encontrada');
        }
        return citaBorrada;
    } catch (error) {
        console.error("Error al borrar cita (admin):", error.message);
        throw error;
    }
};

// Exportamos todas las funciones
module.exports = {
    obtenerCitasPorUsuario,
    crearCita,
    cancelarCita,
    obtenerTodasLasCitas,
    obtenerCitasPendientes,
    borrarCitaAdmin // <-- AÑADIDO
};