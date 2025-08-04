const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido']
  },
  apellidos: {
    type: String,
    required: [true, 'Los apellidos son requeridos']
  },
  dni: {
    type: String,
    required: [true, 'El DNI es requerido'],
    unique: true
  },
  licencia: {
    tipo: {
      type: String,
      required: [true, 'El tipo de licencia es requerido']
    },
    numero: {
      type: String,
      required: [true, 'El número de licencia es requerido'],
      unique: true
    },
    fechaVencimiento: {
      type: Date,
      required: [true, 'La fecha de vencimiento es requerida']
    }
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido']
  },
  direccion: String,
  activo: {
    type: Boolean,
    default: true
  },
  vehiculosAsignados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehiculo'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Conductor', conductorSchema); 