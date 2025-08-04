const bcrypt = require('bcrypt');
const { User, ROLES } = require('../models/User');
const { body, validationResult } = require('express-validator');

const userController = {
  // Listar todos los usuarios
  async listUsers(req, res) {
    try {
      console.log('Iniciando listUsers...');
      console.log('Usuario autenticado:', req.user);

      const users = await User.find({
        ...(req.query.role && { role: req.query.role })
      }, {
        password: 0 // Excluir el campo password
      });

      console.log('Usuarios encontrados:', users);
      res.json(users);
    } catch (error) {
      console.error('Error detallado al listar usuarios:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ error: 'Error al obtener usuarios: ' + error.message });
    }
  },

  // Crear usuario
  async createUser(req, res) {
    try {
      console.log('Iniciando createUser...');
      console.log('Datos recibidos:', req.body);
      console.log('Usuario autenticado:', req.user);

      const { email, password, name, role } = req.body;
      const requestingUser = req.user;

      // Verificar permisos para asignar roles
      if (role) {
        console.log('Verificando permisos para rol:', role);
        // Solo un operador puede crear administradores
        if (role === ROLES.ADMIN && !requestingUser.isOperator()) {
          return res.status(403).json({ error: 'No tienes permisos para crear administradores' });
        }
        // Nadie puede crear operadores a través de la API
        if (role === ROLES.OPERATOR) {
          return res.status(403).json({ error: 'No se pueden crear operadores a través de esta interfaz' });
        }
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Crear usuario
      const user = new User({
        email,
        password,
        name,
        role: role || ROLES.USER
      });

      await user.save();
      console.log('Usuario creado:', user);

      // Enviar respuesta sin el campo password
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error detallado al crear usuario:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ error: 'Error al crear usuario: ' + error.message });
    }
  },

  // Actualizar usuario
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, name, role, password } = req.body;
      const requestingUser = req.user; // Usuario que hace la petición

      // Obtener el usuario a actualizar
      const userToUpdate = await User.findById(id);
      if (!userToUpdate) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar permisos para cambiar roles
      if (role && role !== userToUpdate.role) {
        // Solo un operador puede cambiar a alguien a administrador
        if (role === ROLES.ADMIN && !requestingUser.isOperator()) {
          return res.status(403).json({ error: 'No tienes permisos para asignar el rol de administrador' });
        }
        // Nadie puede asignar el rol de operador
        if (role === ROLES.OPERATOR) {
          return res.status(403).json({ error: 'No se puede asignar el rol de operador' });
        }
        // Un administrador no puede modificar a otro administrador u operador
        if (requestingUser.role === ROLES.ADMIN && 
            (userToUpdate.role === ROLES.ADMIN || userToUpdate.role === ROLES.OPERATOR)) {
          return res.status(403).json({ error: 'No tienes permisos para modificar este usuario' });
        }
      }

      // Verificar si el email ya existe para otro usuario
      if (email && email !== userToUpdate.email) {
        const existingUser = await User.findOne({
          email,
          _id: { $ne: id }
        });

        if (existingUser) {
          return res.status(400).json({ error: 'El email ya está en uso' });
        }
      }

      // Preparar datos de actualización
      const updateData = {
        ...(email && { email }),
        ...(name && { name }),
        ...(role && { role })
      };

      // Si hay nueva contraseña, incluirla
      if (password) {
        updateData.password = password;
      }

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true,
          select: '-password'
        }
      );

      res.json(user);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  },

  // Eliminar usuario
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  },

  // Obtener un usuario por ID
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id, { password: 0 });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  }
};

// Create an error handler middleware
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.success = false;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

const validateUserInput = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = userController; 