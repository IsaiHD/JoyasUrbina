import './Sidebar.css';
import logo from '/logo-white.png';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userEmail: string;
  role: string | null;
  onOpenProfile: () => void;
}

// 1. Asegúrate de extraer 'onOpenProfile' aquí
export default function Sidebar({ currentView, onNavigate, onLogout, userEmail, role, onOpenProfile }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Joyas Urbina" className="sidebar-logo" />
      </div>

      <nav className="sidebar-nav">
        {role === 'admin' && (
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            <span className="icon">📊</span>
            <span className="text">Dashboard</span>
          </button>
        )}

        
        {/* 3. Dejamos el botón de Ventas como principal */}
        <button 
          onClick={() => onNavigate('sales')}
          className={`nav-btn ${currentView === 'sales' ? 'active' : ''}`}
        >
          <span className="icon">💰</span>
          <span className="text">Ventas</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-email" style={{ marginBottom: '10px', fontSize: '0.9em', color: '#9ca3af' }}>
          {userEmail}
        </div>
        
        {/* 4. Agregamos el botón para cambiar contraseña (Perfil) */}
        <button onClick={onOpenProfile} className="nav-btn" style={{ marginBottom: '10px', width: '100%' }}>
          <span className="icon">🔒</span>
          <span className="text">Cambiar Clave</span>
        </button>

        <button onClick={onLogout} className="logout-btn">
          <span className="icon">🚪</span>
          <span className="text">Salir</span>
        </button>
      </div>
    </aside>
  );
}