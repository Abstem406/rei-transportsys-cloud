const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['chuto', 'trailer'],
        required: true
    },
    name: {
        type: String,
        required: false,
        trim: true
    },
    model: {
        type: String,
        required: false,
        trim: true
    },
    plate: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    propietario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Propietario',
        required: true
    }
}, {
    timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle; 