import './Sidebar.css';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userEmail: string;
  role: string | null;
}

export default function Sidebar({ currentView, onNavigate, onLogout, userEmail, role }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>💎 Joyas Urbina</h2>
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

        <button 
          onClick={() => onNavigate('inventory')}
          className={`nav-btn ${currentView === 'inventory' ? 'active' : ''}`}
        >
          <span className="icon">📦</span>
          <span className="text">Inventario</span>
        </button>
        
        <button 
          onClick={() => onNavigate('sales')}
          className={`nav-btn ${currentView === 'sales' ? 'active' : ''}`}
        >
          <span className="icon">💰</span>
          <span className="text">Vender</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-email">{userEmail}</div>
        
        {/* MODIFICADO: Agregamos estructura de Icono + Texto */}
        <button onClick={onLogout} className="logout-btn">
          <span className="icon">🚪</span>
          <span className="text">Salir</span>
        </button>
      </div>
    </aside>
  );
}