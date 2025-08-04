const mongoose = require('mongoose');

const rutaSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    startLocation: {
        type: String,
        required: true,
        trim: true
    },
    endLocation: {
        type: String,
        required: true,
        trim: true
    },
    chuto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: false // Puede no tener chuto o trailer, o ambos
    },
    trailer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: false // Puede no tener chuto o trailer, o ambos
    },
    conductor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false
    },
    // choferAuxiliar: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Employee',
    //     required: false
    // },
    auxiliar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false
    },
    concept: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: false
    },
    endDate: {
        type: Date,
        required: false // Puede ser nula
    }
}, {
    timestamps: true
});

const Ruta = mongoose.model('Ruta', rutaSchema);

module.exports = Ruta; 