require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const { User, ROLES } = require('../models/User');
const { connectDB } = require('../config/db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => {
    rl.question(query, resolve);
});

async function createSuperuser() {
    try {
        // Conectar a la base de datos
        console.log('Conectando a la base de datos...');
        await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/transportsys');

        // Solicitar datos del operador
        const email = await question('Ingrese el correo electrónico del operador: ');
        const name = await question('Ingrese el nombre del operador: ');
        const password = await question('Ingrese la contraseña del operador: ');

        // Validar el correo electrónico
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Correo electrónico inválido');
        }

        // Validar la contraseña
        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Verificar si ya existe un usuario con ese correo
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Ya existe un usuario con ese correo electrónico');
        }

        // Crear el operador (superusuario)
        const operator = new User({
            email,
            name,
            password,
            role: ROLES.OPERATOR
        });

        await operator.save();

        console.log('✅ Operador creado exitosamente');
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Nombre: ${name}`);
        console.log(`🔑 Rol: ${ROLES.OPERATOR}`);
        console.log('\nPuedes usar estas credenciales para iniciar sesión en el sistema.');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
        process.exit();
    }
}

// Ejecutar el comando
createSuperuser();

// Exportar la función si es requerida como módulo
if (require.main === module) {
    createSuperuser();
} else {
    module.exports = createSuperuser;
} 