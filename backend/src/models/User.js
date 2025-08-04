const mongoose = require('mongoose');
const crypto = require('crypto');

const ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    OPERATOR: 'operator'
};

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El correo electrónico es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un correo electrónico válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Método para encriptar la contraseña usando SHA256
userSchema.methods.encryptPassword = function(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// Middleware para encriptar la contraseña antes de guardar
userSchema.pre('save', function(next) {
    if (this.isModified('password')) {
        this.password = this.encryptPassword(this.password);
    }
    next();
});

// Método para verificar la contraseña
userSchema.methods.checkPassword = function(password) {
    return this.password === this.encryptPassword(password);
};

// Métodos de ayuda para verificar roles
userSchema.methods.isOperator = function() {
    return this.role === ROLES.OPERATOR;
};

userSchema.methods.isAdmin = function() {
    return this.role === ROLES.ADMIN || this.role === ROLES.OPERATOR;
};

const User = mongoose.model('User', userSchema);

module.exports = {
    User,
    ROLES
};
