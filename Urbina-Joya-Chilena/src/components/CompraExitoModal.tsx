interface Props {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function SuccessModal({ isOpen, onClose, message = "La operación se realizó correctamente." }: Props) {
  
  // Opcional: Cerrar automáticamente después de 3 segundos si quieres agilidad
  /* useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);
  */

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Icono de Check Animado (CSS simple) */}
        <div style={iconContainerStyle}>
          <span style={{ fontSize: '2.5em' }}>✅</span>
        </div>

        <h2 style={{ color: '#111827', margin: '10px 0 5px 0' }}>¡Venta Exitosa!</h2>
        
        <p style={{ color: '#6b7280', marginBottom: '25px', fontSize: '0.95em' }}>
          {message}
        </p>

        <button 
          onClick={onClose}
          style={buttonStyle}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

// --- ESTILOS ---
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 3000, // Mayor que el PriceModal por si acaso
  backdropFilter: 'blur(3px)'
};

const modalStyle: React.CSSProperties = {
  background: 'white',
  padding: '30px',
  borderRadius: '16px',
  width: '90%',
  maxWidth: '320px',
  textAlign: 'center',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  transform: 'scale(1)',
  animation: 'popIn 0.2s ease-out'
};

const iconContainerStyle: React.CSSProperties = {
  background: '#dcfce7',
  width: '70px',
  height: '70px',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto 15px auto',
  border: '4px solid #f0fdf4'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#166534',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1em',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background 0.2s'
};