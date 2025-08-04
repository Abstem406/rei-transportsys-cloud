const { Department } = require('../models/Department');

exports.createDepartment = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre del departamento es requerido.' });
        }

        const newDepartment = new Department({ name });
        await newDepartment.save();
        res.status(201).json(newDepartment);
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ error: 'Error al crear el departamento.' });
    }
};

exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        res.status(200).json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Error al obtener departamentos.' });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre del departamento es requerido.' });
        }
        const department = await Department.findByIdAndUpdate(req.params.id, { name }, { new: true, runValidators: true });
        if (!department) {
            return res.status(404).json({ error: 'Departamento no encontrado.' });
        }
        res.status(200).json(department);
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ error: 'Error al actualizar el departamento.' });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        if (!department) {
            return res.status(404).json({ error: 'Departamento no encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'Error al eliminar el departamento.' });
    }
}; 