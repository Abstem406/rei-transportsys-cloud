const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const employeeController = require('../controllers/employeeController');
const departmentController = require('../controllers/departmentController');
const positionController = require('../controllers/positionController');
const contractTypeController = require('../controllers/contractTypeController');
const vehicleController = require('../controllers/vehicleController');
const propietarioController = require('../controllers/propietarioController');
const rutaController = require('../controllers/rutaController');
const pagoController = require('../controllers/pagoController');
const facturaController = require('../controllers/facturaController');
const { auth, requireAdmin, requireOperator } = require('../middleware/auth');

// Rutas de autenticación
router.post('/auth/login', authController.login);
router.get('/auth/validate', auth, authController.validateToken);

// Rutas de usuarios (protegidas)
router.get('/users', auth, requireAdmin, userController.listUsers);
router.post('/users', auth, requireAdmin, userController.createUser);
router.get('/users/:id', auth, requireAdmin, userController.getUser);
router.put('/users/:id', auth, requireAdmin, userController.updateUser);
router.delete('/users/:id', auth, requireAdmin, userController.deleteUser);

// Rutas de empleados (protegidas)
router.get('/employees', auth, requireAdmin, employeeController.getAllEmployees);
router.get('/employees/:id', auth, requireAdmin, employeeController.getEmployeeById);
router.post('/employees', auth, requireAdmin, employeeController.createEmployee);
router.put('/employees/:id', auth, requireAdmin, employeeController.updateEmployee);
router.delete('/employees/:id', auth, requireAdmin, employeeController.deleteEmployee);

// Rutas para vincular/desvincular empleado a usuario
router.post('/employees/:employeeId/link-user', auth, requireAdmin, employeeController.linkUserToEmployee);
router.post('/employees/:employeeId/unlink-user', auth, requireAdmin, employeeController.unlinkUserFromEmployee);

// Rutas de Departamentos
router.post('/departments', auth, requireAdmin, departmentController.createDepartment);
router.get('/departments', auth, requireAdmin, departmentController.getAllDepartments);
router.put('/departments/:id', auth, requireAdmin, departmentController.updateDepartment);
router.delete('/departments/:id', auth, requireAdmin, departmentController.deleteDepartment);

// Rutas de Puestos
router.post('/positions', auth, requireAdmin, positionController.createPosition);
router.get('/positions', auth, requireAdmin, positionController.getAllPositions);
router.put('/positions/:id', auth, requireAdmin, positionController.updatePosition);
router.delete('/positions/:id', auth, requireAdmin, positionController.deletePosition);

// Rutas de Tipos de Contrato
router.post('/contract-types', auth, requireAdmin, contractTypeController.createContractType);
router.get('/contract-types', auth, requireAdmin, contractTypeController.getAllContractTypes);
router.put('/contract-types/:id', auth, requireAdmin, contractTypeController.updateContractType);
router.delete('/contract-types/:id', auth, requireAdmin, contractTypeController.deleteContractType);

// Rutas de Vehiculos
router.post('/vehicles', auth, requireAdmin, vehicleController.createVehicle);
router.get('/vehicles', auth, requireAdmin, vehicleController.getAllVehicles);
router.get('/vehicles/:id', auth, requireAdmin, vehicleController.getVehicleById);
router.put('/vehicles/:id', auth, requireAdmin, vehicleController.updateVehicle);
router.delete('/vehicles/:id', auth, requireAdmin, vehicleController.deleteVehicle);

// Rutas de Propietarios
router.post('/propietarios', auth, requireAdmin, propietarioController.createPropietario);
router.get('/propietarios', auth, requireAdmin, propietarioController.getAllPropietarios);
router.get('/propietarios/:id', auth, requireAdmin, propietarioController.getPropietarioById);
router.put('/propietarios/:id', auth, requireAdmin, propietarioController.updatePropietario);
router.delete('/propietarios/:id', auth, requireAdmin, propietarioController.deletePropietario);

// Rutas de Rutas (New routes for Ruta)
router.post('/rutas', auth, requireAdmin, rutaController.createRuta);
router.get('/rutas', auth, requireAdmin, rutaController.getAllRutas);
router.get('/rutas/:id', auth, requireAdmin, rutaController.getRutaById);
router.put('/rutas/:id', auth, requireAdmin, rutaController.updateRuta);
router.delete('/rutas/:id', auth, requireAdmin, rutaController.deleteRuta);

// Rutas de Pagos (New routes for Pago)
router.post('/pagos', auth, requireAdmin, pagoController.upload.single('receiptImage'), pagoController.createPago);
router.get('/pagos', auth, requireAdmin, pagoController.getAllPagos);
router.get('/pagos/:id', auth, requireAdmin, pagoController.getPagoById);
router.put('/pagos/:id', auth, requireAdmin, pagoController.upload.single('receiptImage'), pagoController.updatePago);
router.delete('/pagos/:id', auth, requireAdmin, pagoController.deletePago);

// Rutas de Facturas (New routes for Factura)
router.post('/facturas', auth, requireAdmin, facturaController.createFactura);
router.get('/facturas', auth, requireAdmin, facturaController.getAllFacturas);
router.get('/facturas/:id', auth, requireAdmin, facturaController.getFacturaById);
router.put('/facturas/:id', auth, requireAdmin, facturaController.updateFactura);
router.delete('/facturas/:id', auth, requireAdmin, facturaController.deleteFactura);
router.get('/facturas/:id/pdf', auth, requireAdmin, facturaController.generateInvoicePdf);
router.get('/test-pdf', facturaController.testPdf);

// Ruta de prueba
router.get('/test', (req, res) => {
    res.json({
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 