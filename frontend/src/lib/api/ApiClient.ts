import { API_URL } from '$lib/config';

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'operator';
    createdAt: string;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin' | 'operator';
    active?: boolean;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    role?: 'user' | 'admin' | 'operator';
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    cedula: string;
    rif: string;
    birthDate: string;
    gender: 'masculino' | 'femenino' | 'otro';
    address: string;
    phone: string;
    email: string;
    position: Position;
    department: Department;
    contractType: ContractType;
    startDate: string;
    salary: number;
    active: boolean;
    user?: User;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEmployeeDto {
    firstName: string;
    lastName: string;
    cedula: string;
    rif: string;
    birthDate: string;
    gender: 'masculino' | 'femenino' | 'otro';
    address: string;
    phone: string;
    email: string;
    position: string;
    department: string;
    contractType: string;
    startDate: string;
    salary: number;
    cedulaPrefix?: string;
    cedulaNumber?: string;
    rifPrefix?: string;
    rifNumber?: string;
}

export interface UpdateEmployeeDto {
    firstName?: string;
    lastName?: string;
    cedula?: string;
    rif?: string;
    birthDate?: string;
    gender?: 'masculino' | 'femenino' | 'otro';
    address?: string;
    phone?: string;
    email?: string;
    position?: string;
    department?: string;
    contractType?: string;
    startDate?: string;
    salary?: number;
    active?: boolean;
    cedulaPrefix?: string;
    cedulaNumber?: string;
    rifPrefix?: string;
    rifNumber?: string;
}

