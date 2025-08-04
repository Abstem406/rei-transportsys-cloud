<script lang="ts">
    import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
    import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
    import PageTransition from '$lib/components/PageTransition.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import SearchableSelect from '$lib/components/SearchableSelect.svelte';
    import { getApiClient, type ApiClient, type Ruta, type PaginatedRutasResponse, type Factura, type CreateFacturaDto, type InvoiceItem, type Propietario } from '$lib/api/ApiClient';
    import { onMount } from 'svelte';
    import Pagination from '$lib/components/Pagination.svelte';

    let activeSection = 'generate'; // 'generate' or 'list'
    let isLoading = false;
    let error: string | null = null;
    let api: ApiClient;

    let rutas: Ruta[] = [];
    let selectedRutaId: string | undefined = undefined;
    let selectedRutaDetail: Ruta | null = null;

    // Invoice form data
    let clientName: string = '';
    let clientIdentification: string = '';
    let clientAddress: string = '';
    let clientPhone: string = '';
    let clientEmail: string = '';
    let invoiceItems: InvoiceItem[] = [{ description: '', quantity: 1, unitPrice: 0, total: 0 }];
    let tax: number = 0;
    let notes: string = '';

    let showSuccessMessageModal = false;
    let successMessage = '';
    let showErrorMessageModal = false;
    let errorMessage = '';
    let generatedFacturaId: string | null = null; // For newly generated factura

    // State for listing facturas
    let facturas: Factura[] = [];
    let totalFacturas = 0;
    let currentPage = 1;
    let limit = 10;
    let searchTermList = '';
    let selectedFacturaForPrint: Factura | null = null; // To store the factura selected from the list for printing
    let showFacturaDetailsModal = false;

    $: subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);
    $: totalAmount = subtotal + tax;
    $: totalPages = Math.ceil(totalFacturas / limit); // Calculate totalPages

    // Function to fetch all rutas for the searchable select
    async function fetchRutasForSelect() {
        isLoading = true;
        error = null;
        if (!api) {
            error = 'API client not initialized.';
            isLoading = false;
            return;
        }
        const response = await api.getAllRutas({ limit: 1000 }); // Fetch all rutas
        if (response.data) {
            rutas = response.data.items;
        } else if (response.error) {
            error = response.error;
        }
        isLoading = false;
    }

    // Reactive: When selectedRutaId changes, fetch route details and pre-fill client info
    $: if (selectedRutaId && rutas.length > 0) {
        const currentRuta = rutas.find(r => r._id === selectedRutaId);
        if (currentRuta) {
            fetchRutaDetails(currentRuta._id);
        } else {
            selectedRutaDetail = null;
            clearClientInfo();
        }
    }

    async function fetchRutaDetails(rutaId: string) {
        isLoading = true;
        error = null;
        const response = await api.getRuta(rutaId);
        if (response.data) {
            selectedRutaDetail = response.data;
            prefillClientInfo(response.data);
        } else if (response.error) {
            error = response.error;
            selectedRutaDetail = null;
            clearClientInfo();
        }
        isLoading = false;
    }

    function prefillClientInfo(ruta: Ruta) {
        let owner: Propietario | undefined;
        if (ruta.chuto && ruta.chuto.propietario) {
            owner = ruta.chuto.propietario;
        } else if (ruta.trailer && ruta.trailer.propietario) {
            owner = ruta.trailer.propietario;
        }

        if (owner) {
            clientName = owner.name || '';
            clientIdentification = owner.cedula || '';
            clientAddress = owner.address || '';
            clientPhone = owner.phone || '';
            clientEmail = owner.email || '';
        } else {
            clearClientInfo();
        }
    }

    function clearClientInfo() {
        clientName = '';
        clientIdentification = '';
        clientAddress = '';
        clientPhone = '';
        clientEmail = '';
    }

    function addInvoiceItem() {
        invoiceItems = [...invoiceItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }];
    }

    function removeInvoiceItem(index: number) {
        invoiceItems = invoiceItems.filter((_, i) => i !== index);
        if (invoiceItems.length === 0) {
            addInvoiceItem(); // Always keep at least one item row
        }
    }

    function updateItemTotal(index: number) {
        const item = invoiceItems[index];
        item.total = item.quantity * item.unitPrice;
        invoiceItems = [...invoiceItems]; // Trigger reactive update
    }

    async function handleGenerateFactura() {
        isLoading = true;
        error = null;
        errorMessage = '';

        if (!selectedRutaId) {
            errorMessage = 'Debe seleccionar una ruta para generar la factura.';
            showErrorMessageModal = true;
            isLoading = false;
            return;
        }

        if (!clientName) {
            errorMessage = 'El nombre del cliente es requerido.';
            showErrorMessageModal = true;
            isLoading = false;
            return;
        }

        const validItems = invoiceItems.filter(item => item.description && item.quantity > 0 && item.unitPrice >= 0);
        if (validItems.length === 0) {
            errorMessage = 'Debe añadir al menos un item válido a la factura (descripción, cantidad > 0, precio >= 0).';
            showErrorMessageModal = true;
            isLoading = false;
            return;
        }

        const payload: CreateFacturaDto = {
            ruta: selectedRutaId,
            clientName,
            clientIdentification,
            clientAddress,
            clientPhone,
            clientEmail,
            items: validItems,
            tax,
            notes,
        };

        console.log('DEBUG: Creating Factura with payload:', payload);
        const response = await api.createFactura(payload);
        console.log('DEBUG: Create Factura API response:', response);

        if (response.data) {
            successMessage = `Factura ${response.data.invoiceNumber} generada con éxito.`;
            showSuccessMessageModal = true;
            // Clear form after successful creation
            selectedRutaId = undefined;
            selectedRutaDetail = null;
            clearClientInfo();
            invoiceItems = [{ description: '', quantity: 1, unitPrice: 0, total: 0 }];
            tax = 0;
            notes = '';
            generatedFacturaId = response.data._id;
            await fetchFacturas(); // Refresh the list of facturas
        } else if (response.error) {
            errorMessage = response.error;
            showErrorMessageModal = true;
        }
        isLoading = false;
    }

    function closeSuccessMessageModal() {
        showSuccessMessageModal = false;
        successMessage = '';
        generatedFacturaId = null;
    }

    function closeErrorMessageModal() {
        showErrorMessageModal = false;
        errorMessage = '';
    }

    // New functions for listing and printing existing facturas
    async function fetchFacturas() {
        isLoading = true;
        error = null;
        if (!api) {
            error = 'API client not initialized.';
            isLoading = false;
            return;
        }
        const response = await api.getAllFacturas({
            page: currentPage,
            limit: limit,
            searchTerm: searchTermList,
        });

        if (response.data) {
            facturas = response.data.items;
            totalFacturas = response.data.totalCount;
        } else if (response.error) {
            error = response.error;
        }
        isLoading = false;
    }

    function handlePageChange(event: CustomEvent<number>) {
        currentPage = event.detail;
        fetchFacturas();
    }

    function handleNextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            fetchFacturas();
        }
    }

    function handlePreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            fetchFacturas();
        }
    }

    function handleSearchList() {
        currentPage = 1; // Reset to first page on new search
        fetchFacturas();
    }

    function viewFacturaDetails(factura: Factura) {
        selectedFacturaForPrint = factura;
        showFacturaDetailsModal = true;
    }

    function closeFacturaDetailsModal() {
        showFacturaDetailsModal = false;
        selectedFacturaForPrint = null;
    }

    async function handlePrintFactura(facturaId: string | null) {
        const idToPrint = facturaId || generatedFacturaId;

        if (!idToPrint) {
            errorMessage = 'No hay una factura seleccionada o generada para imprimir.';
            showErrorMessageModal = true;
            return;
        }

        isLoading = true;
        error = null; // Clear previous errors

        let facturaToPrint: Factura | null = null;

        // If we don't have the full factura object, fetch it
        if (!selectedFacturaForPrint || (facturaId && selectedFacturaForPrint._id !== facturaId)) {
            const facturaResponse = await api.getFactura(idToPrint);
            if (facturaResponse.data) {
                facturaToPrint = facturaResponse.data;
            } else if (facturaResponse.error) {
                errorMessage = `Error al obtener detalles de la factura: ${facturaResponse.error}`;
                showErrorMessageModal = true;
                isLoading = false;
                return;
            }
        } else {
            facturaToPrint = selectedFacturaForPrint;
        }

        if (!facturaToPrint) {
            errorMessage = 'No se pudo obtener la información de la factura para imprimir.';
            showErrorMessageModal = true;
            isLoading = false;
            return;
        }

        const response = await api.generateInvoicePdf(idToPrint);

        if (response.data) {
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `factura-${facturaToPrint.invoiceNumber}.pdf`); // Use invoiceNumber for friendly filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            // If printing from details modal, close it after print.
            if (showFacturaDetailsModal) {
                closeFacturaDetailsModal();
            }
        } else if (response.error) {
            errorMessage = response.error;
            showErrorMessageModal = true;
        }
        isLoading = false;
    }

    onMount(async () => {
        api = getApiClient();
        await fetchRutasForSelect();
        await fetchFacturas(); // Fetch facturas on mount for the list view
    });
