require('dotenv').config();
const mongoose = require('mongoose');
const { User, ROLES } = require('../models/User');
const { connectDB } = require('../config/db');

async function createUser(name, email, password, role = ROLES.USER) {
    try {
        console.log('Conectando a la base de datos...');
        await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/transportsys');

        // Validaciones básicas (puedes añadir más si es necesario)
        if (!name || !email || !password) {
            throw new Error('Nombre, correo electrónico y contraseña son requeridos.');
        }

        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Correo electrónico inválido');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Ya existe un usuario con ese correo electrónico');
        }

        // Crear el usuario
        const user = new User({
            name,
            email,
            password,
            role
        });

        await user.save();

        console.log('✅ Usuario creado exitosamente');
        console.log(`👤 Nombre: ${name}`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Rol: ${role}`);
    } catch (error) {
        console.error('❌ Error al crear usuario:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de la base de datos');
    }
}

module.exports = createUser; 