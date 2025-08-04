const { connectDB } = require('../config/db');
const { User, ROLES } = require('../models/User');

async function migrateUsers() {
    try {
        console.log('Conectando a la base de datos...');
        await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/transportsys');

        console.log('Buscando usuarios para migrar...');
        const users = await User.find({});
        
        console.log(`Encontrados ${users.length} usuarios para migrar`);

        for (const user of users) {
            // Si el usuario es superusuario, convertirlo en operador
            if (user.isSuperuser === true) {
                console.log(`Convirtiendo usuario ${user.email} de superusuario a operador`);
                user.role = ROLES.OPERATOR;
                await user.save();
                console.log(`Usuario ${user.email} actualizado a operador`);
            }
            // Si el usuario no tiene rol definido, asignarle rol de usuario
            else if (!user.role) {
                console.log(`Asignando rol de usuario a ${user.email}`);
                user.role = ROLES.USER;
                await user.save();
                console.log(`Usuario ${user.email} actualizado a usuario normal`);
            }
        }

        console.log('Migración completada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

migrateUsers(); 