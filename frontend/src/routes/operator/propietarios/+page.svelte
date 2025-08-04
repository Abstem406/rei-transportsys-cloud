<script lang="ts">
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getApiClient, type Propietario, type CreatePropietarioDto, type UpdatePropietarioDto, ApiClient, type PaginatedPropietariosResponse } from '$lib/api/ApiClient';
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';

  let activeSection = 'propietarios';
  let isLoading = false;
  let error: string | null = null;

  let api: ApiClient; // Declare api here, but initialize in onMount

  let propietarios: Propietario[] = [];
  let totalPropietarios = 0;
  let currentPage = 1;
  let limit = 10; // Number of items per page
  let searchTerm = '';
  let selectedCedulaPrefixFilter: string = ''; // New filter for cedula prefix

  // Modal state
  let showCreateEditModal = false;
  let isEditing = false;
  let currentPropietario: CreatePropietarioDto & { _id?: string; cedulaPrefix?: string; cedulaNumber?: string; } = { 
    name: '',
    cedula: '',
    phone: '',
    address: '',
    email: '',
    cedulaPrefix: 'V', // Default prefix
    cedulaNumber: '',
  };

  // Confirmation modal state
  let showConfirmModal = false;
  let propietarioToDelete: { id: string; name: string; cedula: string; } | null = null;
  let isDeleting = false;

  function openCreateModal() {
    isEditing = false;
    currentPropietario = { 
      name: '', 
      cedula: '', 
      phone: '', 
      address: '', 
      email: '',
      cedulaPrefix: 'V',
      cedulaNumber: '',
    };
    showCreateEditModal = true;
  }

  function openEditModal(propietario: Propietario) {
    isEditing = true;
    // Parse cedula into prefix and number for editing
    const match = propietario.cedula.match(/^([VEJG])-(\d+)$/);
    currentPropietario = {
      ...propietario,
      cedulaPrefix: match ? match[1] : 'V',
      cedulaNumber: match ? match[2] : propietario.cedula,
    };
    showCreateEditModal = true;
  }

  function closeCreateEditModal() {
    showCreateEditModal = false;
    error = null; // Clear any modal-related errors
  }

  async function fetchPropietarios() {
    isLoading = true;
    error = null;
    if (!api) { // Ensure api is initialized before calling methods
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }
    const response = await api.getAllPropietarios({
      searchTerm,
      page: currentPage,
      limit,
      cedulaPrefixFilter: selectedCedulaPrefixFilter === '' ? undefined : selectedCedulaPrefixFilter,
    });
    if (response.data) {
      propietarios = response.data.items;
      totalPropietarios = response.data.totalCount;
    } else if (response.error) {
      error = response.error;
    }
    isLoading = false;
  }

  async function handleCreateOrUpdatePropietario() {
    error = null;
    isLoading = true;
    let response;

    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }

    // Ensure cedula is saved with a hyphen for consistency with backend model
    const cedulaToSave = `${currentPropietario.cedulaPrefix}-${currentPropietario.cedulaNumber}`;

    if (isEditing) {
      if (!currentPropietario._id) {
        error = 'ID de propietario no encontrado para la edición.';
        isLoading = false;
        return;
      }
      const payload: UpdatePropietarioDto = {
        name: currentPropietario.name,
        cedula: cedulaToSave,
        phone: currentPropietario.phone,
        address: currentPropietario.address,
        email: currentPropietario.email || undefined,
      };
      response = await api.updatePropietario(currentPropietario._id, payload);
    } else {
      const payload: CreatePropietarioDto = {
        name: currentPropietario.name,
        cedula: cedulaToSave,
        phone: currentPropietario.phone,
        address: currentPropietario.address,
        email: currentPropietario.email || undefined,
      };
      response = await api.createPropietario(payload);
    }

    if (response && response.data) {
      closeCreateEditModal();
      fetchPropietarios(); // Refresh the list
    } else if (response && response.error) {
      error = response.error;
    }
    isLoading = false;
  }

  function handleDeleteClick(propietario: Propietario) {
    propietarioToDelete = { id: propietario._id, name: propietario.name, cedula: propietario.cedula };
    showConfirmModal = true;
  }

  async function confirmDeletePropietario() {
    if (!propietarioToDelete?.id) return;

    isLoading = true;
    isDeleting = true;
    error = null;
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      isDeleting = false;
      return;
    }
    const response = await api.deletePropietario(propietarioToDelete.id);
    if (response && response.status === 204) {
      showConfirmModal = false;
      closeCreateEditModal(); // Close the edit modal too
      fetchPropietarios(); // Refresh the list
    } else if (response && response.error) {
      error = response.error;
    }
    isLoading = false;
    isDeleting = false;
    propietarioToDelete = null; // Clear the selected propietario
  }

  onMount(() => {
    api = getApiClient(); // Initialize api client on mount
    fetchPropietarios();
  });

  function handleSearch() {
    currentPage = 1; // Reset page on search
    fetchPropietarios();
  }

  function handlePageChange(newPage: number) {
    currentPage = newPage;
    fetchPropietarios();
  }

  function clearFilters() {
    searchTerm = '';
    selectedCedulaPrefixFilter = '';
    currentPage = 1;
    fetchPropietarios();
  }

  $: totalPages = Math.ceil(totalPropietarios / limit);
