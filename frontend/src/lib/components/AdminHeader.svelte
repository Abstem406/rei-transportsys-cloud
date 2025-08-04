<script lang="ts">
  import { goto } from '$app/navigation';
  export let activeSection: string = 'inicio';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  async function handleNavigation(section: string, path: string) {
    activeSection = section;
    await goto(path);
  }

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<header class="admin-header">
  <div class="header-content">
    <div class="logo-section">
      <h1>Panel de Administración</h1>
    </div>
    <nav class="navigation">
      <a 
        href="/admin"
        class="nav-link {activeSection === 'inicio' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('inicio', '/admin')}
      >
        Inicio
      </a>
      <a 
        href="/admin/usuarios"
        class="nav-link {activeSection === 'usuarios' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('usuarios', '/admin/usuarios')}
      >
        Gestión de Usuarios
      </a>
      <a 
        href="/admin/vehiculos"
        class="nav-link {activeSection === 'vehiculos' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('vehiculos', '/admin/vehiculos')}
      >
        Gestión de Vehículos
      </a>
    </nav>
    <button class="logout-button" on:click={handleLogout}>
      Cerrar Sesión
    </button>
  </div>
</header>

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

  .admin-header {
    background-color: var(--light-blue);
    color: var(--white);
    padding: 1rem 2rem;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 10;
    height: 4rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    height: 100%;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
  }

  .logo-section h1 {
    color: var(--white);
    font-size: 1.5rem;
    margin: 0;
    font-weight: bold;
  }

  .navigation {
    display: flex;
    gap: 2rem;
    flex-grow: 1;
    justify-content: center;
  }

  .nav-link {
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .nav-link:hover {
    color: var(--accent-blue);
  }

  .nav-link.active {
    color: var(--accent-blue);
  }

  .logout-button {
    background: none;
    color: white;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: color 0.3s ease;
    padding: 0;
  }

  .logout-button:hover {
    color: var(--accent-blue);
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 0.5rem;
    }

    .navigation {
      flex-direction: column;
      width: 100%;
      gap: 1rem;
    }

    .nav-link {
      width: 100%;
      text-align: center;
    }

    .logout-button {
      width: 100%;
      text-align: center;
      padding: 0.5rem;
    }
  }
</style> 