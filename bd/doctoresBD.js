// bd/doctoresBD.js
const Doctor = require('../models/doctor.js');

/**
 * Crea un nuevo doctor en la BD
 */
const crearDoctor = async (datosDoctor) => {
    try {
        const nuevoDoctor = new Doctor(datosDoctor);
        await nuevoDoctor.save();
        return nuevoDoctor;
    } catch (error) {
        console.error("Error al crear doctor:", error);
        throw error;
    }
};

/**
 * Obtiene todos los doctores de la BD
 */
const obtenerDoctores = async () => {
    try {
        const doctores = await Doctor.find().sort({ nombreCompleto: 1 });
        return doctores;
    } catch (error) {
        console.error("Error al obtener doctores:", error);
        throw error;
    }
};

/**
 * Actualiza un doctor por su ID
 */
const actualizarDoctor = async (doctorId, datosActualizados) => {
    try {
        const doctorActualizado = await Doctor.findByIdAndUpdate(
            doctorId, 
            datosActualizados, 
            { new: true, runValidators: true }
        );
        if (!doctorActualizado) throw new Error('Doctor no encontrado');
        return doctorActualizado;
    } catch (error) {
        console.error("Error al actualizar doctor:", error);
        throw error;
    }
};

/**
 * Elimina un doctor por su ID
 */
const borrarDoctor = async (doctorId) => {
    try {
        const doctorBorrado = await Doctor.findByIdAndDelete(doctorId);
        if (!doctorBorrado) throw new Error('Doctor no encontrado');
        return doctorBorrado;
    } catch (error) {
        console.error("Error al borrar doctor:", error);
        throw error;
    }
};

module.exports = {
    crearDoctor,
    obtenerDoctores,
    actualizarDoctor,
    borrarDoctor
};