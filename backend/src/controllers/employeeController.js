const { Employee } = require('../models/Employee');

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const { searchTerm, department, position, contractType, startDate, endDate, page = 1, limit = 10, userLinked } = req.query;
        const query = {};

        // Bandera de depuración: Imprimir el valor de position recibido del frontend
        console.log('DEBUG (Backend): Posición recibida en req.query.position:', position);

        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { cedula: searchRegex },
                { rif: searchRegex },
            ];
        }

        if (department) {
            query.department = department;
        }
        if (position) {
            query.position = position;
        }
        if (contractType) {
            query.contractType = contractType;
        }
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) {
                // Assuming startDate is in YYYY-MM-DD format and we want to find employees hired on or after this date
                query.startDate.$gte = new Date(startDate);
            }
            if (endDate) {
                // Assuming endDate is in YYYY-MM-DD format and we want to find employees hired on or before this date
                query.startDate.$lte = new Date(endDate);
            }
        }

        // NUEVO FILTRO: empleados con/sin usuario vinculado
        if (userLinked !== undefined) {
            if (userLinked === 'true') {
                query.user = { $ne: null }; // Empleados que tienen un 'user' no nulo
            } else if (userLinked === 'false') {
                query.user = null; // Empleados que tienen 'user' como nulo
            }
        }

        // Bandera de depuración: Imprimir el objeto de consulta final
        console.log('DEBUG (Backend): Objeto de consulta final:', JSON.stringify(query, null, 2));

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Get total count for pagination
        const totalCount = await Employee.countDocuments(query);

        const employees = await Employee.find(query)
            .populate('user')
            .populate('position')
            .populate('department')
            .populate('contractType')
            .skip(skip)
            .limit(limitNumber);

        // Bandera de depuración: Imprimir los empleados encontrados antes de enviar la respuesta
        console.log('DEBUG (Backend): Empleados encontrados para la respuesta:', employees);

        res.status(200).json({ items: employees, totalCount });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('user')
            .populate('position')
            .populate('department')
            .populate('contractType');
        if (!employee) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        res.status(200).json(employee);
    } catch (error) {
        console.error('Error fetching employee by ID:', error);
        res.status(500).json({ error: 'Error al obtener empleado' });
    }
};

// Create a new employee
exports.createEmployee = async (req, res) => {
    try {
        const newEmployee = new Employee(req.body);
        await newEmployee.save();
        await newEmployee.populate(['position', 'department', 'contractType', 'user']);

        console.log(`✅ Empleado creado en DB: ${newEmployee.firstName} ${newEmployee.lastName} (${newEmployee.email})`);
        res.status(201).json(newEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(400).json({ error: error.message });
    }
};

// Update an employee
exports.updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('position')
            .populate('department')
            .populate('contractType')
            .populate('user');
        if (!employee) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        res.status(200).json(employee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(400).json({ error: error.message });
    }
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Error al eliminar empleado' });
    }
};

// Link employee to a user
exports.linkUserToEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { userId } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Check if user already linked to another employee (optional, depends on your business logic)
        const existingEmployeeWithUser = await Employee.findOne({ user: userId });
        if (existingEmployeeWithUser && String(existingEmployeeWithUser._id) !== employeeId) {
            return res.status(400).json({ error: 'Este usuario ya está vinculado a otro empleado.' });
        }

        employee.user = userId;
        await employee.save();
        res.status(200).json(employee);
    } catch (error) {
        console.error('Error linking user to employee:', error);
        res.status(500).json({ error: 'Error al vincular usuario a empleado' });
    }
};

// Unlink employee from a user
exports.unlinkUserFromEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        employee.user = undefined; // Set user reference to undefined (or null)
        await employee.save();
        res.status(200).json(employee);
    } catch (error) {
        console.error('Error unlinking user from employee:', error);
        res.status(500).json({ error: 'Error al desvincular usuario de empleado' });
    }
}; 