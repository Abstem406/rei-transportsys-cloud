const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Propietario = require('../models/Propietario');
require('dotenv').config();

const seedPropietarios = async (numPropietarios) => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/transportsys');
    console.log('MongoDB connected for seeding propietarios.');

    await Propietario.deleteMany({});
    console.log('Existing propietarios cleared.');

    const propietarios = [];
    for (let i = 0; i < numPropietarios; i++) {
      const cedulaPrefix = faker.helpers.arrayElement(['V', 'E', 'J', 'G']);
      const cedulaNumber = faker.string.numeric(8); // 8 digits
      const phone = faker.phone.number('##########'); // 10 digits

      propietarios.push({
        name: faker.person.fullName(),
        cedula: `${cedulaPrefix}-${cedulaNumber}`,
        phone: phone,
        address: faker.location.streetAddress(true),
        email: faker.internet.email(),
      });
    }

    await Propietario.insertMany(propietarios);
    console.log(`${numPropietarios} propietarios seeded successfully!`);
  } catch (error) {
    console.error('Error seeding propietarios:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

const numPropietariosToSeed = parseInt(process.argv[2]) || 50; 

seedPropietarios(numPropietariosToSeed); 