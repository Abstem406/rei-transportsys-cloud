const express = require('express');
const cors = require('cors');
const useragent = require('express-useragent');
const { connectDB, getConnectionStatus } = require('./src/config/db');
const apiRoutes = require('./src/routes/api');
// const seedEmployees = require('./src/seeders/employeeSeeder'); // Importar el seeder
require('dotenv').config();

const app = express();

// Configuración del servidor
const PORT = process.env.PORT || 3500;
const HOST = process.env.HOST || '0.0.0.0'; // IP por defecto, puede ser cambiada por variable de entorno
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/transportsys';

// Middleware básico
// app.use(cors()); // Habilitar CORS para todas las rutas

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // '*' solo para fallback local
  credentials: true                       // si vas a enviar cookies / Authorization
};
app.use(cors(corsOptions));

app.use(useragent.express());

// Función para obtener información del dispositivo
function getDeviceInfo(ua) {
    let deviceType = 'Computadora';
    let platform = ua.platform;
    let browser = ua.browser;

    // Detectar tipo de dispositivo
    if (ua.isMobile) {
        deviceType = 'Móvil';
    } else if (ua.isTablet) {
        deviceType = 'Tablet';
    }

    // Mejorar detección de plataforma
    if (ua.isMac) {
        platform = 'macOS';
    } else if (ua.isWindows) {
        platform = 'Windows';
    } else if (ua.isLinux) {
        platform = 'Linux';
    } else if (ua.isiPhone || ua.isiPad || ua.isiPod) {
        platform = 'iOS';
    } else if (ua.isAndroid) {
        platform = 'Android';
    }

    // Detectar navegadores específicos
    if (ua.isChrome) {
        browser = 'Chrome';
    } else if (ua.isFirefox) {
        browser = 'Firefox';
    } else if (ua.isSafari) {
        browser = 'Safari';
    } else if (ua.isEdge) {
        browser = 'Edge';
    } else if (ua.isOpera) {
        browser = 'Opera';
    } else if (ua.source.toLowerCase().includes('brave')) {
        browser = 'Brave';
    }

    return { deviceType, platform, browser };
}

// Middleware para registrar conexiones
app.use((req, res, next) => {

    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    const deviceInfo = getDeviceInfo(req.useragent);
    
    // Línea separadora para mayor visibilidad
    console.log('\n================================================');
    console.log('🔔 NUEVA CONEXIÓN DETECTADA - ' + new Date().toLocaleString());
    console.log('================================================');
    console.log(`📱 Dispositivo: ${deviceInfo.deviceType}`);
    console.log(`💻 Sistema: ${deviceInfo.platform}`);
    console.log(`🌐 Navegador: ${deviceInfo.browser}`);
    console.log(`🔗 URL accedida: ${req.method} ${req.url}`);
    console.log(`📍 IP: ${req.ip}`);
    console.log('================================================\n');

    next();
});

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Rutas API
app.use('/api', apiRoutes);

// Ruta de estado del servidor y base de datos
app.get('/status', (req, res) => {
    const dbStatus = getConnectionStatus();
    const deviceInfo = getDeviceInfo(req.useragent);
    
    res.json({
        server: {
            status: 'running',
            host: HOST,
            port: PORT
        },
        database: {
            isConnected: dbStatus.isConnected,
            state: dbStatus.state
        },
        client: {
            deviceType: deviceInfo.deviceType,
            platform: deviceInfo.platform,
            browser: deviceInfo.browser,
            ip: req.ip,
            timestamp: new Date().toISOString()
        }
    });
});

// Iniciar servidor y conectar a la base de datos
const startServer = async () => {
    try {
        // Conectar a la base de datos
        await connectDB(MONGO_URI);

        // Ejecutar el seeder de empleados después de conectar la DB
        // await seedEmployees(); 
        
        // Iniciar el servidor
        app.listen(PORT, HOST, () => {
            console.log(`\n🚀 Servidor iniciado:`);
            console.log(`📡 API corriendo en http://${HOST}:${PORT}`);
            console.log(`📝 Estado: http://${HOST}:${PORT}/status`);
            console.log(`🔗 API Test: http://${HOST}:${PORT}/api/test`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();