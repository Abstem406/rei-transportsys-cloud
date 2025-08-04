<script lang="ts">
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getApiClient, type ApiClient, type Vehicle, type CreateVehicleDto, type UpdateVehicleDto, type Ruta, type CreateRutaDto, type UpdateRutaDto, type PaginatedRutasResponse, type Employee } from '$lib/api/ApiClient';
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import SearchableSelect from '$lib/components/SearchableSelect.svelte';

  let activeSection = 'rutas';
  let isLoading = false;
  let error: string | null = null;
  let api: ApiClient;

  let rutas: Ruta[] = [];
  let totalRutas = 0;
  let currentPage = 1;
  let limit = 10;
  let searchTerm = ''; // For searching by startLocation, endLocation, concept, code, vehicle plates

  let chutos: Vehicle[] = [];
  let trailers: Vehicle[] = [];

  // Employee lists for dropdowns
  let conductores: Employee[] = [];
  let auxiliares: Employee[] = [];
  let positions: any[] = []; // To store all fetched positions

  // Modal for creating/editing rutas
  let showCreateEditModal = false;
  let isEditing = false;
  let currentRuta: CreateRutaDto & { _id?: string; code?: string; } = {
    startLocation: '',
    endLocation: '',
    chuto: undefined,
    trailer: undefined,
    conductor: '',
    auxiliar: '',
    concept: '',
    endDate: undefined, // Optional date string
  };

  // Confirmation modal for deletion
  let showConfirmDeleteRutaModal = false;
  let rutaToDelete: { id: string; code: string; } | null = null;
  let isDeletingRuta = false;

  // Detail modal for ruta
  let showRutaDetailModal = false;
  let selectedRutaDetail: Ruta | null = null;

  // Error modal
  let showErrorMessageModal = false;
  let errorMessage = '';

  function openCreateModal() {
    isEditing = false;
    currentRuta = {
      startLocation: '',
      endLocation: '',
      chuto: undefined,
      trailer: undefined,
      conductor: '',
      auxiliar: '',
      concept: '',
      endDate: undefined,
    };
    console.log('DEBUG: Opening create modal, currentRuta:', currentRuta);
    showCreateEditModal = true;
  }

  function openEditModal(ruta: Ruta) {
    isEditing = true;
    currentRuta = {
      _id: ruta._id,
      code: ruta.code,
      startLocation: ruta.startLocation,
      endLocation: ruta.endLocation,
      chuto: (ruta.chuto && typeof ruta.chuto === 'object') ? ruta.chuto._id : undefined,
      trailer: (ruta.trailer && typeof ruta.trailer === 'object') ? ruta.trailer._id : undefined,
      conductor: (ruta.conductor && typeof ruta.conductor === 'object') ? ruta.conductor._id : undefined,
      auxiliar: (ruta.auxiliar && typeof ruta.auxiliar === 'object') ? ruta.auxiliar._id : undefined,
      concept: ruta.concept,
      endDate: ruta.endDate ? new Date(ruta.endDate).toISOString().split('T')[0] : undefined, // Format for input type="date"
    };
    console.log('DEBUG: Opening edit modal, currentRuta:', currentRuta);
    showCreateEditModal = true;
  }

  function closeCreateEditModal() {
    showCreateEditModal = false;
    error = null;
    errorMessage = '';
  }

  function closeErrorMessageModal() {
    showErrorMessageModal = false;
    errorMessage = '';
  }

  function openRutaDetailModal(ruta: Ruta) {
    selectedRutaDetail = ruta;
    showRutaDetailModal = true;
    console.log('DEBUG: openRutaDetailModal received ruta:', ruta);
  }

  function closeRutaDetailModal() {
    showRutaDetailModal = false;
    selectedRutaDetail = null;
  }

  async function fetchPositions() {
    if (!api) {
      console.error('API client not initialized for fetching positions.');
      return;
    }
    isLoading = true;
    const response = await api.getAllPositions();
    if (response.data) {
      positions = response.data;
      console.log('Positions fetched:', positions);
    } else if (response.error) {
      console.error('Error fetching positions:', response.error);
    }
    isLoading = false;
  }

  async function fetchVehiclesForSelect() {
    if (!api) {
      console.error('API client not initialized for fetching vehicles.');
      return;
    }
    isLoading = true;
    // Fetch all vehicles for SearchableSelect to filter locally
    const response = await api.getVehicles({ limit: 1000 }); 
    if (response.data) {
      chutos = response.data.items.filter(v => v.type === 'chuto');
      trailers = response.data.items.filter(v => v.type === 'trailer');
    } else if (response.error) {
      console.error('Error fetching vehicles for select:', response.error);
    }
    isLoading = false;
  }

  async function fetchEmployeesForSelect() {
    if (!api) {
      console.error('API client not initialized for fetching employees.');
      return;
    }
    isLoading = true;

    const conductorPosition = positions.find(p => p.name.toLowerCase() === 'conductor');
    const auxiliarPosition = positions.find(p => p.name.toLowerCase() === 'auxiliar');

    // Banderas de depuración: Imprimir los IDs de posición antes de la llamada a la API
    console.log('DEBUG (Frontend): ID de Conductor para filtro:', conductorPosition ? conductorPosition._id : 'No encontrado');
    console.log('DEBUG (Frontend): ID de Auxiliar para filtro:', auxiliarPosition ? auxiliarPosition._id : 'No encontrado');

    // Fetch all conductors and auxiliares for SearchableSelect to filter locally
    const responseConductores = conductorPosition
      ? await api.getEmployees({ position: conductorPosition._id, limit: 1000 })
      : { data: { items: [] }, error: undefined }; // Provide empty data if position not found

    const responseAuxiliares = auxiliarPosition
      ? await api.getEmployees({ position: auxiliarPosition._id, limit: 1000 })
      : { data: { items: [] }, error: undefined }; // Provide empty data if position not found

    if (responseConductores.data) {
      conductores = responseConductores.data.items.map(emp => ({
        ...emp,
        fullName: `${emp.firstName} ${emp.lastName}`
      }));
      console.log('DEBUG (Frontend): Conductores cargados:', conductores);
    } else if (responseConductores.error) {
      console.error('Error fetching conductores:', responseConductores.error);
    }

    if (responseAuxiliares.data) {
      auxiliares = responseAuxiliares.data.items.map(emp => ({
        ...emp,
        fullName: `${emp.firstName} ${emp.lastName}`
      }));
      console.log('DEBUG (Frontend): Auxiliares cargados:', auxiliares);
    } else if (responseAuxiliares.error) {
      console.error('Error fetching auxiliares:', responseAuxiliares.error);
    }
    
    isLoading = false;
  }

  async function fetchRutas() {
    isLoading = true;
    error = null;
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }
    const response = await api.getAllRutas({
      page: currentPage,
      limit: limit,
      searchTerm: searchTerm,
    });
    console.log('DEBUG: Fetch Rutas API Response:', response);
    if (response.data) {
      rutas = response.data.items;
      totalRutas = response.data.totalCount;
    } else if (response.error) {
      error = response.error;
    }
    isLoading = false;
  }

  function handleDeleteRutaClick(ruta: Ruta) {
    rutaToDelete = { id: ruta._id, code: ruta.code };
    console.log('DEBUG: Ruta to delete:', rutaToDelete);
    showConfirmDeleteRutaModal = true;
  }

  async function confirmDeleteRuta() {
    if (!rutaToDelete?.id) return;

    isLoading = true;
    isDeletingRuta = true;
    error = null;
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      isDeletingRuta = false;
      return;
    }
    console.log('DEBUG: Attempting to delete Ruta with ID:', rutaToDelete.id);
    const response = await api.deleteRuta(rutaToDelete.id);
    console.log('DEBUG: Delete Ruta API Response:', response);
    if (response && response.status === 204) {
      showConfirmDeleteRutaModal = false;
      closeCreateEditModal();
      fetchRutas();
    } else if (response && response.error) {
      errorMessage = response.error;
      showErrorMessageModal = true;
      error = response.error;
    }
    isLoading = false;
    isDeletingRuta = false;
    rutaToDelete = null;
  }

  async function handleCreateOrUpdateRuta() {
    error = null;
    isLoading = true;
    let response;

    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }

    // Prepare dates for API
    const payload: CreateRutaDto & { _id?: string; code?: string; } = { ...currentRuta };
    if (currentRuta.endDate) {
      payload.endDate = currentRuta.endDate; // Already in YYYY-MM-DD format from input type="date"
    } else {
      payload.endDate = undefined; // Ensure it's not an empty string if optional
    }

    // Assign employee IDs to payload
    payload.conductor = currentRuta.conductor || undefined;
    payload.auxiliar = currentRuta.auxiliar || undefined;

    // Basic validation for chuto/trailer presence
    if (!payload.chuto && !payload.trailer) {
        errorMessage = 'Debe seleccionar al menos un chuto o un trailer para la ruta.';
        showErrorMessageModal = true;
        isLoading = false;
        return;
    }

    console.log('DEBUG: Sending payload for Ruta:', payload);

    if (isEditing) {
      response = await api.updateRuta(currentRuta._id as string, payload as UpdateRutaDto);
      console.log('DEBUG: Update Ruta API Response:', response);
    } else {
      response = await api.createRuta(payload);
      console.log('DEBUG: Create Ruta API Response:', response);
    }

    if (response && response.data) {
      closeCreateEditModal();
      fetchRutas();
    } else if (response && response.error) {
      errorMessage = response.error;
      showErrorMessageModal = true;
      error = response.error;
    }
    isLoading = false;
  }

  onMount(async () => {
    api = getApiClient();
    fetchVehiclesForSelect(); // Fetch vehicles (chutos and trailers)
    await fetchPositions(); // Fetch positions first and wait for it to complete
    fetchEmployeesForSelect(); // Then fetch employees
    fetchRutas();
  });

  function handleSearch() {
    currentPage = 1;
    fetchRutas();
  }

  function handlePageChange(newPage: number) {
    currentPage = newPage;
    fetchRutas();
  }

  $: totalPages = Math.ceil(totalRutas / limit);