export interface Department {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDepartmentDto {
    name: string;
}

export interface UpdateDepartmentDto {
    name?: string;
}

export interface Position {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePositionDto {
    name: string;
}

export interface UpdatePositionDto {
    name?: string;
}

export interface ContractType {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateContractTypeDto {
    name: string;
}

export interface UpdateContractTypeDto {
    name?: string;
}

export interface Propietario {
    _id: string;
    name: string;
    cedula: string;
    phone: string;
    address: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePropietarioDto {
    name: string;
    cedula: string;
    phone: string;
    address: string;
    email?: string;
}

export interface UpdatePropietarioDto {
    name?: string;
    cedula?: string;
    phone?: string;
    address?: string;
    email?: string;
}

export interface PaginatedPropietariosResponse {
    items: Propietario[];
    totalCount: number;
}

export type VehicleType = 'chuto' | 'trailer';

export interface Vehicle {
    _id: string;
    type: VehicleType;
    name: string;
    model: string;
    plate: string;
    code: string;
    propietario?: Propietario;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVehicleDto {
    type: VehicleType;
    name?: string;
    model?: string;
    plate: string;
    code: string;
    propietario?: string;
}

export interface UpdateVehicleDto {
    type?: VehicleType;
    name?: string;
    model?: string;
    plate?: string;
    code?: string;
    propietario?: string;
}

export interface PaginatedVehiclesResponse {
    items: Vehicle[];
    totalCount: number;
}

export interface PaginatedEmployeesResponse {
    items: Employee[];
    totalCount: number;
}

// Ruta Interfaces
export interface Ruta {
    _id: string;
    code: string;
    startLocation: string;
    endLocation: string;
    chuto?: Vehicle; // Populated Vehicle object
    trailer?: Vehicle; // Populated Vehicle object
    conductor?: Employee; // Populated Employee object
    auxiliar?: Employee; // Populated Employee object
    concept: string;
    startDate: string; // ISO Date string
    endDate?: string; // ISO Date string, optional
    createdAt: string;
    updatedAt: string;
}

export interface CreateRutaDto {
    startLocation: string;
    endLocation: string;
    chuto?: string; // Vehicle _id
    trailer?: string; // Vehicle _id
    conductor?: string; // Employee _id
    auxiliar?: string; // Employee _id
    concept: string;
    endDate?: string;
}

export interface UpdateRutaDto {
    startLocation?: string;
    endLocation?: string;
    chuto?: string;
    trailer?: string;
    conductor?: string;
    auxiliar?: string;
    concept?: string;
    endDate?: string;
}

export interface PaginatedRutasResponse {
    items: Ruta[];
    totalCount: number;
}

// Pago Interfaces
export interface Pago {
    _id: string;
    paymentType: 'employee' | 'owner' | 'company_out' | 'company_in';
    ruta?: Ruta;
    empleado?: Employee;
    propietario?: Propietario;
    thirdPartyName?: string;
    thirdPartyIdentification?: string;
    thirdPartyContact?: string;
    monto: number;
    fechaPago: string;
    concepto: string;
    metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito/Débito' | 'Otro';
    referencia?: string;
    estado: 'Pendiente' | 'Pagado' | 'Rechazado';
    notas?: string;
    receiptImageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePagoDto {
    paymentType: 'employee' | 'owner' | 'company_out' | 'company_in';
    ruta?: string | null;
    empleado?: string;
    propietario?: string;
    thirdPartyName?: string;
    thirdPartyIdentification?: string;
    thirdPartyContact?: string;
    monto: number;
    fechaPago?: string;
    concepto: string;
    metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito/Débito' | 'Otro';
    referencia?: string;
    estado?: 'Pendiente' | 'Pagado' | 'Rechazado';
    notas?: string;
    receiptImage?: File;
}

export interface UpdatePagoDto {
    paymentType?: 'employee' | 'owner' | 'company_out' | 'company_in';
    ruta?: string | null;
    empleado?: string;
    propietario?: string;
    thirdPartyName?: string;
    thirdPartyIdentification?: string;
    thirdPartyContact?: string;
    monto?: number;
    fechaPago?: string;
    concepto?: string;
    metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito/Débito' | 'Otro';
    referencia?: string;
    estado?: 'Pendiente' | 'Pagado' | 'Rechazado';
    notas?: string;
    receiptImage?: File;
}

export interface PaginatedPagosResponse {
    items: Pago[];
    totalCount: number;
}

// Factura Interfaces
export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Factura {
    _id: string;
    invoiceNumber: string;
    ruta: Ruta; // Populated Ruta object
    clientName: string;
    clientIdentification?: string;
    clientAddress?: string;
    clientPhone?: string;
    clientEmail?: string;
    invoiceDate: string; // ISO Date string
    items: InvoiceItem[];
    subtotal: number;
    tax?: number;
    totalAmount: number;
    paymentStatus: 'Pendiente' | 'Pagado' | 'Anulado';
    notes?: string;
    createdBy?: User; // Populated User object
    createdAt: string;
    updatedAt: string;
}

export interface CreateFacturaDto {
    ruta: string; // Ruta _id
    clientName: string;
    clientIdentification?: string;
    clientAddress?: string;
    clientPhone?: string;
    clientEmail?: string;
    items: InvoiceItem[];
    tax?: number;
    paymentStatus?: 'Pendiente' | 'Pagado' | 'Anulado';
    notes?: string;
}

export interface UpdateFacturaDto {
    clientName?: string;
    clientIdentification?: string;
    clientAddress?: string;
    clientPhone?: string;
    clientEmail?: string;
    items?: InvoiceItem[];
    tax?: number;
    paymentStatus?: 'Pendiente' | 'Pagado' | 'Anulado';
    notes?: string;
}

export interface PaginatedFacturasResponse {
    items: Factura[];
    totalCount: number;
}

export class ApiClient {
    private baseUrl: string;
    private token: string | null = null;
    private _debugMode: boolean;

    constructor(baseUrl: string = API_URL) {
        this.baseUrl = baseUrl;
        this._debugMode = false;
        // Token will be loaded lazily or set via setToken
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }

    getToken(): string | null {
        if (this.token) {
            return this.token;
        }
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
            return this.token;
        }
        return null;
    }

    setDebugMode(mode: boolean) {
        this._debugMode = mode;
        if (mode) {
            console.log('API Client Debug Mode: ON');
        } else {
            console.log('API Client Debug Mode: OFF');
        }
    }

