import { useState } from 'react';
import { authService } from '../services/auth.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres");

    try {
      setLoading(true);
      await authService.updatePassword(password);
      alert("✅ ¡Contraseña actualizada con éxito!");
      setPassword('');
      onClose();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginTop: 0, color: '#111827' }}>🔐 Cambiar Contraseña</h3>
        <p style={{ fontSize: '0.9em', color: '#6b7280', marginBottom: '20px' }}>
          Ingresa tu nueva contraseña para actualizarla.
        </p>

        <form onSubmit={handleSubmit}>
          <input 
            type="password" 
            placeholder="Nueva Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancelar</button>
            <button type="submit" disabled={loading} style={confirmBtnStyle}>
              {loading ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Estilos
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000
};

const modalStyle: React.CSSProperties = {
  background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '350px', textAlign: 'center',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1em', boxSizing: 'border-box'
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#374151'
};

const confirmBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
};