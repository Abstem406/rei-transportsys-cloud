<script lang="ts">
  import { API_URL } from '$lib/config';
  import { onMount } from 'svelte';

  let isVisible = false;
  let isLoading = false;
  let successMessage = '';
  let errorMessage = '';

  type FormData = {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    confirmPassword: string;
    rol: string;
  };

  type TouchedFields = {
    nombre: boolean;
    apellido: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
  };

  type FormErrors = {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    confirmPassword: string;
  };

  // Datos del formulario
  let formData: FormData = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'usuario' // Por defecto
  };

  // Estado de validación
  let touched: TouchedFields = {
    nombre: false,
    apellido: false,
    email: false,
    password: false,
    confirmPassword: false
  };

  // Errores de validación
  let errors: FormErrors = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  // Validar campo
  function validateField(field: keyof FormErrors, value: string) {
    switch (field) {
      case 'nombre':
      case 'apellido':
        if (!value.trim()) {
          errors[field] = 'Este campo es requerido';
        } else if (value.length < 2) {
          errors[field] = 'Debe tener al menos 2 caracteres';
        } else {
          errors[field] = '';
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          errors.email = 'El email es requerido';
        } else if (!emailRegex.test(value)) {
          errors.email = 'Email inválido';
        } else {
          errors.email = '';
        }
        break;
      
      case 'password':
        if (!value) {
          errors.password = 'La contraseña es requerida';
        } else if (value.length < 6) {
          errors.password = 'La contraseña debe tener al menos 6 caracteres';
        } else {
          errors.password = '';
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Confirma tu contraseña';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Las contraseñas no coinciden';
        } else {
          errors.confirmPassword = '';
        }
        break;
    }
  }

  // Manejar cambios en los campos
  function handleInput(field: keyof FormData, value: string) {
    if (field in formData) {
      formData[field] = value;
    }
    if (field in touched) {
      touched[field as keyof TouchedFields] = true;
    }
    if (field in errors) {
      validateField(field as keyof FormErrors, value);
    }
  }

  // Validar formulario completo
  function isFormValid() {
    return !Object.values(errors).some(error => error) &&
           Object.values(formData).every(value => value);
  }

  // Manejar envío del formulario
  async function handleSubmit() {
    // Marcar todos los campos como tocados
    Object.keys(touched).forEach(key => {
      touched[key as keyof TouchedFields] = true;
    });
    
    // Validar todos los campos
    Object.keys(formData).forEach(key => {
      if (key in errors) {
        validateField(key as keyof FormErrors, formData[key as keyof FormData]);
      }
    });

    if (!isFormValid()) {
      errorMessage = 'Por favor, corrige los errores del formulario';
      return;
    }

    isLoading = true;
    errorMessage = '';
    successMessage = '';

    try {
      const response = await fetch(`${API_URL}/usuarios/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar usuario');
      }

      successMessage = '¡Registro exitoso! Redirigiendo...';
      // Aquí podrías agregar la redirección al login
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Error al registrar usuario';
      }
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    setTimeout(() => {
      isVisible = true;
    }, 100);
  });
</script>

<div class="page-container {isVisible ? 'visible' : ''}">
  <div class="animated-background"></div>
  <section class="form-section">
    <div class="form-container">
      <h1>Crear Cuenta</h1>
      <p class="subtitle">Únete a nuestra plataforma de transporte</p>

      <form on:submit|preventDefault={handleSubmit} autocomplete="off">
        <div class="form-grid">
          <div class="form-group">
            <label for="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              class:error={touched.nombre && errors.nombre}
              bind:value={formData.nombre}
              on:input={(e) => handleInput('nombre', (e.target as HTMLInputElement).value)}
              autocomplete="off"
            />
            {#if touched.nombre && errors.nombre}
              <span class="error-message">{errors.nombre}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="apellido">Apellido</label>
            <input
              type="text"
              id="apellido"
              class:error={touched.apellido && errors.apellido}
              bind:value={formData.apellido}
              on:input={(e) => handleInput('apellido', (e.target as HTMLInputElement).value)}
              autocomplete="off"
            />
            {#if touched.apellido && errors.apellido}
              <span class="error-message">{errors.apellido}</span>
            {/if}
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            class:error={touched.email && errors.email}
            bind:value={formData.email}
            on:input={(e) => handleInput('email', (e.target as HTMLInputElement).value)}
            autocomplete="off"
          />
          {#if touched.email && errors.email}
            <span class="error-message">{errors.email}</span>
          {/if}
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              class:error={touched.password && errors.password}
              bind:value={formData.password}
              on:input={(e) => handleInput('password', (e.target as HTMLInputElement).value)}
              autocomplete="new-password"
            />
            {#if touched.password && errors.password}
              <span class="error-message">{errors.password}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              class:error={touched.confirmPassword && errors.confirmPassword}
              bind:value={formData.confirmPassword}
              on:input={(e) => handleInput('confirmPassword', (e.target as HTMLInputElement).value)}
              autocomplete="new-password"
            />
            {#if touched.confirmPassword && errors.confirmPassword}
              <span class="error-message">{errors.confirmPassword}</span>
            {/if}
          </div>
        </div>

        <div class="form-group">
          <label for="rol">Rol</label>
          <select id="rol" bind:value={formData.rol} autocomplete="off">
            <option value="usuario">Usuario</option>
            <option value="conductor">Conductor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {#if errorMessage}
          <div class="alert error">{errorMessage}</div>
        {/if}

        {#if successMessage}
          <div class="alert success">{successMessage}</div>
        {/if}

        <button type="submit" class="submit-button" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  </section>
</div>

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
    --primary-color: var(--medium-blue);
    --primary-dark: var(--dark-blue);
    --accent-color: #ef4444;
  }

  .page-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease-out;
    justify-content: center;
    padding: 6rem 0;
  }

  .page-container.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .animated-background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, var(--dark-blue), var(--medium-blue));
    z-index: -1;
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

  .animated-background::after {
    content: none;
  }

  .register-container {
    padding: 2rem;
  }

  .form-section {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  .form-container {
    width: 100%;
  }

  h1 {
    font-size: 2.5rem;
    color: var(--gray-900);
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .subtitle {
    font-size: 1.2rem;
    color: var(--gray-600);
    text-align: center;
    margin-bottom: 2rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--gray-700);
    margin-bottom: 0.5rem;
  }

  input,
  select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.9);
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    background: white;
  }

  input.error {
    border-color: var(--accent-color);
  }

  .error-message {
    display: block;
    color: var(--accent-color);
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }

  .alert {
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .alert.error {
    background-color: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .alert.success {
    background-color: #dcfce7;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }

  .submit-button {
    width: 100%;
    padding: 1rem;
    background-color: var(--primary-color);
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .submit-button:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .page-container {
      padding: 4rem 1rem;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-section {
      padding: 1rem;
      margin: 1rem;
    }

    h1 {
      font-size: 2rem;
    }

    .register-container {
      padding: 1rem;
    }
  }
</style> 