    private getHeaders(isFormData: boolean = false): HeadersInit {
        const headers: HeadersInit = {};

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const currentToken = this.getToken();
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const status = response.status;

        if (this._debugMode) {
            console.log('-- API Response Debug --');
            console.log('Status:', status);
            console.log('OK:', response.ok);
        }

        if (status === 204) {
            return {
                data: undefined as T,
                status
            };
        }

        try {
            const data = await response.json();
            
            if (!response.ok) {
                return {
                    error: data.error || data.message || 'Ha ocurrido un error',
                    status
                };
            }

            return {
                data: data as T,
                status
            };
        } catch (error) {
            console.error('Error parsing JSON response:', error);
            if (this._debugMode) {
                console.error('Raw response statusText:', response.statusText);
                console.error('Raw response URL:', response.url);
            }
            return {
                error: response.statusText || 'Error al procesar la respuesta o respuesta inesperada del servidor',
                status
            };
        }
    }

    async login(credentials: LoginDto): Promise<ApiResponse<LoginResponse>> {
        const response = await fetch(`${this.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(credentials)
        });

        const apiResponse = await this.handleResponse<LoginResponse>(response);
        if (apiResponse.data && apiResponse.data.token) {
            this.setToken(apiResponse.data.token);
        }
        return apiResponse;
    }

    async validateToken(): Promise<ApiResponse<User>> {
        // Token is now handled by getToken() getter
        const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
            headers: this.getHeaders()
        });

        return this.handleResponse<User>(response);
    }

    async getUsers(role?: string): Promise<ApiResponse<User[]>> {
        const url = role 
            ? `${this.baseUrl}/api/users?role=${role}`
            : `${this.baseUrl}/api/users`;

        const response = await fetch(url, {
            headers: this.getHeaders()
        });

        return this.handleResponse<User[]>(response);
    }

    async getUser(id: string): Promise<ApiResponse<User>> {
        const response = await fetch(`${this.baseUrl}/api/users/${id}`, {
            headers: this.getHeaders()
        });

        return this.handleResponse<User>(response);
    }

    async createUser(user: CreateUserDto): Promise<ApiResponse<User>> {
        const response = await fetch(`${this.baseUrl}/api/users`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(user)
        });

        return this.handleResponse<User>(response);
    }

    async updateUser(id: string, user: UpdateUserDto): Promise<ApiResponse<User>> {
        const response = await fetch(`${this.baseUrl}/api/users/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(user)
        });

        return this.handleResponse<User>(response);
    }

    async deleteUser(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/api/users/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        return this.handleResponse<void>(response);
    }

    async createDepartment(department: CreateDepartmentDto): Promise<ApiResponse<Department>> {
        const response = await fetch(`${this.baseUrl}/api/departments`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(department)
        });
        return this.handleResponse<Department>(response);
    }

    async getAllDepartments(): Promise<ApiResponse<Department[]>> {
        const response = await fetch(`${this.baseUrl}/api/departments`, {
            headers: this.getHeaders()
        });
        return this.handleResponse<Department[]>(response);
    }

    async updateDepartment(id: string, department: UpdateDepartmentDto): Promise<ApiResponse<Department>> {
        const response = await fetch(`${this.baseUrl}/api/departments/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(department)
        });
        return this.handleResponse<Department>(response);
    }

    async deleteDepartment(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/api/departments/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse<void>(response);
    }

    async createPosition(position: CreatePositionDto): Promise<ApiResponse<Position>> {
        const response = await fetch(`${this.baseUrl}/api/positions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(position)
        });
        return this.handleResponse<Position>(response);
    }

    async getAllPositions(): Promise<ApiResponse<Position[]>> {
        const response = await fetch(`${this.baseUrl}/api/positions`, {
            headers: this.getHeaders()
        });
        return this.handleResponse<Position[]>(response);
    }

