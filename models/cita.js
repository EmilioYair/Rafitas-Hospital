// models/cita.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CitaSchema = new Schema({
    // 'ref' conecta esta cita con un documento en la colección 'Usuario'
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    doctor: {
        type: String,
        required: [true, "El nombre del doctor es obligatorio"]
    },
    fecha: {
        type: Date,
        required: [true, "La fecha es obligatoria"]
    },
    hora: {
        type: String,
        required: [true, "La hora es obligatoria"]
    },
    motivo: {
        type: String,
        required: [true, "El motivo es obligatorio"]
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'Confirmada', 'Cancelada'],
        default: 'Pendiente'
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

const Cita = mongoose.model('Cita', CitaSchema);

module.exports = Cita;