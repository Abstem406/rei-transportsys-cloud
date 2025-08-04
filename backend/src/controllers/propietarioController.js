const Propietario = require('../models/Propietario');

exports.createPropietario = async (req, res) => {
  try {
    const newPropietario = new Propietario(req.body);
    await newPropietario.save();
    res.status(201).json(newPropietario);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllPropietarios = async (req, res) => {
  try {
    const { searchTerm, page = 1, limit = 10, cedulaPrefixFilter } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { cedula: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (cedulaPrefixFilter) {
      query.cedula = { $regex: `^${cedulaPrefixFilter}-`, $options: 'i' };
    }

    const propietarios = await Propietario.find(query)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Propietario.countDocuments(query);

    res.status(200).json({
      items: propietarios,
      totalCount: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPropietarioById = async (req, res) => {
  try {
    const propietario = await Propietario.findById(req.params.id);
    if (!propietario) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }
    res.status(200).json(propietario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePropietario = async (req, res) => {
  try {
    const propietario = await Propietario.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!propietario) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }
    res.status(200).json(propietario);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePropietario = async (req, res) => {
  try {
    const propietario = await Propietario.findByIdAndDelete(req.params.id);
    if (!propietario) {
      return res.status(404).json({ message: 'Propietario no encontrado' });
    }
    res.status(204).send(); // No content to send back
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 