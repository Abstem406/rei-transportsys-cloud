<script lang="ts">
  import { onMount } from 'svelte';
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { api } from '$lib/api/ApiClient';
  import type { Employee, CreateEmployeeDto, UpdateEmployeeDto, User, Department, Position, ContractType, PaginatedEmployeesResponse } from '$lib/api/ApiClient';
  import Pagination from '$lib/components/Pagination.svelte';

  // State variables for employees data
  let employees: Employee[] = [];
  let isLoading = true;
  let error: string | null = null;
  let activeSection = 'empleados'; // For the header navigation

  // Search and Filter state variables
  let searchTerm = '';
  let departmentFilter = '';
  let positionFilter = '';
  let contractTypeFilter = '';
  let startDateFilter = ''; // YYYY-MM-DD format for date input
  let endDateFilter = ''; // YYYY-MM-DD format for date input
  let flexibleDateSearchTerm = ''; // New flexible search term for dates
  let userLinkedFilter = ''; // '' for all, 'true' for linked, 'false' for not linked

  // Arrays para almacenar las opciones de filtro completas (con _id y name)
  let allDepartments: Department[] = [];
  let allPositions: Position[] = [];
  let allContractTypes: ContractType[] = [];

  // Pagination state variables
  let currentPage = 1;
  let employeesPerPage = 10;
  let totalPages = 0;

  // Modals state variables
  let showModal = false; // For employee details/edit modal
  let showConfirmModal = false; // For delete confirmation modal
  let showCreateModal = false; // For create new employee modal
  let showLinkUserModal = false; // For linking employee to user modal

  // Selected employee for details/edit/delete
  let selectedEmployee: Employee | null = null;
  let isEditing = false;
  let editedEmployee: UpdateEmployeeDto = {};
  let isDeleting = false;
  let employeeToDelete: { id: string; displayName: string; } | null = null;

  // New employee creation
  let newEmployee: CreateEmployeeDto = {
    firstName: '',
    lastName: '',
    cedula: '', // This will be combined from prefix and number
    rif: '',     // This will be combined from prefix and number
    birthDate: new Date().toISOString().split('T')[0],
    gender: 'masculino',
    address: '',
    phone: '',
    email: '',
    position: '',
    department: '',
    contractType: 'fijo',
    startDate: new Date().toISOString().split('T')[0],
    salary: 0,
    cedulaPrefix: 'V',
    cedulaNumber: '',
    rifPrefix: 'J',
    rifNumber: ''
  };
  let isCreating = false;

  // Generic state for category management (Departments, Positions, Contract Types)
  type CategoryType = 'department' | 'position' | 'contractType';
  type CategoryItem = Department | Position | ContractType;

  let showManageCategoryModal = false;
  let categoryTypeToManage: CategoryType | null = null;
  let newCategoryName = '';
  let editingCategory: CategoryItem | null = null; // Currently edited item (can be Department, Position, or ContractType)
  let categoryToDelete: CategoryItem | null = null; // Item to delete
  let showConfirmDeleteCategoryModal = false;

  let isCreatingCategory = false;
  let isUpdatingCategory = false;
  let isDeletingCategory = false;

  // User Linking specific state
  let usersForLinking: User[] = [];
  let userSearchTerm = '';
  let selectedUserToLink: User | null = null;
  let isLinkingUser = false;
  let showCreateAndLinkUserForm = false;
  let newUserToLink = {
    name: '',
    email: '',
    password: '',
    role: 'user' as const
  };
  let isCreatingAndLinking = false;

  // Reactive block to reload employees when search or filter terms change
  $: searchTerm, departmentFilter, positionFilter, contractTypeFilter, startDateFilter, endDateFilter, userLinkedFilter, (() => {
    currentPage = 1;
    loadEmployees();
  })();

  // Reactive block to parse flexibleDateSearchTerm into startDateFilter and endDateFilter
  $: flexibleDateSearchTerm, parseFlexibleDateSearch();

  function parseFlexibleDateSearch() {
    let tempStartDate: string | undefined = '';
    let tempEndDate: string | undefined = '';
    const term = flexibleDateSearchTerm.trim();

    if (!term) {
      tempStartDate = '';
      tempEndDate = '';
    } else {
      // YYYY
      const yearMatch = term.match(/^(\d{4})$/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        tempStartDate = `${year}-01-01`;
        tempEndDate = `${year}-12-31`;
      } else {
        // YYYY-MM
        const ymMatch = term.match(/^(\d{4})-(\d{1,2})$/);
        if (ymMatch) {
          const year = parseInt(ymMatch[1]);
          const month = parseInt(ymMatch[2]);
          if (month >= 1 && month <= 12) {
            tempStartDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate(); // Last day of month
            tempEndDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
          }
        } else {
          // DD/MM/YYYY or YYYY-MM-DD
          // YYYY-MM-DD
          const ymdMatch = term.match(/^(\d{4}-\d{2}-\d{2})$/);
          if (ymdMatch) {
            tempStartDate = ymdMatch[1];
            tempEndDate = ymdMatch[1];
          } else {
            // DD/MM/YYYY
            const dmyMatch = term.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (dmyMatch) {
              const day = parseInt(dmyMatch[1]);
              const month = parseInt(dmyMatch[2]);
              const year = parseInt(dmyMatch[3]);
              if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                tempStartDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                tempEndDate = tempStartDate;
              }
            }
          }
        }
      }
    }

    // Only update filters if they have changed to avoid unnecessary reloads
    if (startDateFilter !== tempStartDate || endDateFilter !== tempEndDate) {
      startDateFilter = tempStartDate || '';
      endDateFilter = tempEndDate || '';
    }
  }

  // Pagination functions
  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      loadEmployees(); // Reload employees for the next page
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
      loadEmployees(); // Reload employees for the previous page
    }
  }

  // Employee CRUD operations and modal handlers
  function handleEmployeeClick(employee: Employee) {
    selectedEmployee = employee;
    editedEmployee = {
      ...employee,
      // Asegurarse de que position, department y contractType sean solo los IDs
      position: typeof employee.position === 'object' && employee.position ? employee.position._id : employee.position,
      department: typeof employee.department === 'object' && employee.department ? employee.department._id : employee.department,
      contractType: typeof employee.contractType === 'object' && employee.contractType ? employee.contractType._id : employee.contractType,
    };
    // Ensure date inputs are in YYYY-MM-DD format for HTML date input type
    if (editedEmployee.birthDate) editedEmployee.birthDate = new Date(editedEmployee.birthDate).toISOString().split('T')[0];
    if (editedEmployee.startDate) editedEmployee.startDate = new Date(editedEmployee.startDate).toISOString().split('T')[0];

    // Separate cedula and rif into prefix and number for editing
    if (editedEmployee.cedula) {
      const [prefix, ...rest] = editedEmployee.cedula.split('-');
      if (prefix && rest.length > 0) {
        editedEmployee.cedulaPrefix = prefix;
        editedEmployee.cedulaNumber = rest.join('-');
      } else {
        // If no hyphen, assume no prefix or 'V' default if it's purely numeric
        editedEmployee.cedulaPrefix = editedEmployee.cedula.match(/^\d+$/) ? 'V' : ''; // Default to V if only numbers, else empty
        editedEmployee.cedulaNumber = editedEmployee.cedula;
      }
    } else {
      editedEmployee.cedulaPrefix = 'V';
      editedEmployee.cedulaNumber = '';
    }

    if (editedEmployee.rif) {
      const [prefix, ...rest] = editedEmployee.rif.split('-');
      if (prefix && rest.length > 0) {
        editedEmployee.rifPrefix = prefix;
        editedEmployee.rifNumber = rest.join('-');
      } else {
        // If no hyphen, assume no prefix or 'J' default if it's purely numeric
        editedEmployee.rifPrefix = editedEmployee.rif.match(/^\d+$/) ? 'J' : ''; // Default to J if only numbers, else empty
        editedEmployee.rifNumber = editedEmployee.rif;
      }
    } else {
      editedEmployee.rifPrefix = 'J';
      editedEmployee.rifNumber = '';
    }

    showModal = true;
    isEditing = false;
  }

  function closeModal() {
    showModal = false;
    selectedEmployee = null;
    isEditing = false;
  }

  function handleDeleteClick(employee: Employee) {
    employeeToDelete = {
      id: employee._id,
      displayName: employee.fullName // Use fullName for display
    };
    showConfirmModal = true;
  }

  async function handleDelete() {
    if (typeof window === 'undefined') return; // Ensure client-side execution
    if (!employeeToDelete?.id) return;
    
    try {
      isDeleting = true;
      const response = await api.deleteEmployee(employeeToDelete.id);

      if (response.error) {
        throw new Error(response.error);
      }

      employees = employees.filter(e => e._id !== employeeToDelete?.id);
      showConfirmModal = false;
      closeModal();
      await loadEmployees(); // Reload data after deletion to ensure pagination/filters are correct
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al eliminar empleado';
    } finally {
      isDeleting = false;
      employeeToDelete = null;
    }
  }

  async function handleSave() {
    if (typeof window === 'undefined') return; // Ensure client-side execution
    if (!selectedEmployee?._id || !editedEmployee) return;
    
    try {
      // Combine prefix and number for cedula and rif before sending to API
      const cedulaToSend = editedEmployee.cedulaNumber ? `${editedEmployee.cedulaPrefix || 'V'}-${editedEmployee.cedulaNumber}` : '';
      const rifToSend = editedEmployee.rifNumber ? `${editedEmployee.rifPrefix || 'J'}-${editedEmployee.rifNumber}` : '';

      const updatedData: UpdateEmployeeDto = {
        ...editedEmployee,
        cedula: cedulaToSend,
        rif: rifToSend
      };

      const response = await api.updateEmployee(selectedEmployee._id, updatedData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        employees = employees.map(e => e._id === selectedEmployee?._id ? response.data! : e);
        isEditing = false;
        selectedEmployee = response.data;
        await loadEmployees(); // Reload data after update
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al actualizar empleado';
    }
  }

  async function handleCreateEmployee() {
    if (typeof window === 'undefined') return; // Ensure client-side execution
    try {
      isCreating = true;

      // Combine prefix and number for cedula and rif before sending to API
      const cedulaToSend = newEmployee.cedulaNumber ? `${newEmployee.cedulaPrefix || 'V'}-${newEmployee.cedulaNumber}` : '';
      const rifToSend = newEmployee.rifNumber ? `${newEmployee.rifPrefix || 'J'}-${newEmployee.rifNumber}` : '';

      const employeeData: CreateEmployeeDto = {
        ...newEmployee,
        cedula: cedulaToSend,
        rif: rifToSend
      };

      const response = await api.createEmployee(employeeData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        employees = [...employees, response.data];
        showCreateModal = false;
        resetNewEmployee();
        await loadEmployees(); // Reload data after creation
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al crear empleado';
    } finally {
      isCreating = false;
    }
  }

  // User linking functions
  async function searchUsersForLinking() {
    if (typeof window === 'undefined') return;
    if (userSearchTerm.length < 3) {
      usersForLinking = [];
      return;
    }
    try {
      const response = await api.getUsers();
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        usersForLinking = response.data.filter(user =>
          user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.name?.toLowerCase().includes(userSearchTerm.toLowerCase())
        );
      }
    } catch (err) {
      console.error('Error buscando usuarios:', err);
      error = err instanceof Error ? err.message : 'Error al buscar usuarios';
    }
  }

  async function handleLinkUser() {
    if (typeof window === 'undefined') return;
    if (!selectedEmployee?._id || !selectedUserToLink?._id) return;

    try {
      isLinkingUser = true;
      const response = await api.linkEmployeeToUser(selectedEmployee._id, selectedUserToLink._id);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        employees = employees.map(e => e._id === selectedEmployee?._id ? response.data! : e);
        selectedEmployee = response.data;
        closeLinkUserModal();
        await loadEmployees(); // Reload to reflect user link
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al vincular usuario';
    } finally {
      isLinkingUser = false;
    }
  }

  async function handleUnlinkUser() {
    if (typeof window === 'undefined') return; // Add window check
    if (!selectedEmployee?._id) return;

    try {
      isLinkingUser = true;
      const response = await api.unlinkEmployeeFromUser(selectedEmployee._id);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        employees = employees.map(e => e._id === selectedEmployee?._id ? response.data! : e);
        selectedEmployee = response.data;
        closeLinkUserModal();
        await loadEmployees(); // Reload to reflect user unlink
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al desvincular usuario';
    } finally {
      isLinkingUser = false;
    }
  }

  async function handleCreateAndLinkUser() {
    if (typeof window === 'undefined') return; // Add window check
    if (!selectedEmployee?._id || !selectedEmployee?.email) return; // Ensure employee email is available

    try {
      isCreatingAndLinking = true;

      // Set the email for the new user from the selected employee's email
      newUserToLink.email = selectedEmployee.email;

      // 1. Create the new user
      const createUserResponse = await api.createUser({
        name: newUserToLink.name,
        email: newUserToLink.email,
        password: newUserToLink.password,
        role: newUserToLink.role
      });

      if (createUserResponse.error || !createUserResponse.data) {
        throw new Error(createUserResponse.error || 'Error al crear el nuevo usuario');
      }

      const createdUser = createUserResponse.data;
      console.log('Usuario creado exitosamente:', createdUser);

      // 2. Link the newly created user to the selected employee
      const linkResponse = await api.linkEmployeeToUser(selectedEmployee._id, createdUser._id);

      if (linkResponse.error || !linkResponse.data) {
        throw new Error(linkResponse.error || 'Error al vincular el usuario al empleado');
      }

      employees = employees.map(e => e._id === selectedEmployee?._id ? linkResponse.data! : e);
      selectedEmployee = linkResponse.data;

      closeLinkUserModal();
      resetNewUserToLink();
      showCreateAndLinkUserForm = false;
      error = null;
      console.log('Usuario creado y vinculado exitosamente.');
      await loadEmployees(); // Reload to reflect new user link
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al crear y vincular el usuario';
      console.error('Error en handleCreateAndLinkUser:', err);
    } finally {
      isCreatingAndLinking = false;
    }
  }

  function resetNewUserToLink() {
    newUserToLink = {
      name: '',
      email: '',
      password: '',
      role: 'user'
    };
  }

  function openLinkUserModal() {
    showLinkUserModal = true;
    userSearchTerm = '';
    usersForLinking = [];
    selectedUserToLink = null;
    showCreateAndLinkUserForm = false;
    if (selectedEmployee && selectedEmployee.email) {
      newUserToLink.email = selectedEmployee.email;
    }
  }

  function closeLinkUserModal() {
    showLinkUserModal = false;
    userSearchTerm = '';
    usersForLinking = [];
    selectedUserToLink = null;
    showCreateAndLinkUserForm = false;
    resetNewUserToLink();
  }

  // Initial data load on component mount
  onMount(async () => {
    console.log('🔵 Página de empleados montada, iniciando carga');
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        window.location.href = '/'; // Redirect to login if no token
        return;
      }

      api.setToken(token); // Set the token on the api instance
      api.setDebugMode(true); // Activar el modo de depuración del API client
      await loadUniqueFilterOptions(); // Load filter options first
      await loadEmployees(); // Then load employees
      console.log('✅ Carga completa');
    } catch (e) {
      console.error('Error en el montaje del componente Empleados:', e);
      error = 'Error al iniciar la aplicación.';
    }
  });

  // Function to load employees from the API with current filters
  async function loadEmployees() {
    isLoading = true;
    error = null;
    try {
      const filters: any = {
        page: currentPage,
        limit: employeesPerPage,
      };

      if (searchTerm) {
        filters.searchTerm = searchTerm;
      }
      if (departmentFilter) {
        filters.department = departmentFilter;
      }
      if (positionFilter) {
        filters.position = positionFilter;
      }
      if (contractTypeFilter) {
        filters.contractType = contractTypeFilter;
      }
      if (startDateFilter) {
        filters.startDate = startDateFilter;
      }
      if (endDateFilter) {
        filters.endDate = endDateFilter;
      }
      // Convert userLinkedFilter string to boolean for API
      if (userLinkedFilter !== '') {
        filters.userLinked = userLinkedFilter === 'true';
      }

      const response = await api.getEmployees(filters);

      // Bandera de depuración: Imprimir los filtros enviados al backend
      console.log('DEBUG (Frontend): Filtros enviados al backend:', filters);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        console.log('DEBUG (Frontend): Datos de respuesta de la API (response.data.items):', response.data.items);
        employees = response.data.items;
        console.log('DEBUG (Frontend): Contenido de la variable employees después de la asignación:', employees);
        totalPages = Math.ceil(response.data.totalCount / employeesPerPage);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al cargar empleados';
    } finally {
      isLoading = false;
    }
  }

  // Helper to reset new employee form fields
  function resetNewEmployee() {
    newEmployee = {
      firstName: '',
      lastName: '',
      cedula: '',
      rif: '',
      birthDate: new Date().toISOString().split('T')[0],
      gender: 'masculino',
      address: '',
      phone: '',
      email: '',
      position: '',
      department: '',
      contractType: 'fijo',
      startDate: new Date().toISOString().split('T')[0],
      salary: 0,
      cedulaPrefix: 'V',
      cedulaNumber: '',
      rifPrefix: 'J',
      rifNumber: ''
    };
  }

  // Helper to format dates for display
  function formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // New generic category creation functions
  async function handleCreateCategory() {
    if (typeof window === 'undefined') return;
    if (!categoryTypeToManage || !newCategoryName) return;

    isCreatingCategory = true;
    try {
      let response;
      if (categoryTypeToManage === 'department') {
        response = await api.createDepartment({ name: newCategoryName });
      } else if (categoryTypeToManage === 'position') {
        response = await api.createPosition({ name: newCategoryName });
      } else if (categoryTypeToManage === 'contractType') {
        response = await api.createContractType({ name: newCategoryName });
      } else {
        throw new Error('Tipo de categoría desconocido.');
      }
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        alert(`${newCategoryName} creado exitosamente.`);
        newCategoryName = '';
        await loadUniqueFilterOptions(); // Reload all lists after creation
        // Re-open the modal to show the updated list if it's still open
        openManageCategoryModal(categoryTypeToManage);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : `Error al crear ${categoryTypeToManage}`;
      console.error(`Error creating ${categoryTypeToManage}:`, err);
    } finally {
      isCreatingCategory = false;
    }
  }

  async function handleUpdateCategory() {
    if (typeof window === 'undefined') return;
    if (!categoryTypeToManage || !editingCategory || !editingCategory._id) return;

    isUpdatingCategory = true;
    try {
      let response;
      if (categoryTypeToManage === 'department') {
        response = await api.updateDepartment(editingCategory._id, { name: editingCategory.name });
      } else if (categoryTypeToManage === 'position') {
        response = await api.updatePosition(editingCategory._id, { name: editingCategory.name });
      } else if (categoryTypeToManage === 'contractType') {
        response = await api.updateContractType(editingCategory._id, { name: editingCategory.name });
      } else {
        throw new Error('Tipo de categoría desconocido.');
      }

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        alert(`${editingCategory.name} actualizado exitosamente.`);
        editingCategory = null; // Clear editing state
        await loadUniqueFilterOptions(); // Reload all lists after update
        openManageCategoryModal(categoryTypeToManage); // Re-open the modal
      }
    } catch (err) {
      error = err instanceof Error ? err.message : `Error al actualizar ${categoryTypeToManage}`;
      console.error(`Error updating ${categoryTypeToManage}:`, err);
    } finally {
      isUpdatingCategory = false;
    }
  }

  async function handleDeleteCategory() {
    if (typeof window === 'undefined') return;
    if (!categoryTypeToManage || !categoryToDelete || !categoryToDelete._id) return;

    isDeletingCategory = true;
    try {
      let response;
      if (categoryTypeToManage === 'department') {
        response = await api.deleteDepartment(categoryToDelete._id);
      } else if (categoryTypeToManage === 'position') {
        response = await api.deletePosition(categoryToDelete._id);
      } else if (categoryTypeToManage === 'contractType') {
        response = await api.deleteContractType(categoryToDelete._id);
      } else {
        throw new Error('Tipo de categoría desconocido.');
      }
      
      if (response.error) {
        throw new Error(response.error);
      }

      alert(`${categoryToDelete.name} eliminado exitosamente.`);
      showConfirmDeleteCategoryModal = false;
      categoryToDelete = null; // Clear delete state
      await loadUniqueFilterOptions(); // Reload all lists after deletion
      openManageCategoryModal(categoryTypeToManage); // Re-open the modal
    } catch (err) {
      error = err instanceof Error ? err.message : `Error al eliminar ${categoryTypeToManage}`;
      console.error(`Error deleting ${categoryTypeToManage}:`, err);
    } finally {
      isDeletingCategory = false;
    }
  }

  // Function to load unique filter options from the API
  async function loadUniqueFilterOptions() {
    isLoading = true;
    try {
      await Promise.all([
        fetchDepartments(),
        fetchPositions(),
        fetchContractTypes()
      ]);
    } catch (err) {
      console.error('Error loading filter options:', err);
      error = 'Error al cargar las opciones de filtro.';
    } finally {
      isLoading = false;
    }
  }

  // Funciones para cargar opciones de filtro (departamentos, posiciones, tipos de contrato)
  async function fetchDepartments() {
    const response = await api.getAllDepartments();
    if (response.data) {
      allDepartments = response.data;
    } else {
      console.error('Error fetching departments:', response.error);
    }
  }

  async function fetchPositions() {
    const response = await api.getAllPositions();
    if (response.data) {
      allPositions = response.data;
    } else {
      console.error('Error fetching positions:', response.error);
    }
  }

  async function fetchContractTypes() {
    const response = await api.getAllContractTypes();
    if (response.data) {
      allContractTypes = response.data;
    } else {
      console.error('Error fetching contract types:', response.error);
    }
  }

  function resetFilters() {
    searchTerm = '';
    departmentFilter = '';
    positionFilter = '';
    contractTypeFilter = '';
    startDateFilter = '';
    endDateFilter = '';
    flexibleDateSearchTerm = '';
    userLinkedFilter = '';
    currentPage = 1;
    loadEmployees();
  }

  function openCreateModal() {
    showCreateModal = true;
    resetNewEmployee();
    error = null; // Clear any previous errors
  }

  function closeCreateModal() {
    showCreateModal = false;
    resetNewEmployee();
    error = null; // Clear any previous errors
  }

  // Generic function to open the category management modal
  function openManageCategoryModal(type: CategoryType) {
    categoryTypeToManage = type;
    showManageCategoryModal = true;
    newCategoryName = ''; // Reset new category name
    editingCategory = null; // Reset editing state
    categoryToDelete = null; // Reset delete state
    showConfirmDeleteCategoryModal = false; // Ensure confirmation modal is hidden
    error = null; // Clear any previous errors
  }

  function closeManageCategoryModal() {
    showManageCategoryModal = false;
    categoryTypeToManage = null;
    newCategoryName = '';
    editingCategory = null;
    categoryToDelete = null;
    showConfirmDeleteCategoryModal = false;
    error = null;
    loadUniqueFilterOptions(); // Refresh lists after managing
  }

