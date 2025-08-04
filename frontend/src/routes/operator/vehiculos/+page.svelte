<script lang="ts">
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getApiClient, type Vehicle, type PaginatedVehiclesResponse, type VehicleType, type CreateVehicleDto, type UpdateVehicleDto, ApiClient, type Propietario } from '$lib/api/ApiClient';
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import SearchableSelect from '$lib/components/SearchableSelect.svelte';

  let activeSection = 'vehiculos';
  let isLoading = false;
  let error: string | null = null;

  let api: ApiClient; // Declare api here, but initialize in onMount

  let vehicles: Vehicle[] = [];
  let totalVehicles = 0;
  let currentPage = 1;
  let limit = 10; // Number of items per page
  let searchTerm = '';
  let selectedType: VehicleType | '' = '';
  let propietarios: Propietario[] = []; // To store fetched proprietors

  let selectedPropietario: string | undefined = undefined;

  // Modal for creating/editing vehicles
  let showCreateEditModal = false;
  let isEditing = false;
  let currentVehicle: CreateVehicleDto & { _id?: string; propietario?: string; } = { // Default values for new vehicle
    type: 'chuto',
    name: '',
    model: '',
    plate: '',
    code: '',
    propietario: undefined, // Initialize as undefined
  };

  // Confirmation modal state for vehicle deletion
  let showConfirmDeleteVehicleModal = false;
  let vehicleToDelete: { id: string; plate: string; code: string; } | null = null;
  let isDeletingVehicle = false;

  // New state for vehicle detail modal
  let showVehicleDetailModal = false;
  let selectedVehicleDetail: Vehicle | null = null;

  // New state for error modal
  let showErrorMessageModal = false;
  let errorMessage = '';

  function openCreateModal() {
    isEditing = false;
    currentVehicle = {
      type: 'chuto',
      name: '',
      model: '',
      plate: '',
      code: '',
      propietario: undefined,
    };
    showCreateEditModal = true;
  }

  function openEditModal(vehicle: Vehicle) {
    isEditing = true;
    currentVehicle = {
      _id: vehicle._id,
      type: vehicle.type,
      name: vehicle.name,
      model: vehicle.model,
      plate: vehicle.plate,
      code: vehicle.code,
      propietario: (vehicle.propietario && typeof vehicle.propietario === 'object') ? vehicle.propietario._id : undefined,
    };
    showCreateEditModal = true;
  }

  function closeCreateEditModal() {
    showCreateEditModal = false;
    error = null; // Clear any modal-related errors
  }

  // New function to close error message modal
  function closeErrorMessageModal() {
    showErrorMessageModal = false;
    errorMessage = '';
  }

  // New function to open vehicle detail modal
  function openVehicleDetailModal(vehicle: Vehicle) {
    selectedVehicleDetail = vehicle;
    showVehicleDetailModal = true;
  }

  // New function to close vehicle detail modal
  function closeVehicleDetailModal() {
    showVehicleDetailModal = false;
    selectedVehicleDetail = null;
  }

  async function fetchPropietarios() {
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }
    const response = await api.getAllPropietarios();
    if (response.data) {
      propietarios = response.data.items;
      // Set default propietario if none selected and chuto is default type
      if (currentVehicle.type === 'chuto' && !currentVehicle.propietario && propietarios.length > 0) {
        currentVehicle.propietario = propietarios[0]._id;
      }
    } else if (response.error) {
      error = response.error;
    }
    isLoading = false;
  }

  // This function will now simply fetch all proprietors for the SearchableSelect component to filter locally.
  // The SearchableSelect component handles its own internal filtering based on its 'searchTerm' state.
  async function fetchAllPropietariosForSearchableSelect() {
    if (!api) {
      console.error('API client not initialized for fetching proprietors.');
      return;
    }
    isLoading = true; // Set loading state for proprietors
    const response = await api.getAllPropietarios({ limit: 1000 }); // Fetch all for local filtering
    if (response.data) {
      propietarios = response.data.items; 
      console.log('Propietarios fetched for SearchableSelect:', propietarios);
    } else if (response.error) {
      console.error('Error fetching proprietors for SearchableSelect:', response.error);
    }
    isLoading = false; // Clear loading state
  }

  function handleDeleteVehicleClick(vehicle: Vehicle) {
    // console.log('Attempting to delete vehicle:', vehicle); // Removed debug log
    vehicleToDelete = { id: vehicle._id, plate: vehicle.plate, code: vehicle.code };
    showConfirmDeleteVehicleModal = true;
    // console.log('showConfirmDeleteVehicleModal set to', showConfirmDeleteVehicleModal); // Removed debug log
  }

  async function confirmDeleteVehicle() {
    if (!vehicleToDelete?.id) {
      // console.log('No vehicle ID to delete.'); // Removed debug log
      return;
    }

    isLoading = true;
    isDeletingVehicle = true;
    error = null;
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      isDeletingVehicle = false;
      return;
    }
    // console.log('Calling deleteVehicle with ID:', vehicleToDelete.id); // Removed debug log
    const response = await api.deleteVehicle(vehicleToDelete.id);
    // console.log('Delete vehicle API response:', response); // Removed debug log
    if (response && response.status === 204) {
      showConfirmDeleteVehicleModal = false;
      closeCreateEditModal(); // Close the edit modal too if open
      fetchVehicles(); // Refresh the list
    } else if (response && response.error) {
      error = response.error;
    }
    isLoading = false;
    isDeletingVehicle = false;
    vehicleToDelete = null; // Clear the selected vehicle
  }

  async function fetchVehicles() {
    isLoading = true;
    error = null;
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }
    const response = await api.getVehicles({
      page: currentPage,
      limit: limit,
      searchTerm: searchTerm,
      type: selectedType === '' ? undefined : selectedType,
      propietario: selectedPropietario === '' ? undefined : selectedPropietario,
    });
    if (response.data) {
      vehicles = response.data.items;
      totalVehicles = response.data.totalCount;
    } else if (response.error) {
      error = response.error;
    }
    isLoading = false;
  }

  async function handleCreateOrUpdateVehicle() {
    error = null;
    isLoading = true;
    let response;
    
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }

    if (isEditing) {
      response = await api.updateVehicle(currentVehicle._id as string, currentVehicle as UpdateVehicleDto);
    } else {
      // Adjust payload based on vehicle type
      const payload: CreateVehicleDto = { ...currentVehicle };
      if (payload.type === 'chuto' || payload.type === 'trailer') { // Unificar la validación para ambos tipos
        // No es necesario eliminar propietarioName del payload si ya no existe en la DTO
        if (!payload.propietario) {
          error = 'Debe seleccionar un propietario para el vehículo.';
          isLoading = false;
          return;
        }
      }

      response = await api.createVehicle(payload);
    }

    if (response && response.data) {
      closeCreateEditModal();
      fetchVehicles(); // Refresh the list
    } else if (response && response.error) {
      // Set the error message for the modal and show it
      errorMessage = response.error;
      showErrorMessageModal = true;
      // Optionally, keep the inline error as well if desired
      error = response.error;
    }
    isLoading = false;
  }

  onMount(() => {
    api = getApiClient(); // Initialize api client on mount
    fetchAllPropietariosForSearchableSelect(); // Call this instead of fetchPropietarios()
    fetchVehicles();
  });

  function handleSearch() {
    currentPage = 1;
    fetchVehicles();
  }

  function handlePageChange(newPage: number) {
    currentPage = newPage;
    fetchVehicles();
  }

  $: totalPages = Math.ceil(totalVehicles / limit);
