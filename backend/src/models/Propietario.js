const mongoose = require('mongoose');

const propietarioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    cedula: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        match: /^\S+@\S+\.\S+$/
    }
}, {
    timestamps: true
});

const Propietario = mongoose.model('Propietario', propietarioSchema);

module.exports = Propietario; 