const Factura = require('../models/Factura');
const Ruta = require('../models/Ruta');
const Propietario = require('../models/Propietario'); // To get client info from vehicle owner
// const pdf = require('html-pdf'); // Import html-pdf
const { generateFacturaPdf } = require('../helpers/pdfGenerator'); // Import the new helper
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Helper to generate a unique invoice number (e.g., INV-YYYYMMDD-XXXX)
const generateInvoiceNumber = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    const prefix = `INV-${year}${month}${day}-`;
    let counter = 0;
    let invoiceNumber = '';
    let isUnique = false;

    while (!isUnique) {
        counter++;
        const suffix = counter.toString().padStart(4, '0');
        invoiceNumber = `${prefix}${suffix}`;
        const existingFactura = await Factura.findOne({ invoiceNumber });
        if (!existingFactura) {
            isUnique = true;
        }
    }
    return invoiceNumber;
};

exports.createFactura = async (req, res) => {
    try {
        const { ruta: rutaId, clientName, clientIdentification, clientAddress, clientPhone, clientEmail, items, tax, paymentStatus, notes } = req.body;
        const userId = req.user.id; // Assuming auth middleware adds user to req

        // Basic validation
        if (!rutaId || !items || items.length === 0 || !clientName) {
            return res.status(400).json({ message: 'Los campos ruta, nombre del cliente y al menos un item son requeridos.' });
        }

        const ruta = await Ruta.findById(rutaId)
            .populate('chuto')
            .populate('trailer');
        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }

        // Calculate subtotal and totalAmount from items
        let subtotal = 0;
        items.forEach(item => {
            if (typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
                throw new Error('Cantidad y precio unitario de los ítems deben ser números positivos.');
            }
            item.total = item.quantity * item.unitPrice;
            subtotal += item.total;
        });

        const calculatedTax = tax || 0; // If tax is not provided, default to 0
        const totalAmount = subtotal + calculatedTax; // Simple sum for now, can be adjusted for percentage

        const invoiceNumber = await generateInvoiceNumber();

        const newFactura = new Factura({
            invoiceNumber,
            ruta: rutaId,
            clientName,
            clientIdentification,
            clientAddress,
            clientPhone,
            clientEmail,
            items,
            subtotal,
            tax: calculatedTax,
            totalAmount,
            paymentStatus: paymentStatus || 'Pendiente',
            notes,
            createdBy: userId,
        });

        await newFactura.save();
        res.status(201).json(newFactura);
    } catch (error) {
        console.error('Error creating factura:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.getAllFacturas = async (req, res) => {
    try {
        const { searchTerm, page = 1, limit = 10, paymentStatus, rutaId } = req.query;
        const query = {};

        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i');
            query.$or = [
                { invoiceNumber: searchRegex },
                { clientName: searchRegex },
                { clientIdentification: searchRegex },
                { 'items.description': searchRegex },
            ];
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        if (rutaId) {
            query.ruta = rutaId;
        }

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const totalCount = await Factura.countDocuments(query);
        const facturas = await Factura.find(query)
            .populate({
                path: 'ruta',
                select: 'code startLocation endLocation concept', // Select relevant fields from Ruta
            })
            .populate({
                path: 'createdBy',
                select: 'name email', // Select relevant fields from User
            })
            .sort({ invoiceDate: -1 }) // Sort by latest invoices
            .skip(skip)
            .limit(limitNumber);

        res.status(200).json({ items: facturas, totalCount });
    } catch (error) {
        console.error('Error getting all facturas:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getFacturaById = async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id)
            .populate({
                path: 'ruta',
                populate: [ // Populate nested fields in ruta
                    { path: 'chuto', select: 'plate code type propietario' },
                    { path: 'trailer', select: 'plate code type propietario' },
                    { path: 'conductor', select: 'firstName lastName fullName' },
                    { path: 'auxiliar', select: 'firstName lastName fullName' }
                ]
            })
            .populate({
                path: 'createdBy',
                select: 'name email',
            });

        // Optionally populate propietario details if chuto/trailer has one
        if (factura && factura.ruta) {
            if (factura.ruta.chuto && factura.ruta.chuto.propietario) {
                await factura.ruta.chuto.populate('propietario', 'name cedula phone address email');
            }
            if (factura.ruta.trailer && factura.ruta.trailer.propietario) {
                await factura.ruta.trailer.populate('propietario', 'name cedula phone address email');
            }
        }

        if (!factura) {
            return res.status(404).json({ message: 'Factura no encontrada.' });
        }
        res.status(200).json(factura);
    } catch (error) {
        console.error('Error getting factura by ID:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateFactura = async (req, res) => {
    try {
        const { clientName, clientIdentification, clientAddress, clientPhone, clientEmail, items, tax, paymentStatus, notes } = req.body;
        const { id } = req.params;

        const factura = await Factura.findById(id);
        if (!factura) {
            return res.status(404).json({ message: 'Factura no encontrada.' });
        }

        // Update fields if provided
        if (clientName) factura.clientName = clientName;
        if (clientIdentification) factura.clientIdentification = clientIdentification;
        if (clientAddress) factura.clientAddress = clientAddress;
        if (clientPhone) factura.clientPhone = clientPhone;
        if (clientEmail) factura.clientEmail = clientEmail;
        if (notes) factura.notes = notes;
        if (paymentStatus) factura.paymentStatus = paymentStatus;

        // Handle items and recalculate totals
        if (items && items.length > 0) {
            let subtotal = 0;
            factura.items = items.map(item => {
                if (typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
                    throw new Error('Cantidad y precio unitario de los ítems deben ser números positivos.');
                }
                const total = item.quantity * item.unitPrice;
                subtotal += total;
                return {
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: total,
                };
            });
            factura.subtotal = subtotal;
            factura.tax = tax !== undefined ? tax : factura.tax; // Allow setting tax to 0
            factura.totalAmount = factura.subtotal + factura.tax;
        } else if (items && items.length === 0) { // If items array is explicitly emptied
            factura.items = [];
            factura.subtotal = 0;
            factura.totalAmount = factura.tax || 0; // Only tax if no items
        } else if (tax !== undefined) { // If only tax is updated, recalculate totalAmount
            factura.tax = tax;
            factura.totalAmount = factura.subtotal + factura.tax;
        }

        await factura.save();
        res.status(200).json(factura);
    } catch (error) {
        console.error('Error updating factura:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.deleteFactura = async (req, res) => {
    try {
        const factura = await Factura.findByIdAndDelete(req.params.id);
        if (!factura) {
            return res.status(404).json({ message: 'Factura no encontrada.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting factura:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.generateInvoicePdf = async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await Factura.findById(id)
            .populate({
                path: 'ruta',
                populate: [
                    { path: 'chuto', select: 'plate code type propietario' },
                    { path: 'trailer', select: 'plate code type propietario' },
                    { path: 'conductor', select: 'firstName lastName fullName' },
                    { path: 'auxiliar', select: 'firstName lastName fullName' }
                ]
            })
            .populate({
                path: 'createdBy',
                select: 'name email',
            });

        if (!factura) {
            return res.status(404).json({ message: 'Factura no encontrada.' });
        }

        // Prepara los datos relevantes para el PDF
        const facturaData = {
            invoiceNumber: factura.invoiceNumber,
            clientName: factura.clientName,
            clientIdentification: factura.clientIdentification,
            clientAddress: factura.clientAddress,
            clientPhone: factura.clientPhone,
            clientEmail: factura.clientEmail,
            invoiceDate: factura.invoiceDate,
            items: factura.items,
            subtotal: factura.subtotal,
            tax: factura.tax,
            totalAmount: factura.totalAmount,
            paymentStatus: factura.paymentStatus,
            notes: factura.notes,
            ruta: factura.ruta ? {
                code: factura.ruta.code,
                startLocation: factura.ruta.startLocation,
                endLocation: factura.ruta.endLocation,
                concept: factura.ruta.concept,
                startDate: factura.ruta.startDate,
                endDate: factura.ruta.endDate,
                chuto: factura.ruta.chuto ? {
                    plate: factura.ruta.chuto.plate,
                    code: factura.ruta.chuto.code
                } : undefined,
                trailer: factura.ruta.trailer ? {
                    plate: factura.ruta.trailer.plate,
                    code: factura.ruta.trailer.code
                } : undefined,
                conductor: factura.ruta.conductor ? {
                    firstName: factura.ruta.conductor.firstName,
                    lastName: factura.ruta.conductor.lastName
                } : undefined,
                auxiliar: factura.ruta.auxiliar ? {
                    firstName: factura.ruta.auxiliar.firstName,
                    lastName: factura.ruta.auxiliar.lastName
                } : undefined,
            } : undefined
        };

        const response = await axios.post('http://localhost:5001/pdf', facturaData, {
            responseType: 'arraybuffer',
            headers: { 'Content-Type': 'application/json' }
        });
        const pdfBuffer = Buffer.from(response.data, 'binary');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura-${factura.invoiceNumber}.pdf`);
        res.end(pdfBuffer);
    } catch (error) {
        console.error('Error generating invoice PDF via Python:', error);
        res.status(500).json({ message: 'Error al generar el PDF de la factura con Python.', error: error.message });
    }
};

// Endpoint de prueba para PDF fijo
exports.testPdf = (req, res) => {
    // PDF de "Hola" generado previamente (puedes reemplazarlo por cualquier PDF válido)
    const pdfPath = path.join(__dirname, '../../public/uploads/receipts/receipt-1750258923707.jpg'); // Cambia a un PDF real si tienes uno
    // Si tienes un PDF base64, puedes usar Buffer.from(base64, 'base64')
    if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=test.pdf');
        res.send(pdfBuffer);
    } else {
        res.status(404).json({ error: 'PDF de prueba no encontrado' });
    }
}; 