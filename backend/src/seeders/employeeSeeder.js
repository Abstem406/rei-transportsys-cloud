const mongoose = require('mongoose');
const { Employee, CONTRACT_TYPES, GENDERS } = require('../models/Employee');
const { connectDB, disconnectDB } = require('../config/db'); // Asumiendo que tienes funciones para conectar y desconectar la DB
require('dotenv').config({ path: '../.env' }); // Asegúrate de que el .env sea accesible

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/transportsys';

const employeeData = [
    {
        firstName: 'Juan',
        lastName: 'Pérez',
        cedula: '12345678',
        rif: 'J-12345678-0',
        birthDate: '1990-05-15',
        gender: GENDERS.MALE,
        address: 'Av. Libertador #123, Caracas',
        phone: '04121234567',
        email: 'juan.perez@example.com',
        position: 'Desarrollador Frontend',
        department: 'Tecnología',
        contractType: CONTRACT_TYPES.FIXED,
        startDate: '2020-01-20',
        salary: 1500
    },
    {
        firstName: 'María',
        lastName: 'González',
        cedula: '87654321',
        rif: 'V-87654321-1',
        birthDate: '1988-11-22',
        gender: GENDERS.FEMALE,
        address: 'Calle Real #45, Valencia',
        phone: '04149876543',
        email: 'maria.gonzalez@example.com',
        position: 'Gerente de Proyectos',
        department: 'Gestión',
        contractType: CONTRACT_TYPES.FIXED,
        startDate: '2018-07-01',
        salary: 2000
    },
    {
        firstName: 'Pedro',
        lastName: 'Ramírez',
        cedula: '11223344',
        rif: 'E-11223344-2',
        birthDate: '1992-03-10',
        gender: GENDERS.MALE,
        address: 'Urb. El Bosque, Av. Principal, Maracay',
        phone: '04265551234',
        email: 'pedro.ramirez@example.com',
        position: 'Analista de Datos',
        department: 'Finanzas',
        contractType: CONTRACT_TYPES.TEMPORARY,
        startDate: '2021-09-01',
        salary: 1200
    },
    {
        firstName: 'Ana',
        lastName: 'López',
        cedula: '99887766',
        rif: 'J-99887766-3',
        birthDate: '1995-07-01',
        gender: GENDERS.FEMALE,
        address: 'Sector 5, Calle 2, Barquisimeto',
        phone: '04167778899',
        email: 'ana.lopez@example.com',
        position: 'Diseñador Gráfico',
        department: 'Marketing',
        contractType: CONTRACT_TYPES.SERVICES,
        startDate: '2022-03-15',
        salary: 1000
    },
    {
        firstName: 'Luis',
        lastName: 'Hernández',
        cedula: '22334455',
        rif: 'V-22334455-4',
        birthDate: '1985-01-20',
        gender: GENDERS.MALE,
        address: 'Calle Los Robles, Casa 7, Mérida',
        phone: '04241112233',
        email: 'luis.hernandez@example.com',
        position: 'Ingeniero de Soporte',
        department: 'Soporte Técnico',
        contractType: CONTRACT_TYPES.FIXED,
        startDate: '2019-05-01',
        salary: 1400
    },
    {
        firstName: 'Sofía',
        lastName: 'Díaz',
        cedula: '33445566',
        rif: 'P-33445566-5',
        birthDate: '1998-09-03',
        gender: GENDERS.FEMALE,
        address: 'Av. Intercomunal, Res. Sol, Puerto La Cruz',
        phone: '04169990011',
        email: 'sofia.diaz@example.com',
        position: 'Asistente Administrativo',
        department: 'Administración',
        contractType: CONTRACT_TYPES.INTERNSHIP,
        startDate: '2023-01-10',
        salary: 800
    },
    {
        firstName: 'Carlos',
        lastName: 'García',
        cedula: '44556677',
        rif: 'J-44556677-6',
        birthDate: '1980-02-28',
        gender: GENDERS.MALE,
        address: 'Urb. Los Pinos, Calle Principal, San Cristóbal',
        phone: '04123334455',
        email: 'carlos.garcia@example.com',
        position: 'Contador',
        department: 'Contabilidad',
        contractType: CONTRACT_TYPES.FIXED,
        startDate: '2017-08-01',
        salary: 1800
    },
    {
        firstName: 'Laura',
        lastName: 'Martínez',
        cedula: '55667788',
        rif: 'V-55667788-7',
        birthDate: '1993-12-05',
        gender: GENDERS.FEMALE,
        address: 'Centro Ciudad, Edificio A, Cumana',
        phone: '04142223344',
        email: 'laura.martinez@example.com',
        position: 'Especialista en RRHH',
        department: 'Recursos Humanos',
        contractType: CONTRACT_TYPES.FIXED,
        startDate: '2020-11-01',
        salary: 1600
    },
    {
        firstName: 'Diego',
        lastName: 'Ruiz',
        cedula: '66778899',
        rif: 'G-66778899-8',
        birthDate: '1991-04-25',
        gender: GENDERS.MALE,
        address: 'Zona Industrial, Galpón 3, Acarigua',
        phone: '04261110000',
        email: 'diego.ruiz@example.com',
        position: 'Logística y Distribución',
        department: 'Operaciones',
        contractType: CONTRACT_TYPES.TEMPORARY,
        startDate: '2022-06-01',
        salary: 1300
    },
    {
        firstName: 'Elena',
        lastName: 'Sánchez',
        cedula: '77889900',
        rif: 'C-77889900-9',
        birthDate: '1987-10-08',
        gender: GENDERS.FEMALE,
        address: 'Urbanización X, Casa 1, Punto Fijo',
        phone: '04128889900',
        email: 'elena.sanchez@example.com',
        position: 'Asistente Legal',
        department: 'Legal',
        contractType: CONTRACT_TYPES.FIXED,
        startDate: '2019-02-15',
        salary: 1700
    }
];

const seedEmployees = async () => {
    await connectDB(MONGO_URI); // Conectar a la base de datos

    try {
        console.log('🔄 Iniciando siembra de empleados...');
        await Employee.deleteMany({}); // Opcional: Limpiar empleados existentes antes de sembrar
        console.log('✅ Empleados existentes eliminados (si los había).');

        const createdEmployees = await Employee.insertMany(employeeData);
        console.log(`✅ ${createdEmployees.length} empleados creados con éxito.`);
    } catch (error) {
        console.error('❌ Error al sembrar empleados:', error);
    } finally {
        await disconnectDB(); // Desconectar de la base de datos
        console.log('🏁 Proceso de siembra finalizado y base de datos desconectada.');
    }
};

module.exports = seedEmployees;

// Ejecutar el seeder si este archivo es el script principal
if (require.main === module) {
    seedEmployees();
} 