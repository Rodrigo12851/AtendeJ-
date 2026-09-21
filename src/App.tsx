import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { StoreProvider, useStore } from './context/StoreContext';
import { UserRole } from './types';
import { LoginScreen } from './components/LoginScreen';
import { UnrecognizedLinkView } from './components/UnrecognizedLinkView';
import { Navbar } from './components/Navbar';
import { GarcomView } from './components/garcom/GarcomView';
import { CozinhaView } from './components/cozinha/CozinhaView';
import { CaixaView } from './components/caixa/CaixaView';
import { AdminView } from './components/admin/AdminView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { CustomerDeliveryView } from './components/delivery/CustomerDeliveryView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MASTER_PORTAL_TOKEN } from './data/initialData';

const MainApp: React.FC = () => {
  const { currentUser, lojas, logout } = useStore();
  const [currentModule, setCurrentModule] = useState<UserRole>('garcom');

  // Check URL params for direct actions
  const urlParams = new URLSearchParams(window.location.search);
  const publicLojaSlug = urlParams.get('loja') || urlParams.get('loja_id');
  const painelParam = urlParams.get('painel'); // 'admin' | 'garcom' | 'cozinha' | 'caixa'
  const tokenParam = urlParams.get('token');
  const portalParam = urlParams.get('portal');
  const isDonoPortal = portalParam === 'master' || portalParam === 'dono';

  // Verify active session in sessionStorage: NEVER auto-login without explicit authentication
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    try {
      const sessionActive = sessionStorage.getItem('atendeja_session_active');
      return !sessionActive;
    } catch {
      return true;
    }
  });

  // Target store resolution
  const targetLoja = publicLojaSlug
    ? lojas.find(
        (l) =>
          l.slug.toLowerCase() === publicLojaSlug.toLowerCase() ||
          l.id.toLowerCase() === publicLojaSlug.toLowerCase()
      )
    : undefined;

  // Enforce correct initial module based on user role permissions
  useEffect(() => {
    if (currentUser && !isLoggedOut) {
      if (currentUser.perfil === 'super_admin') {
        setCurrentModule('super_admin');
      } else if (
        currentUser.perfil === 'admin' &&
        painelParam &&
        ['garcom', 'cozinha', 'caixa', 'admin'].includes(painelParam)
      ) {
        setCurrentModule(painelParam as UserRole);
      } else {
        setCurrentModule(currentUser.perfil);
      }
    }
  }, [currentUser, isLoggedOut, painelParam]);

  // 1. IF ?loja= URL parameter is present WITHOUT ?painel=, ALWAYS render ONLY Customer Delivery View
  if (publicLojaSlug && !painelParam) {
    return <CustomerDeliveryView lojaSlug={publicLojaSlug} />;
  }

  // 2. IF user is not logged in:
  if (isLoggedOut || !currentUser) {
    // 2.1. Secret Master portal for Dono da Plataforma: MUST have valid MASTER_PORTAL_TOKEN
    if (isDonoPortal) {
      if (tokenParam === MASTER_PORTAL_TOKEN) {
        return (
          <LoginScreen
            mode="dono"
            onLoginSuccess={() => {
              setIsLoggedOut(false);
              try {
                sessionStorage.setItem('atendeja_session_active', 'true');
              } catch {}
            }}
          />
        );
      }
      // Token missing or incorrect -> Blind with UnrecognizedLinkView
      return <UnrecognizedLinkView />;
    }

    // 2.2. Exclusive Store Panels (Admin, Garçom, Cozinha, Caixa): MUST have store + matching token
    if (publicLojaSlug && painelParam) {
      if (!targetLoja) {
        return <UnrecognizedLinkView />;
      }

      if (painelParam === 'admin') {
        if (!tokenParam || tokenParam !== targetLoja.token_admin) {
          return <UnrecognizedLinkView />;
        }
        return (
          <LoginScreen
            mode="loja_admin"
            loja={targetLoja}
            painelAlvo="admin"
            onLoginSuccess={() => {
              setIsLoggedOut(false);
              try {
                sessionStorage.setItem('atendeja_session_active', 'true');
              } catch {}
            }}
          />
        );
      }

      if (['garcom', 'cozinha', 'caixa'].includes(painelParam)) {
        const expectedToken =
          painelParam === 'garcom'
            ? targetLoja.token_garcom
            : painelParam === 'cozinha'
            ? targetLoja.token_cozinha
            : targetLoja.token_caixa;

        if (!tokenParam || tokenParam !== expectedToken) {
          return <UnrecognizedLinkView />;
        }

        return (
          <LoginScreen
            mode="loja_equipe"
            loja={targetLoja}
            painelAlvo={painelParam as 'garcom' | 'cozinha' | 'caixa'}
            onLoginSuccess={() => {
              setIsLoggedOut(false);
              try {
                sessionStorage.setItem('atendeja_session_active', 'true');
              } catch {}
            }}
          />
        );
      }

      // Any other painel param is unrecognized
      return <UnrecognizedLinkView />;
    }

    // 2.3. BARE ROOT URL / UNRECOGNIZED LINK:
    // When someone enters https://atendeja-seven.vercel.app/ without parameters, show blind screen
    return <UnrecognizedLinkView />;
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
            }}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            Sair da Sessão
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
