<script lang="ts">
  export let currentPage: number;
  export let totalPages: number;
  export let onNextPage: () => void;
  export let onPreviousPage: () => void;
</script>

<div class="pagination">
  <button 
    class="button secondary" 
    on:click={onPreviousPage} 
    disabled={currentPage === 1}
  >
    Anterior
  </button>
  <span class="page-info">
    Página {currentPage} de {totalPages}
  </span>
  <button 
    class="button secondary" 
    on:click={onNextPage} 
    disabled={currentPage === totalPages}
  >
    Siguiente
  </button>
</div>

<style>
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
</style> 