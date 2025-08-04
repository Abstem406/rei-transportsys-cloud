<script lang="ts">
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getApiClient, type ApiClient, type Pago, type CreatePagoDto, type UpdatePagoDto, type PaginatedPagosResponse, type Ruta, type Employee, type Propietario } from '$lib/api/ApiClient';
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import SearchableSelect from '$lib/components/SearchableSelect.svelte';
  import { API_URL } from '$lib/config';

  let activeSection = 'pagos';
  let isLoading = false;
  let error: string | null = null;
  let api: ApiClient;

  let pagos: Pago[] = [];
  let totalPagos = 0;
  let currentPage = 1;
  let limit = 10;
  let searchTerm = ''; // For searching by concepto, referencia, metodoPago, ruta.code, empleado names
  let filterPaymentType: 'employee' | 'owner' | 'company_out' | 'company_in' | '' = ''; // New filter state

  let rutasList: Ruta[] = []; // For dropdown in form
  let employeesList: Employee[] = []; // For dropdown in form
  let propietariosList: Propietario[] = []; // New: For dropdown in form

  // Modal for creating/editing pagos
  let showCreateEditModal = false;
  let isEditing = false;
  let currentPago: CreatePagoDto & { _id?: string; } = {
    paymentType: 'employee', // Default value
    ruta: '',
    empleado: '',
    propietario: '', // New field
    thirdPartyName: '', // New field
    thirdPartyIdentification: '', // New field
    thirdPartyContact: '', // New field
    monto: 0,
    fechaPago: new Date().toISOString().split('T')[0],
    concepto: '',
    metodoPago: 'Efectivo',
    referencia: '',
    estado: 'Pendiente',
    notas: '',
    receiptImage: undefined, // New field for file object
  };
  let currentReceiptImageUrl: string | undefined = undefined; // To display existing image URL

  // Confirmation modal for deletion
  let showConfirmDeletePagoModal = false;
  let pagoToDelete: { id: string; concept: string; } | null = null; // Changed 'concepto' to 'concept' for generic use
  let isDeletingPago = false;

  // Detail modal for pago
  let showPagoDetailModal = false;
  let selectedPagoDetail: Pago | null = null;

  // Error modal
  let showErrorMessageModal = false;
  let errorMessage = '';

  function openCreateModal() {
    isEditing = false;
    currentPago = {
      paymentType: 'employee',
      ruta: '',
      empleado: '',
      propietario: '',
      thirdPartyName: '',
      thirdPartyIdentification: '',
      thirdPartyContact: '',
      monto: 0,
      fechaPago: new Date().toISOString().split('T')[0],
      concepto: '',
      metodoPago: 'Efectivo',
      referencia: '',
      estado: 'Pendiente',
      notas: '',
      receiptImage: undefined,
    };
    currentReceiptImageUrl = undefined; // Clear image URL
    console.log('DEBUG: Opening create pago modal, currentPago:', currentPago);
    showCreateEditModal = true;
  }

  function openEditModal(pago: Pago) {
    isEditing = true;
    currentPago = {
      _id: pago._id,
      paymentType: pago.paymentType,
      ruta: pago.ruta?._id || '',
      empleado: pago.empleado?._id || '',
      propietario: pago.propietario?._id || '',
      thirdPartyName: pago.thirdPartyName || '',
      thirdPartyIdentification: pago.thirdPartyIdentification || '',
      thirdPartyContact: pago.thirdPartyContact || '',
      monto: pago.monto,
      fechaPago: pago.fechaPago ? new Date(pago.fechaPago).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      concepto: pago.concepto,
      metodoPago: pago.metodoPago,
      referencia: pago.referencia || '',
      estado: pago.estado,
      notas: pago.notas || '',
      receiptImage: undefined, // Do not pre-fill file input, user has to re-select
    };
    currentReceiptImageUrl = pago.receiptImageUrl ? API_URL + pago.receiptImageUrl : undefined; // Set existing image URL with full path
    console.log('DEBUG (Frontend Edit): Opening edit pago modal, currentPago:', currentPago);
    console.log('DEBUG (Frontend Edit): currentReceiptImageUrl set to:', currentReceiptImageUrl);
    showCreateEditModal = true;
  }

  function closeCreateEditModal() {
    showCreateEditModal = false;
    error = null;
    errorMessage = '';
    currentPago.receiptImage = undefined; // Clear file input on close
    currentReceiptImageUrl = undefined; // Clear displayed image on close
  }

  function closeErrorMessageModal() {
    showErrorMessageModal = false;
    errorMessage = '';
  }

  function handleReceiptImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      currentPago.receiptImage = input.files[0];
      currentReceiptImageUrl = URL.createObjectURL(input.files[0]); // For immediate preview
    } else {
      currentPago.receiptImage = undefined;
      currentReceiptImageUrl = undefined;
    }
  }

  function removeReceiptImage() {
    currentPago.receiptImage = undefined;
    currentReceiptImageUrl = undefined;
    const fileInput = document.getElementById('receiptImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Clear the file input element
    }
  }

  function openPagoDetailModal(pago: Pago) {
    selectedPagoDetail = pago;
    showPagoDetailModal = true;
    console.log('DEBUG (Frontend Detail): openPagoDetailModal received pago:', pago);
    console.log('DEBUG (Frontend Detail): receiptImageUrl from selectedPagoDetail:', pago.receiptImageUrl);
  }

  function closePagoDetailModal() {
    showPagoDetailModal = false;
    selectedPagoDetail = null;
  }

  async function fetchRutasEmployeesAndPropietariosForSelect() { // Renamed function
    if (!api) {
      console.error('API client not initialized for fetching rutas/employees/propietarios.');
      return;
    }
    isLoading = true;
    const [rutasResponse, employeesResponse, propietariosResponse] = await Promise.all([
      api.getAllRutas({ limit: 1000 }),
      api.getEmployees({ limit: 1000 }),
      api.getAllPropietarios({ limit: 1000 }) // Fetch proprietors
    ]);

    if (rutasResponse.data) {
      rutasList = rutasResponse.data.items;
      console.log('DEBUG: Rutas fetched for select:', rutasList);
    } else if (rutasResponse.error) {
      console.error('Error fetching rutas for select:', rutasResponse.error);
    }

    if (employeesResponse.data) {
      employeesList = employeesResponse.data.items;
      console.log('DEBUG: Employees fetched for select:', employeesList);
    } else if (employeesResponse.error) {
      console.error('Error fetching employees for select:', employeesResponse.error);
    }

    if (propietariosResponse.data) { // Handle propietarios response
      propietariosList = propietariosResponse.data.items;
      console.log('DEBUG: Propietarios fetched for select:', propietariosList);
    } else if (propietariosResponse.error) {
      console.error('Error fetching propietarios for select:', propietariosResponse.error);
    }
    isLoading = false;
  }

  async function fetchPagos() {
    isLoading = true;
    error = null;
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }
    const response = await api.getAllPagos({
      page: currentPage,
      limit: limit,
      searchTerm: searchTerm,
      paymentType: filterPaymentType || undefined, // Pass filterPaymentType
    });
    console.log('DEBUG (Frontend Fetch): Fetch Pagos API Response:', response);
    if (response.data) {
      pagos = response.data.items;
      totalPagos = response.data.totalCount;
      console.log('DEBUG (Frontend Fetch): Pagos fetched, first item receiptImageUrl:', pagos.length > 0 ? pagos[0].receiptImageUrl : 'N/A');
    } else if (response.error) {
      error = response.error;
    }
    isLoading = false;
  }

  function handleDeletePagoClick(pago: Pago) {
    pagoToDelete = { id: pago._id, concept: pago.concepto }; // Changed 'concepto' to 'concept'
    console.log('DEBUG: Pago to delete:', pagoToDelete);
    showConfirmDeletePagoModal = true;
  }

  async function confirmDeletePago() {
    if (!pagoToDelete?.id) return;

    isLoading = true;
    isDeletingPago = true;
    error = null;
    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      isDeletingPago = false;
      return;
    }
    console.log('DEBUG: Attempting to delete Pago with ID:', pagoToDelete.id);
    const response = await api.deletePago(pagoToDelete.id);
    console.log('DEBUG: Delete Pago API Response:', response);
    if (response && response.status === 204) {
      showConfirmDeletePagoModal = false;
      closeCreateEditModal();
      fetchPagos();
    } else if (response && response.error) {
      errorMessage = response.error;
      showErrorMessageModal = true;
      error = response.error;
    }
    isLoading = false;
    isDeletingPago = false;
    pagoToDelete = null;
  }

  async function handleCreateOrUpdatePago() {
    error = null;
    isLoading = true;
    let response;

    if (!api) {
      error = 'API client not initialized.';
      isLoading = false;
      return;
    }

    const payload: CreatePagoDto & { _id?: string; } = { ...currentPago };
    payload.fechaPago = currentPago.fechaPago; 

    // Convert empty string ruta to null if it's optional
    if (payload.ruta === '') {
        payload.ruta = null;
    }
    
    // Clear irrelevant fields based on paymentType before sending
    if (payload.paymentType === 'employee') {
      payload.propietario = undefined;
      payload.thirdPartyName = undefined;
      payload.thirdPartyIdentification = undefined;
      payload.thirdPartyContact = undefined;
    } else if (payload.paymentType === 'owner') {
      payload.empleado = undefined;
      payload.thirdPartyName = undefined;
      payload.thirdPartyIdentification = undefined;
      payload.thirdPartyContact = undefined;
    } else if (payload.paymentType === 'company_out' || payload.paymentType === 'company_in') {
      payload.ruta = undefined;
      payload.empleado = undefined;
      payload.propietario = undefined;
    }

    console.log('DEBUG: Sending payload for Pago:', payload);

    if (isEditing) {
      response = await api.updatePago(currentPago._id as string, payload as UpdatePagoDto);
      console.log('DEBUG: Update Pago API Response:', response);
    } else {
      response = await api.createPago(payload);
      console.log('DEBUG: Create Pago API Response:', response);
    }

    if (response && response.data) {
      closeCreateEditModal();
      fetchPagos();
    } else if (response && response.error) {
      errorMessage = response.error;
      showErrorMessageModal = true;
      error = response.error;
    }
    isLoading = false;
  }

  onMount(() => {
    api = getApiClient();
    fetchRutasEmployeesAndPropietariosForSelect();
    fetchPagos();
  });

  function handleSearch() {
    currentPage = 1;
    fetchPagos();
  }

  function handlePageChange(newPage: number) {
    currentPage = newPage;
    fetchPagos();
  }

  $: totalPages = Math.ceil(totalPagos / limit);
