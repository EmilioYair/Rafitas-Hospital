const mongoose = require('mongoose');
const Doctor = require('./models/doctor.js'); // Importamos el modelo

// Esta es la misma URI de tu archivo bd/bd.js
// La ponemos aquí porque este script se ejecuta por separado
const MONGO_URI = "mongodb+srv://yairlbti24_db_user:RIXc7aAtG1SGOBmF@cluster0.9tr2xmx.mongodb.net/?retryWrites=true&w=majority&appName=backend1";

// --- Lista de Doctores Precargados ---
const doctores = [
    {
        nombreCompleto: "Dr. Juan Pérez",
        especialidad: "Cardiología",
        consultorio: "101-A",
        email: "juan.perez@hospital.com",
        telefono: "4271234567"
    },
    {
        nombreCompleto: "Dra. Ana García",
        especialidad: "Dermatología",
        consultorio: "102-B",
        email: "ana.garcia@hospital.com",
        telefono: "4271234568"
    },
    {
        nombreCompleto: "Dr. Carlos Sánchez",
        especialidad: "Pediatría",
        consultorio: "201-A",
        email: "carlos.sanchez@hospital.com",
        telefono: "4271234569"
    },
    {
        nombreCompleto: "Dra. Laura Martínez",
        especialidad: "Ginecología",
        consultorio: "202-B",
        email: "laura.martinez@hospital.com",
        telefono: "4271234570"
    },
    {
        nombreCompleto: "Dr. Miguel Rodríguez",
        especialidad: "Traumatología",
        consultorio: "301-A",
        email: "miguel.rodriguez@hospital.com",
        telefono: "4271234571"
    }
];

// Función que se conecta, borra todo y añade lo nuevo
const importarDoctores = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        
        // Borrar todos los doctores existentes
        await Doctor.deleteMany();

        // Insertar la nueva lista de doctores
        await Doctor.insertMany(doctores);

        console.log('-------------------------------------------');
        console.log('¡Doctores precargados exitosamente!');
        console.log('-------------------------------------------');
        process.exit(); // Termina el script
    } catch (error) {
        console.error('Error al precargar los doctores:', error);
        process.exit(1); // Termina el script con error
    }
};

// Llamamos a la función
importarDoctores();