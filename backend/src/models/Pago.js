const mongoose = require('mongoose');

const PagoSchema = new mongoose.Schema({
    paymentType: {
        type: String,
        enum: ['employee', 'owner', 'company_out', 'company_in'], // New payment types
        required: true,
        default: 'employee' // Default to employee payment for existing data consistency
    },
    ruta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ruta',
        required: false // Now optional, only for employee/owner payments
    },
    empleado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false // Now optional, only for employee payments
    },
    propietario: { // New field for owner payments
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Propietario',
        required: false
    },
    thirdPartyName: { // New field for company_out/company_in
        type: String,
        trim: true,
        required: false,
        maxlength: 100
    },
    thirdPartyIdentification: { // New field for company_out/company_in (e.g., RIF, Cedula)
        type: String,
        trim: true,
        required: false,
        maxlength: 50
    },
    thirdPartyContact: { // New field for company_out/company_in (e.g., phone, email)
        type: String,
        trim: true,
        required: false,
        maxlength: 100
    },
    monto: {
        type: Number,
        required: true,
        min: 0
    },
    fechaPago: {
        type: Date,
        default: Date.now
    },
    concepto: {
        type: String,
        trim: true,
        required: true
    },
    metodoPago: {
        type: String,
        enum: ['Efectivo', 'Transferencia', 'Tarjeta de Crédito/Débito', 'Otro'],
        default: 'Efectivo'
    },
    referencia: {
        type: String,
        trim: true,
        maxlength: 100
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'Pagado', 'Rechazado'],
        default: 'Pendiente'
    },
    notas: {
        type: String,
        trim: true,
        maxlength: 500
    },
    receiptImageUrl: { // New field for receipt image URL
        type: String,
        trim: true,
        required: false,
        maxlength: 255
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Add a pre-save hook for validation based on paymentType
PagoSchema.pre('save', function(next) {
    if (this.paymentType === 'employee') {
        if (!this.empleado) {
            return next(new Error('El campo "empleado" es requerido para pagos de tipo "employee".'));
        }
        this.propietario = undefined;
        this.thirdPartyName = undefined;
        this.thirdPartyIdentification = undefined;
        this.thirdPartyContact = undefined;
    } else if (this.paymentType === 'owner') {
        if (!this.propietario) {
            return next(new Error('El campo "propietario" es requerido para pagos de tipo "owner".'));
        }
        this.empleado = undefined;
        this.thirdPartyName = undefined;
        this.thirdPartyIdentification = undefined;
        this.thirdPartyContact = undefined;
    } else if (this.paymentType === 'company_out' || this.paymentType === 'company_in') {
        if (!this.thirdPartyName) {
            return next(new Error('El campo "thirdPartyName" es requerido para pagos de tipo "company_out" o "company_in".'));
        }
        this.empleado = undefined;
        this.propietario = undefined;
        this.ruta = undefined; // Ruta is not directly tied to third-party payments
    }
    // For payments related to rutas, if 'ruta' is provided, it's optional for employee/owner.
    // For 'company_out' and 'company_in', 'ruta' should generally be null/undefined.
    // However, if it's implicitly part of the concept, it's fine.
    next();
});

module.exports = mongoose.model('Pago', PagoSchema); 