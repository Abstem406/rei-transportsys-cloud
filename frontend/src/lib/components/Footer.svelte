<footer>
  <div class="footer-content">
    <div class="footer-section">
      <h3>TransportSys</h3>
      <p>Sistema inteligente de gestión de transporte</p>
    </div>
    
    <div class="footer-section">
      <h4>Contacto</h4>
      <ul>
        <li>Email: info@transportsys.com</li>
        <li>Tel: (123) 456-7890</li>
        <li>Dirección: Calle Principal #123</li>
      </ul>
    </div>
  </div>
  
  <div class="footer-bottom">
    <p>&copy; 2024 TransportSys. Todos los derechos reservados.</p>
  </div>
</footer>

<style>
  footer {
    background-color: white;
    color: var(--dark-blue);
    padding: 2rem;
    min-height: 12rem;
    margin-top: auto;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    padding: 0 2rem;
  }

  .footer-section h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--dark-blue);
  }

  .footer-section h4 {
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
    color: var(--medium-blue);
  }

  .footer-section p {
    color: var(--medium-blue);
    line-height: 1.6;
  }

  .footer-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .footer-section ul li {
    margin-bottom: 0.5rem;
    color: var(--medium-blue);
  }

  .footer-section a {
    color: var(--medium-blue);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .footer-section a:hover {
    color: var(--accent-blue);
  }

  .footer-bottom {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .footer-bottom p {
    color: var(--medium-blue);
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .footer-content {
      grid-template-columns: 1fr;
      text-align: center;
      padding: 0;
    }

    .footer-section {
      margin-bottom: 2rem;
    }

    footer {
      padding: 2rem 1rem;
    }
  }
</style> 