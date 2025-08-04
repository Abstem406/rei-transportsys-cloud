<script lang="ts">
  import { onMount } from 'svelte';
  import { API_URL } from '$lib/config';
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';

  interface User {
    _id: string;
    email: string;
    name?: string;
    role: 'user' | 'admin' | 'operator';
    createdAt: string;
  }

  let users: User[] = [];
  let isLoading = true;
  let error: string | null = null;
  let activeSection = 'usuarios';

  onMount(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    await loadUsers();
  });

  async function loadUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar usuarios');
      }

      users = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="page-container">
  <OperatorHeader {activeSection} />
  
  <main>
    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    {#if isLoading}
      <div class="loading">Cargando...</div>
    {:else}
      <pre>{JSON.stringify(users, null, 2)}</pre>
    {/if}
  </main>

  <footer>
    <p>© 2024 TransportSys. Todos los derechos reservados.</p>
  </footer>
</div>

<style>
  .page-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 6rem auto 2rem auto;
  }

  pre {
    background: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }

  .error-message {
    background-color: #fee2e2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--gray-600);
  }

  footer {
    background-color: var(--gray-900);
    color: white;
    text-align: center;
    padding: 1rem;
    margin-top: auto;
  }

  @media (max-width: 640px) {
    main {
      padding: 1rem;
      margin-top: 5rem;
    }
  }
</style> 