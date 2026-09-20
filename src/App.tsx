import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { UserRole } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { GarcomView } from './components/garcom/GarcomView';
import { CozinhaView } from './components/cozinha/CozinhaView';
import { CaixaView } from './components/caixa/CaixaView';
import { AdminView } from './components/admin/AdminView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { CustomerDeliveryView } from './components/delivery/CustomerDeliveryView';
import { ErrorBoundary } from './components/ErrorBoundary';

const MainApp: React.FC = () => {
  const { currentUser } = useStore();
  const [currentModule, setCurrentModule] = useState<UserRole>('garcom');
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Check URL params for public customer delivery menu (e.g., ?loja=loja-centro)
  const urlParams = new URLSearchParams(window.location.search);
  const publicLojaSlug = urlParams.get('loja') || urlParams.get('loja_id');

  // Enforce correct initial module based on user role permissions
  useEffect(() => {
    if (currentUser) {
      if (currentUser.perfil === 'super_admin') {
        setCurrentModule('super_admin');
      } else {
        setCurrentModule(currentUser.perfil);
      }
      setIsLoggedOut(false);
    }
  }, [currentUser]);

  // IF ?loja= URL parameter is present, ALWAYS render ONLY the Customer Delivery View (Anota AI Style)
  if (publicLojaSlug) {
    return <CustomerDeliveryView lojaSlug={publicLojaSlug} />;
  }

  if (!currentUser || isLoggedOut) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedOut(false)} />;
  }

  // Determine allowed module to render based on user role (RBAC Security & LGPD Isolation)
  const renderAllowedModule = () => {
    const role = currentUser.perfil;

    // Super Admin: Dono do App (SaaS Platform Dashboard)
    if (role === 'super_admin') {
      return <SuperAdminView />;
    }

    if (role === 'garcom') {
      return <GarcomView />;
    }
    if (role === 'cozinha') {
      return <CozinhaView />;
    }
    if (role === 'caixa') {
      if (currentModule === 'garcom') return <GarcomView />;
      return <CaixaView />;
    }
    // admin da filial / loja
    if (currentModule === 'garcom') return <GarcomView />;
    if (currentModule === 'cozinha') return <CozinhaView />;
    if (currentModule === 'caixa') return <CaixaView />;
    return <AdminView />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-200">
      <Navbar
        currentModule={currentModule}
        onChangeModule={(mod) => setCurrentModule(mod)}
        onLogout={() => setIsLoggedOut(true)}
      />

      <div className="flex-1 w-full">
        {renderAllowedModule()}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <MainApp />
      </StoreProvider>
    </ErrorBoundary>
  );
}
