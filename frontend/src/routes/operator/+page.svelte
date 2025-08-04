<script lang="ts">
  import { onMount } from 'svelte';
  import { API_URL } from '$lib/config';
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  
  interface User {
    email: string;
    role: string;
  }

  let user: User | null = null;
  let isLoading = true;
  let error: string | null = null;
  let activeSection = 'inicio';

  onMount(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Sesión inválida');
      }

      const data = await response.json();
      user = data.user;
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Error desconocido';
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } finally {
      isLoading = false;
    }
  });

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
</script>

<PageTransition let:isVisible>
  <div class="operator-dashboard">
    <AnimatedBackground {isVisible} />
    <OperatorHeader {activeSection} />

    <main>
      {#if isLoading}
        <div class="loading">Cargando...</div>
      {:else if error}
        <div class="error">{error}</div>
      {:else}
        <div class="welcome-section">
          <h2>Bienvenido, {user?.email}</h2>
          <p>Panel de control del operador</p>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-card">
            <h3>Usuarios Activos</h3>
            <p class="card-value">0</p>
            <p class="card-description">Total de usuarios registrados</p>
          </div>

          <div class="dashboard-card">
            <h3>Vehículos</h3>
            <p class="card-value">0</p>
            <p class="card-description">Vehículos en servicio</p>
          </div>

          <div class="dashboard-card">
            <h3>Rutas Activas</h3>
            <p class="card-value">0</p>
            <p class="card-description">Rutas en operación</p>
          </div>

          <div class="dashboard-card">
            <h3>Reportes</h3>
            <p class="card-value">0</p>
            <p class="card-description">Reportes pendientes</p>
          </div>
        </div>

        <div class="quick-actions">
          <h3>Acciones Rápidas</h3>
          <div class="actions-grid">
            <a href="/operator/usuarios" class="action-button">
              <span class="action-icon">👥</span>
              <span>Gestionar Usuarios</span>
            </a>
            <a href="/operator/empleados" class="action-button">
              <span class="action-icon">💼</span>
              <span>Gestionar Empleados</span>
            </a>
            <a href="/operator/vehiculos" class="action-button">
              <span class="action-icon">🚌</span>
              <span>Gestionar Vehículos</span>
            </a>
            <a href="/operator/rutas" class="action-button">
              <span class="action-icon">🗺️</span>
              <span>Gestionar Rutas</span>
            </a>
            <a href="/operator/reportes" class="action-button">
              <span class="action-icon">📊</span>
              <span>Ver Reportes</span>
            </a>
          </div>
        </div>
      {/if}
    </main>
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

  .operator-dashboard {
    min-height: 100vh;
  }

  main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 6rem;
  }

  .welcome-section {
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  .welcome-section h2 {
    color: var(--gray-900);
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
  }

  .welcome-section p {
    color: var(--gray-600);
    margin: 0;
    font-size: 1.1rem;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .dashboard-card {
    background: rgba(255, 255, 255, 0.95);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    transition: transform 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .dashboard-card:hover {
    transform: translateY(-2px);
    border-color: var(--accent-blue);
  }

  .dashboard-card h3 {
    color: var(--gray-700);
    font-size: 1rem;
    margin: 0 0 1rem 0;
  }

  .card-value {
    color: var(--dark-blue);
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
  }

  .card-description {
    color: var(--gray-600);
    font-size: 0.9rem;
    margin: 0.5rem 0 0 0;
  }

  .quick-actions {
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  .quick-actions h3 {
    color: var(--gray-900);
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-button {
    background: var(--white);
    border: 1px solid var(--gray-300);
    padding: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: var(--gray-700);
  }

  .action-button:hover {
    background: var(--light-blue);
    color: var(--white);
    border-color: var(--light-blue);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(57, 73, 171, 0.2);
  }

  .action-icon {
    font-size: 1.5rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--white);
  }

  .error {
    background-color: #fee2e2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    .welcome-section {
      padding: 1.5rem;
    }

    .welcome-section h2 {
      font-size: 1.5rem;
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 