<script>
  import { onMount, tick } from 'svelte';
  
  let isVisible = false;
  let componentMounted = false;
  
  $: console.log('PageTransition estado:', { isVisible, componentMounted });

  onMount(() => {
    console.log('🔄 PageTransition iniciando montaje');
    componentMounted = true;
    
    // Esperamos a que el DOM esté completamente actualizado
    tick().then(() => {
      console.log('🔄 PageTransition esperando tick');
      
      // Pequeño retraso para asegurar que todo esté listo
      setTimeout(() => {
        console.log('🔄 PageTransition activando visibilidad');
        isVisible = true;
      }, 50);
    });

    return () => {
      console.log('🔄 PageTransition desmontado');
    };
  });
</script>

<div 
  class="page-transition {isVisible ? 'visible' : ''}"
  data-mounted={componentMounted}
  data-visible={isVisible}
>
  <slot {isVisible} />
</div>

<style>
  .page-transition {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease-out;
    will-change: opacity, transform;
  }

  .page-transition.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style> 