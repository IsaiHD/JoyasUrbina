import { useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Importamos el cerebro
import type { LoginDTO } from '../types/auth.types';

export default function LoginPage() {
  const { login, loading, error } = useAuth(); // Desestructuramos lo que necesitamos
  const [form, setForm] = useState<LoginDTO>({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evitar recarga del navegador
    login(form);
  };

  // Manejador genérico para inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <img src="../src/assets/logo-black.png" alt="Logo" 
          style={{ width: '220px',
                   height: 'auto',
                   marginLeft:'0%'}}
        />
        
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '20px'}}>Acceso exclusivo personal</p>
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            required
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '12px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}