
interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userEmail: string;
  role: string | null; // <--- AGREGAMOS ESTA PROP NUEVA
}

export default function Sidebar({ currentView, onNavigate, onLogout, userEmail, role }: Props) {
  return (
    <aside style={{ 
      width: '250px', 
      background: '#111827', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px',
      flexShrink: 0 // Evita que se aplaste
    }}>
      <h2 style={{ color: '#3b82f6', marginBottom: '40px' }}>💎 Joyas Urbina</h2>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* BOTÓN DASHBOARD: Solo visible si role === 'admin' */}
        {role === 'admin' && (
          <button 
            onClick={() => onNavigate('dashboard')}
            style={btnStyle(currentView === 'dashboard')}
          >
            📊 Dashboard
          </button>
        )}

        <button 
          onClick={() => onNavigate('inventory')}
          style={btnStyle(currentView === 'inventory')}
        >
          📦 Inventario
        </button>
        
        <button 
          onClick={() => onNavigate('sales')}
          style={btnStyle(currentView === 'sales')}
        >
          💰 Vender (POS)
        </button>
      </nav>

      <div style={{ borderTop: '1px solid #374151', paddingTop: '20px' }}>
        <div style={{ fontSize: '0.8em', color: '#9ca3af', marginBottom: '10px' }}>
          {userEmail}
        </div>
        <button 
          onClick={onLogout}
          style={{ ...btnStyle(false), background: '#7f1d1d', color: '#fca5a5' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

// Estilos dinámicos para saber cuál está activo
const btnStyle = (isActive: boolean) => ({
  background: isActive ? '#374151' : 'transparent',
  color: isActive ? 'white' : '#9ca3af',
  border: 'none',
  padding: '12px',
  textAlign: 'left' as const,
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: isActive ? 'bold' : 'normal',
  transition: 'all 0.2s'
});