</script>

<PageTransition let:isVisible>
  <div class="page-container">
    <OperatorHeader {activeSection} />
    <AnimatedBackground {isVisible} />
    
    <main>
      <div class="content-section">
        <div class="header-section">
          <div class="title-section">
            <h1>Gestión de Pagos</h1>
            <button class="btn-primary" on:click={openCreateModal}>+</button>
          </div>
          <div class="filters">
            <input type="text" placeholder="Buscar por concepto, referencia, ruta o empleado" bind:value={searchTerm} on:input={handleSearch} />
            <select bind:value={filterPaymentType} on:change={handleSearch}>
                <option value="">Todos los Tipos</option>
                <option value="employee">Pago a Empleado</option>
                <option value="owner">Pago a Propietario</option>
                <option value="company_out">De la Empresa (Salida)</option>
                <option value="company_in">A la Empresa (Entrada)</option>
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
            <p>Cargando pagos...</p>
          </div>
        {:else}
          {#if pagos.length > 0}
            <div class="data-cards-container">
              {#each pagos as pago (pago._id)}
                <div class="data-card" on:click={() => openPagoDetailModal(pago)}>
                  <div class="card-header">
                    <h3>Pago #{pago._id.slice(-6)}</h3>
                    <span class="card-tag {pago.estado.toLowerCase()}">{pago.estado}</span>
                  </div>
                  <div class="card-body">
                    <p><strong>Tipo de Pago:</strong> {pago.paymentType === 'employee' ? 'A Empleado' : pago.paymentType === 'owner' ? 'A Propietario' : pago.paymentType === 'company_out' ? 'De la Empresa (Salida)' : 'A la Empresa (Entrada)'}</p>
                    {#if pago.paymentType === 'employee'}
                        <p><strong>Empleado:</strong> {pago.empleado ? `${pago.empleado.firstName} ${pago.empleado.lastName}` : 'N/A'}</p>
                    {:else if pago.paymentType === 'owner'}
                        <p><strong>Propietario:</strong> {pago.propietario ? `${pago.propietario.name}` : 'N/A'}</p>
                    {:else if pago.paymentType === 'company_out' || pago.paymentType === 'company_in'}
                        <p><strong>Tercero:</strong> {pago.thirdPartyName || 'N/A'}</p>
                        <p><strong>Identificación:</strong> {pago.thirdPartyIdentification || 'N/A'}</p>
                    {/if}
                    {#if pago.ruta}
                        <p><strong>Ruta:</strong> {pago.ruta.code}</p>
                    {/if}
                    <p><strong>Monto:</strong> ${pago.monto.toFixed(2)}</p>
                    <p><strong>Concepto:</strong> {pago.concepto}</p>
                    <p><strong>Fecha:</strong> {new Date(pago.fechaPago).toLocaleDateString()}</p>
                    <p><strong>Método:</strong> {pago.metodoPago}</p>
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
              <p>No se encontraron pagos.</p>
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
      <h2>{isEditing ? 'Editar Pago' : 'Registrar Nuevo Pago'}</h2>
      <form on:submit|preventDefault={handleCreateOrUpdatePago}>
        <div class="form-group">
          <label for="paymentType">Tipo de Pago</label>
          <select id="paymentType" bind:value={currentPago.paymentType} required on:change={() => {
            currentPago.ruta = '';
            currentPago.empleado = '';
            currentPago.propietario = '';
            currentPago.thirdPartyName = '';
            currentPago.thirdPartyIdentification = '';
            currentPago.thirdPartyContact = '';
          }}>
            <option value="employee">A Empleado</option>
            <option value="owner">A Propietario</option>
            <option value="company_out">De la Empresa (Salida)</option>
            <option value="company_in">A la Empresa (Entrada)</option>
          </select>
        </div>

        {#if currentPago.paymentType === 'employee'}
          <div class="form-group">
            <label for="empleado">Empleado</label>
            <select id="empleado" bind:value={currentPago.empleado} required>
              <option value="">Seleccionar Empleado</option>
              {#each employeesList as employeeOption}
                <option value={employeeOption._id}>{employeeOption.firstName} {employeeOption.lastName} ({employeeOption.cedula})</option>
              {/each}
            </select>
          </div>
        {:else if currentPago.paymentType === 'owner'}
          <SearchableSelect
            items={propietariosList}
            bind:value={currentPago.propietario}
            labelField="name"
            subLabelField="cedula"
            valueField="_id"
            placeholder="Seleccionar Propietario"
            searchPlaceholder="Buscar por nombre o cédula"
            required={true}
          >
            <span slot="search-label">Buscar Propietario:</span>
          </SearchableSelect>
        {/if}

        {#if currentPago.paymentType === 'employee' || currentPago.paymentType === 'owner'}
          <div class="form-group">
            <label for="ruta">Ruta (Opcional)</label>
            <select id="ruta" bind:value={currentPago.ruta}>
              <option value="">Seleccionar Ruta (Opcional)</option>
              {#each rutasList as rutaOption}
                <option value={rutaOption._id}>{rutaOption.code} ({rutaOption.startLocation} a {rutaOption.endLocation})</option>
              {/each}
            </select>
          </div>
        {/if}

        {#if currentPago.paymentType === 'company_out' || currentPago.paymentType === 'company_in'}
          <div class="form-group">
            <label for="thirdPartyName">Nombre del Tercero</label>
            <input type="text" id="thirdPartyName" bind:value={currentPago.thirdPartyName} required />
          </div>
          <div class="form-group">
            <label for="thirdPartyIdentification">Identificación del Tercero (Opcional)</label>
            <input type="text" id="thirdPartyIdentification" bind:value={currentPago.thirdPartyIdentification} />
          </div>
          <div class="form-group">
            <label for="thirdPartyContact">Contacto del Tercero (Opcional)</label>
            <input type="text" id="thirdPartyContact" bind:value={currentPago.thirdPartyContact} />
          </div>
        {/if}

        <div class="form-group">
          <label for="monto">Monto</label>
          <input type="number" id="monto" bind:value={currentPago.monto} min="0" step="0.01" required />
        </div>

        <div class="form-group">
          <label for="concepto">Concepto</label>
          <input type="text" id="concepto" bind:value={currentPago.concepto} required />
        </div>

        <div class="form-group">
          <label for="fechaPago">Fecha de Pago</label>
          <input type="date" id="fechaPago" bind:value={currentPago.fechaPago} required />
        </div>

        <div class="form-group">
          <label for="metodoPago">Método de Pago</label>
          <select id="metodoPago" bind:value={currentPago.metodoPago}>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta de Crédito/Débito">Tarjeta de Crédito/Débito</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div class="form-group">
          <label for="referencia">Referencia (Opcional)</label>
          <input type="text" id="referencia" bind:value={currentPago.referencia} maxlength="100" />
        </div>

        <div class="form-group">
          <label for="estado">Estado</label>
          <select id="estado" bind:value={currentPago.estado}>
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
            <option value="Rechazado">Rechazado</option>
          </select>
        </div>

        <div class="form-group">
          <label for="notas">Notas (Opcional)</label>
          <textarea id="notas" bind:value={currentPago.notas} maxlength="500"></textarea>
        </div>

        <div class="form-group">
          <label for="receiptImage">Comprobante de Pago (Opcional)</label>
          <input type="file" id="receiptImage" accept="image/*" on:change={handleReceiptImageChange} />
          {#if currentReceiptImageUrl}
            <div class="receipt-preview">
              <img src="{currentReceiptImageUrl}" alt="Comprobante de Pago" />
              <button type="button" class="btn-danger btn-sm" on:click={removeReceiptImage}>Eliminar Imagen</button>
            </div>
          {/if}
        </div>

        {#if error}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {error}
          </div>
        {/if}

        <div class="form-actions">
          <button type="submit" class="btn-primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Pago' : 'Registrar Pago')}
          </button>
          <button type="button" class="btn-secondary" on:click={closeCreateEditModal} disabled={isLoading}>Cancelar</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showPagoDetailModal && selectedPagoDetail}
  <div class="modal-overlay detail-modal" on:click|self={closePagoDetailModal}>
    <div class="modal-content detail-content">
      <div class="modal-header">
        <h2>Detalles del Pago</h2>
        <button class="close-button" on:click={closePagoDetailModal}>&times;</button>
      </div>
      <div class="modal-body detail-body">
        <div class="detail-item">
          <span class="detail-label">ID de Pago:</span>
          <span class="detail-value">{selectedPagoDetail._id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tipo de Pago:</span>
          <span class="detail-value">{selectedPagoDetail.paymentType === 'employee' ? 'A Empleado' : selectedPagoDetail.paymentType === 'owner' ? 'A Propietario' : selectedPagoDetail.paymentType === 'company_out' ? 'De la Empresa (Salida)' : 'A la Empresa (Entrada)'}</span>
        </div>
        {#if selectedPagoDetail.paymentType === 'employee'}
          <div class="detail-item">
            <span class="detail-label">Empleado:</span>
            <span class="detail-value">{#if selectedPagoDetail.empleado}{selectedPagoDetail.empleado.firstName} {selectedPagoDetail.empleado.lastName} ({selectedPagoDetail.empleado.cedula}){:else}N/A{/if}</span>
          </div>
        {:else if selectedPagoDetail.paymentType === 'owner'}
          <div class="detail-item">
            <span class="detail-label">Propietario:</span>
            <span class="detail-value">{#if selectedPagoDetail.propietario}{selectedPagoDetail.propietario.name} ({selectedPagoDetail.propietario.cedula}){:else}N/A{/if}</span>
          </div>
        {:else if selectedPagoDetail.paymentType === 'company_out' || selectedPagoDetail.paymentType === 'company_in'}
          <div class="detail-item">
            <span class="detail-label">Tercero:</span>
            <span class="detail-value">{selectedPagoDetail.thirdPartyName || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Identificación del Tercero:</span>
            <span class="detail-value">{selectedPagoDetail.thirdPartyIdentification || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Contacto del Tercero:</span>
            <span class="detail-value">{selectedPagoDetail.thirdPartyContact || 'N/A'}</span>
          </div>
        {/if}
        {#if selectedPagoDetail.ruta}
          <div class="detail-item">
            <span class="detail-label">Ruta:</span>
            <span class="detail-value">{#if selectedPagoDetail.ruta}{selectedPagoDetail.ruta.code} ({selectedPagoDetail.ruta.startLocation} - {selectedPagoDetail.ruta.endLocation}){:else}N/A{/if}</span>
          </div>
        {/if}
        <div class="detail-item">
          <span class="detail-label">Monto:</span>
          <span class="detail-value">${selectedPagoDetail.monto.toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Concepto:</span>
          <span class="detail-value">{selectedPagoDetail.concepto}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha de Pago:</span>
          <span class="detail-value">{new Date(selectedPagoDetail.fechaPago).toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Método de Pago:</span>
          <span class="detail-value">{selectedPagoDetail.metodoPago}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Referencia:</span>
          <span class="detail-value">{#if selectedPagoDetail.referencia}{selectedPagoDetail.referencia}{:else}N/A{/if}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Estado:</span>
          <span class="detail-value">{selectedPagoDetail.estado}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Notas:</span>
          <span class="detail-value">{#if selectedPagoDetail.notas}{selectedPagoDetail.notas}{:else}N/A{/if}</span>
        </div>
        {#if selectedPagoDetail.receiptImageUrl}
          <div class="detail-item full-width">
            <span class="detail-label">Comprobante:</span>
            <div class="detail-value">
              <img src="{API_URL}{selectedPagoDetail.receiptImageUrl}" alt="Comprobante de Pago" class="detail-receipt-image" />
            </div>
          </div>
        {/if}
        <div class="detail-item">
          <span class="detail-label">Creado el:</span>
          <span class="detail-value">{new Date(selectedPagoDetail.createdAt).toLocaleString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Última Actualización:</span>
          <span class="detail-value">{new Date(selectedPagoDetail.updatedAt).toLocaleString()}</span>
        </div>
      </div>
      <div class="modal-footer form-actions">
        <button class="btn-secondary" on:click={() => {
          const pagoToEdit = selectedPagoDetail as Pago;
          closePagoDetailModal();
          openEditModal(pagoToEdit);
        }}>Editar</button>
        <button class="btn-danger" on:click={() => {
          const pagoToDelete = selectedPagoDetail as Pago;
          closePagoDetailModal();
          handleDeletePagoClick(pagoToDelete);
        }}>Eliminar</button>
      </div>
    </div>
  </div>
{/if}

{#if showConfirmDeletePagoModal && pagoToDelete}
  <div class="modal-overlay confirm-modal" on:click={() => showConfirmDeletePagoModal = false} role="presentation">
    <div class="modal-content confirm-content" on:click|stopPropagation role="dialog">
      <div class="modal-header">
        <h2>Confirmar Eliminación</h2>
        <button class="close-button" on:click={() => showConfirmDeletePagoModal = false}>&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="confirm-message">
          <span class="warning-icon">⚠️</span>
          <p>¿Estás seguro de que deseas eliminar el pago con concepto: <strong>{pagoToDelete.concept}</strong>?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          class="btn-secondary" 
          on:click={() => showConfirmDeletePagoModal = false}
          disabled={isDeletingPago}
        >
          Cancelar
        </button>
        <button 
          class="btn-danger" 
          on:click={confirmDeletePago}
          disabled={isDeletingPago}
        >
          {isDeletingPago ? 'Eliminando...' : 'Eliminar'}
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

  .btn-primary {
    background-color: var(--light-blue);
    color: var(--white);
  }

  .btn-primary:hover {
    background-color: var(--medium-blue);
  }

  .btn-secondary {
    background-color: var(--gray-700);
    color: var(--white);
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

  .data-cards-container { 
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .data-card { 
    background-color: var(--white);
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s ease-in-out;
  }

  .data-card:hover { 
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

  .card-tag {
    padding: 0.3rem 0.8rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .card-tag.pendiente {
    background-color: #fcd34d; /* yellow-300 */
    color: #92400e; /* yellow-800 */
  }

  .card-tag.pagado {
    background-color: #a7f3d0; /* emerald-200 */
    color: #065f46; /* emerald-800 */
  }

  .card-tag.rechazado {
    background-color: #fecaca; /* red-200 */
    color: #991b1b; /* red-800 */
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

  .form-group input, .form-group select, .form-group textarea {
    width: 100%; /* Ensure full width within its container */
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
    color: var(--gray-900);
    background-color: var(--white);
    box-sizing: border-box; /* Added for consistent sizing */
  }

  .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
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

  .receipt-preview {
    margin-top: 1rem;
    text-align: center;
  }

  .receipt-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    border: 1px solid var(--gray-300);
    margin-bottom: 0.5rem;
  }

  .receipt-preview .btn-sm {
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
  }

  .detail-receipt-image {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    border: 1px solid var(--gray-300);
    margin-top: 0.5rem;
  }

  .detail-item.full-width {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-item.full-width .detail-value {
    text-align: left;
    width: 100%;
  }
</style> 