    async updatePosition(id: string, position: UpdatePositionDto): Promise<ApiResponse<Position>> {
        const response = await fetch(`${this.baseUrl}/api/positions/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(position)
        });
        return this.handleResponse<Position>(response);
    }

    async deletePosition(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/api/positions/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse<void>(response);
    }

    async createContractType(contractType: CreateContractTypeDto): Promise<ApiResponse<ContractType>> {
        const response = await fetch(`${this.baseUrl}/api/contract-types`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(contractType)
        });
        return this.handleResponse<ContractType>(response);
    }

    async getAllContractTypes(): Promise<ApiResponse<ContractType[]>> {
        const response = await fetch(`${this.baseUrl}/api/contract-types`, {
            headers: this.getHeaders()
        });
        return this.handleResponse<ContractType[]>(response);
    }

    async updateContractType(id: string, contractType: UpdateContractTypeDto): Promise<ApiResponse<ContractType>> {
        const response = await fetch(`${this.baseUrl}/api/contract-types/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(contractType)
        });
        return this.handleResponse<ContractType>(response);
    }

    async deleteContractType(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/api/contract-types/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse<void>(response);
    }

    async getEmployees(filters?: { searchTerm?: string; department?: string; position?: string; contractType?: string; startDate?: string; endDate?: string; page?: number; limit?: number; userLinked?: boolean; }): Promise<ApiResponse<PaginatedEmployeesResponse>> {
        let url = `${this.baseUrl}/api/employees`;
        const queryParams = new URLSearchParams();

        if (filters) {
            if (filters.searchTerm) {
                queryParams.append('searchTerm', filters.searchTerm);
            }
            if (filters.department) {
                queryParams.append('department', filters.department);
            }
            if (filters.position) {
                queryParams.append('position', filters.position);
            }
            if (filters.contractType) {
                queryParams.append('contractType', filters.contractType);
            }
            if (filters.startDate) {
                queryParams.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                queryParams.append('endDate', filters.endDate);
            }
            if (filters.page) {
                queryParams.append('page', filters.page.toString());
            }
            if (filters.limit) {
                queryParams.append('limit', filters.limit.toString());
            }
            if (typeof filters.userLinked !== 'undefined') {
                queryParams.append('userLinked', filters.userLinked.toString());
            }
        }

        if (queryParams.toString()) {
            url = `${url}?${queryParams.toString()}`;
        }

        const response = await fetch(url, {
            headers: this.getHeaders()
        });

        return this.handleResponse<PaginatedEmployeesResponse>(response);
    }

    async getEmployee(id: string): Promise<ApiResponse<Employee>> {
        const response = await fetch(`${this.baseUrl}/api/employees/${id}`, {
            headers: this.getHeaders()
        });

        return this.handleResponse<Employee>(response);
    }

    async createEmployee(employee: CreateEmployeeDto): Promise<ApiResponse<Employee>> {
        if (this._debugMode) {
            console.log('-- Creating Employee Debug --');
            console.log('Request URL:', `${this.baseUrl}/api/employees`);
            console.log('Request Body:', JSON.stringify(employee, null, 2));
        }
        const response = await fetch(`${this.baseUrl}/api/employees`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(employee)
        });

        const apiResponse = await this.handleResponse<Employee>(response);
        if (this._debugMode) {
            console.log('Create Employee API Response:', apiResponse);
        }
        return apiResponse;
    }

