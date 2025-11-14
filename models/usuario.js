const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsuarioSchema = new Schema({
    nombre: {
        type: String,
        required: [true, "El nombre es obligatorio"]
    },
    apellido: {
        type: String,
        required: [true, "El apellido es obligatorio"]
    },
    email: {
        type: String,
        required: [true, "El email es obligatorio"],
        unique: true, // No permite que dos usuarios tengan el mismo email
        match: [/.+\@.+\..+/, "Por favor ingresa un email válido"]
    },
    telefono: {
        type: String,
        required: false
    },
    fechaNacimiento: {
        type: String, 
        required: false
    },
    password: {
        type: String,
        required: [true, "La contraseña es obligatoria"]
    },
    rol: {
        type: String,
        enum: ['usuario', 'admin'],
        default: 'usuario'
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

module.exports = Usuario;
