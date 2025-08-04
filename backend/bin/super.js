#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Importar comandos
const createSuperuser = require('../src/commands/createSuperuser');
const createUser = require('../src/commands/createUser');

program
    .version('1.0.0')
    .description('CLI de administración para TransportSys');

program
    .command('create-superuser')
    .description('Crear un nuevo superusuario (rol: operator)')
    .action(async () => {
        await createSuperuser();
    });

program
    .command('create-user <name> <email> <password>')
    .description('Crear un nuevo usuario con un rol específico (por defecto: user)')
    .option('-r, --role <role>', 'Rol del usuario (user, admin)', 'user')
    .action(async (name, email, password, options) => {
        await createUser(name, email, password, options.role);
    });

program.parse(process.argv); 