    async updateEmployee(id: string, employee: UpdateEmployeeDto): Promise<ApiResponse<Employee>> {
        if (this._debugMode) {
            console.log('-- Updating Employee Debug --');
            console.log('Request URL:', `${this.baseUrl}/api/employees/${id}`);
            console.log('Request Body:', JSON.stringify(employee, null, 2));
        }
        const response = await fetch(`${this.baseUrl}/api/employees/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(employee)
        });

        const apiResponse = await this.handleResponse<Employee>(response);
        if (this._debugMode) {
            console.log('Update Employee API Response:', apiResponse);
        }
        return apiResponse;
    }

    async deleteEmployee(id: string): Promise<ApiResponse<void>> {
        if (this._debugMode) {
            console.log('-- Deleting Employee Debug --');
            console.log('Request URL:', `${this.baseUrl}/api/employees/${id}`);
        }
        const response = await fetch(`${this.baseUrl}/api/employees/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        const apiResponse = await this.handleResponse<void>(response);
        if (this._debugMode) {
            console.log('Delete Employee API Response:', apiResponse);
        }
        return apiResponse;
    }

    async linkEmployeeToUser(employeeId: string, userId: string): Promise<ApiResponse<Employee>> {
        if (this._debugMode) {
            console.log('-- Linking Employee to User Debug --');
            console.log('Request URL:', `${this.baseUrl}/api/employees/${employeeId}/link-user`);
            console.log('Request Body:', JSON.stringify({ userId }, null, 2));
        }
        const response = await fetch(`${this.baseUrl}/api/employees/${employeeId}/link-user`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ userId })
        });

        const apiResponse = await this.handleResponse<Employee>(response);
        if (this._debugMode) {
            console.log('Link Employee to User API Response:', apiResponse);
        }
        return apiResponse;
    }

    async unlinkEmployeeFromUser(employeeId: string): Promise<ApiResponse<Employee>> {
        if (this._debugMode) {
            console.log('-- Unlinking Employee from User Debug --');
            console.log('Request URL:', `${this.baseUrl}/api/employees/${employeeId}/unlink-user`);
        }
        const response = await fetch(`${this.baseUrl}/api/employees/${employeeId}/unlink-user`, {
            method: 'POST',
            headers: this.getHeaders()
        });

        const apiResponse = await this.handleResponse<Employee>(response);
        if (this._debugMode) {
            console.log('Unlink Employee from User API Response:', apiResponse);
        }
        return apiResponse;
    }

    // Propietarios API
    async createPropietario(propietario: CreatePropietarioDto): Promise<ApiResponse<Propietario>> {
        const response = await fetch(`${this.baseUrl}/api/propietarios`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(propietario)
        });
        return this.handleResponse<Propietario>(response);
    }

    async getAllPropietarios(filters?: { searchTerm?: string; page?: number; limit?: number; cedulaPrefixFilter?: string; }): Promise<ApiResponse<PaginatedPropietariosResponse>> {
        let url = `${this.baseUrl}/api/propietarios`;
        const queryParams = new URLSearchParams();

        if (filters) {
            if (filters.searchTerm) {
                queryParams.append('searchTerm', filters.searchTerm);
            }
            if (filters.page) {
                queryParams.append('page', filters.page.toString());
            }
            if (filters.limit) {
                queryParams.append('limit', filters.limit.toString());
            }
            if (filters.cedulaPrefixFilter) {
                queryParams.append('cedulaPrefixFilter', filters.cedulaPrefixFilter);
            }
        }

        if (queryParams.toString()) {
            url = `${url}?${queryParams.toString()}`;
        }

        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        return this.handleResponse<PaginatedPropietariosResponse>(response);
    }

    async getPropietario(id: string): Promise<ApiResponse<Propietario>> {
        const response = await fetch(`${this.baseUrl}/api/propietarios/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse<Propietario>(response);
    }

    async updatePropietario(id: string, propietario: UpdatePropietarioDto): Promise<ApiResponse<Propietario>> {
        const response = await fetch(`${this.baseUrl}/api/propietarios/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(propietario)
        });
        return this.handleResponse<Propietario>(response);
    }

    async deletePropietario(id: string): Promise<ApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/api/propietarios/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse<void>(response);
    }

    // Vehicles API
    async createVehicle(vehicle: CreateVehicleDto): Promise<ApiResponse<Vehicle>> {
        if (this._debugMode) {
            console.log('-- Creating Vehicle Debug --');
            console.log('Request URL:', `${this.baseUrl}/api/vehicles`);
            console.log('Request Body:', JSON.stringify(vehicle, null, 2));
        }
        const response = await fetch(`${this.baseUrl}/api/vehicles`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(vehicle)
        });

        const apiResponse = await this.handleResponse<Vehicle>(response);
        if (this._debugMode) {
            console.log('Create Vehicle API Response:', apiResponse);
        }
        return apiResponse;
    }

    async getVehicles(filters?: { searchTerm?: string; type?: VehicleType; page?: number; limit?: number; propietario?: string; }): Promise<ApiResponse<PaginatedVehiclesResponse>> {
        let url = `${this.baseUrl}/api/vehicles`;
        const queryParams = new URLSearchParams();

        if (filters) {
            if (filters.searchTerm) {
                queryParams.append('searchTerm', filters.searchTerm);
            }
            if (filters.type) {
                queryParams.append('type', filters.type);
            }
            if (filters.page) {
                queryParams.append('page', filters.page.toString());
            }
            if (filters.limit) {
                queryParams.append('limit', filters.limit.toString());
            }
            if (filters.propietario) {
                queryParams.append('propietario', filters.propietario);
            }
        }

        if (queryParams.toString()) {
            url = `${url}?${queryParams.toString()}`;
        }

        const response = await fetch(url, {
            headers: this.getHeaders()
        });

        return this.handleResponse<PaginatedVehiclesResponse>(response);
    }

    async getVehicle(id: string): Promise<ApiResponse<Vehicle>> {
        const response = await fetch(`${this.baseUrl}/api/vehicles/${id}`, {
            headers: this.getHeaders()
        });

        return this.handleResponse<Vehicle>(response);
    }

    async updateVehicle(id: string, vehicle: UpdateVehicleDto): Promise<ApiResponse<Vehicle>> {
        if (this._debugMode) {
            console.log('-- Updating Vehicle Debug --');
            console.log('Request URL:', `${this.baseUrl}/api/vehicles/${id}`);
            console.log('Request Body:', JSON.stringify(vehicle, null, 2));
        }
        const response = await fetch(`${this.baseUrl}/api/vehicles/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(vehicle)
        });

        const apiResponse = await this.handleResponse<Vehicle>(response);
        if (this._debugMode) {
            console.log('Update Vehicle API Response:', apiResponse);
        }
        return apiResponse;
    }

    async deleteVehicle(id: string): Promise<ApiResponse<void>> {
        if (this._debugMode) {
            console.log('-- Deleting Vehicle Debug --');
            console.log('Request URL:', `${this.baseUrl}/api/vehicles/${id}`);
        }
        const response = await fetch(`${this.baseUrl}/api/vehicles/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        const apiResponse = await this.handleResponse<void>(response);
        if (this._debugMode) {
            console.log('Delete Vehicle API Response:', apiResponse);
        }
        return apiResponse;
    }

    // Ruta API
    async createRuta(ruta: CreateRutaDto): Promise<ApiResponse<Ruta>> {
        const response = await fetch(`${this.baseUrl}/api/rutas`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(ruta)
        });
        return this.handleResponse<Ruta>(response);
    }

    async getAllRutas(filters?: { searchTerm?: string; page?: number; limit?: number; }): Promise<ApiResponse<PaginatedRutasResponse>> {
        let url = `${this.baseUrl}/api/rutas`;
        const queryParams = new URLSearchParams();

        if (filters) {
            if (filters.searchTerm) {
                queryParams.append('searchTerm', filters.searchTerm);
            }
            if (filters.page) {
                queryParams.append('page', filters.page.toString());
            }
            if (filters.limit) {
                queryParams.append('limit', filters.limit.toString());
            }
        }

        if (queryParams.toString()) {
            url = `${url}?${queryParams.toString()}`;
        }

        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        return this.handleResponse<PaginatedRutasResponse>(response);
    }

    async getRuta(id: string): Promise<ApiResponse<Ruta>> {
        const response = await fetch(`${this.baseUrl}/api/rutas/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse<Ruta>(response);
    }

    async updateRuta(id: string, ruta: UpdateRutaDto): Promise<ApiResponse<Ruta>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Updating Ruta with ID:', id);
            console.log('DEBUG: ApiClient - Update Ruta Payload:', JSON.stringify(ruta, null, 2));
        }
        const response = await fetch(`${this.baseUrl}/api/rutas/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(ruta)
        });
        const apiResponse = await this.handleResponse<Ruta>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Update Ruta API Response:', apiResponse);
        }
        return apiResponse;
    }

    async deleteRuta(id: string): Promise<ApiResponse<void>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Deleting Ruta with ID:', id);
        }
        const response = await fetch(`${this.baseUrl}/api/rutas/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        const apiResponse = await this.handleResponse<void>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Delete Ruta API Response:', apiResponse);
        }
        return apiResponse;
    }

    // Pago API
    async createPago(pago: CreatePagoDto): Promise<ApiResponse<Pago>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Creating Pago:', JSON.stringify(pago, null, 2));
        }
        const formData = new FormData();
        for (const key in pago) {
            if (Object.prototype.hasOwnProperty.call(pago, key)) {
                const value = pago[key as keyof CreatePagoDto];
                if (value !== undefined) {
                    if (key === 'receiptImage' && value instanceof File) {
                        formData.append(key, value);
                    } else if (value !== null) {
                        formData.append(key, String(value));
                    }
                }
            }
        }

        const response = await fetch(`${this.baseUrl}/api/pagos`, {
            method: 'POST',
            headers: this.getHeaders(true),
            body: formData
        });
        const apiResponse = await this.handleResponse<Pago>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Create Pago API Response:', apiResponse);
        }
        return apiResponse;
    }

    async getAllPagos(filters?: { searchTerm?: string; page?: number; limit?: number; paymentType?: 'employee' | 'owner' | 'company_out' | 'company_in'; rutaId?: string; empleadoId?: string; propietarioId?: string; estado?: string; }): Promise<ApiResponse<PaginatedPagosResponse>> {
        let url = `${this.baseUrl}/api/pagos`;
        const queryParams = new URLSearchParams();

        if (filters) {
            if (filters.searchTerm) { queryParams.append('searchTerm', filters.searchTerm); }
            if (filters.page) { queryParams.append('page', filters.page.toString()); }
            if (filters.limit) { queryParams.append('limit', filters.limit.toString()); }
            if (filters.paymentType) { queryParams.append('paymentType', filters.paymentType); }
            if (filters.rutaId) { queryParams.append('rutaId', filters.rutaId); }
            if (filters.empleadoId) { queryParams.append('empleadoId', filters.empleadoId); }
            if (filters.propietarioId) { queryParams.append('propietarioId', filters.propietarioId); }
            if (filters.estado) { queryParams.append('estado', filters.estado); }
        }

        if (queryParams.toString()) {
            url = `${url}?${queryParams.toString()}`;
        }
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Fetching Pagos from URL:', url);
        }
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        const apiResponse = await this.handleResponse<PaginatedPagosResponse>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Get All Pagos API Response:', apiResponse);
        }
        return apiResponse;
    }

    async getPago(id: string): Promise<ApiResponse<Pago>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Fetching Pago with ID:', id);
        }
        const response = await fetch(`${this.baseUrl}/api/pagos/${id}`, {
            headers: this.getHeaders()
        });
        const apiResponse = await this.handleResponse<Pago>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Get Pago by ID API Response:', apiResponse);
        }
        return apiResponse;
    }

    async updatePago(id: string, pago: UpdatePagoDto): Promise<ApiResponse<Pago>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Updating Pago with ID:', id);
            console.log('DEBUG: ApiClient - Update Pago Payload:', JSON.stringify(pago, null, 2));
        }
        const formData = new FormData();
        for (const key in pago) {
            if (Object.prototype.hasOwnProperty.call(pago, key)) {
                const value = pago[key as keyof UpdatePagoDto];
                if (value !== undefined) {
                    if (key === 'receiptImage' && value instanceof File) {
                        formData.append(key, value);
                    } else if (value !== null) {
                        formData.append(key, String(value));
                    }
                }
            }
        }
        
        const response = await fetch(`${this.baseUrl}/api/pagos/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(true),
            body: formData
        });
        const apiResponse = await this.handleResponse<Pago>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Update Pago API Response:', apiResponse);
        }
        return apiResponse;
    }

    async deletePago(id: string): Promise<ApiResponse<void>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Deleting Pago with ID:', id);
        }
        const response = await fetch(`${this.baseUrl}/api/pagos/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        const apiResponse = await this.handleResponse<void>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Delete Pago API Response:', apiResponse);
        }
        return apiResponse;
    }

    // Factura API
    async createFactura(factura: CreateFacturaDto): Promise<ApiResponse<Factura>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Creating Factura:', JSON.stringify(factura, null, 2));
        }
        const response = await fetch(`${this.baseUrl}/api/facturas`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(factura)
        });
        const apiResponse = await this.handleResponse<Factura>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Create Factura API Response:', apiResponse);
        }
        return apiResponse;
    }

    async getAllFacturas(filters?: { searchTerm?: string; page?: number; limit?: number; paymentStatus?: string; rutaId?: string; }): Promise<ApiResponse<PaginatedFacturasResponse>> {
        let url = `${this.baseUrl}/api/facturas`;
        const queryParams = new URLSearchParams();

        if (filters) {
            if (filters.searchTerm) { queryParams.append('searchTerm', filters.searchTerm); }
            if (filters.page) { queryParams.append('page', filters.page.toString()); }
            if (filters.limit) { queryParams.append('limit', filters.limit.toString()); }
            if (filters.paymentStatus) { queryParams.append('paymentStatus', filters.paymentStatus); }
            if (filters.rutaId) { queryParams.append('rutaId', filters.rutaId); }
        }

        if (queryParams.toString()) {
            url = `${url}?${queryParams.toString()}`;
        }
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Fetching Facturas from URL:', url);
        }
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        const apiResponse = await this.handleResponse<PaginatedFacturasResponse>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Get All Facturas API Response:', apiResponse);
        }
        return apiResponse;
    }

    async getFactura(id: string): Promise<ApiResponse<Factura>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Fetching Factura with ID:', id);
        }
        const response = await fetch(`${this.baseUrl}/api/facturas/${id}`, {
            headers: this.getHeaders()
        });
        const apiResponse = await this.handleResponse<Factura>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Get Factura by ID API Response:', apiResponse);
        }
        return apiResponse;
    }

    async updateFactura(id: string, factura: UpdateFacturaDto): Promise<ApiResponse<Factura>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Updating Factura with ID:', id);
            console.log('DEBUG: ApiClient - Update Factura Payload:', JSON.stringify(factura, null, 2));
        }
        const response = await fetch(`${this.baseUrl}/api/facturas/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(factura)
        });
        const apiResponse = await this.handleResponse<Factura>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Update Factura API Response:', apiResponse);
        }
        return apiResponse;
    }

    async deleteFactura(id: string): Promise<ApiResponse<void>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Deleting Factura with ID:', id);
        }
        const response = await fetch(`${this.baseUrl}/api/facturas/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        const apiResponse = await this.handleResponse<void>(response);
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Delete Factura API Response:', apiResponse);
        }
        return apiResponse;
    }

    async generateInvoicePdf(id: string): Promise<ApiResponse<Blob>> {
        if (this._debugMode) {
            console.log('DEBUG: ApiClient - Generating Invoice PDF for ID:', id);
        }
        const response = await fetch(`${this.baseUrl}/api/facturas/${id}/pdf`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error generating PDF:', errorText);
            return { error: errorText || 'Error al generar el PDF', status: response.status };
        }

        const pdfBlob = await response.blob();
        return { data: pdfBlob, status: response.status };
    }
}

// Add a global instance or a getter for it
let apiInstance: ApiClient | null = null;

export function getApiClient(): ApiClient {
    if (!apiInstance) {
        apiInstance = new ApiClient();
        // Enable debug mode for all API calls initiated from this client
        apiInstance.setDebugMode(true);
    }
    return apiInstance;
}

export const api = new ApiClient(); 