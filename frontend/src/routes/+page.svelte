<script lang="ts">
  import { onMount } from 'svelte';
  import { API_URL } from '$lib/config';
  import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
  import PageTransition from '$lib/components/PageTransition.svelte';
  
  let isLoading = false;
  let errorMessage = '';
  
  type LoginData = {
    email: string;
    password: string;
  };

  let loginData: LoginData = {
    email: '',
    password: ''
  };

  async function handleSubmit() {
    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Guardar token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir según el tipo de usuario
      if (data.user.role === 'operator') {
        window.location.href = '/operator';
      } else if (data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/user';
      }
      
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Error al iniciar sesión';
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<PageTransition let:isVisible>
  <div class="page-container">
    <AnimatedBackground {isVisible} />
    <main>
      <div class="login-container">
        <div class="login-box">
          <h1>Bienvenido</h1>
          <p class="subtitle">Inicia sesión en tu cuenta</p>

          <form on:submit|preventDefault={handleSubmit} autocomplete="off">
            <div class="form-group">
              <label for="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                bind:value={loginData.email}
                placeholder="Ingresa tu correo electrónico"
                required
                autocomplete="off"
              />
            </div>

            <div class="form-group">
              <label for="password">Contraseña</label>
              <input
                type="password"
                id="password"
                bind:value={loginData.password}
                placeholder="Ingresa tu contraseña"
                required
                autocomplete="new-password"
              />
            </div>

            {#if errorMessage}
              <div class="error-message">{errorMessage}</div>
            {/if}

            <button type="submit" class="submit-button" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

            <div class="links">

            </div>
          </form>
        </div>
      </div>
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

  .page-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  main {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    margin: 4rem 0 12rem 0;
    position: relative;
    z-index: 1;
  }

  .login-container {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .login-box {
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  h1 {
    color: var(--gray-900);
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
  }

  .subtitle {
    color: var(--gray-600);
    margin: 0.5rem 0 2rem 0;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--gray-700);
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.9);
    color: var(--gray-900);
  }

  input:focus {
    outline: none;
    border-color: var(--light-blue);
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.1);
    background: white;
  }

  .submit-button {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--light-blue);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .submit-button:hover:not(:disabled) {
    background-color: var(--medium-blue);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    background-color: #fee2e2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .links {
    margin-top: 1.5rem;
    text-align: center;
  }

  @media (max-width: 640px) {
    main {
      padding: 1rem;
      margin: 2rem 0;
    }

    .login-box {
      padding: 1.5rem;
    }
  }
</style>
