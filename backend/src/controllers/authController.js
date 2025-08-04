const { User } = require('../models/User');
const jwt = require('jsonwebtoken');

const authController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Buscar usuario
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // Verificar contraseña
            const isValidPassword = user.checkPassword(password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // Generar token
            const token = jwt.sign(
                { 
                    id: user._id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || 'tu_secreto_jwt',
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    },

    validateToken: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'Token no proporcionado' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({ message: 'Usuario no encontrado' });
            }

            res.json({
                user: {
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            res.status(401).json({ message: 'Token inválido' });
        }
    }
};

module.exports = authController; 