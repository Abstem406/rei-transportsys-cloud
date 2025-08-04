const { ContractType } = require('../models/ContractType');

exports.createContractType = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre del tipo de contrato es requerido.' });
        }

        const newContractType = new ContractType({ name });
        await newContractType.save();
        res.status(201).json(newContractType);
    } catch (error) {
        console.error('Error creating contract type:', error);
        res.status(500).json({ error: 'Error al crear el tipo de contrato.' });
    }
};

exports.getAllContractTypes = async (req, res) => {
    try {
        const contractTypes = await ContractType.find();
        res.status(200).json(contractTypes);
    } catch (error) {
        console.error('Error fetching contract types:', error);
        res.status(500).json({ error: 'Error al obtener tipos de contrato.' });
    }
};

exports.updateContractType = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre del tipo de contrato es requerido.' });
        }
        const contractType = await ContractType.findByIdAndUpdate(req.params.id, { name }, { new: true, runValidators: true });
        if (!contractType) {
            return res.status(404).json({ error: 'Tipo de contrato no encontrado.' });
        }
        res.status(200).json(contractType);
    } catch (error) {
        console.error('Error updating contract type:', error);
        res.status(500).json({ error: 'Error al actualizar el tipo de contrato.' });
    }
};

exports.deleteContractType = async (req, res) => {
    try {
        const contractType = await ContractType.findByIdAndDelete(req.params.id);
        if (!contractType) {
            return res.status(404).json({ error: 'Tipo de contrato no encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting contract type:', error);
        res.status(500).json({ error: 'Error al eliminar el tipo de contrato.' });
    }
}; 