</script>

<PageTransition let:isVisible>
    <div class="page-container">
        <OperatorHeader {activeSection} />
        <AnimatedBackground {isVisible} />

        <main>
            <div class="content-section">
                <div class="tabs-container">
                    <button
                        class="tab-button {activeSection === 'generate' ? 'active' : ''}"
                        on:click={() => (activeSection = 'generate')}
                    >
                        Generar Factura
                    </button>
                    <button
                        class="tab-button {activeSection === 'list' ? 'active' : ''}"
                        on:click={() => {
                            activeSection = 'list';
                            fetchFacturas(); // Refresh list when tab is activated
                        }}
                    >
                        Listar Facturas
                    </button>
                </div>

                {#if activeSection === 'generate'}
                    <div class="header-section">
                        <h1>Generar Factura</h1>
                    </div>

                    <div class="form-grid">
                        <div class="form-group col-span-2">
                            <label for="ruta-select">Seleccionar Ruta:</label>
                            <SearchableSelect
                                items={rutas}
                                bind:value={selectedRutaId}
                                labelField="code"
                                subLabelField="concept"
                                valueField="_id"
                                placeholder="Buscar Ruta por código o concepto"
                                searchPlaceholder="Escribe para buscar..."
                                required={true}
                            >
                                <span slot="search-label">Ruta:</span>
                            </SearchableSelect>
                        </div>

                        {#if selectedRutaDetail}
                            <div class="client-info-section">
                                <h3>Información del Cliente</h3>
                                <div class="form-group">
                                    <label for="clientName">Nombre del Cliente:</label>
                                    <input type="text" id="clientName" bind:value={clientName} required />
                                </div>
                                <div class="form-group">
                                    <label for="clientIdentification">Cédula/RIF:</label>
                                    <input type="text" id="clientIdentification" bind:value={clientIdentification} />
                                </div>
                                <div class="form-group">
                                    <label for="clientAddress">Dirección:</label>
                                    <input type="text" id="clientAddress" bind:value={clientAddress} />
                                </div>
                                <div class="form-group">
                                    <label for="clientPhone">Teléfono:</label>
                                    <input type="text" id="clientPhone" bind:value={clientPhone} />
                                </div>
                                <div class="form-group">
                                    <label for="clientEmail">Email:</label>
                                    <input type="email" id="clientEmail" bind:value={clientEmail} />
                                </div>
                            </div>

                            <div class="invoice-items-section col-span-2">
                                <h3>Items de la Factura</h3>
                                {#each invoiceItems as item, index (index)}
                                    <div class="item-row">
                                        <div class="form-group item-description">
                                            <label for="item-description-{index}">Descripción:</label>
                                            <input type="text" id="item-description-{index}" bind:value={item.description} required />
                                        </div>
                                        <div class="form-group item-quantity">
                                            <label for="item-quantity-{index}">Cantidad:</label>
                                            <input type="number" id="item-quantity-{index}" bind:value={item.quantity} min="1" on:input={() => updateItemTotal(index)} required />
                                        </div>
                                        <div class="form-group item-unit-price">
                                            <label for="item-unit-price-{index}">Precio Unitario:</label>
                                            <input type="number" id="item-unit-price-{index}" bind:value={item.unitPrice} min="0" step="0.01" on:input={() => updateItemTotal(index)} required />
                                        </div>
                                        <div class="form-group item-total">
                                            <label>Total:</label>
                                            <input type="text" value={item.total.toFixed(2)} readonly class="read-only-input" />
                                        </div>
                                        {#if invoiceItems.length > 1}
                                            <button type="button" class="btn-remove-item" on:click={() => removeInvoiceItem(index)} title="Eliminar item">X</button>
                                        {/if}
                                    </div>
                                {/each}
                                <button type="button" class="btn-add-item" on:click={addInvoiceItem}>+ Añadir Item</button>
                            </div>

                            <div class="totals-section col-span-2">
                                <div class="form-group">
                                    <label for="subtotal">Subtotal:</label>
                                    <input type="text" id="subtotal" value={subtotal.toFixed(2)} readonly class="read-only-input" />
                                </div>
                                <div class="form-group">
                                    <label for="tax">Impuesto:</label>
                                    <input type="number" id="tax" bind:value={tax} min="0" step="0.01" />
                                </div>
                                <div class="form-group total-amount-display">
                                    <label for="totalAmount">Monto Total:</label>
                                    <input type="text" id="totalAmount" value={totalAmount.toFixed(2)} readonly class="read-only-input total-input" />
                                </div>
                            </div>

                            <div class="form-group col-span-2">
                                <label for="notes">Notas (Opcional):</label>
                                <textarea id="notes" bind:value={notes} rows="3"></textarea>
                            </div>

                            <div class="form-actions col-span-2">
                                <button type="submit" class="btn-primary" on:click={handleGenerateFactura} disabled={isLoading}>
                                    {isLoading ? 'Generando...' : 'Generar Factura'}
                                </button>
                                {#if generatedFacturaId}
                                    <button type="button" class="btn-secondary" on:click={() => handlePrintFactura(generatedFacturaId)} disabled={isLoading}>
                                        Imprimir Factura (PDF)
                                    </button>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {:else if activeSection === 'list'}
                    <div class="header-section">
                        <h1>Listar Facturas</h1>
                        <div class="search-container">
                            <input
                                type="text"
                                placeholder="Buscar por número de factura o cliente..."
                                bind:value={searchTermList}
                                on:input={handleSearchList}
                            />
                        </div>
                    </div>

                    {#if isLoading && facturas.length === 0}
                        <p>Cargando facturas...</p>
                    {:else if error}
                        <p class="error-message">Error: {error}</p>
                    {:else if facturas.length === 0}
                        <p>No se encontraron facturas.</p>
                    {:else}
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>No. Factura</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Ruta</th>
                                        <th>Monto Total</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each facturas as factura (factura._id)}
                                        <tr>
                                            <td>{factura.invoiceNumber}</td>
                                            <td>{new Date(factura.invoiceDate).toLocaleDateString('es-VE')}</td>
                                            <td>{factura.clientName}</td>
                                            <td>{factura.ruta?.code || 'N/A'}</td>
                                            <td>{factura.totalAmount.toFixed(2)}</td>
                                            <td>
                                                <span class="status-badge status-{factura.paymentStatus.toLowerCase()}">
                                                    {factura.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn-icon" on:click={() => viewFacturaDetails(factura)} title="Ver Detalles">
                                                    👁️
                                                </button>
                                                <button class="btn-icon" on:click={() => handlePrintFactura(factura._id)} title="Imprimir PDF">
                                                    🖨️
                                                </button>
                                                <!-- Add more action buttons like edit/delete later if needed -->
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onNextPage={handleNextPage}
                            onPreviousPage={handlePreviousPage}
                        />
                    {/if}
                {/if}
            </div>
        </main>

        <Footer />
    </div>
</PageTransition>

{#if showSuccessMessageModal}
    <div class="modal-overlay success-modal" on:click|self={closeSuccessMessageModal}>
        <div class="modal-content success-content">
            <div class="modal-header">
                <h2>Éxito</h2>
                <button class="close-button" on:click={closeSuccessMessageModal}>&times;</button>
            </div>
            <div class="modal-body">
                <p class="success-message-text">{successMessage}</p>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" on:click={closeSuccessMessageModal}>Aceptar</button>
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

{#if showFacturaDetailsModal && selectedFacturaForPrint}
    <div class="modal-overlay" on:click|self={closeFacturaDetailsModal}>
        <div class="modal-content large-modal">
            <div class="modal-header">
                <h2>Detalles de Factura #{selectedFacturaForPrint.invoiceNumber}</h2>
                <button class="close-button" on:click={closeFacturaDetailsModal}>&times;</button>
            </div>
            <div class="modal-body factura-details-modal-body">
                <div class="detail-group">
                    <strong>Fecha de Emisión:</strong> {new Date(selectedFacturaForPrint.invoiceDate).toLocaleDateString('es-VE')}
                </div>
                <div class="detail-group">
                    <strong>Estado de Pago:</strong>
                    <span class="status-badge status-{selectedFacturaForPrint.paymentStatus.toLowerCase()}">
                        {selectedFacturaForPrint.paymentStatus}
                    </span>
                </div>

                <h3>Información del Cliente</h3>
                <div class="detail-group"><strong>Nombre:</strong> {selectedFacturaForPrint.clientName}</div>
                {#if selectedFacturaForPrint.clientIdentification}
                    <div class="detail-group"><strong>Cédula/RIF:</strong> {selectedFacturaForPrint.clientIdentification}</div>
                {/if}
                {#if selectedFacturaForPrint.clientAddress}
                    <div class="detail-group"><strong>Dirección:</strong> {selectedFacturaForPrint.clientAddress}</div>
                {/if}
                {#if selectedFacturaForPrint.clientPhone}
                    <div class="detail-group"><strong>Teléfono:</strong> {selectedFacturaForPrint.clientPhone}</div>
                {/if}
                {#if selectedFacturaForPrint.clientEmail}
                    <div class="detail-group"><strong>Email:</strong> {selectedFacturaForPrint.clientEmail}</div>
                {/if}

                <h3>Detalles de la Ruta</h3>
                {#if selectedFacturaForPrint.ruta}
                    <div class="detail-group"><strong>Código de Ruta:</strong> {selectedFacturaForPrint.ruta.code}</div>
                    <div class="detail-group"><strong>Origen:</strong> {selectedFacturaForPrint.ruta.startLocation}</div>
                    <div class="detail-group"><strong>Destino:</strong> {selectedFacturaForPrint.ruta.endLocation}</div>
                    <div class="detail-group"><strong>Concepto:</strong> {selectedFacturaForPrint.ruta.concept}</div>
                    <div class="detail-group"><strong>Fecha de Inicio:</strong> {new Date(selectedFacturaForPrint.ruta.startDate).toLocaleDateString('es-VE')}</div>
                    {#if selectedFacturaForPrint.ruta.endDate}
                        <div class="detail-group"><strong>Fecha de Fin:</strong> {new Date(selectedFacturaForPrint.ruta.endDate).toLocaleDateString('es-VE')}</div>
                    {/if}
                    {#if selectedFacturaForPrint.ruta.chuto}
                        <div class="detail-group"><strong>Chuto:</strong> {selectedFacturaForPrint.ruta.chuto.plate} ({selectedFacturaForPrint.ruta.chuto.code})</div>
                    {/if}
                    {#if selectedFacturaForPrint.ruta.trailer}
                        <div class="detail-group"><strong>Trailer:</strong> {selectedFacturaForPrint.ruta.trailer.plate} ({selectedFacturaForPrint.ruta.trailer.code})</div>
                    {/if}
                    {#if selectedFacturaForPrint.ruta.conductor}
                        <div class="detail-group"><strong>Conductor:</strong> {selectedFacturaForPrint.ruta.conductor.firstName} {selectedFacturaForPrint.ruta.conductor.lastName}</div>
                    {/if}
                    {#if selectedFacturaForPrint.ruta.auxiliar}
                        <div class="detail-group"><strong>Auxiliar:</strong> {selectedFacturaForPrint.ruta.auxiliar.firstName} {selectedFacturaForPrint.ruta.auxiliar.lastName}</div>
                    {/if}
                {:else}
                    <div class="detail-group">No hay detalles de ruta disponibles.</div>
                {/if}

                <h3>Conceptos Facturados</h3>
                {#if selectedFacturaForPrint.items && selectedFacturaForPrint.items.length > 0}
                    <div class="items-table-modal">
                        <table>
                            <thead>
                                <tr>
                                    <th>Descripción</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unitario</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each selectedFacturaForPrint.items as item}
                                    <tr>
                                        <td>{item.description}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unitPrice.toFixed(2)}</td>
                                        <td>{item.total.toFixed(2)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <p>No hay ítems facturados.</p>
                {/if}

                <div class="totals-modal">
                    <div class="detail-group"><strong>Subtotal:</strong> {selectedFacturaForPrint.subtotal.toFixed(2)}</div>
                    <div class="detail-group"><strong>Impuesto:</strong> {selectedFacturaForPrint.tax?.toFixed(2) || '0.00'}</div>
                    <div class="detail-group total-amount-display"><strong>Monto Total:</strong> {selectedFacturaForPrint.totalAmount.toFixed(2)}</div>
                </div>

                {#if selectedFacturaForPrint.notes}
                    <h3>Notas</h3>
                    <p>{selectedFacturaForPrint.notes}</p>
                {/if}
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" on:click={() => selectedFacturaForPrint && handlePrintFactura(selectedFacturaForPrint._id)} disabled={isLoading}>
                    {isLoading ? 'Generando PDF...' : 'Imprimir Factura (PDF)'}
                </button>
                <button class="btn-primary" on:click={closeFacturaDetailsModal}>Cerrar</button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Variables de estilo globales */
    :global(:root) {
        --dark-blue: #1a237e;
        --medium-blue: #283593;
        --light-blue: #3949ab;
        --accent-blue: #42a5f5;
        --white: #ffffff;
        --gray-100: #f3f4f6;
        --gray-200: #e5e7eb;
        --gray-300: #d1d5db;
        --gray-400: #9ca3af;
        --gray-500: #6b7280;
        --gray-600: #4b5563;
        --gray-700: #374151;
        --gray-800: #1f2937;
        --gray-900: #111827;

        --green-success: #10b981;
        --red-error: #ef4444;
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
        max-width: 1000px; /* Increased max-width for invoice form */
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
    }

    h1 {
        color: var(--gray-900);
        font-size: 2rem;
        margin: 0;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    .form-group {
        margin-bottom: 0;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--gray-700);
        font-weight: 500;
    }

    .form-group input,
    .form-group textarea,
    .form-group .read-only-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--gray-300);
        border-radius: 0.5rem;
        font-size: 1rem;
        color: var(--gray-900);
        background-color: var(--white);
        box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        border-color: var(--accent-blue);
        outline: none;
        box-shadow: 0 0 0 2px rgba(66, 165, 245, 0.2);
    }

    .read-only-input {
        background-color: var(--gray-100);
        color: var(--gray-600);
        cursor: not-allowed;
    }

    .col-span-2 {
        grid-column: span 2;
    }

    .client-info-section, .invoice-items-section, .totals-section {
        padding: 1.5rem;
        border: 1px solid var(--gray-200);
        border-radius: 0.75rem;
        background-color: var(--gray-50);
    }

    .client-info-section h3, .invoice-items-section h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: var(--dark-blue);
        font-size: 1.25rem;
    }

    .item-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr auto;
        gap: 1rem;
        align-items: flex-end;
        margin-bottom: 1rem;
    }

    .item-row .form-group {
        margin-bottom: 0;
    }

    .item-row .item-description {
        grid-column: span 1;
    }

    .item-row .item-quantity, .item-row .item-unit-price, .item-row .item-total {
        grid-column: span 1;
    }

    .btn-remove-item {
        background-color: var(--red-error);
        color: var(--white);
        border: none;
        border-radius: 0.5rem;
        width: 38px; /* Approx height of input */
        height: 38px; /* Approx height of input */
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
        margin-bottom: 0.5rem; /* Align with input bottom */
    }

    .btn-remove-item:hover {
        background-color: #cc0000;
    }

    .btn-add-item {
        background-color: var(--light-blue);
        color: var(--white);
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
        margin-top: 1rem;
    }

    .btn-add-item:hover {
        background-color: var(--medium-blue);
    }

    .totals-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.75rem;
        background-color: var(--gray-50);
        border: 1px solid var(--gray-200);
        border-radius: 0.75rem;
        padding: 1.5rem;
    }

    .totals-section .form-group {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 1rem;
        width: 100%;
        max-width: 300px; /* Limit width of total inputs */
    }

    .totals-section .form-group label {
        width: 100px; /* Fixed width for labels */
        text-align: right;
        margin-bottom: 0;
    }

    .totals-section .form-group input {
        flex-grow: 1;
    }

    .total-amount-display {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--dark-blue);
        border-top: 1px solid var(--gray-300);
        padding-top: 1rem;
        margin-top: 0.5rem;
    }

    .total-amount-display input {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--dark-blue);
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    .btn-primary {
        background-color: var(--accent-blue);
        color: var(--white);
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border: none;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: var(--medium-blue);
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Modal styles (from other pages, ensuring consistency) */
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
        max-width: 500px;
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.75rem;
        color: var(--gray-900);
    }

    .modal-header .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--gray-600);
    }

    .modal-body {
        margin-bottom: 1.5rem;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    /* Success Modal specific styles */
    .success-modal .modal-content {
        border: 2px solid var(--green-success);
    }

    .success-modal .modal-header {
        background-color: var(--green-success);
        color: var(--white);
        border-radius: 1rem 1rem 0 0;
        padding: 1rem 1.5rem;
    }

    .success-modal .modal-header h2, .success-modal .modal-header .close-button {
        color: var(--white);
    }

    .success-message-text {
        color: var(--gray-900);
        font-size: 1.1rem;
        text-align: center;
    }

    /* Error Modal specific styles */
    .error-modal .modal-content {
        border: 2px solid var(--red-error);
    }

    .error-modal .modal-header {
        background-color: var(--red-error);
        color: var(--white);
        border-radius: 1rem 1rem 0 0;
        padding: 1rem 1.5rem;
    }

    .error-modal .modal-header h2, .error-modal .modal-header .close-button {
        color: var(--white);
    }

    .error-message-text {
        color: var(--gray-900);
        font-size: 1.1rem;
        text-align: center;
    }

    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        .col-span-2 {
            grid-column: span 1;
        }
        .item-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }
        .item-row .btn-remove-item {
            width: 100%;
            height: auto;
            padding: 0.5rem;
        }
        .totals-section .form-group {
            max-width: 100%;
            justify-content: space-between;
        }
        .totals-section .form-group label {
            width: auto;
            text-align: left;
        }
    }

    /* New styles for tabs and invoice list */
    .tabs-container {
        display: flex;
        margin-bottom: 2rem;
        border-bottom: 2px solid var(--gray-200);
    }

    .tab-button {
        padding: 0.75rem 1.5rem;
        border: none;
        background-color: transparent;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--gray-600);
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
        margin-bottom: -2px; /* Compensate for border-bottom */
    }

    .tab-button:hover {
        color: var(--dark-blue);
    }

    .tab-button.active {
        color: var(--dark-blue);
        border-color: var(--accent-blue);
        font-weight: 600;
    }

    .table-container {
        overflow-x: auto;
        margin-top: 1.5rem;
        background-color: var(--white);
        border-radius: 0.75rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 1px solid var(--gray-200);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        min-width: 700px; /* Ensure table is not too squished on smaller screens */
    }

    th,
    td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--gray-200);
    }

    th {
        background-color: var(--gray-50);
        color: var(--gray-700);
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.85rem;
    }

    tbody tr:last-child td {
        border-bottom: none;
    }

    tbody tr:hover {
        background-color: var(--gray-100);
    }

    .status-badge {
        display: inline-block;
        padding: 0.3em 0.6em;
        border-radius: 9999px; /* Pill shape */
        font-size: 0.75em;
        font-weight: 700;
        color: var(--white);
        text-transform: capitalize;
    }

    .status-badge.status-pendiente {
        background-color: #f59e0b; /* Amber */
    }

    .status-badge.status-pagado {
        background-color: var(--green-success);
    }

    .status-badge.status-anulado {
        background-color: var(--red-error);
    }

    .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        margin: 0 0.25rem;
        padding: 0.5rem;
        border-radius: 0.5rem;
        transition: background-color 0.2s ease;
    }

    .btn-icon:hover {
        background-color: var(--gray-200);
    }

    .search-container {
        margin-bottom: 1rem;
    }

    .search-container input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--gray-300);
        border-radius: 0.5rem;
        font-size: 1rem;
    }

    /* Modal for Factura Details */
    .large-modal {
        max-width: 700px; /* Wider modal for details */
    }

    .factura-details-modal-body {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .factura-details-modal-body h3 {
        grid-column: span 2; /* Span full width */
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        color: var(--dark-blue);
        font-size: 1.1rem;
        border-bottom: 1px solid var(--gray-200);
        padding-bottom: 0.5rem;
    }

    .detail-group {
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
    }

    .detail-group strong {
        color: var(--gray-700);
        margin-right: 0.5rem;
    }

    .items-table-modal {
        grid-column: span 2; /* Full width for items table */
        margin-top: 1rem;
        border: 1px solid var(--gray-200);
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .items-table-modal table {
        width: 100%;
        border-collapse: collapse;
    }

    .items-table-modal th,
    .items-table-modal td {
        padding: 0.75rem;
        border-bottom: 1px solid var(--gray-200);
        text-align: left;
    }

    .items-table-modal th {
        background-color: var(--gray-50);
    }

    .items-table-modal tbody tr:last-child td {
        border-bottom: none;
    }

    .totals-modal {
        grid-column: span 2; /* Full width for totals */
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        border-top: 1px solid var(--gray-200);
        padding-top: 1rem;
        margin-top: 1rem;
        gap: 0.5rem;
    }

    .totals-modal .detail-group {
        width: 100%;
        max-width: 250px;
        display: flex;
        justify-content: space-between;
    }

    .totals-modal .total-amount-display {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--dark-blue);
    }
</style> 