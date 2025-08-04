<script>
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/stores';

  // No mostrar el header en rutas protegidas
  $: showHeader = !$page.url.pathname.startsWith('/operator') && 
                  !$page.url.pathname.startsWith('/admin') && 
                  !$page.url.pathname.startsWith('/user');
</script>

<div class="app">
  {#if showHeader}
    <Header />
  {/if}
  <main>
    <slot />
  </main>
  <Footer />
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
    width: 100%;
  }
</style> 