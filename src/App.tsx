import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { StoreProvider, useStore } from './context/StoreContext';
import { UserRole } from './types';
import { LoginScreen } from './components/LoginScreen';
import { PublicPortalView } from './components/portal/PublicPortalView';
import { Navbar } from './components/Navbar';
import { GarcomView } from './components/garcom/GarcomView';
import { CozinhaView } from './components/cozinha/CozinhaView';
import { CaixaView } from './components/caixa/CaixaView';
import { AdminView } from './components/admin/AdminView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { CustomerDeliveryView } from './components/delivery/CustomerDeliveryView';
import { ErrorBoundary } from './components/ErrorBoundary';

const MainApp: React.FC = () => {
  const { currentUser, lojas, logout } = useStore();
  const [currentModule, setCurrentModule] = useState<UserRole>('garcom');

  // Check URL params for direct actions
  const urlParams = new URLSearchParams(window.location.search);
  const publicLojaSlug = urlParams.get('loja') || urlParams.get('loja_id');
  const portalParam = urlParams.get('portal'); // e.g. 'dono' or 'master'
  const equipeParam = urlParams.get('equipe') || urlParams.get('login');

  // Verify active session: NEVER auto-login unless explicitly authenticated in sessionStorage
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    try {
      const sessionActive = sessionStorage.getItem('atendeja_session_active');
      return !sessionActive;
    } catch {
      return true;
    }
  });

  // Portal view mode for unauthenticated users: 'portal' | 'login'
  const [authView, setAuthView] = useState<'portal' | 'login'>(() => {
    if (portalParam === 'dono' || portalParam === 'master' || equipeParam) {
      return 'login';
    }
    return 'portal';
  });

  const [initialLoginTab, setInitialLoginTab] = useState<'equipe' | 'dono'>(() => {
    if (portalParam === 'dono' || portalParam === 'master') return 'dono';
    return 'equipe';
  });

  // Enforce correct initial module based on user role permissions
  useEffect(() => {
    if (currentUser && !isLoggedOut) {
      if (currentUser.perfil === 'super_admin') {
        setCurrentModule('super_admin');
      } else {
        setCurrentModule(currentUser.perfil);
      }
    }
  }, [currentUser, isLoggedOut]);

  // 1. IF ?loja= URL parameter is present, ALWAYS render ONLY the Customer Delivery View (Anota AI Style)
  if (publicLojaSlug) {
    return <CustomerDeliveryView lojaSlug={publicLojaSlug} />;
  }

  // 2. IF not authenticated: show either the Public Portal or the Login Screen
  if (isLoggedOut || !currentUser) {
    if (authView === 'portal') {
      return (
        <PublicPortalView
          lojas={lojas}
          onSelectLoja={(slug) => {
            window.location.search = `?loja=${slug}`;
          }}
          onOpenLogin={(tab) => {
            setInitialLoginTab(tab);
            setAuthView('login');
          }}
        />
      );
    }

    return (
      <LoginScreen
        initialTab={initialLoginTab}
        onLoginSuccess={() => {
          setIsLoggedOut(false);
          try {
            sessionStorage.setItem('atendeja_session_active', 'true');
          } catch {
            // ignore
          }
        }}
        onBackToPortal={() => setAuthView('portal')}
      />
    );
  }

  // 3. Intercept active session if the user's store is suspended (super_admin is exempt)
  const userLoja = currentUser.perfil !== 'super_admin' && currentUser.loja_id
    ? lojas.find((l) => l.id === currentUser.loja_id)
    : null;

  const isStoreSuspended = !!(userLoja && (!userLoja.ativa || userLoja.status_assinatura === 'suspenso'));

  if (isStoreSuspended) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 shadow-2xl shadow-red-950/10 space-y-5">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50 dark:ring-red-950/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-full">
              Operações Bloqueadas
            </span>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mt-3">
              Estabelecimento Suspenso
            </h2>
            <p className="text-stone-600 dark:text-stone-300 text-sm mt-2">
              O acesso para a loja <strong>{userLoja.nome}</strong> foi temporariamente suspenso pelo administrador da plataforma.
            </p>
            <p className="text-stone-500 dark:text-stone-400 text-xs mt-3 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
              As operações de garçom, cozinha, caixa e administração desta loja estão paralisadas até a regularização com o suporte.
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              setIsLoggedOut(true);
              setAuthView('portal');
            }}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            Sair e Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // 4. Determine allowed module to render based on user role (RBAC Security & LGPD Isolation)
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
        onLogout={() => {
          logout();
          setIsLoggedOut(true);
          setAuthView('portal');
        }}
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
