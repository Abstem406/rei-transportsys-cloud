require('dotenv').config();
const mongoose = require('mongoose');
const { User, ROLES } = require('../models/User');
const { faker } = require('@faker-js/faker');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transportsys';

async function seedUsers() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a la base de datos');

    // Opcional: Eliminar usuarios existentes para una siembra limpia
    await User.deleteMany({});
    console.log('Usuarios existentes eliminados (opcional)');

    const users = [];
    for (let i = 0; i < 10; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const user = {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: 'password123', // Contraseña por defecto para los usuarios sembrados
        role: i === 0 ? ROLES.ADMIN : ROLES.USER, // El primer usuario será admin, los demás user
        createdAt: faker.date.past({ years: 1 })
      };
      users.push(user);
    }

    await User.insertMany(users);
    console.log(`Se han creado ${users.length} usuarios con éxito.`);
  } catch (error) {
    console.error('Error al sembrar usuarios:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de la base de datos');
  }
}

seedUsers(); 