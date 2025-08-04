const { Position } = require('../models/Position');

exports.createPosition = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre del puesto es requerido.' });
        }

        const newPosition = new Position({ name });
        await newPosition.save();
        res.status(201).json(newPosition);
    } catch (error) {
        console.error('Error creating position:', error);
        res.status(500).json({ error: 'Error al crear el puesto.' });
    }
};

exports.getAllPositions = async (req, res) => {
    try {
        const positions = await Position.find();
        res.status(200).json(positions);
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ error: 'Error al obtener puestos.' });
    }
};

exports.updatePosition = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre del puesto es requerido.' });
        }
        const position = await Position.findByIdAndUpdate(req.params.id, { name }, { new: true, runValidators: true });
        if (!position) {
            return res.status(404).json({ error: 'Puesto no encontrado.' });
        }
        res.status(200).json(position);
    } catch (error) {
        console.error('Error updating position:', error);
        res.status(500).json({ error: 'Error al actualizar el puesto.' });
    }
};

exports.deletePosition = async (req, res) => {
    try {
        const position = await Position.findByIdAndDelete(req.params.id);
        if (!position) {
            return res.status(404).json({ error: 'Puesto no encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting position:', error);
        res.status(500).json({ error: 'Error al eliminar el puesto.' });
    }
}; 