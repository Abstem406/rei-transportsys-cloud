<script lang="ts">
  import { goto } from '$app/navigation';
  export let activeSection: string = 'inicio';
  let showSidebar: boolean = false; // State to control sidebar visibility

  function toggleSidebar() {
    showSidebar = !showSidebar;
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  async function handleNavigation(section: string, path: string) {
    activeSection = section;
    showSidebar = false; // Close sidebar on navigation
    await goto(path);
  }

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<header class="operator-header">
  <nav class="header-content">
    <div class="logo-section">
      <a href="/operator">TransportSys</a>
    </div>
    <button class="menu-toggle" on:click={toggleSidebar} aria-label="Toggle menu">
      <span class="hamburger"></span>
      <span class="hamburger"></span>
      <span class="hamburger"></span>
    </button>
    <div class="navigation {showSidebar ? 'active' : ''}">
      <a 
        href="/operator"
        class="nav-link {activeSection === 'inicio' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('inicio', '/operator')}
      >
        Inicio
      </a>
      <a 
        href="/operator/usuarios"
        class="nav-link {activeSection === 'usuarios' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('usuarios', '/operator/usuarios')}
      >
        Gestión de Usuarios
      </a>
      <a 
        href="/operator/empleados"
        class="nav-link {activeSection === 'empleados' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('empleados', '/operator/empleados')}
      >
        Gestión de Empleados
      </a>
      <a 
        href="/operator/vehiculos"
        class="nav-link {activeSection === 'vehiculos' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('vehiculos', '/operator/vehiculos')}
      >
        Gestión de Vehículos
      </a>
      <a 
        href="/operator/propietarios"
        class="nav-link {activeSection === 'propietarios' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('propietarios', '/operator/propietarios')}
      >
        Gestión de Propietarios
      </a>
      <a 
        href="/operator/rutas"
        class="nav-link {activeSection === 'rutas' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('rutas', '/operator/rutas')}
      >
        Gestión de Rutas
      </a>
      <a 
        href="/operator/pagos"
        class="nav-link {activeSection === 'pagos' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('pagos', '/operator/pagos')}
      >
        Gestión de Pagos
      </a>
      <a 
        href="/operator/facturas"
        class="nav-link {activeSection === 'facturas' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('facturas', '/operator/facturas')}
      >
        Gestión de Facturas
      </a>
      <a 
        href="/operator/reportes"
        class="nav-link {activeSection === 'reportes' ? 'active' : ''}" 
        on:click|preventDefault={() => handleNavigation('reportes', '/operator/reportes')}
      >
        Reportes
      </a>
      <button class="logout-button mobile-only" on:click={handleLogout}>
        Cerrar Sesión
      </button>
    </div>
    <button class="logout-button desktop-only" on:click={handleLogout}>
      Cerrar Sesión
    </button>
  </nav>
</header>

<style>
  .operator-header {
    background-color: var(--light-blue);
    padding: 1rem 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    height: 4rem;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 1000;
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

  .logo-section a {
    color: white;
    text-decoration: none;
    font-size: 1.5rem;
    font-weight: bold;
    transition: color 0.3s ease;
  }

  .logo-section a:hover {
    color: var(--accent-blue);
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
    padding: 0.5rem;
  }

  .nav-link:hover {
    color: var(--accent-blue);
  }

  .nav-link.active {
    color: var(--accent-blue);
  }

  .logout-button {
    background: none;
    border: 1px solid white;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
  }

  .logout-button:hover {
    background-color: white;
    color: var(--light-blue);
  }

  /* Sidebar styles */
  @media (max-width: 768px) {
    .menu-toggle {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      width: 30px;
      height: 25px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      z-index: 1001;
    }

    .hamburger {
      width: 100%;
      height: 3px;
      background-color: white;
      border-radius: 2px;
      transition: all 0.3s linear;
      position: relative;
      transform-origin: 1px;
    }

    .navigation {
      position: fixed;
      top: 0;
      left: -100%; /* Hidden by default */
      width: 250px;
      height: 100vh;
      background-color: var(--dark-blue); /* Darker background for sidebar */
      flex-direction: column;
      padding: 2rem 1rem;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
      transition: left 0.3s ease-in-out;
      z-index: 999;
      justify-content: flex-start; /* Align items to the top */
      gap: 1rem;
    }

    .navigation.active {
      left: 0; /* Show sidebar */
    }

    .nav-link {
      color: var(--white);
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      text-align: left;
      width: 100%;
    }

    .nav-link:hover {
      background-color: var(--medium-blue);
      color: var(--white);
    }

    .nav-link.active {
      background-color: var(--accent-blue);
      color: var(--white);
    }

    .logout-button.desktop-only {
      display: none;
    }

    .logout-button.mobile-only {
      display: block;
      width: 100%;
      margin-top: 2rem;
      background-color: #dc2626;
      border: none;
      color: white;
    }

    .logout-button.mobile-only:hover {
      background-color: #b91c1c;
      color: white;
    }
  }

  @media (min-width: 769px) {
    .menu-toggle {
      display: none; /* Hide hamburger on larger screens */
    }
    .logout-button.mobile-only {
      display: none;
    }
  }

  @media (max-width: 1024px) {
    .header-content {
      padding: 0 1rem;
    }

    .navigation {
      gap: 1rem;
    }
  }

  @media (max-width: 768px) {
    .operator-header {
      height: auto;
      padding: 1rem;
    }

    .header-content {
      flex-direction: row; /* Keep logo and hamburger in a row */
      justify-content: space-between;
      align-items: center;
    }
  }

  @media (max-width: 640px) {
    .logo-section a {
      font-size: 1.2rem;
    }
  }
</style> 