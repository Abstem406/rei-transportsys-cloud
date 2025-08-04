const Vehicle = require('../models/Vehicle'); // Asume que este modelo existe o se creará

exports.createVehicle = async (req, res) => {
  try {
    const { type, name, model, plate, code, propietario } = req.body;

    if (!propietario) {
      return res.status(400).json({ message: 'El propietario es requerido para este vehículo.' });
    }

    if (type === 'trailer' && (!name || !model)) {
      return res.status(400).json({ message: 'El nombre y el modelo son requeridos para vehículos tipo Trailer.' });
    }

    const newVehicle = new Vehicle({ type, name, model, plate, code, propietario });
    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.plate) {
        return res.status(400).json({ message: 'La placa ya está en uso.' });
      }
      if (error.keyPattern.code) {
        return res.status(400).json({ message: 'El código ya está en uso.' });
      }
    }
    res.status(400).json({ message: error.message });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const { searchTerm, type, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (searchTerm) {
      query.$or = [
        { plate: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
        { model: { $regex: searchTerm, $options: 'i' } },
        { 'propietario.name': { $regex: searchTerm, $options: 'i' } },
        { 'propietario.cedula': { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (type) {
      query.type = type;
    }

    const vehicles = await Vehicle.find(query)
      .populate({
        path: 'propietario',
        select: 'name cedula'
      })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Vehicle.countDocuments(query);

    res.status(200).json({
      items: vehicles,
      totalCount: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate({
        path: 'propietario',
        select: 'name cedula'
      });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehiculo no encontrado' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { type, name, model, plate, code, propietario } = req.body;

    const existingVehicle = await Vehicle.findById(req.params.id);
    if (!existingVehicle) {
      return res.status(404).json({ message: 'Vehiculo no encontrado' });
    }

    const vehicleType = type || existingVehicle.type;

    if (!propietario) {
      return res.status(400).json({ message: 'El propietario es requerido para este vehículo.' });
    }

    if (vehicleType === 'trailer' && (!name || !model)) {
        return res.status(400).json({ message: 'El nombre y el modelo son requeridos para vehículos tipo Trailer.' });
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (model !== undefined) updateData.model = model;
    if (plate !== undefined) updateData.plate = plate;
    if (code !== undefined) updateData.code = code;
    updateData.propietario = propietario;

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehiculo no encontrado' });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.plate) {
        return res.status(400).json({ message: 'La placa ya está en uso.' });
      }
      if (error.keyPattern.code) {
        return res.status(400).json({ message: 'El código ya está en uso.' });
      }
    }
    res.status(400).json({ message: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehiculo no encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 