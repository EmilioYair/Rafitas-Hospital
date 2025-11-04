import mongoose from "mongoose"

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
})

export default mongoose.model('Contacto', contactoSchema)
