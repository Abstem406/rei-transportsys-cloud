<script lang="ts">
  import { onMount } from 'svelte';
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { api, type User } from '$lib/api/ApiClient';
  import Pagination from '$lib/components/Pagination.svelte';

  let users: User[] = [];
  let isLoading = true;
  let error: string | null = null;
  let activeSection = 'usuarios';
  let searchTerm = '';
  let showModal = false;
  let showConfirmModal = false;
  let selectedUser: User | null = null;
  let isEditing = false;
  let editedUser: Partial<User> & { password?: string } = {};
  let isDeleting = false;
  let userToDelete: { id: string; displayName: string; } | null = null;
  let showCreateModal = false;
  let newUser = {
    name: '',
    email: '',
    password: '',
    role: 'user' as const
  };
  let isCreating = false;
  let selectedRole = ''; // '' for all roles, 'user', 'admin', 'operator'

  // Pagination
  let currentPage = 1;
  let usersPerPage = 10;
  let totalPages = 0;

  // Reactive variable for filtered users
  let filteredUsers: User[] = [];

  // Reactive block to reset currentPage when searchTerm changes
  $: searchTerm, selectedRole, currentPage = 1;

  // Reactive block for filtering and calculating total pages
  $: {
    filteredUsers = users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearchTerm = (
        user.email.toLowerCase().includes(searchLower) ||
        (user.name?.toLowerCase() || '').includes(searchLower)
      );
      const matchesRole = selectedRole === '' || user.role === selectedRole;
      return matchesSearchTerm && matchesRole;
    });

    totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (currentPage > totalPages) {
      currentPage = totalPages || 1;
    }
  }

  // Reactive block for pagination
  $: paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function handleUserClick(user: User) {
    selectedUser = user;
    editedUser = { ...user };
    showModal = true;
    isEditing = false;
  }

  function closeModal() {
    showModal = false;
    selectedUser = null;
    isEditing = false;
  }

  function handleDeleteClick(user: User) {
    userToDelete = {
      id: user._id,
      displayName: user.name || user.email
    };
    showConfirmModal = true;
  }

  async function handleDelete() {
    if (!userToDelete?.id) return;
    
    try {
      isDeleting = true;
      const response = await api.deleteUser(userToDelete.id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      users = users.filter(u => u._id !== userToDelete?.id);
      showConfirmModal = false;
      closeModal();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al eliminar usuario';
    } finally {
      isDeleting = false;
      userToDelete = null;
    }
  }

  async function handleSave() {
    if (!selectedUser?._id || !editedUser) return;
    
    try {
      const response = await api.updateUser(selectedUser._id, editedUser);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        users = users.map(u => u._id === selectedUser?._id ? response.data! : u);
        isEditing = false;
        selectedUser = response.data;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al actualizar usuario';
    }
  }

  async function handleCreateUser() {
    try {
      isCreating = true;
      const response = await api.createUser(newUser);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        users = [...users, response.data];
        showCreateModal = false;
        newUser = { name: '', email: '', password: '', role: 'user' };
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al crear usuario';
    } finally {
      isCreating = false;
    }
  }

  onMount(async () => {
    console.log('🔵 Página montada, iniciando carga');
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        window.location.href = '/';
        return;
      }

      api.setToken(token);
      await loadUsers();
      console.log('✅ Carga completa');
    } catch (e) {
      console.error('❌ Error en carga:', e);
      error = e instanceof Error ? e.message : 'Error desconocido';
    }
  });

  async function loadUsers() {
    console.log('🔄 Iniciando carga de usuarios');
    try {
      const response = await api.getUsers(selectedRole === '' ? undefined : selectedRole);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        users = response.data;
        console.log('✅ Usuarios cargados:', users.length);
      }
    } catch (err) {
      console.error('❌ Error cargando usuarios:', err);
      throw err;
    } finally {
      isLoading = false;
      console.log('🏁 Carga finalizada');
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<PageTransition let:isVisible>
  <div class="page-container">
    <OperatorHeader {activeSection} />
    <AnimatedBackground {isVisible} />
    
    <main>
      <div class="content-section">
        <div class="header-section">
          <div class="title-section">
            <h1>Gestión de Usuarios</h1>
            <button class="button primary create-button" on:click={() => showCreateModal = true}>
              <span class="icon">+</span>
              Crear Usuario
            </button>
          </div>
          <div class="search-box">
            <input
              type="text"
              bind:value={searchTerm}
              placeholder="Buscar por nombre o email..."
              class="search-input"
            />
          </div>
        </div>

        <div class="filter-section">
          <label for="role-filter" class="filter-label">Filtrar por Rol:</label>
          <select id="role-filter" bind:value={selectedRole} class="filter-select">
            <option value="">Todos los Roles</option>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
            <option value="operator">Operador</option>
          </select>
        </div>

        {#if error}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {error}
          </div>
        {/if}

        {#if isLoading}
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Cargando usuarios...</p>
          </div>
        {:else}
          <div class="users-grid">
            {#each paginatedUsers as user (user._id)}
              <div class="user-card" on:click={() => handleUserClick(user)}>
                <div class="user-avatar">
                  {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <div class="user-info">
                  <h3>{user.name || 'Sin nombre'}</h3>
                  <p class="email">{user.email}</p>
                  <p class="date">Registrado: {formatDate(user.createdAt)}</p>
                </div>
              </div>
            {:else}
              <div class="no-results">
                {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
              </div>
            {/each}
          </div>
        {/if}

        {#if !isLoading && totalPages > 1}
          <Pagination 
            {currentPage}
            {totalPages}
            onNextPage={nextPage}
            onPreviousPage={previousPage}
          />
        {/if}
      </div>
    </main>

    {#if showModal && selectedUser}
      <div class="modal-backdrop" on:click={closeModal}>
        <div class="modal-content" on:click|stopPropagation>
          <div class="modal-header">
            <h2>{isEditing ? 'Editar Usuario' : 'Detalles del Usuario'}</h2>
            <button class="close-button" on:click={closeModal}>&times;</button>
          </div>
          
          <div class="modal-body">
            {#if isEditing}
              <div class="form-group">
                <label for="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  bind:value={editedUser.name}
                  placeholder="Nombre del usuario"
                />
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  bind:value={editedUser.email}
                  placeholder="Email del usuario"
                />
              </div>
              <div class="form-group">
                <label for="password">Nueva Contraseña (dejar en blanco para mantener la actual)</label>
                <input
                  type="password"
                  id="password"
                  bind:value={editedUser.password}
                  placeholder="Nueva contraseña"
                />
              </div>
            {:else}
              <div class="user-details">
                <p><strong>Nombre:</strong> {selectedUser.name || 'Sin nombre'}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Rol:</strong> {selectedUser.role}</p>
                <p><strong>Fecha de registro:</strong> {formatDate(selectedUser.createdAt)}</p>
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
                  if (selectedUser) handleDeleteClick(selectedUser);
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

    {#if showConfirmModal && userToDelete}
      <div class="modal-backdrop confirm-modal" on:click={() => showConfirmModal = false}>
        <div class="modal-content confirm-content" on:click|stopPropagation>
          <div class="modal-header">
            <h2>Confirmar Eliminación</h2>
            <button class="close-button" on:click={() => showConfirmModal = false}>&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="confirm-message">
              <span class="warning-icon">⚠️</span>
              <p>¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete.displayName}</strong>?</p>
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
      <div class="modal-backdrop" on:click={() => showCreateModal = false}>
        <div class="modal-content" on:click|stopPropagation>
          <div class="modal-header">
            <h2>Crear Nuevo Usuario</h2>
            <button class="close-button" on:click={() => showCreateModal = false}>&times;</button>
          </div>
          
          <div class="modal-body">
            <form on:submit|preventDefault={handleCreateUser}>
              <div class="form-group">
                <label for="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  bind:value={newUser.name}
                  placeholder="Nombre del usuario"
                  required
                />
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  bind:value={newUser.email}
                  placeholder="Email del usuario"
                  required
                />
              </div>

              <div class="form-group">
                <label for="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  bind:value={newUser.password}
                  placeholder="Contraseña del usuario"
                  required
                />
              </div>

              <div class="form-group">
                <label for="role">Rol</label>
                <select id="role" bind:value={newUser.role}>
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button 
              class="button secondary" 
              on:click={() => showCreateModal = false}
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button 
              class="button primary" 
              on:click={handleCreateUser}
              disabled={isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <Footer />
  </div>
</PageTransition>

<style>
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
  }

  h1 {
    color: var(--gray-900);
    font-size: 2rem;
    margin: 0;
  }

  .search-box {
    flex: 0 1 300px;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background-color: white;
    font-size: 1rem;
    transition: all 0.3s ease;
    color: black;
  }

  .search-input::placeholder {
    color: black;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--light-blue);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .user-card {
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

  .user-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .user-avatar {
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

  .user-info {
    flex: 1;
  }

  .user-info h3 {
    margin: 0;
    color: var(--gray-900);
    font-size: 1.1rem;
  }

  .user-info .email {
    color: var(--gray-600);
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  .user-info .date {
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
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .header-section {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .search-box {
      flex: none;
    }

    .users-grid {
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

  .user-details p {
    margin: 0.5rem 0;
    color: var(--gray-700);
  }

  .user-details strong {
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

  .form-group input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  .form-group input:focus {
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

  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
    background-color: white;
    color: black !important;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2C197.942L146.2%2C57.143L5.4%2C197.942h281.6z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 0.7em top 50%;
    background-size: 0.65em auto;
    padding-right: 2em;
  }

  select option {
    background-color: white;
    color: black !important;
  }

  select:focus {
    outline: none;
    border-color: var(--light-blue);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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

  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .filter-section {
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .filter-label {
    color: var(--gray-700);
    font-weight: 500;
  }

  .filter-select {
    flex: 1;
    max-width: 200px;
  }
</style> 