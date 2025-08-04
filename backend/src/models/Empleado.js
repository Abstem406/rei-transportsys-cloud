const mongoose = require('mongoose');
const crypto = require('crypto');

const employeeSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'El primer nombre es requerido'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es requerido'],
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
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
        required: [true, 'El puesto es requerido']
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'El departamento es requerido']
    },
    contractType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContractType',
        required: [true, 'El tipo de contrato es requerido']
    },
    startDate: {
        type: Date,
        required: [true, 'La fecha de inicio de contrato es requerida'],
        default: Date.now
    },
    birthDate: {
        type: Date,
        required: [true, 'La fecha de nacimiento es requerida']
    },
    gender: {
        type: String,
        enum: ['masculino', 'femenino', 'otro'],
        required: [true, 'El género es requerido']
    },
    cedula: {
        type: String,
        required: [true, 'La cédula es requerida'],
        unique: true,
        trim: true
    },
    rif: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    salary: {
        type: Number,
        required: [true, 'El salario es requerido'],
        min: [0, 'El salario no puede ser negativo']
    },
    phone: {
        type: String,
        required: [true, 'El teléfono es requerido'],
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Virtual for employee's full name
employeeSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Middleware to hash password before saving (if password is provided/modified)
employeeSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        this.password = crypto.createHash('sha256').update(this.password).digest('hex');
    }
    next();
});

// Method to compare password (should use the same hashing logic)
employeeSchema.methods.comparePassword = function(candidatePassword) {
    return this.password === crypto.createHash('sha256').update(candidatePassword).digest('hex');
};

// JSON transformation to include virtuals and exclude sensitive data
employeeSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee; 