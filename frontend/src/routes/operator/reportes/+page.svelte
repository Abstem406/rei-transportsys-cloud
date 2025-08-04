<script lang="ts">
  import OperatorHeader from '$lib/components/operator/OperatorHeader.svelte';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let activeSection = 'reportes'; // Highlight the current section in the header
  let isLoading = false; // Example state
  let error: string | null = null; // Example state
</script>

<PageTransition let:isVisible>
  <div class="page-container">
    <OperatorHeader {activeSection} />
    <AnimatedBackground {isVisible} />
    
    <main>
      <div class="content-section">
        <div class="header-section">
          <div class="title-section">
            <h1>Gestión de Reportes</h1>
            <!-- Add buttons for creating reports or other actions here -->
          </div>
          <!-- Add search or filter components here if needed -->
        </div>

        {#if error}
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            {error}
          </div>
        {:else if isLoading}
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Cargando reportes...</p>
          </div>
        {:else}
          <!-- Content for displaying reports will be here -->
          <div class="no-results">
            <p>Aquí se mostrará la lista de reportes.</p>
            <p>Puedes empezar a añadir la lógica para cargar y mostrar tus reportes aquí.</p>
          </div>
        {/if}
      </div>
    </main>

    <Footer />
  </div>
</PageTransition>

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
</style> 