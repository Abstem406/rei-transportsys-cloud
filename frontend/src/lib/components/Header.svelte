<script>
  let isMenuOpen = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
</script>

<header>
  <nav>
    <div class="logo">
      <a href="/">TransportSys</a>
    </div>
    
    <button class="menu-button" on:click={toggleMenu}>
      <span class="menu-icon"></span>
    </button>
    
    <ul class="nav-links {isMenuOpen ? 'active' : ''}">
      <li><a href="/">Inicio</a></li>
    </ul>
  </nav>
</header>

<style>
  header {
    background-color: var(--light-blue);
    padding: 1rem 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    height: 4rem;
  }

  nav {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
  }

  .logo a {
    color: white;
    text-decoration: none;
    font-size: 1.5rem;
    font-weight: bold;
    transition: color 0.3s ease;
  }

  .logo a:hover {
    color: var(--accent-blue);
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-links a {
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .nav-links a:hover {
    color: var(--accent-blue);
  }

  .menu-button {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
  }

  .menu-icon {
    display: block;
    width: 24px;
    height: 2px;
    background-color: white;
    position: relative;
    transition: background-color 0.3s ease;
  }

  .menu-icon::before,
  .menu-icon::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background-color: white;
    transition: transform 0.3s ease;
  }

  .menu-icon::before {
    top: -6px;
  }

  .menu-icon::after {
    bottom: -6px;
  }

  @media (max-width: 768px) {
    .menu-button {
      display: block;
    }

    .nav-links {
      display: none;
      position: absolute;
      top: 4rem;
      left: 0;
      right: 0;
      background-color: var(--light-blue);
      flex-direction: column;
      padding: 1rem;
      gap: 1rem;
      text-align: center;
    }

    .nav-links.active {
      display: flex;
    }
  }
</style> 