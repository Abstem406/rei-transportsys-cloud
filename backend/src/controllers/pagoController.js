const Pago = require('../models/Pago');
const Ruta = require('../models/Ruta');
const { Employee } = require('../models/Employee');
const Propietario = require('../models/Propietario');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/receipts'); // Directory for storing receipts
    },
    filename: (req, file, cb) => {
        cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Export upload middleware
exports.upload = upload;

// Create a new Pago
exports.createPago = async (req, res) => {
    try {
        console.log('DEBUG (Backend Create): req.body:', req.body);
        console.log('DEBUG (Backend Create): req.file:', req.file);
        const { paymentType, ruta, empleado, propietario, thirdPartyName, thirdPartyIdentification, thirdPartyContact, monto, fechaPago, concepto, metodoPago, referencia, estado, notas } = req.body;
        const receiptImageUrl = req.file ? `/uploads/receipts/${req.file.filename}` : undefined; // Get image URL if uploaded
        console.log('DEBUG (Backend Create): Generated receiptImageUrl:', receiptImageUrl);

        // Basic validation for common required fields
        if (!paymentType || !monto || !concepto) {
            return res.status(400).json({ message: 'Los campos paymentType, monto y concepto son requeridos.' });
        }

        // Conditional validation based on paymentType
        if (paymentType === 'employee') {
            if (!empleado) return res.status(400).json({ message: 'El campo empleado es requerido para pagos a empleados.' });
            const existingEmployee = await Employee.findById(empleado);
            if (!existingEmployee) return res.status(404).json({ message: 'Empleado no encontrado.' });
            if (ruta) {
                const existingRuta = await Ruta.findById(ruta);
                if (!existingRuta) return res.status(404).json({ message: 'Ruta no encontrada.' });
            }
        } else if (paymentType === 'owner') {
            if (!propietario) return res.status(400).json({ message: 'El campo propietario es requerido para pagos a propietarios.' });
            const existingPropietario = await Propietario.findById(propietario);
            if (!existingPropietario) return res.status(404).json({ message: 'Propietario no encontrado.' });
            if (ruta) {
                const existingRuta = await Ruta.findById(ruta);
                if (!existingRuta) return res.status(404).json({ message: 'Ruta no encontrada.' });
            }
        } else if (paymentType === 'company_out' || paymentType === 'company_in') {
            if (!thirdPartyName) return res.status(400).json({ message: 'El campo thirdPartyName es requerido para pagos a/desde terceros.' });
            // For third-party payments, ruta, empleado, propietario should not be set
            if (ruta || empleado || propietario) {
                return res.status(400).json({ message: 'Ruta, empleado y propietario no deben especificarse para pagos a/desde terceros.' });
            }
        }

        const newPago = new Pago({
            paymentType,
            ruta,
            empleado,
            propietario,
            thirdPartyName,
            thirdPartyIdentification,
            thirdPartyContact,
            monto,
            fechaPago: fechaPago || Date.now(),
            concepto,
            metodoPago,
            referencia,
            estado,
            notas,
            receiptImageUrl // Save the image URL
        });

        console.log('DEBUG (Backend Create): New Pago object before save:', newPago);
        await newPago.save();
        res.status(201).json(newPago);
    } catch (error) {
        console.error('Error creating pago:', error);
        res.status(400).json({ message: error.message });
    }
};

// Get all Pagos with pagination and search
exports.getAllPagos = async (req, res) => {
    try {
        console.log('DEBUG (Backend Get All): Fetching all pagos with query:', req.query);
        const { searchTerm, page = 1, limit = 10, paymentType, rutaId, empleadoId, propietarioId, estado } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        const pipeline = [];

        // Lookup and unwind for ruta, empleado, and propietario
        pipeline.push(
            { $lookup: { from: 'rutas', localField: 'ruta', foreignField: '_id', as: 'ruta' } },
            { $unwind: { path: '$ruta', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'employees', localField: 'empleado', foreignField: '_id', as: 'empleado' } },
            { $unwind: { path: '$empleado', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'propietarios', localField: 'propietario', foreignField: '_id', as: 'propietario' } },
            { $unwind: { path: '$propietario', preserveNullAndEmptyArrays: true } }
        );

        const matchConditions = {};
        if (paymentType) {
            matchConditions.paymentType = paymentType;
        }
        if (rutaId) {
            matchConditions['ruta._id'] = new mongoose.Types.ObjectId(rutaId);
        }
        if (empleadoId) {
            matchConditions['empleado._id'] = new mongoose.Types.ObjectId(empleadoId);
        }
        if (propietarioId) {
            matchConditions['propietario._id'] = new mongoose.Types.ObjectId(propietarioId);
        }
        if (estado) {
            matchConditions.estado = estado;
        }

        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i');
            matchConditions.$or = [
                { concepto: searchRegex },
                { referencia: searchRegex },
                { metodoPago: searchRegex },
                { 'ruta.code': searchRegex },
                { 'ruta.startLocation': searchRegex },
                { 'ruta.endLocation': searchRegex },
                { 'empleado.firstName': searchRegex },
                { 'empleado.lastName': searchRegex },
                { 'propietario.name': searchRegex },
                { 'propietario.cedula': searchRegex },
                { thirdPartyName: searchRegex },
                { thirdPartyIdentification: searchRegex }
            ];
        }

        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({ $match: matchConditions });
        }

        // Facet for pagination and total count
        pipeline.push({
            $facet: {
                items: [
                    { $skip: skip },
                    { $limit: parsedLimit },
                    { 
                        $project: {
                            _id: 1,
                            paymentType: 1,
                            monto: 1,
                            fechaPago: 1,
                            concepto: 1,
                            metodoPago: 1,
                            referencia: 1,
                            estado: 1,
                            notas: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            'ruta._id': 1,
                            'ruta.code': 1,
                            'ruta.startLocation': 1,
                            'ruta.endLocation': 1,
                            'empleado._id': 1,
                            'empleado.firstName': 1,
                            'empleado.lastName': 1,
                            'empleado.cedula': 1,
                            'propietario._id': 1,
                            'propietario.name': 1,
                            'propietario.cedula': 1,
                            thirdPartyName: 1,
                            thirdPartyIdentification: 1,
                            thirdPartyContact: 1,
                            receiptImageUrl: 1, // Include new field
                        }
                    }
                ],
                totalCount: [{ $count: 'count' }]
            }
        });

        const result = await Pago.aggregate(pipeline);

        const pagos = result[0].items;
        const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

        console.log('DEBUG (Backend Get All): Pagos fetched (first 3):', pagos.slice(0, 3)); // Log first few pagos to avoid clutter
        res.status(200).json({
            items: pagos,
            totalCount: totalCount,
        });

    } catch (error) {
        console.error('Error getting all pagos:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Pago by ID
exports.getPagoById = async (req, res) => {
    try {
        const pago = await Pago.findById(req.params.id)
            .populate({ path: 'ruta', select: 'code startLocation endLocation' })
            .populate({ path: 'empleado', select: 'firstName lastName cedula' })
            .populate({ path: 'propietario', select: 'name cedula' });

        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }
        res.status(200).json(pago);
    } catch (error) {
        console.error('Error getting pago by ID:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update a Pago
exports.updatePago = async (req, res) => {
    try {
        console.log('DEBUG (Backend Update): req.body:', req.body);
        console.log('DEBUG (Backend Update): req.file:', req.file);
        const { paymentType, ruta, empleado, propietario, thirdPartyName, thirdPartyIdentification, thirdPartyContact, monto, fechaPago, concepto, metodoPago, referencia, estado, notas } = req.body;
        const receiptImageUrl = req.file ? `/uploads/receipts/${req.file.filename}` : undefined; // Get image URL if uploaded
        console.log('DEBUG (Backend Update): Generated receiptImageUrl:', receiptImageUrl);

        const pago = await Pago.findById(req.params.id);
        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }

        // Basic validation for common required fields on update
        if (!monto || !concepto || !paymentType) {
            return res.status(400).json({ message: 'Los campos paymentType, monto y concepto son requeridos.' });
        }

        // Conditional validation and assignment based on paymentType
        if (paymentType === 'employee') {
            if (!empleado) return res.status(400).json({ message: 'El campo empleado es requerido para pagos de tipo empleado.' });
            const existingEmployee = await Employee.findById(empleado);
            if (!existingEmployee) return res.status(404).json({ message: 'Empleado no encontrado.' });
            pago.empleado = empleado;
            pago.propietario = undefined; // Clear other types
            pago.thirdPartyName = undefined;
            pago.thirdPartyIdentification = undefined;
            pago.thirdPartyContact = undefined;
            // Ruta can be updated if provided
            if (ruta) {
                const existingRuta = await Ruta.findById(ruta);
                if (!existingRuta) return res.status(404).json({ message: 'Ruta no encontrada.' });
                pago.ruta = ruta;
            } else {
                pago.ruta = undefined; // Clear ruta if not provided for employee
            }
        } else if (paymentType === 'owner') {
            if (!propietario) return res.status(400).json({ message: 'El campo propietario es requerido para pagos de tipo propietario.' });
            const existingPropietario = await Propietario.findById(propietario);
            if (!existingPropietario) return res.status(404).json({ message: 'Propietario no encontrado.' });
            pago.propietario = propietario;
            pago.empleado = undefined; // Clear other types
            pago.thirdPartyName = undefined;
            pago.thirdPartyIdentification = undefined;
            pago.thirdPartyContact = undefined;
            // Ruta can be updated if provided
            if (ruta) {
                const existingRuta = await Ruta.findById(ruta);
                if (!existingRuta) return res.status(404).json({ message: 'Ruta no encontrada.' });
                pago.ruta = ruta;
            } else {
                pago.ruta = undefined; // Clear ruta if not provided for owner
            }
        } else if (paymentType === 'company_out' || paymentType === 'company_in') {
            if (!thirdPartyName) return res.status(400).json({ message: 'El campo thirdPartyName es requerido para pagos a/desde terceros.' });
            pago.thirdPartyName = thirdPartyName;
            pago.thirdPartyIdentification = thirdPartyIdentification;
            pago.thirdPartyContact = thirdPartyContact;
            pago.empleado = undefined; // Clear other types
            pago.propietario = undefined;
            pago.ruta = undefined; // Clear ruta for third-party payments
        }

        pago.paymentType = paymentType;
        pago.monto = monto;
        pago.fechaPago = fechaPago || pago.fechaPago;
        pago.concepto = concepto;
        pago.metodoPago = metodoPago;
        pago.referencia = referencia;
        pago.estado = estado;
        pago.notas = notas;
        pago.receiptImageUrl = receiptImageUrl || pago.receiptImageUrl; // Update image URL

        console.log('DEBUG (Backend Update): Pago object before save:', pago);
        await pago.save();
        res.status(200).json(pago);
    } catch (error) {
        console.error('Error updating pago:', error);
        res.status(400).json({ message: error.message });
    }
};

// Delete a Pago
exports.deletePago = async (req, res) => {
    try {
        const pago = await Pago.findByIdAndDelete(req.params.id);
        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting pago:', error);
        res.status(500).json({ message: error.message });
    }
}; 