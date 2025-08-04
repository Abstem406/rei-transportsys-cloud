const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');

const auth = async (req, res, next) => {
    try {
        console.log('Iniciando middleware de autenticación...');
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            console.log('No se encontró token en la petición');
            return res.status(401).json({ message: 'Acceso denegado' });
        }

        console.log('Token encontrado, verificando...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
        console.log('Token decodificado:', decoded);

        const user = await User.findById(decoded.id);
        console.log('Usuario encontrado:', user);

        if (!user) {
            console.log('No se encontró el usuario en la base de datos');
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        req.user = user;
        console.log('Usuario autenticado correctamente');
        next();
    } catch (error) {
        console.error('Error detallado en autenticación:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(401).json({ message: 'Token inválido: ' + error.message });
    }
};

// Middleware para requerir rol de operador
const requireOperator = (req, res, next) => {
    console.log('Verificando rol de operador...');
    console.log('Usuario:', req.user);
    if (req.user.role !== ROLES.OPERATOR) {
        console.log('Usuario no es operador');
        return res.status(403).json({ message: 'Se requieren permisos de operador' });
    }
    console.log('Usuario es operador, permitiendo acceso');
    next();
};

// Middleware para requerir rol de administrador o superior
const requireAdmin = (req, res, next) => {
    console.log('Verificando rol de administrador...');
    console.log('Usuario:', req.user);
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.OPERATOR) {
        console.log('Usuario no tiene permisos de administrador');
        return res.status(403).json({ message: 'Se requieren permisos de administrador' });
    }
    console.log('Usuario tiene permisos de administrador, permitiendo acceso');
    next();
};

module.exports = {
    auth,
    requireOperator,
    requireAdmin
}; 