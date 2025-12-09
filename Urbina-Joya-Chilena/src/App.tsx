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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* Pasamos el rol al Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={logout} 
        userEmail={session.user.email || ''}
        role={role} // <--- NUEVA PROP
      />

      <main style={{ flex: 1, background: '#f3f4f6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Renderizado de Vistas */}
        {currentView === 'dashboard' && <DashboardPage />}
        {currentView === 'inventory' && <InventoryPage />}
        {currentView === 'sales' && <SalesPage />}
        
      </main>
    </div>
  );
}

export default App;