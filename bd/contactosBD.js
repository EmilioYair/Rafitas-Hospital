const mongoose = require("mongoose");

const contactoSchema = new mongoose.Schema({
    nombre: {
        type: String, 
        require: true,
        trim: true,
        unique: false
    },
    edad: {
        type: Number,
        required: true,
        trim: true,
        unique: false
    }
});

module.exports = mongoose.model('Contacto', contactoSchema);