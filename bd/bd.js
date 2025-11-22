const mongoose = require("mongoose");

// --- SOLUCIÓN: Usar variable de entorno ---
// const MONGO_URI = "mongodb+srv://yairlbti24_db_user:RIXc7aAtG1SGOBmF@cluster0.9tr2xmx.mongodb.net/?retryWrites=true&w=majority&appName=backend1";

async function conectarBD(){
    try{
        // Usamos process.env.MONGO_URI
        const respuestaMongo = await mongoose.connect(process.env.MONGO_URI);
        
        console.log("Conexion con MongoDB Atlas exitosa");
    }
    catch(err){
        console.log("Error al conectar con MongoDB: " + err);
        process.exit(1); 
    }
}

module.exports = conectarBD;
