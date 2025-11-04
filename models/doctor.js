// models/doctor.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DoctorSchema = new Schema({
    nombreCompleto: {
        type: String,
        required: [true, "El nombre completo es obligatorio"],
        trim: true
    },
    especialidad: {
        type: String,
        required: [true, "La especialidad es obligatoria"],
        trim: true
    },
    consultorio: {
        type: String,
        required: [true, "El número de consultorio es obligatorio"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "El email es obligatorio"],
        unique: true,
        match: [/.+\@.+\..+/, "Por favor ingresa un email válido"]
    },
    telefono: {
        type: String,
        required: false
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

const Doctor = mongoose.model('Doctor', DoctorSchema);

module.exports = Doctor;