</script>

<PageTransition let:isVisible>
  <div class="page-container">
    <OperatorHeader {activeSection} />
    <AnimatedBackground {isVisible} />
    
    <main>
      <div class="content-section">
        <div class="header-section">
          <div class="title-section">
            <h1>Gestión de Vehículos</h1>
            <button class="btn-primary" on:click={openCreateModal}>+</button>
          </div>
          <div class="filters">
            <input type="text" placeholder="Buscar por placa, código, nombre o modelo" bind:value={searchTerm} on:input={handleSearch} />
            <select bind:value={selectedType} on:change={handleSearch}>
              <option value="">Todos los tipos</option>
              <option value="chuto">Chuto</option>
              <option value="trailer">Trailer</option>
            </select>
            <select bind:value={selectedPropietario} on:change={handleSearch}>
              <option value="">Todos los propietarios</option>
              {#each propietarios as propietario}
                <option value={propietario._id}>{propietario.name}</option>
              {/each}
            </select>
          </div>
        </div>

        {#if error}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {error}
          </div>
        {:else if isLoading}
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Cargando vehículos...</p>
          </div>
        {:else}
          {#if vehicles.length > 0}
            <div class="vehicle-cards-container">
              {#each vehicles as vehicle (vehicle._id)}
                <div class="vehicle-card" on:click={() => openVehicleDetailModal(vehicle)}>
                  <div class="card-header">
                    <h3>
                      {#if vehicle.name}
                        {vehicle.name} ({vehicle.type === 'chuto' ? 'Chuto' : 'Trailer'})
                      {:else}
                        {vehicle.type === 'chuto' ? 'Chuto' : 'Trailer'}
                      {/if}
                    </h3>
                    <span class="card-tag {vehicle.type}">{vehicle.type === 'chuto' ? 'CHUTO' : 'TRAILER'}</span>
                  </div>
                  <div class="card-body">
                    <p><strong>Placa:</strong> {vehicle.plate}</p>
                    <p><strong>Código:</strong> {vehicle.code}</p>
                    <p><strong>Propietario:</strong>
                      {#if vehicle.propietario}
                        {vehicle.propietario.name} ({vehicle.propietario.cedula})
                      {:else}
                        N/A
                      {/if}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
            <div class="pagination">
              <button on:click={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Anterior</button>
              <span>Página {currentPage} de {totalPages}</span>
              <button on:click={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente</button>
            </div>
          {:else}
            <div class="no-results">
              <p>No se encontraron vehículos.</p>
            </div>
          {/if}
        {/if}
      </div>
    </main>

    <Footer />
  </div>
</PageTransition>

{#if showCreateEditModal}
  <div class="modal-overlay" on:click|self={closeCreateEditModal}>
    <div class="modal-content">
      <h2>{isEditing ? 'Editar Vehículo' : 'Crear Nuevo Vehículo'}</h2>
      <form on:submit|preventDefault={handleCreateOrUpdateVehicle}>
        <div class="form-group">
          <label for="vehicleType">Tipo de Vehículo</label>
          <select id="vehicleType" bind:value={currentVehicle.type} required>
            <option value="chuto">Chuto</option>
            <option value="trailer">Trailer</option>
          </select>
        </div>

        {#if currentVehicle.type === 'trailer'}
        <div class="form-group">
          <label for="name">Nombre</label>
          <input type="text" id="name" bind:value={currentVehicle.name} required />
        </div>

        <div class="form-group">
          <label for="model">Modelo</label>
          <input type="text" id="model" bind:value={currentVehicle.model} required />
        </div>
        {/if}

        <div class="form-group">
          <label for="plate">Placa</label>
          <input type="text" id="plate" bind:value={currentVehicle.plate} required />
        </div>

        <div class="form-group">
          <label for="code">Código</label>
          <input type="text" id="code" bind:value={currentVehicle.code} required />
        </div>

        {#if currentVehicle.type === 'chuto' || currentVehicle.type === 'trailer'}
          <SearchableSelect
            items={propietarios}
            bind:value={currentVehicle.propietario}
            labelField="name"
            subLabelField="cedula"
            valueField="_id"
            placeholder="Selecciona un propietario"
            searchPlaceholder="Buscar por nombre o cédula"
            required={true}
          >
            <span slot="search-label">Buscar Propietario:</span>
          </SearchableSelect>
        {/if}

        {#if error}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {error}
          </div>
        {/if}

        <div class="form-actions">
          <button type="submit" class="btn-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo')}
          </button>
          <button type="button" class="btn-secondary" on:click={closeCreateEditModal} disabled={isLoading}>Cancelar</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showVehicleDetailModal && selectedVehicleDetail}
  <div class="modal-overlay detail-modal" on:click|self={closeVehicleDetailModal}>
    <div class="modal-content detail-content">
      <div class="modal-header">
        <h2>Detalles del Vehículo</h2>
        <button class="close-button" on:click={closeVehicleDetailModal}>&times;</button>
      </div>
      <div class="modal-body detail-body">
        <div class="detail-item">
          <span class="detail-label">Tipo:</span>
          <span class="detail-value">{selectedVehicleDetail.type === 'chuto' ? 'Chuto' : 'Trailer'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Nombre:</span>
          <span class="detail-value">{selectedVehicleDetail.name}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Modelo:</span>
          <span class="detail-value">{selectedVehicleDetail.model}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Placa:</span>
          <span class="detail-value">{selectedVehicleDetail.plate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Código:</span>
          <span class="detail-value">{selectedVehicleDetail.code}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Propietario:</span>
          <span class="detail-value">
            {#if selectedVehicleDetail.propietario}
              {selectedVehicleDetail.propietario.name} ({selectedVehicleDetail.propietario.cedula})
            {:else}
              N/A
            {/if}
          </span>
        </div>
      </div>
      <div class="modal-footer form-actions">
        <button class="btn-secondary" on:click={() => {
          if (selectedVehicleDetail) {
            openEditModal(selectedVehicleDetail as Vehicle);
          } else {
            // No console.error, as per user request to remove debug logs
            // console.error('selectedVehicleDetail is null or undefined when trying to edit.');
          }
          closeVehicleDetailModal();
        }}>Editar</button>
        <button class="btn-danger" on:click={() => {
          // Call handleDeleteVehicleClick first, passing the vehicle detail before it's cleared
          if (selectedVehicleDetail) {
            handleDeleteVehicleClick(selectedVehicleDetail as Vehicle);
          } else {
            // No console.error, as per user request to remove debug logs
            // console.error('selectedVehicleDetail is null or undefined when trying to delete.');
          }
          closeVehicleDetailModal(); // Then close the detail modal
        }}>Eliminar</button>
      </div>
    </div>
  </div>
{/if}

{#if showConfirmDeleteVehicleModal && vehicleToDelete}
  <div class="modal-overlay confirm-modal" on:click={() => showConfirmDeleteVehicleModal = false} role="presentation">
    <div class="modal-content confirm-content" on:click|stopPropagation role="dialog">
      <div class="modal-header">
        <h2>Confirmar Eliminación</h2>
        <button class="close-button" on:click={() => showConfirmDeleteVehicleModal = false}>&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="confirm-message">
          <span class="warning-icon">⚠️</span>
          <p>¿Estás seguro de que deseas eliminar el vehículo <strong>{vehicleToDelete.plate}</strong> con código: <strong>{vehicleToDelete.code}</strong>?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          class="btn-secondary" 
          on:click={() => showConfirmDeleteVehicleModal = false}
          disabled={isDeletingVehicle}
        >
          Cancelar
        </button>
        <button 
          class="btn-danger" 
          on:click={confirmDeleteVehicle}
          disabled={isDeletingVehicle}
        >
          {isDeletingVehicle ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showErrorMessageModal}
  <div class="modal-overlay error-modal" on:click|self={closeErrorMessageModal}>
    <div class="modal-content error-content">
      <div class="modal-header">
        <h2>Error</h2>
        <button class="close-button" on:click={closeErrorMessageModal}>&times;</button>
      </div>
      <div class="modal-body">
        <p class="error-message-text">{errorMessage}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" on:click={closeErrorMessageModal}>Aceptar</button>
      </div>
    </div>
  </div>
{/if}

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
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
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
  }

  .filters {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .filters input, .filters select {
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
    background-color: #ffffff; /* White background */
    color: #111827; /* Black text (gray-900 equivalent) */
  }

  .btn-primary, .btn-secondary, .btn-danger {
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border: none;
  }

  .btn-primary {
    background-color: var(--light-blue);
    color: var(--white);
  }

  .btn-primary:hover {
    background-color: var(--medium-blue);
  }

  .btn-secondary {
    background-color: var(--gray-300);
    color: var(--gray-900);
  }

  .btn-secondary:hover {
    background-color: var(--gray-600);
    color: var(--white);
  }

  .btn-danger {
    background-color: #dc2626;
    color: var(--white);
  }

  .btn-danger:hover {
    background-color: #b91c1c;
  }

  .vehicle-cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .vehicle-card {
    background-color: var(--white);
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s ease-in-out;
  }

  .vehicle-card:hover {
    transform: translateY(-5px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--gray-300);
    padding-bottom: 0.75rem;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--dark-blue);
  }

  .vehicle-type {
    background-color: var(--accent-blue);
    color: var(--white);
    padding: 0.3rem 0.8rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .card-body p {
    margin: 0.5rem 0;
    color: var(--gray-700);
    font-size: 0.95rem;
  }

  .card-body strong {
    color: var(--gray-900);
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--gray-300);
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  .pagination button {
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    border: 1px solid var(--light-blue);
    background-color: var(--white);
    color: var(--light-blue);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .pagination button:hover:not(:disabled) {
    background-color: var(--light-blue);
    color: var(--white);
  }

  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Placeholder styles for messages, loading, and no results */
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

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .no-results {
    text-align: center;
    padding: 3rem;
    color: var(--gray-600);
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  @media (max-width: 768px) {
    .header-section {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    .title-section {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
    .filters {
      flex-direction: column;
      align-items: stretch;
    }
  }

  /* Styles for confirmation modal (copied from employees page for consistency) */
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

  .modal-header .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--gray-600);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--gray-900);
  }

  .modal-body p {
    margin: 0.5rem 0;
    color: var(--gray-700);
  }

  .modal-body strong {
    color: var(--gray-900);
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
    th, td {
      padding: 0.75rem 0.5rem;
    }
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  }

  .modal-content {
    background-color: var(--white);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 850px;
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-content h2 {
    color: var(--gray-900);
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--gray-700);
    font-weight: 500;
  }

  .form-group input, .form-group select {
    width: 100%; /* Ensure full width within its container */
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
    color: var(--gray-900);
    background-color: var(--white);
    box-sizing: border-box; /* Added for consistent sizing */
  }

  .form-group input:focus, .form-group select:focus {
    border-color: var(--accent-blue);
    outline: none;
    box-shadow: 0 0 0 2px rgba(66, 165, 245, 0.2);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .form-actions .btn-primary, .form-actions .btn-secondary {
    min-width: 120px;
  }

  .detail-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* Space between detail items */
    margin-bottom: 1.5rem; /* Space before buttons */
  }

  .detail-item {
    display: flex;
    justify-content: space-between; /* Aligns label and value */
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px dashed var(--gray-300);
  }

  .detail-item:last-child {
    border-bottom: none; /* No border for the last item */
  }

  .detail-label {
    font-weight: 600;
    color: var(--gray-900);
    flex-shrink: 0; /* Prevent label from shrinking */
    margin-right: 1rem;
  }

  .detail-value {
    color: var(--gray-700);
    text-align: right; /* Align value to the right */
    flex-grow: 1; /* Allow value to take up remaining space */
  }

  /* Error Modal specific styles */
  .error-modal .modal-content {
    max-width: 450px; /* Smaller width for error messages */
    border: 2px solid #dc2626; /* Red border for errors */
  }

  .error-modal .modal-header {
    background-color: #ef4444; /* Red header background */
    color: var(--white); /* White text for header */
    padding: 1rem 1.5rem;
    border-radius: 1rem 1rem 0 0;
  }

  .error-modal .modal-header h2 {
    color: var(--white); /* Ensure title is white */
  }

  .error-modal .modal-header .close-button {
    color: var(--white); /* White close button */
  }

  .error-modal .modal-body {
    padding: 1.5rem;
    text-align: center;
  }

  .error-message-text {
    color: var(--gray-900); /* Dark text for message */
    font-size: 1.1rem;
    line-height: 1.5;
  }

  .error-modal .modal-footer {
    justify-content: center; /* Center the button in error modal */
    margin-top: 1.5rem;
  }
</style> 

