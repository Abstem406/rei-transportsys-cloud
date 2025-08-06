import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        host: '0.0.0.0',
        port: 5173,  // Asegúrate de que coincida con el puerto de tu aplicación
        allowedHosts: [
            'pioneros.bitforges.com', // ← Subdominio que quieres permitir
            'bitforges.com',            // ← Dominio principal (opcional)
            'api-pioneros.bitforges.com'
          ],
          proxy: {
            '/api': {
                target: 'https://api-pioneros.bitforges.com', // El API externo
                changeOrigin: true, 
                rewrite: (path) => path.replace(/^\/api/, ''), // Reemplaza /api por /
            },
        },
    }
    
});
