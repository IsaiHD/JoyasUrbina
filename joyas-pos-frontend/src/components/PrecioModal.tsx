import { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
  productName: string;
}

export default function PriceModal({ isOpen, onClose, onConfirm, productName }: Props) {
  const [displayValue, setDisplayValue] = useState(''); // Estado para el texto con puntos
  const inputRef = useRef<HTMLInputElement>(null);

  // Enfocar el input automáticamente al abrir
  useEffect(() => {
    if (isOpen) {
      setDisplayValue(''); // Limpiar precio anterior
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Lógica de formateo en tiempo real
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Quitamos cualquier caracter que no sea número (incluyendo puntos anteriores)
    const rawValue = e.target.value.replace(/\D/g, '');

    // 2. Si no hay nada, limpiamos
    if (rawValue === '') {
      setDisplayValue('');
      return;
    }

    // 3. Convertimos a número y formateamos con puntos (es-CL)
    const numberValue = parseInt(rawValue, 10);
    
    // "es-CL" usa puntos para miles automáticamente
    setDisplayValue(numberValue.toLocaleString('es-CL'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Para enviar el dato, debemos quitar los puntos y convertir a número limpio
    // Ejemplo: "5.000" -> "5000" -> 5000
    const finalPrice = parseInt(displayValue.replace(/\./g, ''), 10);
    
    if (!finalPrice || finalPrice < 0) return;
    onConfirm(finalPrice);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginTop: 0, color: '#111827', marginBottom: '10px' }}>💰 Ingresar Precio</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '0.9em' }}>
          Define el precio de venta para: <br/>
          <strong style={{ color: '#3b82f6' }}>{productName}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }}>$</span>
            
            <input
              ref={inputRef}
              type="text" // Cambiamos a text para permitir puntos
              inputMode="numeric" // Muestra teclado numérico en celulares
              value={displayValue}
              onChange={handleChange}
              placeholder="0"
              required
              style={inputStyle}
              maxLength={12} // Evita números astronómicos
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ ...btnStyle, background: '#f3f4f6', color: '#374151' }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              style={{ ...btnStyle, background: '#2563eb', color: 'white', fontWeight: 'bold' }}
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- ESTILOS (Mantenemos los mismos) ---
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 2000,
  backdropFilter: 'blur(2px)'
};

const modalStyle: React.CSSProperties = {
  background: 'white',
  padding: '25px',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '350px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  textAlign: 'center'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 10px 10px 25px',
  fontSize: '1.2em',
  borderRadius: '8px',
  border: '2px solid #e5e7eb',
  outline: 'none',
  boxSizing: 'border-box',
  fontWeight: 'bold',
  color: '#1f2937'
};

const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1em',
  transition: 'filter 0.2s'
};