const mongoose = require('mongoose');

// Estado de la conexión
let isConnected = false;

const connectDB = async (mongoUri) => {
    if (isConnected) {
        console.log('💾 Using existing database connection');
        return;
    }

    try {
        const db = await mongoose.connect(mongoUri);

        isConnected = true;
        console.log('✅ Database connected successfully');
        
        // Eventos de conexión
        mongoose.connection.on('connected', () => {
            isConnected = true;
            console.log('🔄 MongoDB connected');
        });

        mongoose.connection.on('error', (err) => {
            isConnected = false;
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.log('❌ MongoDB disconnected');
        });

        return db;
    } catch (error) {
        isConnected = false;
        console.error('❌ Error connecting to database:', error);
        process.exit(1);
    }
};

// Función para verificar el estado de la conexión
const getConnectionStatus = () => {
    return {
        isConnected,
        state: mongoose.connection.readyState
    };
};

module.exports = {
    connectDB,
    getConnectionStatus
};
