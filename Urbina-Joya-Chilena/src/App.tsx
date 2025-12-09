import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventarioPage';
import SalesPage from './pages/VentasPage';
import DashboardPage from './pages/DashboardPage'; // <--- IMPORTAR
import Sidebar from './components/Sidebar';

function App() {
  const { session, role, loading, logout } = useAuth(); // <--- OBTENEMOS 'role'
  
  // Cambiamos la vista por defecto: si es admin, va al dashboard, si no, a ventas
  const [currentView, setCurrentView] = useState('inventory'); 

  if (loading) return <div>Cargando...</div>;
  if (!session) return <LoginPage />;

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      flexDirection: 'row' // Por defecto fila
    }} className="app-container">
      
      {/* SIDEBAR */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={logout} 
        userEmail={session.user.email || ''}
        role={role}
      />

      {/* MAIN CONTENT */}
      <main style={{ 
        flex: 1, 
        background: '#f3f4f6', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        // EN MÓVIL: Necesitamos espacio abajo para que la barra no tape el contenido
        paddingBottom: window.innerWidth < 768 ? '70px' : '0' 
      }}>
        
        {/* Renderizado de Vistas */}
        <div style={{ height: '100%', overflowY: 'auto' }}>
          {currentView === 'dashboard' && <DashboardPage />}
          {currentView === 'inventory' && <InventoryPage />}
          {currentView === 'sales' && <SalesPage />}
        </div>
        
      </main>

      {/* CSS AJUSTE RÁPIDO PARA MÓVIL EN APP */}
      <style>{`
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column-reverse !important; /* Pone la barra abajo del todo en flujo */
          }
          main {
            padding-bottom: 70px; /* Espacio de seguridad */
            width: 100vw;
          }
        }
      `}</style>
    </div>
  );
}

export default App;