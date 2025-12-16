import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { authService } from '../services/auth.service';

interface Props {
  isOpen: boolean;
  onSuccess: () => void;
  userId: string;
}

export default function SetupAccountModal({ isOpen, onSuccess, userId }: Props) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Dentro de SetupAccountModal.tsx

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres");
    if (nombre.trim().length < 2) return alert("Ingresa un nombre válido");

    try {
      setLoading(true);

      // 1. Actualizar contraseña
      await authService.updatePassword(password);

      // 2. Intentar ACTUALIZAR primero (ya que sabemos que el usuario existe en DB)
      // Usamos .select() para confirmar que devolvió datos
      const { data: updateData, error: updateError } = await supabase
        .from('usuario')
        .update({ nombre: nombre })
        .eq('id_usuario', userId)
        .select();

      if (updateError) throw updateError;

      // 3. Si updateData está vacío, significa que el usuario NO existía -> Hacemos INSERT
      if (!updateData || updateData.length === 0) {
        console.log("El usuario no existía, creando uno nuevo...");
        const { error: insertError } = await supabase
          .from('usuario')
          .insert({ 
            id_usuario: userId, 
            nombre: nombre,
            rol: 'vendedor' // Rol por defecto si es nuevo
          });
          
        if (insertError) throw insertError;
      }

      alert("🎉 ¡Datos actualizados correctamente!");
      onSuccess(); 

    } catch (error: any) {
      console.error("Error:", error);
      alert("Error guardando datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0, color: '#111827' }}>👋 ¡Bienvenido al Equipo!</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Para activar tu cuenta, por favor ingresa tus datos personales.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ textAlign: 'left' }}>
            <label style={labelStyle}>Tu Nombre Completo</label>
            <input 
              type="text" 
              placeholder="Ej: Juan Pérez" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={labelStyle}>Crea tu Contraseña</label>
            <input 
              type="password" 
              placeholder="Mínimo 6 caracteres" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Activando...' : 'Activar Cuenta y Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Estilos
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(17, 24, 39, 0.9)', // Fondo oscuro para enfocar atención
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
};
const modalStyle: React.CSSProperties = {
  background: 'white', padding: '40px', borderRadius: '16px', width: '90%', maxWidth: '400px', textAlign: 'center',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1em', boxSizing: 'border-box'
};
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#374151', fontWeight: 'bold'
};
const btnStyle: React.CSSProperties = {
  marginTop: '10px', padding: '15px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em'
};