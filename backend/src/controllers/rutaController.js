const Ruta = require('../models/Ruta');
const Vehicle = require('../models/Vehicle');
const moment = require('moment-timezone');
const { Employee } = require('../models/Employee');
const Position = require('../models/Position');

// Helper function to generate a random 9-digit code
const generateRandomCode = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
};

exports.createRuta = async (req, res) => {
    try {
        const { startLocation, endLocation, chuto, trailer, concept, endDate, conductor, auxiliar } = req.body;

        // Validate required fields
        if (!startLocation || !endLocation || !concept) {
            return res.status(400).json({ message: 'Los campos lugar de salida, lugar de destino y concepto son requeridos.' });
        }

        // Set startDate to current Venezuela time
        const startDate = moment().tz('America/Caracas').toDate();

        // Ensure at least one vehicle (chuto or trailer) is provided
        if (!chuto && !trailer) {
            return res.status(400).json({ message: 'Debe seleccionar al menos un chuto o un trailer para la ruta.' });
        }

        // Check if chuto and trailer vehicles exist and are of correct type
        if (chuto) {
            const chutoVehicle = await Vehicle.findById(chuto);
            if (!chutoVehicle || chutoVehicle.type !== 'chuto') {
                return res.status(400).json({ message: 'El chuto seleccionado no es válido o no existe.' });
            }
        }
        if (trailer) {
            const trailerVehicle = await Vehicle.findById(trailer);
            if (!trailerVehicle || trailerVehicle.type !== 'trailer') {
                return res.status(400).json({ message: 'El trailer seleccionado no es válido o no existe.' });
            }
        }

        // Validate and assign employees based on position
        const validateEmployee = async (employeeId, allowedPositions, employeeType) => {
            if (!employeeId) return null;
            const employee = await Employee.findById(employeeId).populate('position');
            if (!employee) {
                throw new Error(`${employeeType} no encontrado.`);
            }
            // Check if position exists and its name is in allowedPositions (case-insensitive)
            if (!employee.position || !allowedPositions.includes(employee.position.name.toLowerCase())) {
                throw new Error(`${employeeType} debe tener uno de los siguientes puestos: ${allowedPositions.join(', ')}.`);
            }
            return employee._id;
        };

        const validatedConductor = await validateEmployee(conductor, ['conductor'], 'Conductor');
        const validatedAuxiliar = await validateEmployee(auxiliar, ['auxiliar'], 'Auxiliar');

        let code = generateRandomCode();
        let existingRuta = await Ruta.findOne({ code });
        // Regenerate code if it already exists to ensure uniqueness
        while (existingRuta) {
            code = generateRandomCode();
            existingRuta = await Ruta.findOne({ code });
        }

        const newRuta = new Ruta({
            code,
            startLocation,
            endLocation,
            chuto,
            trailer,
            conductor: validatedConductor,
            auxiliar: validatedAuxiliar,
            concept,
            startDate,
            endDate
        });

        await newRuta.save();
        res.status(201).json(newRuta);
    } catch (error) {
        console.error('Error creating ruta:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.getAllRutas = async (req, res) => {
    try {
        const { searchTerm, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        const pipeline = [];

        // Lookup and unwind for chuto, trailer, conductor, auxiliar
        pipeline.push(
            { $lookup: { from: 'vehicles', localField: 'chuto', foreignField: '_id', as: 'chuto' } },
            { $unwind: { path: '$chuto', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'vehicles', localField: 'trailer', foreignField: '_id', as: 'trailer' } },
            { $unwind: { path: '$trailer', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'employees', localField: 'conductor', foreignField: '_id', as: 'conductor' } },
            { $unwind: { path: '$conductor', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'employees', localField: 'auxiliar', foreignField: '_id', as: 'auxiliar' } },
            { $unwind: { path: '$auxiliar', preserveNullAndEmptyArrays: true } }
        );

        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { startLocation: searchRegex },
                        { endLocation: searchRegex },
                        { concept: searchRegex },
                        { code: searchRegex },
                        { 'chuto.plate': searchRegex },
                        { 'chuto.code': searchRegex },
                        { 'trailer.plate': searchRegex },
                        { 'trailer.code': searchRegex },
                        { 'conductor.firstName': searchRegex },
                        { 'conductor.lastName': searchRegex },
                        { 'auxiliar.firstName': searchRegex },
                        { 'auxiliar.lastName': searchRegex },
                    ]
                }
            });
        }

        // Facet for pagination and total count
        pipeline.push({
            $facet: {
                items: [
                    { $skip: skip },
                    { $limit: parsedLimit },
                    { // Project to reshape the output and include only necessary fields for populated documents
                        $project: {
                            _id: 1,
                            code: 1,
                            startLocation: 1,
                            endLocation: 1,
                            concept: 1,
                            startDate: 1,
                            endDate: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            'chuto._id': 1,
                            'chuto.name': 1,
                            'chuto.plate': 1,
                            'chuto.code': 1,
                            'trailer._id': 1,
                            'trailer.name': 1,
                            'trailer.plate': 1,
                            'trailer.code': 1,
                            'conductor._id': 1,
                            'conductor.firstName': 1,
                            'conductor.lastName': 1,
                            'auxiliar._id': 1,
                            'auxiliar.firstName': 1,
                            'auxiliar.lastName': 1,
                        }
                    }
                ],
                totalCount: [{ $count: 'count' }]
            }
        });

        const result = await Ruta.aggregate(pipeline);

        const rutas = result[0].items;
        const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

        res.status(200).json({
            items: rutas,
            totalCount: totalCount,
        });
    } catch (error) {
        console.error('Error getting all rutas:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getRutaById = async (req, res) => {
    try {
        const ruta = await Ruta.findById(req.params.id)
            .populate({ path: 'chuto', select: 'name plate code' })
            .populate({ path: 'trailer', select: 'name plate code' })
            .populate({ path: 'conductor', select: 'firstName lastName fullName position' })
            .populate({ path: 'auxiliar', select: 'firstName lastName fullName position' });

        console.log('Ruta by ID fetched (backend):', ruta); // Debug flag for backend data

        if (!ruta) {
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }
        res.status(200).json(ruta);
    } catch (error) {
        console.error('Error getting ruta by ID:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateRuta = async (req, res) => {
    try {
        const { startLocation, endLocation, chuto, trailer, concept, endDate, conductor, auxiliar } = req.body;
        console.log('DEBUG: Backend - Received update request for Ruta ID:', req.params.id);
        console.log('DEBUG: Backend - Update Payload:', req.body);

        const ruta = await Ruta.findById(req.params.id);
        if (!ruta) {
            console.log('DEBUG: Backend - Ruta not found for update.');
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }

        // Validate required fields on update
        if (!startLocation || !endLocation || !concept) {
            console.log('DEBUG: Backend - Missing required fields for update.');
            return res.status(400).json({ message: 'Los campos lugar de salida, lugar de destino y concepto son requeridos.' });
        }

        // Ensure at least one vehicle (chuto or trailer) is provided
        if (!chuto && !trailer) {
            console.log('DEBUG: Backend - No chuto or trailer provided for update.');
            return res.status(400).json({ message: 'Debe seleccionar al menos un chuto o un trailer para la ruta.' });
        }

        // Check if chuto and trailer vehicles exist and are of correct type
        if (chuto) {
            const chutoVehicle = await Vehicle.findById(chuto);
            if (!chutoVehicle || chutoVehicle.type !== 'chuto') {
                console.log('DEBUG: Backend - Invalid chuto for update.', chuto);
                return res.status(400).json({ message: 'El chuto seleccionado no es válido o no existe.' });
            }
        }
        if (trailer) {
            const trailerVehicle = await Vehicle.findById(trailer);
            if (!trailerVehicle || trailerVehicle.type !== 'trailer') {
                console.log('DEBUG: Backend - Invalid trailer for update.', trailer);
                return res.status(400).json({ message: 'El trailer seleccionado no es válido o no existe.' });
            }
        }

        // Validate and assign employees based on position for update
        const validateEmployee = async (employeeId, allowedPositions, employeeType) => {
            if (!employeeId) return null;
            const employee = await Employee.findById(employeeId).populate('position');
            if (!employee) {
                console.log(`DEBUG: Backend - ${employeeType} not found for update.`, employeeId);
                throw new Error(`${employeeType} no encontrado.`);
            }
            // Check if position exists and its name is in allowedPositions (case-insensitive)
            if (!employee.position || !allowedPositions.includes(employee.position.name.toLowerCase())) {
                console.log(`DEBUG: Backend - Invalid position for ${employeeType} for update.`, employee.position);
                throw new Error(`${employeeType} debe tener uno de los siguientes puestos: ${allowedPositions.join(', ')}.`);
            }
            return employee._id;
        };

        ruta.startLocation = startLocation;
        ruta.endLocation = endLocation;
        ruta.chuto = chuto;
        ruta.trailer = trailer;
        ruta.conductor = await validateEmployee(conductor, ['conductor'], 'Conductor');
        ruta.auxiliar = await validateEmployee(auxiliar, ['auxiliar'], 'Auxiliar');
        ruta.concept = concept;
        ruta.endDate = endDate;
        // Do not update code as it's auto-generated and permanent

        await ruta.save();
        console.log('DEBUG: Backend - Ruta updated successfully:', ruta);
        res.status(200).json(ruta);
    } catch (error) {
        console.error('DEBUG: Backend - Error updating ruta:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.deleteRuta = async (req, res) => {
    try {
        console.log('DEBUG: Backend - Received delete request for Ruta ID:', req.params.id);
        const ruta = await Ruta.findByIdAndDelete(req.params.id);
        if (!ruta) {
            console.log('DEBUG: Backend - Ruta not found for deletion.');
            return res.status(404).json({ message: 'Ruta no encontrada.' });
        }
        console.log('DEBUG: Backend - Ruta deleted successfully:', ruta);
        res.status(204).send();
    } catch (error) {
        console.error('DEBUG: Backend - Error deleting ruta:', error);
        res.status(500).json({ message: error.message });
    }
};
