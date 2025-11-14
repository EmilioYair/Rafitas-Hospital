// bd/usuariosBD.js
const Usuario = require('../models/usuario.js');
const bcrypt = require('bcryptjs');

/**
 * Registra un nuevo usuario en la base de datos
 */
const registrarUsuario = async (datosUsuario) => {
    try {
        const { nombre, apellido, email, telefono, fechaNacimiento, password } = datosUsuario;
        let usuario = await Usuario.findOne({ email: email });
        if (usuario) {
            throw new Error('El correo electrónico ya está registrado.');
        }
        usuario = new Usuario({ nombre, apellido, email, telefono, fechaNacimiento, password });
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt); 
        await usuario.save();
        
        console.log("Usuario registrado exitosamente:", usuario);
        const usuarioGuardado = usuario.toObject();
        delete usuarioGuardado.password;
        return usuarioGuardado;
    } catch (error) {
        console.error("Error en registrarUsuario:", error.message);
        throw error;
    }
};

/**
 * Autentica a un usuario.
 */
const loginUsuario = async (email, password) => {
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            throw new Error('Credenciales incorrectas');
        }
        const esMatch = await bcrypt.compare(password, usuario.password);
        if (!esMatch) {
            throw new Error('Credenciales incorrectas');
        }
        return {
            id: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol
        };
    } catch (error) {
        console.error("Error en loginUsuario:", error.message);
        throw error;
    }
};

// --- FUNCIÓN NUEVA ---
/**
 * Obtiene los datos de un usuario por su ID (sin la contraseña)
 */
const obtenerUsuarioPorId = async (usuarioId) => {
    try {
        // .select('-password') excluye la contraseña de la consulta
        const usuario = await Usuario.findById(usuarioId).select('-password');
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        return usuario;
    } catch (error) {
        console.error("Error al obtener usuario:", error.message);
        throw error;
    }
};

// --- FUNCIÓN NUEVA ---
/**
 * Actualiza los datos de un usuario en la BD
 */
const actualizarUsuario = async (usuarioId, datosActualizados) => {
    try {
        // { new: true } devuelve el documento ya actualizado
        // .select('-password') excluye la contraseña
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            usuarioId, 
            datosActualizados, 
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!usuarioActualizado) {
            throw new Error('Usuario no encontrado para actualizar');
        }
        console.log("Usuario actualizado:", usuarioActualizado);
        return usuarioActualizado;
    } catch (error) {
        console.error("Error al actualizar usuario:", error.message);
        throw error;
    }
};

/**
 * Obtiene todos los usuarios (sin contraseña)
 */
const obtenerTodosLosUsuarios = async () => {
    try {
        const usuarios = await Usuario.find().select('-password');
        return usuarios;
    } catch (error) {
        console.error("Error al obtener usuarios:", error.message);
        throw error;
    }
};

/**
 * Promueve un usuario a admin
 */
const promoverAAdmin = async (usuarioId) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            usuarioId,
            { rol: 'admin' },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!usuarioActualizado) {
            throw new Error('Usuario no encontrado');
        }
        console.log("Usuario promovido a admin:", usuarioActualizado);
        return usuarioActualizado;
    } catch (error) {
        console.error("Error al promover usuario a admin:", error.message);
        throw error;
    }
};

/**
 * Degrada un admin a usuario normal
 */
const descensoDeAdmin = async (usuarioId) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            usuarioId,
            { rol: 'usuario' },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!usuarioActualizado) {
            throw new Error('Usuario no encontrado');
        }
        console.log("Admin degradado a usuario:", usuarioActualizado);
        return usuarioActualizado;
    } catch (error) {
        console.error("Error al degradar admin:", error.message);
        throw error;
    }
};

/**
 * Elimina un usuario de la base de datos
 */
const eliminarUsuario = async (usuarioId) => {
    try {
        const usuarioEliminado = await Usuario.findByIdAndDelete(usuarioId);
        
        if (!usuarioEliminado) {
            throw new Error('Usuario no encontrado');
        }
        console.log("Usuario eliminado:", usuarioEliminado.email);
        return {
            mensaje: 'Usuario eliminado exitosamente',
            usuario: usuarioEliminado.email
        };
    } catch (error) {
        console.error("Error al eliminar usuario:", error.message);
        throw error;
    }
};

// Exportamos las funciones
module.exports = {
    registrarUsuario,
    loginUsuario,
    obtenerUsuarioPorId,
    actualizarUsuario,
    obtenerTodosLosUsuarios,
    promoverAAdmin,
    descensoDeAdmin,
    eliminarUsuario
};