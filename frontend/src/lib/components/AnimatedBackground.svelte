<script>
  import { onMount } from 'svelte';
  
  export let isVisible = false;
  let mounted = false;

  onMount(() => {
    setTimeout(() => {
      mounted = true;
    }, 0);
  });
</script>

<div 
  class="background-container" 
  class:mounted 
  class:visible={isVisible}
  data-mounted={mounted}
  data-visible={isVisible}
>
  <div class="animated-background"></div>
</div>

<style>
  .background-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    opacity: 0;
    transform: scale(1.1);
    transition: all 0.3s ease-out;
    will-change: opacity, transform;
    pointer-events: none;
    background: var(--white);
  }

  .background-container.mounted {
    opacity: 0.3;
    transform: scale(1);
  }

  .background-container.visible {
    opacity: 1;
  }

  .animated-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, var(--dark-blue), var(--medium-blue));
    will-change: transform;
  }

  .animated-background::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="rgba(255,255,255,0.1)"><path d="M0 0 L50 50 L0 100 Z"/><path d="M100 0 L50 50 L100 100 Z"/><path d="M50 0 L100 0 L50 50 Z"/><path d="M0 0 L50 0 L25 25 Z"/><path d="M50 100 L100 100 L75 75 Z"/><path d="M0 100 L50 100 L25 75 Z"/></g></svg>') repeat;
    background-size: 100px 100px;
    opacity: 0.5;
    animation: triangleFloat 30s linear infinite;
    will-change: transform, background-position;
  }

  @keyframes triangleFloat {
    0% {
      background-position: 0 0;
      transform: scale(1);
    }
    25% {
      background-position: -25px -25px;
      transform: scale(1.1);
    }
    50% {
      background-position: -50px -50px;
      transform: scale(1);
    }
    75% {
      background-position: -75px -75px;
      transform: scale(1.1);
    }
    100% {
      background-position: -100px -100px;
      transform: scale(1);
    }
  }
</style> 