</script>

<PageTransition let:isVisible>
  <div class="page-container">
    <OperatorHeader {activeSection} />
    <AnimatedBackground {isVisible} />
    
    <main>
      <div class="content-section">
        <div class="header-section">
          <div class="title-section">
            <h1>Gestión de Rutas</h1>
            <button class="btn-primary" on:click={openCreateModal}>+</button>
          </div>
          <div class="filters">
            <input type="text" placeholder="Buscar por código, ubicación o concepto" bind:value={searchTerm} on:input={handleSearch} />
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
            <p>Cargando rutas...</p>
          </div>
        {:else}
          {#if rutas.length > 0}
            <div class="ruta-cards-container">
              {#each rutas as ruta (ruta._id)}
                <div class="ruta-card" on:click={() => openRutaDetailModal(ruta)}>
                  <div class="card-header">
                    <h3>Ruta {ruta.code}</h3>
                    <span class="ruta-concept">{ruta.concept}</span>
                  </div>
                  <div class="card-body">
                    <p><strong>De:</strong> {ruta.startLocation}</p>
                    <p><strong>A:</strong> {ruta.endLocation}</p>
                    <p><strong>Inicio:</strong> {new Date(ruta.startDate).toLocaleDateString()}</p>
                    <p><strong>Fin:</strong> {#if ruta.endDate}{new Date(ruta.endDate).toLocaleDateString()}{:else}Pendiente{/if}</p>
                    <p><strong>Chuto:</strong> {#if ruta.chuto}{ruta.chuto.plate} ({ruta.chuto.code}){:else}N/A{/if}</p>
                    <p><strong>Trailer:</strong> {#if ruta.trailer}{ruta.trailer.plate} ({ruta.trailer.code}){:else}N/A{/if}</p>
                    <p><strong>Conductor:</strong> {#if ruta.conductor}{ruta.conductor.firstName} {ruta.conductor.lastName}{:else}N/A{/if}</p>
                    <p><strong>Auxiliar:</strong> {#if ruta.auxiliar}{ruta.auxiliar.firstName} {ruta.auxiliar.lastName}{:else}N/A{/if}</p>
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
              <p>No se encontraron rutas.</p>
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
      <h2>{isEditing ? 'Editar Ruta' : 'Crear Nueva Ruta'}</h2>
      <form on:submit|preventDefault={handleCreateOrUpdateRuta}>
        {#if isEditing}
          <div class="form-group">
            <label for="code">Código de Ruta</label>
            <input type="text" id="code" bind:value={currentRuta.code} disabled />
          </div>
        {/if}

        <div class="form-group">
          <label for="startLocation">Lugar de Salida</label>
          <input type="text" id="startLocation" bind:value={currentRuta.startLocation} required />
        </div>

        <div class="form-group">
          <label for="endLocation">Lugar de Destino</label>
          <input type="text" id="endLocation" bind:value={currentRuta.endLocation} required />
        </div>

        <div class="form-group">
          <label for="concept">Concepto de la Ruta</label>
          <input type="text" id="concept" bind:value={currentRuta.concept} required />
        </div>

        <div class="form-group">
          <label for="endDate">Fecha de Llegada (Opcional)</label>
          <input type="date" id="endDate" bind:value={currentRuta.endDate} />
        </div>

        <div class="form-group">
          <label for="chuto">Chuto (Opcional)</label>
          <SearchableSelect
            items={chutos}
            bind:value={currentRuta.chuto}
            labelField="plate"
            subLabelField="code"
            valueField="_id"
            placeholder="Seleccionar Chuto (Opcional)"
            searchPlaceholder="Buscar por placa o código"
            required={false}
          >
            <span slot="search-label">Buscar Chuto:</span>
          </SearchableSelect>
        </div>

        <div class="form-group">
          <label for="trailer">Trailer (Opcional)</label>
          <SearchableSelect
            items={trailers}
            bind:value={currentRuta.trailer}
            labelField="plate"
            subLabelField="code"
            valueField="_id"
            placeholder="Seleccionar Trailer (Opcional)"
            searchPlaceholder="Buscar por placa o código"
            required={false}
          >
            <span slot="search-label">Buscar Trailer:</span>
          </SearchableSelect>
        </div>

        <div class="form-group">
          <label for="conductor">Conductor</label>
          <SearchableSelect
            items={conductores}
            bind:value={currentRuta.conductor}
            labelField="fullName"
            subLabelField="cedula"
            valueField="_id"
            placeholder="Seleccionar Conductor"
            searchPlaceholder="Buscar por nombre o cédula"
            required={true}
          >
            <span slot="search-label">Buscar Conductor:</span>
          </SearchableSelect>
        </div>

        <div class="form-group">
          <label for="auxiliar">Auxiliar (Opcional)</label>
          <SearchableSelect
            items={auxiliares}
            bind:value={currentRuta.auxiliar}
            labelField="fullName"
            subLabelField="cedula"
            valueField="_id"
            placeholder="Seleccionar Auxiliar (Opcional)"
            searchPlaceholder="Buscar por nombre o cédula"
            required={false}
          >
            <span slot="search-label">Buscar Auxiliar:</span>
          </SearchableSelect>
        </div>

        {#if error}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {error}
          </div>
        {/if}

        <div class="form-actions">
          <button type="submit" class="btn-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Ruta' : 'Crear Ruta')}
          </button>
          <button type="button" class="btn-secondary" on:click={closeCreateEditModal} disabled={isLoading}>Cancelar</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showRutaDetailModal && selectedRutaDetail}
  <div class="modal-overlay detail-modal" on:click|self={closeRutaDetailModal}>
    <div class="modal-content detail-content">
      <div class="modal-header">
        <h2>Detalles de la Ruta</h2>
        <button class="close-button" on:click={closeRutaDetailModal}>&times;</button>
      </div>
      <div class="modal-body detail-body">
        <div class="detail-item">
          <span class="detail-label">Código:</span>
          <span class="detail-value">{selectedRutaDetail.code}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Lugar de Salida:</span>
          <span class="detail-value">{selectedRutaDetail.startLocation}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Lugar de Destino:</span>
          <span class="detail-value">{selectedRutaDetail.endLocation}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Concepto:</span>
          <span class="detail-value">{selectedRutaDetail.concept}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha de Salida:</span>
          <span class="detail-value">{new Date(selectedRutaDetail.startDate).toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha de Llegada:</span>
          <span class="detail-value">
            {#if selectedRutaDetail.endDate}
              {new Date(selectedRutaDetail.endDate).toLocaleDateString()}
            {:else}
              Pendiente
            {/if}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Chuto:</span>
          <span class="detail-value">
            {#if selectedRutaDetail.chuto}
              {selectedRutaDetail.chuto.plate} ({selectedRutaDetail.chuto.code})
            {:else}
              N/A
            {/if}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Trailer:</span>
          <span class="detail-value">
            {#if selectedRutaDetail.trailer}
              {selectedRutaDetail.trailer.plate} ({selectedRutaDetail.trailer.code})
            {:else}
              N/A
            {/if}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Conductor:</span>
          <span class="detail-value">
            {#if selectedRutaDetail.conductor}
              {selectedRutaDetail.conductor.firstName} {selectedRutaDetail.conductor.lastName}
            {:else}
              N/A
            {/if}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Auxiliar:</span>
          <span class="detail-value">
            {#if selectedRutaDetail.auxiliar}
              {selectedRutaDetail.auxiliar.firstName} {selectedRutaDetail.auxiliar.lastName}
            {:else}
              N/A
            {/if}
          </span>
        </div>
      </div>
      <div class="modal-footer form-actions">
        <button class="btn-secondary" on:click={() => {
          console.log('DEBUG: Selected Ruta Detail before Edit:', selectedRutaDetail);
          const rutaToEdit = selectedRutaDetail as Ruta;
          closeRutaDetailModal();
          openEditModal(rutaToEdit);
        }}>Editar</button>
        <button class="btn-danger" on:click={() => {
          console.log('DEBUG: Selected Ruta Detail before Delete:', selectedRutaDetail);
          const rutaToDelete = selectedRutaDetail as Ruta;
          closeRutaDetailModal();
          handleDeleteRutaClick(rutaToDelete);
        }}>Eliminar</button>
      </div>
    </div>
  </div>
{/if}

{#if showConfirmDeleteRutaModal && rutaToDelete}
  <div class="modal-overlay confirm-modal" on:click={() => showConfirmDeleteRutaModal = false} role="presentation">
    <div class="modal-content confirm-content" on:click|stopPropagation role="dialog">
      <div class="modal-header">
        <h2>Confirmar Eliminación</h2>
        <button class="close-button" on:click={() => showConfirmDeleteRutaModal = false}>&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="confirm-message">
          <span class="warning-icon">⚠️</span>
          <p>¿Estás seguro de que deseas eliminar la ruta con código: <strong>{rutaToDelete.code}</strong>?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          class="btn-secondary" 
          on:click={() => showConfirmDeleteRutaModal = false}
          disabled={isDeletingRuta}
        >
          Cancelar
        </button>
        <button 
          class="btn-danger" 
          on:click={confirmDeleteRuta}
          disabled={isDeletingRuta}
        >
          {isDeletingRuta ? 'Eliminando...' : 'Eliminar'}
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
    background-color: #ffffff;
    color: #111827;
  }

  .btn-primary, .btn-secondary, .btn-danger {
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border: none;
  }

  .btn-primary:hover {
    background-color: var(--medium-blue);
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

  .ruta-cards-container { /* Changed from vehicle-cards-container */
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .ruta-card { /* Changed from vehicle-card */
    background-color: var(--white);
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s ease-in-out;
  }

  .ruta-card:hover { /* Changed from vehicle-card */
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

  .ruta-concept { /* New style for concept tag */
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
    max-width: 850px; /* Increased max-width */
    position: relative;
    max-height: 90vh; /* Increased max-height */
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

  .propietario-selection-group { /* Reusing this for chuto/trailer if needed, adapting names */
    display: flex;
    gap: 1rem; /* Space between the two inputs */
    margin-bottom: 1.25rem; /* Consistent with other form-groups */
  }

  .propietario-selection-group .form-group {
    flex: 1; /* Each child takes equal width */
    margin-bottom: 0; /* Remove redundant margin */
  }

  .propietario-selection-group .form-group label {
    display: block;
    margin-bottom: 0.5rem;
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