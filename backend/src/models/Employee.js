const mongoose = require('mongoose');

const CONTRACT_TYPES = {
    FIXED: 'fijo',
    TEMPORARY: 'temporal',
    SERVICES: 'servicios',
    INTERNSHIP: 'pasantia'
};

const GENDERS = {
    MALE: 'masculino',
    FEMALE: 'femenino',
    OTHER: 'otro'
};

const employeeSchema = new mongoose.Schema({
    // Información personal
    firstName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true
    },
    cedula: {
        type: String,
        required: [true, 'La cédula es requerida'],
        unique: true,
        trim: true
    },
    rif: {
        type: String,
        required: [true, 'El RIF es requerido'],
        unique: true,
        trim: true
    },
    birthDate: {
        type: Date,
        required: [true, 'La fecha de nacimiento es requerida']
    },
    gender: {
        type: String,
        enum: Object.values(GENDERS),
        required: [true, 'El género es requerido']
    },
    address: {
        type: String,
        required: [true, 'La dirección es requerida'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'El número de teléfono es requerido'],
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

    // Información laboral
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
        required: [true, 'El cargo es requerido'],
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'El departamento es requerido'],
    },
    contractType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContractType',
        required: [true, 'El tipo de contrato es requerido']
    },
    startDate: {
        type: Date,
        required: [true, 'La fecha de ingreso es requerida']
    },
    salary: {
        type: Number,
        required: [true, 'El salario es requerido']
    },

    // Estado y referencias
    active: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        sparse: true // Permite que sea null/undefined
    }
}, {
    timestamps: true
});

// Método virtual para obtener el nombre completo
employeeSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Índices

// Método para obtener información pública del empleado
employeeSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        fullName: this.fullName,
        cedula: this.cedula,
        rif: this.rif,
        birthDate: this.birthDate,
        gender: this.gender,
        address: this.address,
        phone: this.phone,
        email: this.email,
        position: this.position,
        department: this.department,
        contractType: this.contractType,
        startDate: this.startDate,
        active: this.active,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = {
    Employee,
    CONTRACT_TYPES,
    GENDERS
}; 