require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const readline = require('readline');
const { Employee, CONTRACT_TYPES, GENDERS } = require('../models/Employee');
const { connectDB, disconnectDB } = require('../config/db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => {
    rl.question(query, resolve);
});

async function createEmployee() {
    try {
        console.log('Conectando a la base de datos...');
        await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/transportsys');

        console.log('\n--- Crear Nuevo Empleado ---');

        const firstName = await question('Nombre: ');
        const lastName = await question('Apellido: ');
        const cedula = await question('Cédula: ');
        const rif = await question('RIF: ');
        
        let birthDate;
        while (true) {
            const dateInput = await question('Fecha de Nacimiento (YYYY-MM-DD): ');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                console.error('❌ Formato de fecha inválido. Use YYYY-MM-DD.');
                continue;
            }
            birthDate = dateInput;
            break;
        }

        let gender;
        const genderOptions = Object.values(GENDERS).join(', ');
        while (true) {
            const input = await question(`Género (${genderOptions}): `);
            if (Object.values(GENDERS).includes(input.toLowerCase())) {
                gender = input.toLowerCase();
                break;
            } else {
                console.error(`❌ Género inválido. Use uno de: ${genderOptions}.`);
            }
        }

        const address = await question('Dirección: ');
        const phone = await question('Teléfono: ');

        let email;
        while (true) {
            const emailInput = await question('Email: ');
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(emailInput)) {
                console.error('❌ Formato de correo electrónico inválido.');
                continue;
            }
            email = emailInput;
            break;
        }

        const position = await question('Puesto: ');
        const department = await question('Departamento: ');

        let contractType;
        const contractOptions = Object.values(CONTRACT_TYPES).join(', ');
        while (true) {
            const input = await question(`Tipo de Contrato (${contractOptions}): `);
            if (Object.values(CONTRACT_TYPES).includes(input.toLowerCase())) {
                contractType = input.toLowerCase();
                break;
            } else {
                console.error(`❌ Tipo de contrato inválido. Use uno de: ${contractOptions}.`);
            }
        }

        let startDate;
        while (true) {
            const dateInput = await question('Fecha de Ingreso (YYYY-MM-DD): ');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                console.error('❌ Formato de fecha inválido. Use YYYY-MM-DD.');
                continue;
            }
            startDate = dateInput;
            break;
        }

        let salary;
        while (true) {
            const salaryInput = parseFloat(await question('Salario: '));
            if (isNaN(salaryInput) || salaryInput < 0) {
                console.error('❌ Salario inválido. Debe ser un número positivo.');
                continue;
            }
            salary = salaryInput;
            break;
        }

        // Verificar si ya existe un empleado con esa cédula o email
        const existingEmployeeByCedula = await Employee.findOne({ cedula });
        if (existingEmployeeByCedula) {
            throw new Error('Ya existe un empleado con esa cédula.');
        }
        const existingEmployeeByEmail = await Employee.findOne({ email });
        if (existingEmployeeByEmail) {
            throw new Error('Ya existe un empleado con ese correo electrónico.');
        }

        // Crear el empleado
        const newEmployee = new Employee({
            firstName,
            lastName,
            cedula,
            rif,
            birthDate,
            gender,
            address,
            phone,
            email,
            position,
            department,
            contractType,
            startDate,
            salary
        });

        await newEmployee.save();

        console.log('\n✅ Empleado creado exitosamente!');
        console.log(`Nombre Completo: ${newEmployee.fullName}`);
        console.log(`Cédula: ${newEmployee.cedula}`);
        console.log(`Email: ${newEmployee.email}`);
        console.log('Puedes verificarlo en la interfaz de gestión de empleados.');

    } catch (error) {
        console.error('❌ Error al crear empleado:', error.message);
    } finally {
        rl.close();
        await disconnectDB();
        process.exit();
    }
}

// Ejecutar el comando
if (require.main === module) {
    createEmployee();
} 