const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FacturaSchema = new Schema({
    // Número de factura, autogenerado y único
    invoiceNumber: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },
    // Referencia a la Ruta que origina la factura
    ruta: {
        type: Schema.Types.ObjectId,
        ref: 'Ruta',
        required: true,
    },
    // Información del cliente (puede ser poblada desde Propietario o introducida manualmente)
    clientName: {
        type: String,
        required: true,
        trim: true,
    },
    clientIdentification: { // Cédula o RIF del cliente
        type: String,
        trim: true,
    },
    clientAddress: {
        type: String,
        trim: true,
    },
    clientPhone: {
        type: String,
        trim: true,
    },
    clientEmail: {
        type: String,
        trim: true,
        lowercase: true,
    },
    // Fecha de emisión de la factura
    invoiceDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    // Conceptos/Items de la factura (array de objetos para permitir múltiples items)
    items: [
        {
            description: { type: String, required: true, trim: true },
            quantity: { type: Number, required: true, min: 0 },
            unitPrice: { type: Number, required: true, min: 0 },
            total: { type: Number, required: true, min: 0 },
        }
    ],
    // Montos totales
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    tax: { // Porcentaje de impuesto o monto fijo de impuesto
        type: Number,
        default: 0,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    // Estado de pago de la factura
    paymentStatus: {
        type: String,
        enum: ['Pendiente', 'Pagado', 'Anulado'],
        default: 'Pendiente',
    },
    // Notas adicionales
    notes: {
        type: String,
        trim: true,
    },
    // Referencia al usuario que creó la factura
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true, // `createdAt` and `updatedAt`
});

module.exports = mongoose.model('Factura', FacturaSchema); 