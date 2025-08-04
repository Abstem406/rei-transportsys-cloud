<script lang="ts">
  import AdminHeader from '$lib/components/AdminHeader.svelte';
  import { onMount } from 'svelte';
  
  let activeSection = 'inicio';
  let userInfo: { name?: string, email: string } | null = null;

  onMount(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      userInfo = JSON.parse(userStr);
    }
  });

  function handleNavigationChange(event: CustomEvent<string>) {
    activeSection = event.detail;
  }
</script>

<div class="admin-dashboard">
  <AdminHeader 
    {activeSection} 
    on:navigationChange={handleNavigationChange}
  />

  <main>
    <div class="welcome-section">
      <h1>
        Bienvenido, {#if userInfo?.name}
          {userInfo.name}
        {:else if userInfo?.email}
          {userInfo.email}
        {:else}
          Administrador
        {/if}
      </h1>
      <p>Panel de administración del sistema de transporte</p>
    </div>
  </main>
</div>

<style>
  .admin-dashboard {
    min-height: 100vh;
    background-color: #f3f4f6;
    padding-top: 4rem;
    margin: 0;
    border: none;
  }

  main {
    flex: 1;
    border: none;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }

  .welcome-section {
    background-color: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .welcome-section h1 {
    color: var(--gray-900);
    font-size: 2rem;
    margin: 0 0 1rem 0;
    font-weight: bold;
  }

  .welcome-section p {
    color: var(--gray-600);
    font-size: 1.1rem;
    margin: 0;
  }

  .admin-footer {
    background-color: var(--dark-blue);
    color: var(--white);
    padding: 1rem 0;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    text-align: center;
  }

  .footer-content p {
    margin: 0;
    opacity: 0.8;
  }
</style> 