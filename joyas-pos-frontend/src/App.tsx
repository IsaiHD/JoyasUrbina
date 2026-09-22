import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

// --- IMPORTACIONES DE PÁGINAS ---
import LoginPage from './pages/LoginPage';
import VentasPage from './pages/VentasPage'; // Usamos directamente VentasPage
import DashboardPage from './pages/DashboardPage';

import Sidebar from './components/Sidebar';
import ChangePasswordModal from './components/ChangePasswordModal';
import SetupAccountModal from './components/SetupAccountModal';
import './App.css';

function App() {
  const { session, role, userName, loading, logout } = useAuth();
  
  // 1. CAMBIO AQUÍ: La vista por defecto ahora es 'sales' (ventas)
  const [currentView, setCurrentView] = useState('sales');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (session) {
      if (!userName) {
        setShowSetup(true);
      } else {
        setShowSetup(false);
      }
    }
  }, [session, loading, userName]);

  const handleSetupSuccess = () => {
    setShowSetup(false);
    window.location.reload(); 
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: '#6b7280' }}>
        Cargando sistema...
      </div>
    );
  }
  
  if (!session) return <LoginPage />;

  return (
    <div className="app-container">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={logout} 
        userEmail={session.user.email || ''}
        role={role}
        onOpenProfile={() => setIsPasswordModalOpen(true)}
      />

      <main className="main-content">
        <div className="content-scroll-area">
          {/* 2. CAMBIO AQUÍ: Eliminamos InventoryPage y dejamos solo el Dashboard y Ventas */}
          {currentView === 'dashboard' && <DashboardPage />}
          {currentView === 'sales' && <VentasPage />}
        </div>
      </main>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      <SetupAccountModal
        isOpen={showSetup}
        userId={session.user.id}
        onSuccess={handleSetupSuccess}
      />
    </div>
  );
}

export default App;