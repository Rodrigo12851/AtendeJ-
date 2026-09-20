import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Phone,
  DollarSign,
  X,
  ExternalLink,
  Store,
  Users,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Clock,
  FileText,
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const SuperAdminView: React.FC = () => {
  const {
    lojas,
    users,
    loginAttempts,
    toggleLojaAtiva,
    createStoreWithAdmin,
    resetLoginLockout,
    isUserLockedOut,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'lojas' | 'seguranca' | 'lgpd'>('lojas');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [searchLoja, setSearchLoja] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativas' | 'suspensas'>('todos');

  // Form State da Nova Loja
  const [nomeLoja, setNomeLoja] = useState('');
  const [marcaLoja, setMarcaLoja] = useState('');
  const [cnpjLoja, setCnpjLoja] = useState('');
  const [slugLoja, setSlugLoja] = useState('');
  const [enderecoLoja, setEnderecoLoja] = useState('');
  const [telefoneLoja, setTelefoneLoja] = useState('');
  const [taxaEntrega, setTaxaEntrega] = useState('7.50');
  const [planoLoja, setPlanoLoja] = useState<'basico' | 'pro' | 'enterprise'>('pro');

  // Form State do Usuário Administrador da Loja
  const [adminNome, setAdminNome] = useState('');
  const [adminUsuario, setAdminUsuario] = useState('');
  const [adminSenha, setAdminSenha] = useState('123');
  const [adminPin, setAdminPin] = useState('1234');

  // Métricas do SaaS
  const metricas = useMemo(() => {
    const totalLojas = lojas.length;
    const ativas = lojas.filter((l) => l.ativa).length;
    const suspensas = totalLojas - ativas;
    const totalTentativasFalhas = loginAttempts.filter((a) => !a.sucesso).length;
    const tentativasBloqueadas = loginAttempts.filter((a) => a.bloqueado).length;

    return {
      totalLojas,
      ativas,
      suspensas,
      totalTentativasFalhas,
      tentativasBloqueadas,
    };
  }, [lojas, loginAttempts]);

  // Lojas filtradas
  const lojasFiltradas = useMemo(() => {
    return lojas.filter((l) => {
      const matchSearch =
        l.nome.toLowerCase().includes(searchLoja.toLowerCase()) ||
        (l.marca && l.marca.toLowerCase().includes(searchLoja.toLowerCase())) ||
        l.slug.toLowerCase().includes(searchLoja.toLowerCase());

      if (!matchSearch) return false;
      if (filtroStatus === 'ativas') return l.ativa;
      if (filtroStatus === 'suspensas') return !l.ativa;
      return true;
    });
  }, [lojas, searchLoja, filtroStatus]);

  const handleCopyLink = (loja: typeof lojas[0]) => {
    const origin = window.location.origin;
    let url = `${origin}/?loja=${loja.slug}`;
    if (loja.marca) url += `&marca=${encodeURIComponent(loja.marca)}`;
    if (loja.nome) url += `&nome=${encodeURIComponent(loja.nome)}`;
    if (loja.logo_url && !loja.logo_url.startsWith('data:')) {
      url += `&logo=${encodeURIComponent(loja.logo_url)}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedSlug(loja.slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeLoja || !slugLoja || !adminNome || !adminUsuario || !adminPin) return;

    createStoreWithAdmin(
      {
        nome: nomeLoja,
        marca: marcaLoja || nomeLoja,
        cnpj: cnpjLoja,
        slug: slugLoja.toLowerCase().trim().replace(/\s+/g, '-'),
        endereco: enderecoLoja,
        telefone: telefoneLoja,
        taxa_entrega: parseFloat(taxaEntrega.replace(',', '.')) || 0,
        plano: planoLoja,
      },
      {
        nome: adminNome,
        usuario: adminUsuario.trim().toLowerCase(),
        senha: adminSenha,
        pin: adminPin,
      }
    );

    // Reset Form
    setNomeLoja('');
    setMarcaLoja('');
    setCnpjLoja('');
    setSlugLoja('');
    setEnderecoLoja('');
    setTelefoneLoja('');
    setAdminNome('');
    setAdminUsuario('');
    setAdminPin('1234');
    setShowAddForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Dono do App */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-amber-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Painel do Dono da Plataforma (SaaS)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LGPD Compliance Ativo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Gestão de Lojas, Clientes & Segurança</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
              Aqui você cadastra novos restaurantes parceiros, gerencia assinaturas e monitora tentativas de acesso em tempo real.
              <strong className="text-stone-300 ml-1">
                Seus clientes têm privacidade total: comandas, pedidos e caixas operam em bancos segregados.
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Loja</span>
          </button>
        </div>

        {/* Métricas Cards Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-stone-800/80">
          <div className="bg-stone-800/50 p-3.5 rounded-2xl border border-stone-700/50">
            <span className="text-[11px] font-bold text-stone-400 block uppercase">Lojas Ativas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{metricas.ativas}</span>
              <span className="text-[10px] text-stone-400">de {metricas.totalLojas}</span>
            </div>
          </div>

          <div className="bg-stone-800/50 p-3.5 rounded-2xl border border-stone-700/50">
            <span className="text-[11px] font-bold text-stone-400 block uppercase">Lojas Suspensas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${metricas.suspensas > 0 ? 'text-red-400' : 'text-stone-400'}`}>
                {metricas.suspensas}
              </span>
              <span className="text-[10px] text-stone-400">inadimplência</span>
            </div>
          </div>

          <div className="bg-stone-800/50 p-3.5 rounded-2xl border border-stone-700/50">
            <span className="text-[11px] font-bold text-stone-400 block uppercase">Tentativas de Login</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400">{loginAttempts.length}</span>
              <span className="text-[10px] text-stone-400">auditadas</span>
            </div>
          </div>

          <div className="bg-stone-800/50 p-3.5 rounded-2xl border border-stone-700/50">
            <span className="text-[11px] font-bold text-stone-400 block uppercase">Ataques Bloqueados</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${metricas.tentativasBloqueadas > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {metricas.tentativasBloqueadas}
              </span>
              <span className="text-[10px] text-stone-400">força bruta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas do Dono */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('lojas')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'lojas'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Lojas Parceiras ({lojas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seguranca')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'seguranca'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Auditoria de Logins & Invasão</span>
          {metricas.tentativasBloqueadas > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lgpd')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'lgpd'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
              : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Privacidade & LGPD</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: LOJAS PARCEIRAS */}
      {/* ========================================================================= */}
      {activeTab === 'lojas' && (
        <div className="space-y-6">
          {/* Modal / Card Expansível de Cadastro */}
          {showAddForm && (
            <div className="bg-white dark:bg-stone-900 p-6 sm:p-7 rounded-3xl border-2 border-amber-500/40 shadow-xl space-y-5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-amber-500" />
                    <span>Cadastrar Nova Loja Contratante</span>
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Informe os dados da empresa parceira e crie o usuário gerente de acesso.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer text-stone-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStore} className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
                    1. Dados da Loja / Restaurante
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Nome da Loja / Filial *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Pizzaria Forno Nobre"
                        value={nomeLoja}
                        onChange={(e) => setNomeLoja(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Nome da Marca (Para Cardápio)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Forno Nobre Pizzas"
                        value={marcaLoja}
                        onChange={(e) => setMarcaLoja(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Identificador URL (Slug) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: forno-nobre"
                        value={slugLoja}
                        onChange={(e) => setSlugLoja(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        CNPJ da Empresa
                      </label>
                      <input
                        type="text"
                        placeholder="00.000.000/0001-00"
                        value={cnpjLoja}
                        onChange={(e) => setCnpjLoja(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 98765-4321"
                        value={telefoneLoja}
                        onChange={(e) => setTelefoneLoja(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Taxa de Entrega Padrão (R$)
                      </label>
                      <input
                        type="text"
                        placeholder="7.50"
                        value={taxaEntrega}
                        onChange={(e) => setTaxaEntrega(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, número, bairro e cidade"
                        value={enderecoLoja}
                        onChange={(e) => setEnderecoLoja(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Plano Contratado
                      </label>
                      <select
                        value={planoLoja}
                        onChange={(e) => setPlanoLoja(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="basico">Plano Básico (R$ 99/mês)</option>
                        <option value="pro">Plano Pro (R$ 189/mês)</option>
                        <option value="enterprise">Plano Enterprise (R$ 349/mês)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-200 dark:border-stone-800 pt-5">
                  <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>2. Usuário Administrador / Gerente da Loja</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Nome do Gerente *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Roberto Gerente"
                        value={adminNome}
                        onChange={(e) => setAdminNome(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Login de Usuário *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: roberto.loja"
                        value={adminUsuario}
                        onChange={(e) => setAdminUsuario(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Senha Inicial
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        value={adminSenha}
                        onChange={(e) => setAdminSenha(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        PIN Rápido (4 dígitos) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="1234"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Concluir Cadastro da Loja</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por nome, marca ou slug..."
                value={searchLoja}
                onChange={(e) => setSearchLoja(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Status:
              </span>
              <button
                type="button"
                onClick={() => setFiltroStatus('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filtroStatus === 'todos'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                Todas ({lojas.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('ativas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filtroStatus === 'ativas'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                Ativas ({metricas.ativas})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('suspensas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filtroStatus === 'suspensas'
                    ? 'bg-red-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                Suspensas ({metricas.suspensas})
              </button>
            </div>
          </div>

          {/* Cards das Lojas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lojasFiltradas.map((loja) => {
              const adminUser = users.find((u) => u.id === loja.admin_usuario_id || (u.loja_id === loja.id && u.perfil === 'admin'));

              return (
                <div
                  key={loja.id}
                  className={`p-5 rounded-3xl border transition-all shadow-xs bg-white dark:bg-stone-900 ${
                    loja.ativa
                      ? 'border-stone-200 dark:border-stone-800'
                      : 'border-red-300 dark:border-red-950/60 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {loja.logo_url ? (
                        <img
                          src={loja.logo_url}
                          alt={loja.nome}
                          className="w-12 h-12 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 bg-stone-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-500/30">
                          <Store className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                            {loja.marca || loja.nome}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              loja.ativa
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {loja.ativa ? 'Ativa' : 'Suspensa'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          {loja.nome} • <span className="font-mono text-amber-600">/{loja.slug}</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {loja.plano ? `Plano ${loja.plano}` : 'Plano Pro'}
                    </span>
                  </div>

                  {/* Informações Cadastrais da Loja */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 grid grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{loja.endereco || 'Endereço não informado'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{loja.telefone || 'Telefone não informado'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Entrega: {formatCurrency(loja.taxa_entrega)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{loja.cnpj ? `CNPJ: ${loja.cnpj}` : 'Sem CNPJ'}</span>
                    </div>
                  </div>

                  {/* Usuário Gerente Vinculado */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👨‍💼</span>
                      <div>
                        <span className="font-bold text-stone-800 dark:text-white block text-[11px]">
                          Gerente: {adminUser?.nome || 'Admin Padrão'}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          login: {adminUser?.usuario || 'admin'} • PIN: {adminUser?.pin || '****'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400">Acesso Restrito à Loja</span>
                  </div>

                  {/* Ações do Dono do App */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(loja)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        copiedSlug === loja.slug
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      {copiedSlug === loja.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSlug === loja.slug ? 'Link Copiado!' : 'Link Cardápio WhatsApp'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleLojaAtiva(loja.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        loja.ativa
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {loja.ativa ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{loja.ativa ? 'Suspender Loja' : 'Ativar Loja'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: SEGURANÇA & AUDITORIA DE LOGINS */}
      {/* ========================================================================= */}
      {activeTab === 'seguranca' && (
        <div className="space-y-5">
          {/* Banner de Proteção contra Força Bruta */}
          <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-transparent p-5 rounded-3xl border border-amber-500/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-bold shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <span>Monitoramento Ativo de Tentativas de Invasão & Força Bruta</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    5 Falhas = Bloqueio Automático
                  </span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 max-w-3xl leading-relaxed">
                  Toda vez que alguém tenta adivinhar o PIN ou senha de um usuário, o sistema registra data, hora e usuário tentado.
                  Se houver 5 tentativas com erro no intervalo de 15 minutos, a conta é congelada temporariamente para impedir quebra de senha.
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Tentativas de Acesso */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span>Histórico de Tentativas de Login ({loginAttempts.length})</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Registros em tempo real na nuvem Firestore para auditoria de segurança.
                </p>
              </div>
            </div>

            {loginAttempts.length === 0 ? (
              <div className="p-12 text-center text-stone-400 space-y-2">
                <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum incidente registrado</p>
                <p className="text-xs text-stone-500">Todas as tentativas de acesso até agora foram normais.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 font-bold border-b border-stone-200 dark:border-stone-800 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Data / Horário</th>
                      <th className="px-4 py-3">Usuário Tentado</th>
                      <th className="px-4 py-3">Status do Acesso</th>
                      <th className="px-4 py-3">Motivo / Detalhe</th>
                      <th className="px-4 py-3 text-right">Ação de Segurança</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {loginAttempts.map((attempt) => {
                      const lockout = isUserLockedOut(attempt.usuario);

                      return (
                        <tr
                          key={attempt.id}
                          className={`hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition ${
                            attempt.bloqueado ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-stone-600 dark:text-stone-400">
                            {formatDateTime(attempt.data_hora)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-stone-900 dark:text-white block font-mono">
                              {attempt.usuario}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {attempt.bloqueado ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                🚫 Bloqueado por Força Bruta
                              </span>
                            ) : attempt.sucesso ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                ✓ Login Concluído
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                ⚠️ PIN Incorreto
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-stone-500 dark:text-stone-400">
                            {attempt.motivo_falha || 'Autenticação autorizada'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {lockout.locked ? (
                              <button
                                type="button"
                                onClick={() => resetLoginLockout(attempt.usuario)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer"
                              >
                                Desbloquear Conta
                              </button>
                            ) : (
                              <span className="text-[11px] text-stone-400 font-medium">Protegido</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: CONFORMIDADE LGPD */}
      {/* ========================================================================= */}
      {activeTab === 'lgpd' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-7 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  Blindagem Jurídica & Diretrizes da LGPD (Lei nº 13.709/2018)
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Como o seu sistema protege você (Dono da Plataforma) contra processos judiciais de vazamento de dados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-sm">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>1. Segregação Rígida de Dados (Multi-Tenancy)</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Cada restaurante tem seus clientes, pedidos e produtos identificados por um <code className="font-mono bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded text-[11px]">loja_id</code> estrito. Uma pizzaria concorrente nunca tem permissão técnica de ler ou alterar os dados de outra.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <span>2. Não Exposição de Dados pelo Dono</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  O Dono do App não opera o salão nem o caixa dos clientes. Isso garante que você não é caracterizado como controlador direto dos dados fiscais daquele restaurante, resguardando sua empresa de responsabilidade civil indevida.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-sm">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>3. Consentimento Explícito no Delivery</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Antes de finalizar um pedido de delivery, o cliente visualiza o aviso legal de que seus dados (nome, telefone e endereço) são tratados exclusivamente para o despacho e entrega daquela refeição.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-sm">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>4. Zero Retenção de Dados Bancários</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  O sistema não armazena números de cartões de crédito ou códigos de segurança (CVV). Pagamentos são concluídos na maquininha física do garçom/motoboy ou via PIX, eliminando qualquer risco de fraude de cartão.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
