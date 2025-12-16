import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

// --- TUS IMPORTACIONES DE PÁGINAS ---
// Asegúrate de que los nombres de archivo coincidan con lo que tienes en tu carpeta
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventarioPage'; 
import SalesPage from './pages/VentasPage';
import DashboardPage from './pages/DashboardPage';
// ------------------------------------

import Sidebar from './components/Sidebar';
import ChangePasswordModal from './components/ChangePasswordModal';
import SetupAccountModal from './components/SetupAccountModal';
import './App.css';

function App() {
  // Extraemos todo lo necesario del hook
  const { session, role, userName, loading, logout } = useAuth();
  
  const [currentView, setCurrentView] = useState('inventory');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Estado para controlar el modal de Bienvenida
  const [showSetup, setShowSetup] = useState(false);

  // EFECTO: Lógica inteligente para mostrar el Setup
  useEffect(() => {
    // 1. Si el sistema dice "cargando", NO hacemos nada. Esperamos.
    if (loading) return;

    // 2. Si ya terminó de cargar y tenemos usuario:
    if (session) {
      // Verificamos si tiene nombre asignado
      if (!userName) {
        setShowSetup(true);
      } else {
        // Si ya tiene nombre, aseguramos que el modal esté cerrado
        setShowSetup(false);
      }
    }
  }, [session, loading, userName]); // Se ejecuta cuando cambia cualquiera de estos

  // Callback para cuando el usuario completa el registro
  const handleSetupSuccess = () => {
    setShowSetup(false);
    // Recargamos para que useAuth vuelva a pedir los datos limpios
    window.location.reload(); 
  };

  // 1. Pantalla de Carga
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: '#6b7280' }}>
        Cargando sistema...
      </div>
    );
  }
  
  // 2. Si no hay sesión, mostramos el Login
  if (!session) return <LoginPage />;

  // 3. App Principal
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
          {currentView === 'dashboard' && <DashboardPage />}
          {currentView === 'inventory' && <InventoryPage />}
          {currentView === 'sales' && <SalesPage />}
        </div>
      </main>

      {/* Modal para cambiar contraseña voluntariamente (Perfil) */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      {/* Modal de Bienvenida OBLIGATORIO (Solo si no tiene nombre) */}
      <SetupAccountModal
        isOpen={showSetup}
        userId={session.user.id}
        onSuccess={handleSetupSuccess}
      />
    </div>
  );
}

export default App;