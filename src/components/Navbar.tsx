import React, { useMemo, useState } from 'react';
import {
  ChefHat,
  Banknote,
  Shield,
  User as UserIcon,
  LogOut,
  Volume2,
  VolumeX,
  RotateCcw,
  Pizza,
  Building2,
  Share2,
  Check,
  Sun,
  Moon,
  Cloud,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SuperAdminStoresModal } from './admin/SuperAdminStoresModal';

interface NavbarProps {
  currentModule: UserRole;
  onChangeModule: (role: UserRole) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentModule, onChangeModule, onLogout }) => {
  const {
    currentUser,
    audioEnabled,
    setAudioEnabled,
    isDarkMode,
    setDarkMode,
    resetToSeedData,
    tables,
    comandas,
    orders,
    lojas,
    currentLojaId,
    currentLoja,
    setCurrentLojaId,
  } = useStore();

  const [showStoresModal, setShowStoresModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleReset = () => {
    if (window.confirm('Deseja reiniciar todos os dados da pizzaria para o estado inicial de demonstração?')) {
      resetToSeedData();
    }
  };

  const handleCopyDeliveryLink = () => {
    const slug = currentLoja?.slug || 'loja-centro';
    let url = `${window.location.origin}/?loja=${slug}`;
    if (currentLoja?.marca) {
      url += `&marca=${encodeURIComponent(currentLoja.marca)}`;
    }
    if (currentLoja?.nome) {
      url += `&nome=${encodeURIComponent(currentLoja.nome)}`;
    }
    if (currentLoja?.logo_url && !currentLoja.logo_url.startsWith('data:')) {
      url += `&logo=${encodeURIComponent(currentLoja.logo_url)}`;
    }
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  // High Density Header Metrics calculations
  const totalSales = useMemo(() => {
    const closed = comandas
      .filter((c) => c.status === 'fechada')
      .reduce((acc, c) => acc + c.total, 0);
    if (closed > 0) return closed;
    return comandas.reduce((acc, c) => acc + c.total, 0);
  }, [comandas]);

  const occupiedCount = useMemo(() => {
    return tables.filter((t) => t.status === 'ocupada' || t.status === 'aguardando_fechamento').length;
  }, [tables]);

  const ticketMedio = useMemo(() => {
    const closed = comandas.filter((c) => c.status === 'fechada');
    if (closed.length > 0) {
      return totalSales / closed.length;
    }
    const openWithTotal = comandas.filter((c) => c.total > 0);
    return openWithTotal.length > 0 ? totalSales / openWithTotal.length : 0;
  }, [comandas, totalSales]);

  const kitchenActiveCount = useMemo(() => {
    return orders.filter((o) => o.status === 'novo' || o.status === 'em_preparo').length;
  }, [orders]);

  const userInitials = useMemo(() => {
    if (!currentUser?.nome) return 'US';
    const parts = currentUser.nome.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }, [currentUser]);

  return (
    <div className="w-full relative md:sticky md:top-0 z-40">
      {/* Primary Warm Trattoria Navigation Bar */}
      <header className="bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
          {/* Main Top Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Trattoria Brand or SaaS Platform Brand */}
            {currentUser?.perfil === 'super_admin' ? (
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center shadow-sm text-stone-950 font-bold shrink-0">
                  👑
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none text-white flex items-center gap-1 uppercase">
                    ATENDEJÁ
                  </h1>
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 mt-0.5 font-bold">
                    👑 Dono da Plataforma (SaaS)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 shrink-0">
                {currentLoja?.logo_url ? (
                  <img
                    src={currentLoja.logo_url}
                    alt={currentLoja.marca || currentLoja.nome || 'Logo da Loja'}
                    className="w-8 h-8 rounded-lg object-cover shadow-sm border border-stone-700 bg-stone-900 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-sm text-white shrink-0">
                    <Pizza className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none text-white flex items-center gap-1 uppercase">
                    {currentLoja?.marca || 'PIZZARIA ITÁLIA'}
                  </h1>
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 mt-0.5 font-bold">
                    {currentLoja?.nome ? `📍 ${currentLoja.nome}` : '📍 Filial'}
                  </p>
                </div>
              </div>
            )}

            {/* Desktop Module Navigation Tabs - RBAC & Strict Role Isolation */}
            {currentUser?.perfil === 'super_admin' ? (
              <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>PAINEL DO DONO DO APP</span>
              </div>
            ) : currentUser?.perfil === 'garcom' ? (
              <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold items-center gap-1.5 shadow-xs">
                <UtensilsCrossed className="w-4 h-4 text-red-400" />
                <span>PAINEL DO GARÇOM • MESAS & SALÃO</span>
              </div>
            ) : currentUser?.perfil === 'cozinha' ? (
              <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold items-center gap-1.5 shadow-xs">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>PAINEL DA COZINHA • MONITOR KDS {kitchenActiveCount > 0 && `(${kitchenActiveCount})`}</span>
              </div>
            ) : currentUser?.perfil === 'caixa' ? (
              <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 shrink-0 py-1">
                <button
                  onClick={() => onChangeModule('caixa')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                    currentModule === 'caixa'
                      ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-xs'
                      : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                  }`}
                >
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">01</span>
                  <span className="uppercase text-[11px] sm:text-xs">CAIXA / PDV</span>
                </button>
                <button
                  onClick={() => onChangeModule('garcom')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                    currentModule === 'garcom'
                      ? 'bg-red-600/25 border-red-500 text-white shadow-xs'
                      : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                  }`}
                >
                  <span className="text-[10px] font-mono text-red-400 font-bold">02</span>
                  <span className="uppercase text-[11px] sm:text-xs">CONSULTAR MESAS</span>
                </button>
              </nav>
            ) : (
              /* Admin Filial: Acesso a todos os 4 módulos operacionais */
              <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 shrink-0 py-1">
                <button
                  onClick={() => onChangeModule('garcom')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                    currentModule === 'garcom'
                      ? 'bg-red-600/25 border-red-500 text-white shadow-xs'
                      : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                  }`}
                >
                  <span className="text-[10px] font-mono text-red-400 font-bold">01</span>
                  <span className="uppercase text-[11px] sm:text-xs">MESAS</span>
                </button>

                <button
                  onClick={() => onChangeModule('cozinha')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                    currentModule === 'cozinha'
                      ? 'bg-amber-500/25 border-amber-500 text-white shadow-xs'
                      : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                  }`}
                >
                  <span className="text-[10px] font-mono text-amber-400 font-bold">02</span>
                  <span className="uppercase text-[11px] sm:text-xs">
                    COZINHA {kitchenActiveCount > 0 && `(${kitchenActiveCount})`}
                  </span>
                </button>

                <button
                  onClick={() => onChangeModule('caixa')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                    currentModule === 'caixa'
                      ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-xs'
                      : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                  }`}
                >
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">03</span>
                  <span className="uppercase text-[11px] sm:text-xs">CAIXA</span>
                </button>

                <button
                  onClick={() => onChangeModule('admin')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                    currentModule === 'admin'
                      ? 'bg-purple-600/25 border-purple-500 text-white shadow-xs'
                      : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                  }`}
                >
                  <span className="text-[10px] font-mono text-purple-400 font-bold">04</span>
                  <span className="uppercase text-[11px] sm:text-xs">ADMIN</span>
                </button>
              </nav>
            )}

            {/* Desktop User Profile & Actions (Visible on MD+) */}
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Cloud Status Indicator */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-[10px] font-bold text-emerald-400"
                title="Cloud Firestore conectado em tempo real (Projeto: atendeja-83ef5)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Cloud className="w-3.5 h-3.5" />
                <span>Nuvem Ativa</span>
              </div>

              {/* Copy Delivery Link Button */}
              <button
                onClick={handleCopyDeliveryLink}
                className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                  linkCopied
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                    : 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
                title="Copiar link do cardápio digital de delivery da loja ativa"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
                <span>{linkCopied ? 'Copiado!' : 'Delivery'}</span>
              </button>

              {/* Store Switcher (Only for Super Admin / Dono do App) */}
              {currentUser?.perfil === 'super_admin' ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center bg-stone-950/80 border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-amber-300 font-medium">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
                    <select
                      value={currentLojaId}
                      onChange={(e) => setCurrentLojaId(e.target.value)}
                      className="bg-transparent text-amber-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1 max-w-[120px] sm:max-w-[160px] truncate"
                    >
                      <option value="todas" className="bg-stone-900 text-white">🏢 Todas as Lojas</option>
                      {lojas.map((l) => (
                        <option key={l.id} value={l.id} className="bg-stone-900 text-white">
                          📍 {l.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setShowStoresModal(true)}
                    className="px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                    title="Gerenciar Filiais e Administradores"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">+ Lojas</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center bg-stone-800 border border-stone-700/80 rounded-lg px-2 py-1 text-xs text-stone-300 font-semibold max-w-[140px] truncate">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-red-400 shrink-0" />
                  <span className="truncate">{currentLoja?.nome || 'Loja Principal'}</span>
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg border transition ${
                  isDarkMode
                    ? 'border-amber-500/70 bg-amber-950/60 text-amber-300'
                    : 'border-stone-800 bg-stone-800/50 text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title={isDarkMode ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
              </button>

              {/* Audio Toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-lg border transition ${
                  audioEnabled
                    ? 'border-emerald-600/70 bg-emerald-950/60 text-emerald-400'
                    : 'border-stone-800 bg-stone-800/50 text-stone-400 hover:text-white hover:bg-stone-800'
                }`}
                title={audioEnabled ? 'Sons ativados' : 'Sons desativados'}
              >
                {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Reset Demo Data Button (Apenas Admin e Super Admin) */}
              {(currentUser?.perfil === 'admin' || currentUser?.perfil === 'super_admin') && (
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg border border-stone-800 bg-stone-800/50 text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
                  title="Restaurar dados de teste"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Operator Badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300">
                  {userInitials}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase leading-tight text-white truncate max-w-[90px]">
                    {currentUser?.nome || 'Operador'}
                  </p>
                  <p className="text-[9px] text-stone-400 uppercase font-mono leading-none">
                    {currentUser?.perfil || 'garcom'}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="p-2 rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/70 text-red-300 transition"
                title="Trocar de usuário / Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Header Right: Quick Operator Avatar & Logout */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-stone-800 border border-stone-700 text-stone-200">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300">
                  {userInitials}
                </div>
                <span className="text-[11px] font-bold truncate max-w-[90px] text-white">
                  {currentUser?.nome ? currentUser.nome.split(' ')[0] : 'Operador'}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/70 text-red-300 transition"
                title="Trocar de usuário / Sair"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Nav Tabs (Row 2 on mobile) - RBAC & Strict Role Isolation */}
          {currentUser?.perfil === 'garcom' && (
            <div className="flex md:hidden items-center justify-between pt-2 pb-0.5 border-t border-stone-800/80 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-300">
                <UtensilsCrossed className="w-3.5 h-3.5 text-red-400" />
                <span>Painel do Garçom • Salão & Mesas</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded-md border border-stone-700">
                {tables.length} mesas
              </span>
            </div>
          )}

          {currentUser?.perfil === 'cozinha' && (
            <div className="flex md:hidden items-center justify-between pt-2 pb-0.5 border-t border-stone-800/80 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                <span>Monitor da Cozinha (KDS)</span>
              </span>
              {kitchenActiveCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40 animate-pulse">
                  {kitchenActiveCount} preparando
                </span>
              )}
            </div>
          )}

          {currentUser?.perfil === 'caixa' && (
            <nav className="flex md:hidden items-center gap-1 overflow-x-auto pt-2 pb-0.5 scrollbar-none border-t border-stone-800/80 mt-2">
              <button
                onClick={() => onChangeModule('caixa')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                  currentModule === 'caixa'
                    ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-xs'
                    : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <span className="text-[10px] font-mono text-emerald-400 font-bold">01</span>
                <span className="uppercase text-[11px]">CAIXA / PDV</span>
              </button>
              <button
                onClick={() => onChangeModule('garcom')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                  currentModule === 'garcom'
                    ? 'bg-red-600/25 border-red-500 text-white shadow-xs'
                    : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <span className="text-[10px] font-mono text-red-400 font-bold">02</span>
                <span className="uppercase text-[11px]">MESAS</span>
              </button>
            </nav>
          )}

          {currentUser?.perfil === 'admin' && (
            <nav className="flex md:hidden items-center gap-1 overflow-x-auto pt-2 pb-0.5 scrollbar-none border-t border-stone-800/80 mt-2">
              <button
                onClick={() => onChangeModule('garcom')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                  currentModule === 'garcom'
                    ? 'bg-red-600/25 border-red-500 text-white shadow-xs'
                    : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <span className="text-[10px] font-mono text-red-400 font-bold">01</span>
                <span className="uppercase text-[11px]">MESAS</span>
              </button>

              <button
                onClick={() => onChangeModule('cozinha')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                  currentModule === 'cozinha'
                    ? 'bg-amber-500/25 border-amber-500 text-white shadow-xs'
                    : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <span className="text-[10px] font-mono text-amber-400 font-bold">02</span>
                <span className="uppercase text-[11px]">
                  COZINHA {kitchenActiveCount > 0 && `(${kitchenActiveCount})`}
                </span>
              </button>

              <button
                onClick={() => onChangeModule('caixa')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                  currentModule === 'caixa'
                    ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-xs'
                    : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <span className="text-[10px] font-mono text-emerald-400 font-bold">03</span>
                <span className="uppercase text-[11px]">CAIXA</span>
              </button>

              <button
                onClick={() => onChangeModule('admin')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold tracking-tight transition-all border shrink-0 ${
                  currentModule === 'admin'
                    ? 'bg-purple-600/25 border-purple-500 text-white shadow-xs'
                    : 'border-transparent text-stone-400 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <span className="text-[10px] font-mono text-purple-400 font-bold">04</span>
                <span className="uppercase text-[11px]">ADMIN</span>
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* 2. Mobile Store Information & Utility Toolbar (ROLA JUNTO COM A TELA - NOT STICKY) */}
      <div className="md:hidden bg-stone-900/95 dark:bg-stone-900 border-b border-stone-800 px-3 py-2 space-y-2">
        {/* Full Action Toolbar from Screenshot: Nuvem Ativa, Delivery, Loja, Tema, Som, Reset, Operador */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {/* Cloud Status */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-[10px] font-bold text-emerald-400 shrink-0 shadow-2xs"
            title="Cloud Firestore conectado em tempo real"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Cloud className="w-3.5 h-3.5" />
            <span>Nuvem Ativa</span>
          </div>

          {/* Copy Delivery Link */}
          <button
            onClick={handleCopyDeliveryLink}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer ${
              linkCopied
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                : 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200'
            }`}
            title="Copiar link do cardápio digital de delivery"
          >
            {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
            <span>{linkCopied ? 'Copiado!' : 'Delivery'}</span>
          </button>

          {/* Store Indicator / Switcher */}
          {currentUser?.perfil === 'super_admin' ? (
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center bg-stone-950/80 border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-amber-300 font-medium">
                <Building2 className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
                <select
                  value={currentLojaId}
                  onChange={(e) => setCurrentLojaId(e.target.value)}
                  className="bg-transparent text-amber-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1 max-w-[130px] truncate"
                >
                  <option value="todas" className="bg-stone-900 text-white">🏢 Todas as Lojas</option>
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id} className="bg-stone-900 text-white">
                      📍 {l.nome}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowStoresModal(true)}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>+ Lojas</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-stone-800 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 font-semibold shrink-0">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-red-400 shrink-0" />
              <span className="truncate max-w-[150px]">{currentLoja?.nome || 'Loja Principal'}</span>
            </div>
          )}

          {/* Dark / Light Mode */}
          <button
            onClick={() => setDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-lg border transition shrink-0 cursor-pointer ${
              isDarkMode
                ? 'border-amber-500/70 bg-amber-950/60 text-amber-300'
                : 'border-stone-800 bg-stone-800/50 text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
            title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
          </button>

          {/* Audio */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-1.5 rounded-lg border transition shrink-0 cursor-pointer ${
              audioEnabled
                ? 'border-emerald-600/70 bg-emerald-950/60 text-emerald-400'
                : 'border-stone-800 bg-stone-800/50 text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
            title={audioEnabled ? 'Sons ativados' : 'Sons desativados'}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Demo Data (Apenas Admin e Super Admin) */}
          {(currentUser?.perfil === 'admin' || currentUser?.perfil === 'super_admin') && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-stone-800 bg-stone-800/50 text-stone-400 hover:text-white hover:bg-stone-800 transition shrink-0 cursor-pointer"
              title="Restaurar dados de teste"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Full Operator Badge */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-stone-800 shrink-0">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300">
              {userInitials}
            </div>
            <div className="text-left leading-tight">
              <span className="text-[10px] font-bold text-white block truncate max-w-[100px]">
                {currentUser?.nome || 'Operador'}
              </span>
              <span className="text-[9px] text-stone-400 uppercase font-mono block">
                {currentUser?.perfil || 'garcom'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Metrics (Vendas do dia, Mesas, Ticket Médio) - Exclusivo para ADMIN da loja */}
        {currentUser?.perfil === 'admin' && (
          <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-stone-800/80 text-center">
            <div className="bg-stone-950/60 p-1.5 rounded-xl border border-stone-800/80">
              <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-tight">Vendas Hoje</span>
              <span className="text-xs font-mono font-bold text-stone-100">{formatCurrency(totalSales)}</span>
            </div>
            <div className="bg-stone-950/60 p-1.5 rounded-xl border border-stone-800/80">
              <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-tight">Mesas</span>
              <span className="text-xs font-mono font-bold text-stone-100">{occupiedCount} / {tables.length}</span>
            </div>
            <div className="bg-stone-950/60 p-1.5 rounded-xl border border-stone-800/80">
              <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-tight">Ticket Médio</span>
              <span className="text-xs font-mono font-bold text-stone-100">{formatCurrency(ticketMedio)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Metric & Status Bar - Exclusivo para ADMIN da loja */}
      {currentUser?.perfil === 'admin' && (
        <div className="hidden md:block bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-b border-stone-200/90 dark:border-stone-800 px-4 sm:px-6 py-2.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 sm:gap-10">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-400 tracking-wider">
                  Vendas do Dia
                </span>
                <span className="text-base sm:text-xl font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  {formatCurrency(totalSales)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-400 tracking-wider">
                  Mesas Ocupadas
                </span>
                <span className="text-base sm:text-xl font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  {occupiedCount} / {tables.length}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-400 tracking-wider">
                  Ticket Médio
                </span>
                <span className="text-base sm:text-xl font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  {formatCurrency(ticketMedio)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistema Online
              </span>
            </div>
          </div>
        </div>
      )}

      {showStoresModal && <SuperAdminStoresModal onClose={() => setShowStoresModal(false)} />}
    </div>
  );
};