</script>

<PageTransition let:isVisible>
  <div class="page-container">
    <OperatorHeader {activeSection} />
    <AnimatedBackground {isVisible} />
    
    <main>
      <div class="content-section">
        <div class="header-section">
          <div class="title-section">
            <h1>Gestión de Propietarios</h1>
            <button class="btn-primary" on:click={openCreateModal}>+</button>
          </div>
          <div class="filters">
            <input type="text" placeholder="Buscar por nombre o cédula" bind:value={searchTerm} on:input={handleSearch} />
            <select bind:value={selectedCedulaPrefixFilter} on:change={handleSearch}>
              <option value="">Todos los prefijos</option>
              <option value="V">V</option>
              <option value="E">E</option>
              <option value="J">J</option>
              <option value="G">G</option>
            </select>
            <button class="btn-secondary" on:click={clearFilters}>Limpiar Filtros</button>
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
            <p>Cargando propietarios...</p>
          </div>
        {:else}
          {#if propietarios.length > 0}
            <div class="propietarios-grid">
              {#each propietarios as propietario (propietario._id)}
                <div
                  class="propietario-card"
                  on:click={() => openEditModal(propietario)}
                  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openEditModal(propietario); }}
                  role="button"
                  tabindex="0"
                >
                  <div class="propietario-avatar">
                    {propietario.name[0].toUpperCase()}
                  </div>
                  <div class="propietario-info">
                    <h3>{propietario.name}</h3>
                    <p class="cedula">Cédula: {propietario.cedula}</p>
                    <p class="phone">Teléfono: {propietario.phone}</p>
                    <p class="address">Dirección: {propietario.address}</p>
                    {#if propietario.email}
                      <p class="email">Email: {propietario.email}</p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onNextPage={() => handlePageChange(currentPage + 1)}
              onPreviousPage={() => handlePageChange(currentPage - 1)}
            />
          {:else}
            <div class="no-results">
              <p>No se encontraron propietarios.</p>
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
      <h2>{isEditing ? 'Editar Propietario' : 'Crear Nuevo Propietario'}</h2>
      <form on:submit|preventDefault={handleCreateOrUpdatePropietario}>
        <div class="form-group">
          <label for="propietarioName">Nombre</label>
          <input type="text" id="propietarioName" bind:value={currentPropietario.name} required />
        </div>
        <div class="form-group">
          <label for="propietarioCedula">Cédula</label>
          <div class="cedula-input-group">
            <select id="cedulaPrefix" bind:value={currentPropietario.cedulaPrefix} required>
              <option value="V">V</option>
              <option value="E">E</option>
              <option value="J">J</option>
              <option value="G">G</option>
            </select>
            <input type="text" id="propietarioCedulaNumber" bind:value={currentPropietario.cedulaNumber} placeholder="Número de cédula/RIF" required />
          </div>
        </div>
        <div class="form-group">
          <label for="propietarioPhone">Teléfono</label>
          <input type="text" id="propietarioPhone" bind:value={currentPropietario.phone} required />
        </div>
        <div class="form-group">
          <label for="propietarioAddress">Dirección</label>
          <input type="text" id="propietarioAddress" bind:value={currentPropietario.address} required />
        </div>
        <div class="form-group">
          <label for="propietarioEmail">Correo Electrónico (Opcional)</label>
          <input type="email" id="propietarioEmail" bind:value={currentPropietario.email} />
        </div>

        {#if error}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {error}
          </div>
        {/if}

        <div class="form-actions">
          {#if isEditing && currentPropietario._id}
            <button class="btn-danger" on:click={() => handleDeleteClick(currentPropietario as Propietario)} disabled={isLoading}>
              Eliminar Propietario
            </button>
          {/if}
          <div class="form-buttons-right">
            <button type="submit" class="btn-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Propietario' : 'Crear Propietario')}
            </button>
            <button type="button" class="btn-secondary" on:click={closeCreateEditModal} disabled={isLoading}>Cancelar</button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showConfirmModal && propietarioToDelete}
  <div class="modal-overlay confirm-modal" on:click={() => showConfirmModal = false} role="presentation">
    <div class="modal-content confirm-content" on:click|stopPropagation role="dialog">
      <div class="modal-header">
        <h2>Confirmar Eliminación</h2>
        <button class="close-button" on:click={() => showConfirmModal = false}>&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="confirm-message">
          <span class="warning-icon">⚠️</span>
          <p>¿Estás seguro de que deseas eliminar al propietario <strong>{propietarioToDelete.name}</strong> con Cédula: <strong>{propietarioToDelete.cedula}</strong>?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          class="btn-secondary" 
          on:click={() => showConfirmModal = false}
          disabled={isDeleting}
        >
          Cancelar
        </button>
        <button 
          class="btn-danger" 
          on:click={confirmDeletePropietario}
          disabled={isDeleting}
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
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
    background-color: var(--white);
    color: var(--gray-900);
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

  /* Styles for Propietario Cards */
  .propietarios-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .propietario-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    position: relative; /* For card-actions positioning */
  }

  .propietario-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .propietario-avatar {
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
    flex-shrink: 0;
  }

  .propietario-info {
    flex: 1;
  }

  .propietario-info h3 {
    margin: 0;
    color: var(--gray-900);
    font-size: 1.1rem;
  }

  .propietario-info p {
    color: var(--gray-600);
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  /* End Styles for Propietario Cards */

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
    /* Remove th, td styles as table is gone */
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
    z-index: 1000;
  }

  .modal-content {
    background-color: var(--white);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 700px;
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
    width: 100%; /* Make all inputs and selects full width */
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
    color: var(--gray-900);
    background-color: var(--white);
  }

  .form-group input:focus, .form-group select:focus {
    border-color: var(--accent-blue);
    outline: none;
    box-shadow: 0 0 0 2px rgba(66, 165, 245, 0.2);
  }

  .form-actions {
    display: flex;
    justify-content: space-between; /* Distribute items with space between */
    align-items: center;
    gap: 1rem; /* Adjust gap if necessary for spacing */
    margin-top: 2rem;
    flex-wrap: wrap; /* Allow buttons to wrap on smaller screens */
  }

  .form-buttons-right {
    display: flex;
    gap: 1rem; /* Gap between primary and secondary buttons */
    flex-wrap: wrap;
    justify-content: flex-end; /* Align these buttons to the right within their group */
  }

  .form-actions .btn-primary, .form-actions .btn-secondary, .form-actions .btn-danger {
    min-width: 120px;
    /* Remove flex-grow: 1 to prevent stretching, let them maintain min-width */
  }

  .cedula-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center; /* Align items vertically in the middle */
  }

  .cedula-input-group select {
    flex-shrink: 0;
    width: 70px; /* Adjusted width for better appearance */
  }

  .cedula-input-group input {
    flex-grow: 1; /* Allow it to grow to fill remaining space */
    width: auto; /* Override 100% from .form-group input for flex behavior */
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
</style> 