</script>

<PageTransition let:isVisible>
  <div class="page-container">
    <OperatorHeader {activeSection} />
    <AnimatedBackground isVisible={isVisible} />
    
    <main>
      <div class="content-section">
        <div class="header-section">
          <div class="title-section">
            <h1>Gestión de Empleados</h1>
            <button class="button primary create-button" on:click={openCreateModal}>
              <span class="icon">+</span>
              Crear Empleado
            </button>
          </div>
          <div class="search-box">
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, RIF o correo"
              bind:value={searchTerm}
              on:input={loadEmployees}
              class="search-input"
            />
          </div>
          <div class="category-buttons">
            <button class="button secondary" on:click={() => openManageCategoryModal('department')}>
              Gestionar Departamentos
            </button>
            <button class="button secondary" on:click={() => openManageCategoryModal('position')}>
              Gestionar Puestos
            </button>
            <button class="button secondary" on:click={() => openManageCategoryModal('contractType')}>
              Gestionar Tipos de Contrato
            </button>
          </div>
          <div class="filters-section">
            <div class="filter-group">
              <label for="departmentFilter">Departamento:</label>
              <select id="departmentFilter" bind:value={departmentFilter} class="filter-select" on:change={loadEmployees}>
                <option value="">Todos los Departamentos</option>
                {#each allDepartments as department}
                  <option value={department._id}>{department.name}</option>
                {/each}
              </select>
            </div>
            <div class="filter-group">
              <label for="positionFilter">Puesto:</label>
              <select id="positionFilter" bind:value={positionFilter} class="filter-select" on:change={loadEmployees}>
                <option value="">Todos los Cargos</option>
                {#each allPositions as position}
                  <option value={position._id}>{position.name}</option>
                {/each}
              </select>
            </div>
            <div class="filter-group">
              <label for="contractTypeFilter">Tipo de Contrato:</label>
              <select id="contractTypeFilter" bind:value={contractTypeFilter} class="filter-select" on:change={loadEmployees}>
                <option value="">Todos los Tipos de Contrato</option>
                {#each allContractTypes as contractType}
                  <option value={contractType._id}>{contractType.name}</option>
                {/each}
              </select>
            </div>
            <div class="filter-group">
              <label for="userLinkedFilter">Usuario Vinculado:</label>
              <select id="userLinkedFilter" bind:value={userLinkedFilter} class="filter-select" on:change={loadEmployees}>
                <option value="">Usuario Vinculado (Todos)</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="flexibleDateSearch">Fecha de Contrato:</label>
              <input
                type="text"
                id="flexibleDateSearch"
                bind:value={flexibleDateSearchTerm}
                placeholder="Buscar por año, mes o fecha completa (YYYY-MM-DD, DD/MM/YYYY)"
                class="filter-input"
              />
              <p class="help-text">Formatos de búsqueda: Año (YYYY), Año-Mes (YYYY-MM), Fecha (YYYY-MM-DD o DD/MM/YYYY)</p>
            </div>
            <button class="button secondary" on:click={resetFilters}>Limpiar Filtros</button>
          </div>
        </div>

        {console.log('Pagination render check:', { isLoading, totalPages })} <!-- Diagnostic log -->
        {#if error}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {error}
          </div>
        {/if}

        {#if isLoading}
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Cargando empleados...</p>
          </div>
        {:else}
          <div class="employees-grid">
            {#each employees as employee (employee._id)}
              <div
                class="employee-card"
                on:click={() => handleEmployeeClick(employee)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleEmployeeClick(employee); }}
                role="button"
                tabindex="0"
              >
                <div class="employee-avatar">
                  {employee.firstName[0].toUpperCase()}
                </div>
                <div class="employee-info">
                  <h3>{employee.firstName} {employee.lastName}</h3>
                  <p class="position">{typeof employee.position === 'object' && employee.position ? employee.position.name : employee.position || 'N/A'}</p>
                  <p class="department">{typeof employee.department === 'object' && employee.department ? employee.department.name : employee.department || 'N/A'}</p>
                  <p class="date">Contratado: {formatDate(employee.startDate)}</p>
                </div>
              </div>
            {:else}
              <div class="no-results">
                {searchTerm || departmentFilter || positionFilter || contractTypeFilter || startDateFilter ? 'No se encontraron empleados que coincidan con la búsqueda o filtros' : 'No hay empleados registrados'}
              </div>
            {/each}
          </div>
          {#if !isLoading && totalPages > 1}
            <Pagination
              {currentPage}
              {totalPages}
              onNextPage={nextPage}
              onPreviousPage={previousPage}
            />
          {/if}
        {/if}
      </div>
    </main>

    {#if showModal && selectedEmployee}
      <div class="modal-backdrop" on:click={closeModal} role="presentation">
        <div class="modal-content" on:click|stopPropagation role="dialog">
          <div class="modal-header">
            <h2>{isEditing ? 'Editar Empleado' : 'Detalles del Empleado'}</h2>
            <button class="close-button" on:click={closeModal}>&times;</button>
          </div>
          
          <div class="modal-body">
            {#if isEditing}
              <div class="form-group">
                <label for="firstName">Nombre</label>
                <input
                  type="text"
                  id="firstName"
                  bind:value={editedEmployee.firstName}
                  placeholder="Nombre del empleado"
                  required
                />
              </div>
              <div class="form-group">
                <label for="lastName">Apellido</label>
                <input
                  type="text"
                  id="lastName"
                  bind:value={editedEmployee.lastName}
                  placeholder="Apellido del empleado"
                  required
                />
              </div>
              <div class="form-group">
                <label for="cedula">Cédula</label>
                <div class="input-with-prefix">
                  <select bind:value={editedEmployee.cedulaPrefix} class="prefix-select-base {editedEmployee.cedulaPrefix ? '' : 'prefix-select-arrow'}">
                    <option value="">-</option>
                    <option value="V">V</option>
                    <option value="E">E</option>
                  </select>
                  <input
                    type="text"
                    id="cedula"
                    bind:value={editedEmployee.cedulaNumber}
                    placeholder="Número de cédula"
                    required
                  />
                </div>
              </div>
              <div class="form-group">
                <label for="rif">RIF</label>
                <div class="input-with-prefix">
                  <select bind:value={editedEmployee.rifPrefix} class="prefix-select-base {editedEmployee.rifPrefix ? '' : 'prefix-select-arrow'}">
                    <option value="">-</option>
                    <option value="J">J</option>
                    <option value="G">G</option>
                    <option value="V">V</option>
                    <option value="E">E</option>
                    <option value="P">P</option>
                  </select>
                  <input
                    type="text"
                    id="rif"
                    bind:value={editedEmployee.rifNumber}
                    placeholder="Número de RIF"
                    required
                  />
                </div>
              </div>
              <div class="form-group">
                <label for="birthDate">Fecha de Nacimiento</label>
                <input
                  type="date"
                  id="birthDate"
                  bind:value={editedEmployee.birthDate}
                  required
                />
              </div>
              <div class="form-group">
                <label for="gender">Género</label>
                <select id="gender" bind:value={editedEmployee.gender} required>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  bind:value={editedEmployee.email}
                  placeholder="Email del empleado"
                  required
                />
              </div>
              <div class="form-group">
                <label for="phone">Teléfono</label>
                <input
                  type="text"
                  id="phone"
                  bind:value={editedEmployee.phone}
                  placeholder="Teléfono del empleado"
                  required
                />
              </div>
              <div class="form-group">
                <label for="address">Dirección</label>
                <input
                  type="text"
                  id="address"
                  bind:value={editedEmployee.address}
                  placeholder="Dirección del empleado"
                  required
                />
              </div>
              <div class="form-group">
                <label for="position">Puesto</label>
                <div class="select-with-button">
                  <select id="position" bind:value={editedEmployee.position} required>
                    {#each allPositions as position}
                      <option value={position._id}>{position.name}</option>
                    {/each}
                  </select>
                  <button type="button" class="button secondary" on:click={() => openManageCategoryModal('position')}>+</button>
                </div>
              </div>
              <div class="form-group">
                <label for="department">Departamento</label>
                <div class="select-with-button">
                  <select id="department" bind:value={editedEmployee.department} required>
                    {#each allDepartments as department}
                      <option value={department._id}>{department.name}</option>
                    {/each}
                  </select>
                  <button type="button" class="button secondary" on:click={() => openManageCategoryModal('department')}>+</button>
                </div>
              </div>
              <div class="form-group">
                <label for="contractType">Tipo de Contrato</label>
                <div class="select-with-button">
                  <select id="contractType" bind:value={editedEmployee.contractType} required>
                    {#each allContractTypes as contractType}
                      <option value={contractType._id}>{contractType.name}</option>
                    {/each}
                  </select>
                  <button type="button" class="button secondary" on:click={() => openManageCategoryModal('contractType')}>+</button>
                </div>
              </div>
              <div class="form-group">
                <label for="startDate">Fecha de Ingreso</label>
                <input
                  type="date"
                  id="startDate"
                  bind:value={editedEmployee.startDate}
                  required
                />
              </div>
              <div class="form-group">
                <label for="salary">Salario</label>
                <input
                  type="number"
                  id="salary"
                  bind:value={editedEmployee.salary}
                  placeholder="Salario del empleado"
                  required
                />
              </div>
            {:else}
              <div class="employee-details">
                <p><strong>Nombre:</strong> {selectedEmployee.firstName}</p>
                <p><strong>Apellido:</strong> {selectedEmployee.lastName}</p>
                <p><strong>Cédula:</strong> {selectedEmployee.cedula}</p>
                <p><strong>RIF:</strong> {selectedEmployee.rif}</p>
                <p><strong>Fecha de Nacimiento:</strong> {formatDate(selectedEmployee.birthDate)}</p>
                <p><strong>Género:</strong> {selectedEmployee.gender}</p>
                <p><strong>Email:</strong> {selectedEmployee.email}</p>
                <p><strong>Teléfono:</strong> {selectedEmployee.phone}</p>
                <p><strong>Dirección:</strong> {selectedEmployee.address}</p>
                <p><strong>Puesto:</strong> {typeof selectedEmployee.position === 'object' && selectedEmployee.position ? selectedEmployee.position.name : selectedEmployee.position || 'N/A'}</p>
                <p><strong>Departamento:</strong> {typeof selectedEmployee.department === 'object' && selectedEmployee.department ? selectedEmployee.department.name : selectedEmployee.department || 'N/A'}</p>
                <p><strong>Tipo de Contrato:</strong> {typeof selectedEmployee.contractType === 'object' && selectedEmployee.contractType ? selectedEmployee.contractType.name : selectedEmployee.contractType || 'N/A'}</p>
                <p><strong>Fecha de Ingreso:</strong> {formatDate(selectedEmployee.startDate)}</p>
                <p><strong>Salario:</strong> ${selectedEmployee.salary.toLocaleString()}</p>
                {#if selectedEmployee.user}
                  <p><strong>Usuario Vinculado:</strong> {selectedEmployee.user.email}</p>
                  <button class="button danger" on:click={handleUnlinkUser} disabled={isLinkingUser}>
                    {isLinkingUser ? 'Desvinculando...' : 'Desvincular Usuario'}
                  </button>
                {:else}
                  <p><strong>Usuario Vinculado:</strong> Ninguno</p>
                  <button class="button primary" on:click={openLinkUserModal}>Vincular Usuario</button>
                {/if}
              </div>
            {/if}
          </div>

          <div class="modal-footer">
            {#if isEditing}
              <button class="button secondary" on:click={() => isEditing = false}>Cancelar</button>
              <button class="button primary" on:click={handleSave}>Guardar</button>
            {:else}
              <button 
                class="button danger" 
                on:click={() => {
                  if (selectedEmployee) handleDeleteClick(selectedEmployee);
                }}
              >
                Eliminar
              </button>
              <button class="button primary" on:click={() => isEditing = true}>Editar</button>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    {#if showConfirmModal && employeeToDelete}
      <div class="modal-backdrop confirm-modal" on:click={() => showConfirmModal = false} role="presentation">
        <div class="modal-content confirm-content" on:click|stopPropagation role="dialog">
          <div class="modal-header">
            <h2>Confirmar Eliminación</h2>
            <button class="close-button" on:click={() => showConfirmModal = false}>&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="confirm-message">
              <span class="warning-icon">⚠️</span>
              <p>¿Estás seguro de que deseas eliminar al empleado <strong>{employeeToDelete.displayName}</strong>?</p>
              <p class="warning-text">Esta acción no se puede deshacer.</p>
            </div>
          </div>

          <div class="modal-footer">
            <button 
              class="button secondary" 
              on:click={() => showConfirmModal = false}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button 
              class="button danger" 
              on:click={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if showCreateModal}
      <div class="modal-backdrop" on:click={closeCreateModal} role="presentation">
        <div class="modal-content" on:click|stopPropagation role="dialog">
          <div class="modal-header">
            <h2>Crear Nuevo Empleado</h2>
            <button class="close-button" on:click={closeCreateModal}>&times;</button>
          </div>
          
          <div class="modal-body">
            <form on:submit|preventDefault={handleCreateEmployee}>
              <div class="form-group">
                <label for="new-firstName">Nombre</label>
                <input
                  type="text"
                  id="new-firstName"
                  bind:value={newEmployee.firstName}
                  placeholder="Nombre del empleado"
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-lastName">Apellido</label>
                <input
                  type="text"
                  id="new-lastName"
                  bind:value={newEmployee.lastName}
                  placeholder="Apellido del empleado"
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-cedula">Cédula</label>
                <div class="input-with-prefix">
                  <select bind:value={newEmployee.cedulaPrefix} class="prefix-select-base {newEmployee.cedulaPrefix ? '' : 'prefix-select-arrow'}">
                    <option value="">-</option>
                    <option value="V">V</option>
                    <option value="E">E</option>
                  </select>
                  <input
                    type="text"
                    id="new-cedula"
                    bind:value={newEmployee.cedulaNumber}
                    placeholder="Número de cédula"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="new-rif">RIF</label>
                <div class="input-with-prefix">
                  <select bind:value={newEmployee.rifPrefix} class="prefix-select-base {newEmployee.rifPrefix ? '' : 'prefix-select-arrow'}">
                    <option value="">-</option>
                    <option value="J">J</option>
                    <option value="G">G</option>
                    <option value="V">V</option>
                    <option value="E">E</option>
                    <option value="P">P</option>
                  </select>
                  <input
                    type="text"
                    id="new-rif"
                    bind:value={newEmployee.rifNumber}
                    placeholder="Número de RIF"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="new-birthDate">Fecha de Nacimiento</label>
                <input
                  type="date"
                  id="new-birthDate"
                  bind:value={newEmployee.birthDate}
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-gender">Género</label>
                <select id="new-gender" bind:value={newEmployee.gender} required>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div class="form-group">
                <label for="new-email">Email</label>
                <input
                  type="email"
                  id="new-email"
                  bind:value={newEmployee.email}
                  placeholder="Email del empleado"
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-phone">Teléfono</label>
                <input
                  type="text"
                  id="new-phone"
                  bind:value={newEmployee.phone}
                  placeholder="Teléfono del empleado"
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-address">Dirección</label>
                <input
                  type="text"
                  id="new-address"
                  bind:value={newEmployee.address}
                  placeholder="Dirección del empleado"
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-position">Puesto</label>
                <div class="select-with-button">
                  <select id="new-position" bind:value={newEmployee.position} required>
                    {#each allPositions as position}
                      <option value={position._id}>{position.name}</option>
                    {/each}
                  </select>
                  <button type="button" class="button secondary" on:click={() => openManageCategoryModal('position')}>+</button>
                </div>
              </div>

              <div class="form-group">
                <label for="new-department">Departamento</label>
                <div class="select-with-button">
                  <select id="new-department" bind:value={newEmployee.department} required>
                    {#each allDepartments as department}
                      <option value={department._id}>{department.name}</option>
                    {/each}
                  </select>
                  <button type="button" class="button secondary" on:click={() => openManageCategoryModal('department')}>+</button>
                </div>
              </div>

              <div class="form-group">
                <label for="new-contractType">Tipo de Contrato</label>
                <div class="select-with-button">
                  <select id="new-contractType" bind:value={newEmployee.contractType} required>
                    {#each allContractTypes as contractType}
                      <option value={contractType._id}>{contractType.name}</option>
                    {/each}
                  </select>
                  <button type="button" class="button secondary" on:click={() => openManageCategoryModal('contractType')}>+</button>
                </div>
              </div>

              <div class="form-group">
                <label for="new-startDate">Fecha de Ingreso</label>
                <input
                  type="date"
                  id="new-startDate"
                  bind:value={newEmployee.startDate}
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-salary">Salario</label>
                <input
                  type="number"
                  id="new-salary"
                  bind:value={newEmployee.salary}
                  placeholder="Salario del empleado"
                  required
                />
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button 
              class="button secondary" 
              on:click={closeCreateModal}
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button 
              class="button primary" 
              on:click={handleCreateEmployee}
              disabled={isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear Empleado'}
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if showLinkUserModal && selectedEmployee}
      <div class="modal-backdrop" on:click={closeLinkUserModal} role="presentation">
        <div class="modal-content" on:click|stopPropagation role="dialog">
          <div class="modal-header">
            <h2>Vincular Usuario a {selectedEmployee.fullName}</h2>
            <button class="close-button" on:click={closeLinkUserModal}>&times;</button>
          </div>
          <div class="modal-body">
            <div class="toggle-buttons">
              <button
                class="button {showCreateAndLinkUserForm ? 'secondary' : 'primary'}"
                on:click={() => { showCreateAndLinkUserForm = false; userSearchTerm = ''; usersForLinking = []; selectedUserToLink = null; }}>
                Vincular Usuario Existente
              </button>
              <button
                class="button {showCreateAndLinkUserForm ? 'primary' : 'secondary'}"
                on:click={() => {
                  showCreateAndLinkUserForm = true; 
                  userSearchTerm = ''; 
                  usersForLinking = []; 
                  selectedUserToLink = null;
                  if (selectedEmployee && selectedEmployee.email) {
                    newUserToLink.email = selectedEmployee.email;
                  }
                }}>
                Crear y Vincular Nuevo
              </button>
            </div>

            {#if showCreateAndLinkUserForm}
              <form on:submit|preventDefault={handleCreateAndLinkUser} class="create-user-form">
                <div class="form-group">
                  <label for="new-link-name">Nombre</label>
                  <input
                    type="text"
                    id="new-link-name"
                    bind:value={newUserToLink.name}
                    placeholder="Nombre del nuevo usuario"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="new-link-email">Email</label>
                  <input
                    type="email"
                    id="new-link-email"
                    bind:value={newUserToLink.email}
                    placeholder="Email del nuevo usuario"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="new-link-password">Contraseña</label>
                  <input
                    type="password"
                    id="new-link-password"
                    bind:value={newUserToLink.password}
                    placeholder="Contraseña del nuevo usuario"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="new-link-role">Rol</label>
                  <select id="new-link-role" bind:value={newUserToLink.role}>
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </form>
            {:else}
              <div class="form-group">
                <label for="userSearch">Buscar usuario por nombre o email:</label>
                <input
                  type="text"
                  id="userSearch"
                  bind:value={userSearchTerm}
                  on:input={searchUsersForLinking}
                  placeholder="Escribe para buscar..."
                  class="search-input"
                />
              </div>

              {#if usersForLinking.length > 0}
                <div class="user-list">
                  {#each usersForLinking as user (user._id)}
                    <div
                      class="user-list-item {selectedUserToLink?._id === user._id ? 'selected' : ''}"
                      on:click={() => selectedUserToLink = user}
                      on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectedUserToLink = user; }}
                      role="button"
                      tabindex="0"
                    >
                      <p><strong>{user.name || 'Sin nombre'}</strong></p>
                      <p>{user.email}</p>
                    </div>
                  {/each}
                </div>
              {:else if userSearchTerm.length >= 3}
                <p class="no-results">No se encontraron usuarios.</p>
              {:else}
                <p class="info-text">Escribe al menos 3 caracteres para buscar usuarios.</p>
              {/if}

              {#if selectedUserToLink}
                <div class="selected-user-info">
                  <p>Usuario seleccionado: <strong>{selectedUserToLink.name || selectedUserToLink.email}</strong></p>
                </div>
              {/if}
            {/if}
          </div>

          <div class="modal-footer">
            <button class="button secondary" on:click={closeLinkUserModal} disabled={isCreatingAndLinking}>Cancelar</button>
            {#if showCreateAndLinkUserForm}
              <button
                class="button primary"
                on:click={handleCreateAndLinkUser}
                disabled={!newUserToLink.name || !newUserToLink.email || !newUserToLink.password || isCreatingAndLinking}
              >
                {isCreatingAndLinking ? 'Creando y Vinculando...' : 'Crear y Vincular'}
              </button>
            {:else}
              <button
                class="button primary"
                on:click={handleLinkUser}
                disabled={!selectedUserToLink || isLinkingUser}
              >
                {isLinkingUser ? 'Vinculando...' : 'Vincular'}
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    {#if showManageCategoryModal}
      <div class="modal-backdrop" on:click={closeManageCategoryModal} role="presentation">
        <div class="modal-content" on:click|stopPropagation role="dialog">
          <div class="modal-header">
            <h2>Gestionar 
              {#if categoryTypeToManage === 'department'}Departamentos
              {:else if categoryTypeToManage === 'position'}Puestos
              {:else if categoryTypeToManage === 'contractType'}Tipos de Contrato
              {/if}
            </h2>
            <button class="close-button" on:click={closeManageCategoryModal}>&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="newCategoryName">Nuevo Nombre de 
                {#if categoryTypeToManage === 'department'}Departamento
                {:else if categoryTypeToManage === 'position'}Puesto
                {:else if categoryTypeToManage === 'contractType'}Tipo de Contrato
                {/if}
              </label>
              <input
                type="text"
                id="newCategoryName"
                bind:value={newCategoryName}
                placeholder="Ej: Nuevo Nombre"
                required
              />
              <button class="button primary small create-category-button" on:click={handleCreateCategory} disabled={isCreatingCategory || !newCategoryName}>
                {isCreatingCategory ? 'Creando...' : 'Crear'}
              </button>
            </div>

            <hr class="modal-divider"/>

            <h3>
              {#if categoryTypeToManage === 'department'}Departamentos Existentes
              {:else if categoryTypeToManage === 'position'}Puestos Existentes
              {:else if categoryTypeToManage === 'contractType'}Tipos de Contrato Existentes
              {/if}
            </h3>
            <ul class="category-list">
              {#if categoryTypeToManage === 'department'}
                {#each allDepartments as item (item._id)}
                  <li class="category-item">
                    <span>{item.name}</span>
                    <div class="actions">
                      <button class="button secondary small" on:click={() => editingCategory = { ...item, type: 'department' }}>Editar</button>
                      <button class="button danger small" on:click={() => { categoryToDelete = { ...item, type: 'department' }; showConfirmDeleteCategoryModal = true; }}>Eliminar</button>
                    </div>
                  </li>
                {:else}
                  <p>No hay departamentos registrados.</p>
                {/each}
              {:else if categoryTypeToManage === 'position'}
                {#each allPositions as item (item._id)}
                  <li class="category-item">
                    <span>{item.name}</span>
                    <div class="actions">
                      <button class="button secondary small" on:click={() => editingCategory = { ...item, type: 'position' }}>Editar</button>
                      <button class="button danger small" on:click={() => { categoryToDelete = { ...item, type: 'position' }; showConfirmDeleteCategoryModal = true; }}>Eliminar</button>
                    </div>
                  </li>
                {:else}
                  <p>No hay puestos registrados.</p>
                {/each}
              {:else if categoryTypeToManage === 'contractType'}
                {#each allContractTypes as item (item._id)}
                  <li class="category-item">
                    <span>{item.name}</span>
                    <div class="actions">
                      <button class="button secondary small" on:click={() => editingCategory = { ...item, type: 'contractType' }}>Editar</button>
                      <button class="button danger small" on:click={() => { categoryToDelete = { ...item, type: 'contractType' }; showConfirmDeleteCategoryModal = true; }}>Eliminar</button>
                    </div>
                  </li>
                {:else}
                  <p>No hay tipos de contrato registrados.</p>
                {/each}
              {/if}
            </ul>

            {#if editingCategory}
              <hr class="modal-divider"/>
              <h3>Editar 
                {#if categoryTypeToManage === 'department'}Departamento
                {:else if categoryTypeToManage === 'position'}Puesto
                {:else if categoryTypeToManage === 'contractType'}Tipo de Contrato
                {/if}
              </h3>
              <div class="form-group">
                <label for="editCategoryName">Nombre del 
                  {#if categoryTypeToManage === 'department'}Departamento
                  {:else if categoryTypeToManage === 'position'}Puesto
                  {:else if categoryTypeToManage === 'contractType'}Tipo de Contrato
                  {/if}
                </label>
                <input
                  type="text"
                  id="editCategoryName"
                  bind:value={editingCategory.name}
                  placeholder="Ej: Nuevo Nombre"
                  required
                />
              </div>
              <div class="modal-footer">
                <button class="button secondary" on:click={() => editingCategory = null}>Cancelar Edición</button>
                <button class="button primary" on:click={handleUpdateCategory} disabled={isUpdatingCategory || !editingCategory.name}>
                  {isUpdatingCategory ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    {#if showConfirmDeleteCategoryModal && categoryToDelete}
      <div class="modal-backdrop confirm-modal" on:click={() => showConfirmDeleteCategoryModal = false} role="presentation">
        <div class="modal-content confirm-content" on:click|stopPropagation role="dialog">
          <div class="modal-header">
            <h2>Confirmar Eliminación</h2>
            <button class="close-button" on:click={() => showConfirmDeleteCategoryModal = false}>&times;</button>
          </div>
          <div class="modal-body">
            <div class="confirm-message">
              <span class="warning-icon">⚠️</span>
              <p>¿Estás seguro de que deseas eliminar 
                {#if categoryTypeToManage === 'department'}el departamento
                {:else if categoryTypeToManage === 'position'}el puesto
                {:else if categoryTypeToManage === 'contractType'}el tipo de contrato
                {/if}
                <strong>{categoryToDelete.name}</strong>?</p>
              <p class="warning-text">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              class="button secondary" 
              on:click={() => showConfirmDeleteCategoryModal = false}
              disabled={isDeletingCategory}
            >
              Cancelar
            </button>
            <button 
              class="button danger" 
              on:click={handleDeleteCategory}
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <Footer />
  </div>
</PageTransition>

<style>
  /* Import common styles or define them here */
  :global(:root) {
    --dark-blue: #1a237e;
    --medium-blue: #283593;
    --light-blue: #3949ab;
    --accent-blue: #42a5f5;
    --white: #ffffff;
    --gray-300: #e5e7eb;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-900: #111827;
  }

  .page-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  main {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 6rem auto 2rem auto;
    position: relative;
    z-index: 1;
    width: 100%;
  }

  .content-section {
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  .header-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  h1 {
    color: var(--gray-900);
    font-size: 2rem;
    margin: 0;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
  }

  .category-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .category-buttons .button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .filters-section {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 0.875rem;
    color: var(--gray-700);
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--gray-500);
    margin-top: 0.25rem;
  }

  .filter-select,
  .filter-input {
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    background-color: white;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    color: var(--gray-900);
    min-width: 150px;
  }

  .filter-select:focus,
  .filter-input:focus,
  .search-input:focus { /* Apply focus styles to all relevant inputs */
    outline: none;
    border-color: var(--light-blue);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Specific styles for the main search input to match usuarios page */
  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background-color: white;
    font-size: 1rem;
    transition: all 0.3s ease;
    color: var(--gray-900);
  }

  .search-input::placeholder {
    color: var(--gray-500);
  }

  .search-box {
    width: 60%; /* Ensure it takes full width to match the screenshot */
  }

  .employees-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .employee-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
    cursor: pointer;
  }

  .employee-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .employee-avatar {
    width: 3rem;
    height: 3rem;
    background: var(--light-blue);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: bold;
  }

  .employee-info {
    flex: 1;
  }

  .employee-info h3 {
    margin: 0;
    color: var(--gray-900);
    font-size: 1.1rem;
  }

  .employee-info .email,
  .employee-info .position,
  .employee-info .department {
    color: var(--gray-600);
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  .employee-info .date {
    color: var(--gray-500);
    font-size: 0.8rem;
    margin: 0;
  }

  .error-message {
    background-color: #fee2e2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .error-icon {
    font-size: 1.25rem;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--gray-600);
  }

  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid #e5e7eb;
    border-top-color: var(--light-blue);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--gray-600);
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .header-section {
      flex-direction: column;
      gap: 1.5rem;
      align-items: stretch;
    }

    .main-header-row { /* This block is now unused */
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .main-header-row .search-box { /* This block is now unused */
      width: 100%;
      flex: none;
    }

    .filters-section {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .filter-group, .search-box {
      width: 100%;
    }

    .filter-select,
    .filter-input,
    .search-input {
      width: 100%;
    }

    .employees-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    main {
      padding: 1rem;
      margin-top: 5rem;
    }

    .content-section {
      padding: 1.5rem;
    }

    h1 {
      font-size: 1.5rem;
    }
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 1rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--gray-300);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--gray-900);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--gray-600);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--gray-300);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.3s ease;
  }

  .button.primary {
    background: var(--light-blue);
    color: white;
  }

  .button.secondary {
    background: var(--gray-300);
    color: var(--gray-700);
  }

  .button.danger {
    background: #dc2626;
    color: white;
  }

  .button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .employee-details p {
    margin: 0.5rem 0;
    color: var(--gray-700);
  }

  .employee-details strong {
    color: var(--gray-900);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--gray-700);
  }

  .form-group input, .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  .form-group input:focus, .form-group select:focus {
    outline: none;
    border-color: var(--light-blue);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .confirm-modal {
    background: rgba(0, 0, 0, 0.6);
  }

  .confirm-content {
    max-width: 400px;
  }

  .confirm-message {
    text-align: center;
    padding: 1rem;
  }

  .warning-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  .warning-text {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .confirm-message p {
    margin: 0.5rem 0;
    color: var(--gray-700);
  }

  .confirm-message strong {
    color: var(--gray-900);
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .create-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .icon {
    font-size: 1.25rem;
    font-weight: bold;
  }

  /* Pagination styles */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
    padding: 1rem;
  }

  .page-info {
    color: var(--gray-700);
    font-size: 0.9rem;
  }

  .pagination button {
    min-width: 100px;
  }

  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .title-section {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .create-button {
      width: 100%;
      justify-content: center;
    }
  }

  /* Styles for user linking modal */
  .user-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    margin-top: 1rem;
  }

  .user-list-item {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--gray-300);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .user-list-item:last-child {
    border-bottom: none;
  }

  .user-list-item:hover {
    background-color: var(--gray-300);
  }

  .user-list-item.selected {
    background-color: var(--light-blue);
    color: white;
  }

  .user-list-item.selected p {
    color: white;
  }

  .user-list-item p {
    margin: 0;
    color: var(--gray-700);
  }

  .selected-user-info {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #e0f2f7;
    border-radius: 0.5rem;
    border: 1px solid var(--accent-blue);
  }

  .selected-user-info strong {
    color: var(--dark-blue);
  }

  .info-text {
    text-align: center;
    padding: 1rem;
    color: var(--gray-600);
  }

  /* Styles for toggle buttons in linking modal */
  .toggle-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .toggle-buttons .button {
    flex: 1;
    font-size: 0.9rem;
    padding: 0.6rem 1rem;
  }

  /* Styles for create user form inside linking modal */
  .create-user-form {
    margin-top: 1rem;
  }

  .select-with-button {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .select-with-button select {
    flex: 1;
  }

  .select-with-button .button.secondary {
    padding: 0.5rem;
    font-size: 1rem;
    line-height: 1;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%; /* Make it round */
  }

  .select-with-button .button.secondary:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  /* New styles for input with prefix */
  .input-with-prefix {
    display: flex;
    gap: 0.5rem;
  }

  .input-with-prefix .prefix-select-base {
    width: auto; /* Allow select to take its natural width */
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--gray-300);
    background-color: white;
    font-size: 1rem;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    color: black !important; /* Force black text */
  }

  .input-with-prefix .prefix-select-arrow {
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2C197.942L146.2%2C57.143L5.4%2C197.942h281.6z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 0.7em top 50%;
    background-size: 0.65em auto;
    padding-right: 2em; /* Ensure text doesn't overlap arrow */
  }

  .input-with-prefix input[type="text"] {
    flex: 1;
    min-width: 0; /* Allow input to shrink */
  }

  .category-list {
    list-style: none;
    padding: 0;
    margin-top: 1.5rem;
  }

  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    background-color: #f9fafb;
  }

  .category-item span {
    font-weight: 500;
    color: var(--gray-900);
  }

  .category-item .actions {
    display: flex;
    gap: 0.5rem;
  }

  .button.small {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  .create-category-button {
    margin-top: 1rem;
    width: auto;
  }

  .modal-divider {
    border: 0;
    height: 1px;
    background: var(--gray-300);
    margin: 1.5rem 0;
  }
</style>


