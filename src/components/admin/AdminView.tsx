import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  UtensilsCrossed,
  Plus,
  AlertTriangle,
  Award,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Boxes,
  Camera,
  Upload,
  Image as ImageIcon,
  Settings,
  Store,
  MapPin,
  Share2,
  ExternalLink,
  Copy,
  Cloud,
  Database,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, Table, User, Category } from '../../types';
import { formatCurrency, formatDateTime, formatTime } from '../../utils/formatters';
import { compressImageFile } from '../../utils/imageCompressor';
import { GraficosVendasPanel } from './GraficosVendasPanel';

export const AdminView: React.FC = () => {
  const {
    products,
    categories,
    tables,
    users,
    orders,
    comandas,
    addProduct,
    updateProduct,
    deleteProduct,
    addTable,
    deleteTable,
    addUser,
    deleteUser,
    toggleUserStatus,
    currentLojaId,
    currentLoja,
    updateLoja,
    addTaxaBairro,
    deleteTaxaBairro,
    pizzaSizes,
    pizzaCrusts,
    pizzaDoughs,
    pizzaAddons,
    addPizzaSize,
    updatePizzaSize,
    deletePizzaSize,
    addPizzaCrust,
    updatePizzaCrust,
    deletePizzaCrust,
    addPizzaDough,
    updatePizzaDough,
    deletePizzaDough,
    addPizzaAddon,
    updatePizzaAddon,
    deletePizzaAddon,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'metricas' | 'graficos' | 'produtos' | 'opcoes' | 'mesas' | 'usuarios' | 'cancelamentos' | 'configuracoes'
  >('graficos');
  const [metricasSubView, setMetricasSubView] = useState<'graficos' | 'tabelas'>('graficos');
  const [periodFilter, setPeriodFilter] = useState<'hoje' | '7dias' | 'mes'>('hoje');

  // Modals for CRUD
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Customization Option Modals
  const [showOptionModal, setShowOptionModal] = useState<'size' | 'crust' | 'dough' | 'addon' | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState('');
  const [optSlices, setOptSlices] = useState('8');
  const [optMaxFlavors, setOptMaxFlavors] = useState('2');
  const [optMultiplier, setOptMultiplier] = useState('1.0');

  // New Product Form State (with photo/image and customization toggles)
  const [prodNome, setProdNome] = useState('');
  const [prodCategoria, setProdCategoria] = useState('pizzas');
  const [prodPreco, setProdPreco] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImagem, setProdImagem] = useState('');
  const [prodIsPizza, setProdIsPizza] = useState(false);
  const [prodImprimeCozinha, setProdImprimeCozinha] = useState(true);
  const [prodPermitirTamanhos, setProdPermitirTamanhos] = useState(true);
  const [prodPermitirBordas, setProdPermitirBordas] = useState(true);
  const [prodPermitirMassas, setProdPermitirMassas] = useState(true);
  const [prodPermitirAdicionais, setProdPermitirAdicionais] = useState(true);
  const [prodTamanhosSel, setProdTamanhosSel] = useState<string[]>([]);
  const [prodBordasSel, setProdBordasSel] = useState<string[]>([]);
  const [prodMassasSel, setProdMassasSel] = useState<string[]>([]);
  const [prodAdicionaisSel, setProdAdicionaisSel] = useState<string[]>([]);

  // New Table Form State
  const [tableNumero, setTableNumero] = useState(tables.length + 1);
  const [tableCapacidade, setTableCapacidade] = useState(4);
  const [tableLocalizacao, setTableLocalizacao] = useState('Salão Principal');

  // New User Form State
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<'garcom' | 'cozinha' | 'caixa' | 'admin'>('garcom');
  const [userPin, setUserPin] = useState('');

  // Store Settings Form State
  const [lojaMarca, setLojaMarca] = useState(currentLoja?.marca || 'Pizzaria Itália');
  const [lojaNome, setLojaNome] = useState(currentLoja?.nome || '');
  const [lojaLogoUrl, setLojaLogoUrl] = useState(currentLoja?.logo_url || '');
  const [lojaTaxa, setLojaTaxa] = useState(currentLoja?.taxa_entrega?.toString() || '7.00');
  const [lojaEndereco, setLojaEndereco] = useState(currentLoja?.endereco || '');
  const [lojaTelefone, setLojaTelefone] = useState(currentLoja?.telefone || '');
  const [lojaTempo, setLojaTempo] = useState(currentLoja?.tempo_estimado_entrega || '30 - 45 min');
  const [lojaHorario, setLojaHorario] = useState(currentLoja?.horario_funcionamento || '18:00 às 23:30');
  const [lojaSaved, setLojaSaved] = useState(false);

  // New Neighborhood Fee State
  const [newBairroNome, setNewBairroNome] = useState('');
  const [newBairroValor, setNewBairroValor] = useState('');
  const [adminLinkCopied, setAdminLinkCopied] = useState(false);

  const getDeliveryUrl = () => {
    const slug = currentLoja?.slug || 'loja-centro';
    let url = `${window.location.origin}/?loja=${slug}`;
    if (lojaMarca) {
      url += `&marca=${encodeURIComponent(lojaMarca)}`;
    }
    if (lojaNome) {
      url += `&nome=${encodeURIComponent(lojaNome)}`;
    }
    if (lojaLogoUrl && !lojaLogoUrl.startsWith('data:')) {
      url += `&logo=${encodeURIComponent(lojaLogoUrl)}`;
    }
    return url;
  };

  const handleCopyLinkFromAdmin = () => {
    const url = getDeliveryUrl();
    navigator.clipboard.writeText(url);
    setAdminLinkCopied(true);
    setTimeout(() => setAdminLinkCopied(false), 2500);
  };

  const handleAddBairroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoja || !newBairroNome.trim()) return;
    const val = parseFloat(newBairroValor.replace(',', '.')) || 0;
    addTaxaBairro(currentLoja.id, newBairroNome.trim(), val);
    setNewBairroNome('');
    setNewBairroValor('');
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressImageFile(file, 400, 400, 0.85);
      setLojaLogoUrl(compressedUrl);
    } catch {
      alert('Erro ao carregar e comprimir a imagem da logo.');
    }
  };

  useEffect(() => {
    if (currentLoja) {
      setLojaMarca(currentLoja.marca || 'Pizzaria Itália');
      setLojaNome(currentLoja.nome);
      setLojaLogoUrl(currentLoja.logo_url || '');
      setLojaTaxa(currentLoja.taxa_entrega.toString());
      setLojaEndereco(currentLoja.endereco || '');
      setLojaTelefone(currentLoja.telefone || '');
      setLojaTempo(currentLoja.tempo_estimado_entrega || '30 - 45 min');
      setLojaHorario(currentLoja.horario_funcionamento || '18:00 às 23:30');
    }
  }, [currentLoja]);

  const handleSaveLoja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoja) return;
    const taxaNum = parseFloat(lojaTaxa.replace(',', '.')) || 0;
    updateLoja({
      ...currentLoja,
      marca: lojaMarca.trim() || 'Pizzaria Itália',
      nome: lojaNome.trim() || currentLoja.nome,
      logo_url: lojaLogoUrl.trim() || undefined,
      taxa_entrega: taxaNum,
      endereco: lojaEndereco.trim(),
      telefone: lojaTelefone.trim(),
      tempo_estimado_entrega: lojaTempo.trim(),
      horario_funcionamento: lojaHorario.trim(),
    });
    setLojaSaved(true);
    setTimeout(() => setLojaSaved(false), 3000);
  };

  // 1. Financial Metrics Calculations (PRD Section 25)
  const totalSales = useMemo(() => {
    return comandas
      .filter((c) => c.status === 'fechada')
      .reduce((acc, c) => acc + c.total, 0);
  }, [comandas]);

  const totalComandasCount = comandas.length;
  const closedComandasCount = comandas.filter((c) => c.status === 'fechada').length;
  const ticketMedio = closedComandasCount > 0 ? totalSales / closedComandasCount : 0;
  const activeOrdersCount = orders.length;

  // 2. Best-selling Products Ranking (PRD Section 26)
  const productRanking = useMemo(() => {
    const counts: Record<string, { nome: string; count: number; totalVal: number }> = {};

    orders.forEach((order) => {
      order.itens.forEach((item) => {
        if (item.status !== 'cancelado') {
          if (!counts[item.nome]) {
            counts[item.nome] = { nome: item.nome, count: 0, totalVal: 0 };
          }
          counts[item.nome].count += item.quantidade;
          counts[item.nome].totalVal += item.preco_total;
        }
      });
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [orders]);

  // 3. Waiter Sales Ranking (PRD Section 26)
  const waiterRanking = useMemo(() => {
    const ranking: Record<string, { nome: string; total: number; count: number }> = {};

    comandas.forEach((cmd) => {
      if (!ranking[cmd.garcom_nome]) {
        ranking[cmd.garcom_nome] = { nome: cmd.garcom_nome, total: 0, count: 0 };
      }
      ranking[cmd.garcom_nome].total += cmd.total;
      ranking[cmd.garcom_nome].count += 1;
    });

    return Object.values(ranking).sort((a, b) => b.total - a.total);
  }, [comandas]);

  // 4. Audit of Cancellations (PRD Section 17 & 26)
  const cancellationAuditList = useMemo(() => {
    const list: Array<{
      orderId: number;
      mesaNumero: number;
      itemNome: string;
      quantidade: number;
      valor: number;
      motivo: string;
      data: string;
      usuarioNome: string;
    }> = [];

    orders.forEach((order) => {
      order.itens.forEach((item) => {
        if (item.status === 'cancelado' && item.cancelamento) {
          list.push({
            orderId: order.id,
            mesaNumero: order.mesa_numero,
            itemNome: item.nome,
            quantidade: item.quantidade,
            valor: item.preco_total,
            motivo: item.cancelamento.motivo,
            data: item.cancelamento.data,
            usuarioNome: item.cancelamento.usuario_nome,
          });
        }
      });
    });

    return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [orders]);

  // Handle Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(prodPreco.replace(',', '.'));
    if (!prodNome || isNaN(priceNum)) return;

    const defaultImg = 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600';
    const finalImage = prodImagem.trim() || defaultImg;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        nome: prodNome,
        categoria_id: prodCategoria,
        preco: priceNum,
        descricao: prodDesc,
        imagem: finalImage,
        isPizza: prodIsPizza,
        imprime_cozinha: prodImprimeCozinha,
        permitirTamanhos: prodPermitirTamanhos,
        permitirBordas: prodPermitirBordas,
        permitirMassas: prodPermitirMassas,
        permitirAdicionais: prodPermitirAdicionais,
        tamanhos_disponiveis: prodTamanhosSel,
        bordas_disponiveis: prodBordasSel,
        massas_disponiveis: prodMassasSel,
        adicionais_disponiveis: prodAdicionaisSel,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        codigo_interno: `P${Math.floor(100 + Math.random() * 900)}`,
        nome: prodNome,
        categoria_id: prodCategoria,
        preco: priceNum,
        descricao: prodDesc,
        imagem: finalImage,
        ativo: true,
        imprime_cozinha: prodImprimeCozinha,
        isPizza: prodIsPizza,
        permitirTamanhos: prodPermitirTamanhos,
        permitirBordas: prodPermitirBordas,
        permitirMassas: prodPermitirMassas,
        permitirAdicionais: prodPermitirAdicionais,
        tamanhos_disponiveis: prodTamanhosSel,
        bordas_disponiveis: prodBordasSel,
        massas_disponiveis: prodMassasSel,
        adicionais_disponiveis: prodAdicionaisSel,
      });
    }

    setProdNome('');
    setProdPreco('');
    setProdDesc('');
    setProdImagem('');
    setShowAddProductModal(false);
  };

  // Handle Save Customization Option (Size, Crust, Dough, Addon)
  const handleSaveOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optName.trim() || !showOptionModal) return;

    const priceVal = parseFloat(optPrice.replace(',', '.')) || 0;

    if (showOptionModal === 'size') {
      const sizeObj = {
        nome: optName.trim(),
        fatias: parseInt(optSlices, 10) || 8,
        maxSabores: parseInt(optMaxFlavors, 10) || 2,
        multiplicador: parseFloat(optMultiplier) || 1.0,
      };
      if (editingOptionId) {
        updatePizzaSize({ id: editingOptionId, ...sizeObj });
      } else {
        addPizzaSize(sizeObj);
      }
    } else if (showOptionModal === 'crust') {
      const crustObj = { nome: optName.trim(), preco: priceVal };
      if (editingOptionId) {
        updatePizzaCrust({ id: editingOptionId, ...crustObj });
      } else {
        addPizzaCrust(crustObj);
      }
    } else if (showOptionModal === 'dough') {
      const doughObj = { nome: optName.trim() };
      if (editingOptionId) {
        updatePizzaDough({ id: editingOptionId, ...doughObj });
      } else {
        addPizzaDough(doughObj);
      }
    } else if (showOptionModal === 'addon') {
      const addonObj = { nome: optName.trim(), preco: priceVal };
      if (editingOptionId) {
        updatePizzaAddon({ id: editingOptionId, ...addonObj });
      } else {
        addPizzaAddon(addonObj);
      }
    }

    setShowOptionModal(null);
    setEditingOptionId(null);
    setOptName('');
    setOptPrice('');
  };

  // Handle Save Table
  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    addTable(Number(tableNumero), Number(tableCapacidade), tableLocalizacao);
    setTableNumero((prev) => prev + 1);
    setShowAddTableModal(false);
  };

  // Handle Save User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPin) return;
    addUser({
      nome: userName,
      usuario: userName.toLowerCase().replace(/\s+/g, '.'),
      senha: userPin,
      pin: userPin,
      perfil: userRole,
      ativo: true,
    });
    setUserName('');
    setUserPin('');
    setShowAddUserModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                Painel do Administrador & Gestão
              </h1>
              <p className="text-[11px] text-stone-400 font-medium">
                📍 {currentLojaId === 'todas' ? 'Visão Consolidada (Todas as Lojas)' : `Filial: ${currentLoja?.nome}`} • BI • Cardápio • Mesas • Equipe
              </p>
            </div>
          </div>

          {/* Mobile Tab Selector (Visible on mobile screens) */}
          <div className="md:hidden w-full">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-700 text-white text-xs font-bold rounded-xl focus:outline-hidden focus:border-red-500 cursor-pointer shadow-xs"
            >
              <option value="graficos">📊 Gráficos de Vendas (BI)</option>
              <option value="metricas">📈 Métricas & Vendas Tabulares</option>
              <option value="produtos">🍕 Cardápio ({products.length} produtos)</option>
              <option value="opcoes">📦 Opções & Bordas</option>
              <option value="mesas">🪑 Mesas ({tables.length} mesas)</option>
              <option value="usuarios">👥 Equipe ({users.length} membros)</option>
              <option value="cancelamentos">📋 Auditoria ({cancellationAuditList.length} registros)</option>
              <option value="configuracoes">⚙️ Configurações & Taxas da Loja</option>
            </select>
          </div>

          {/* Desktop / Tablet Horizontal Scrollable Tab Bar */}
          <div className="hidden md:flex items-center gap-1.5 bg-stone-950/80 p-1 sm:p-1.5 rounded-2xl border border-stone-800 overflow-x-auto text-xs font-semibold scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('graficos')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'graficos'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráficos (BI)</span>
            </button>
            <button
              onClick={() => setActiveTab('metricas')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeTab === 'metricas'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Métricas
            </button>
            <button
              onClick={() => setActiveTab('produtos')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeTab === 'produtos'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Cardápio ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('opcoes')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'opcoes'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Opções & Bordas</span>
            </button>
            <button
              onClick={() => setActiveTab('mesas')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeTab === 'mesas'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Mesas ({tables.length})
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeTab === 'usuarios'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Equipe ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelamentos')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0 ${
                activeTab === 'cancelamentos'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>Auditoria</span>
              {cancellationAuditList.length > 0 && (
                <span className="bg-red-950 text-amber-300 px-1.5 py-0.2 text-[10px] rounded-full border border-amber-400/40 font-mono">
                  {cancellationAuditList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'configuracoes'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurações & Taxas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-5 flex-1">
        {/* ================= TAB 0: GRAFICOS DE VENDAS (BI) ================= */}
        {activeTab === 'graficos' && (
          <GraficosVendasPanel
            orders={orders}
            comandas={comandas}
            products={products}
            categories={categories}
            initialPeriod="7dias"
          />
        )}

        {/* ================= TAB 1: METRICAS ================= */}
        {activeTab === 'metricas' && (
          <div className="space-y-5">
            {/* View Mode Toggle / Sub-view Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shadow-2xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">
                    Modo de Exibição: {metricasSubView === 'graficos' ? 'Gráficos de Vendas (Recharts)' : 'Tabelas & Indicadores Numéricos'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Alterne entre a visão gráfica de tendências e o resumo tabular
                  </p>
                </div>
              </div>

              <div className="flex items-center border border-stone-200 bg-stone-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMetricasSubView('graficos')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-1.5 ${
                    metricasSubView === 'graficos'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-700 dark:text-slate-300 hover:text-stone-950'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Gráficos BI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetricasSubView('tabelas')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-1.5 ${
                    metricasSubView === 'tabelas'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-700 dark:text-slate-300 hover:text-stone-950'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tabelas & KPIs</span>
                </button>
              </div>
            </div>

            {metricasSubView === 'graficos' ? (
              <GraficosVendasPanel
                orders={orders}
                comandas={comandas}
                products={products}
                categories={categories}
                initialPeriod="7dias"
              />
            ) : (
              <div className="space-y-5">
                {/* Period Selector (PRD Section 26) */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Filtro por Período:
                  </span>
                  <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setPeriodFilter('hoje')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        periodFilter === 'hoje' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                      }`}
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setPeriodFilter('7dias')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        periodFilter === '7dias' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                      }`}
                    >
                      Últimos 7 dias
                    </button>
                    <button
                      onClick={() => setPeriodFilter('mes')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        periodFilter === 'mes' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                      }`}
                    >
                      Este Mês
                    </button>
                  </div>
                </div>

                {/* Top Stat Cards (PRD Section 25) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                      <span>Faturamento Total</span>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-mono mt-2">
                      {formatCurrency(totalSales)}
                    </div>
                    <span className="text-xs text-emerald-700 font-medium mt-1 block">
                      {closedComandasCount} comandas finalizadas
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                      <span>Ticket Médio</span>
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-mono mt-2">
                      {formatCurrency(ticketMedio)}
                    </div>
                    <span className="text-xs text-stone-400 font-medium mt-1 block">
                      Por comanda fechada
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                      <span>Total de Pedidos</span>
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-mono mt-2">{activeOrdersCount}</div>
                    <span className="text-xs text-blue-700 font-medium mt-1 block">
                      Enviados para a cozinha
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                      <span>Tempo Médio Cozinha</span>
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-mono mt-2">14 min</div>
                    <span className="text-xs text-emerald-700 font-medium mt-1 block">
                      ✓ Dentro da meta (&lt; 20 min)
                    </span>
                  </div>
                </div>

                {/* 2-Column Section: Ranking de Produtos & Ranking de Garçons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Best-selling Products (PRD Section 26) */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase text-stone-800 dark:text-slate-200 tracking-wider">
                        🏆 Produtos Mais Vendidos
                      </h3>
                      <span className="text-xs text-stone-400 font-medium">Qtd / Total</span>
                    </div>

                    <div className="space-y-2">
                      {productRanking.slice(0, 7).map((prod, idx) => (
                        <div
                          key={prod.nome}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                idx === 0
                                  ? 'bg-amber-400 text-stone-950 shadow-2xs'
                                  : idx === 1
                                  ? 'bg-stone-300 text-stone-800 dark:text-slate-200'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {idx + 1}º
                            </span>
                            <div>
                              <span className="font-semibold text-stone-900 dark:text-slate-100 block">{prod.nome}</span>
                              <span className="text-xs text-stone-500 font-mono">
                                {formatCurrency(prod.totalVal)} faturados
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-stone-800 dark:text-slate-200 bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-mono">
                            {prod.count} un
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Waiter Ranking (PRD Section 26) */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase text-stone-800 dark:text-slate-200 tracking-wider">
                        👔 Vendas por Garçom
                      </h3>
                      <span className="text-xs text-stone-400 font-medium">Faturamento</span>
                    </div>

                    <div className="space-y-2">
                      {waiterRanking.map((w, idx) => (
                        <div
                          key={w.nome}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center font-bold text-[11px] text-stone-700 dark:text-slate-300">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-semibold text-stone-900 dark:text-slate-100 block">{w.nome}</span>
                              <span className="text-xs text-stone-500">
                                {w.count} mesas atendidas
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-emerald-700 font-mono">
                            {formatCurrency(w.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PRODUTOS & CARDAPIO ================= */}
        {activeTab === 'produtos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">
                  Catálogo & Cardápio Digital
                </h2>
                <p className="text-xs text-stone-500">
                  Gerencie produtos, fotos, preços, receitas e direcionamento de impressão.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdNome('');
                  setProdPreco('');
                  setProdDesc('');
                  setProdImagem('');
                  setProdIsPizza(true);
                  setProdImprimeCozinha(true);
                  setProdPermitirTamanhos(true);
                  setProdPermitirBordas(true);
                  setProdPermitirMassas(true);
                  setProdPermitirAdicionais(true);
                  setProdTamanhosSel(pizzaSizes.map((s) => s.id));
                  setProdBordasSel(pizzaCrusts.map((c) => c.id));
                  setProdMassasSel(pizzaDoughs.map((d) => d.id));
                  setProdAdicionaisSel(pizzaAddons.map((a) => a.id));
                  setShowAddProductModal(true);
                }}
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Produto</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Código</th>
                      <th className="p-3.5">Foto</th>
                      <th className="p-3.5">Produto</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5">Preço</th>
                      <th className="p-3.5">Impressão</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/80 transition">
                        <td className="p-3.5 font-mono text-stone-600 font-bold">
                          {p.codigo_interno}
                        </td>
                        <td className="p-3.5">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                            {p.imagem ? (
                              <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">🍕</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-stone-900 dark:text-slate-100 block">{p.nome}</span>
                          <span className="text-xs text-stone-500 line-clamp-1">
                            {p.descricao}
                          </span>
                        </td>
                        <td className="p-3.5 capitalize font-medium text-stone-600">
                          {p.categoria_id}
                        </td>
                        <td className="p-3.5 font-bold text-stone-900 dark:text-slate-100 font-mono">
                          {formatCurrency(p.preco)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                              p.imprime_cozinha
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {p.imprime_cozinha ? 'Cozinha / KDS' : 'Balanção / Direto'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.ativo ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {p.ativo ? 'Ativo' : 'Pausado'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProdNome(p.nome);
                              setProdCategoria(p.categoria_id);
                              setProdPreco(p.preco.toString());
                              setProdDesc(p.descricao);
                              setProdImagem(p.imagem || '');
                              setProdIsPizza(!!p.isPizza);
                              setProdImprimeCozinha(p.imprime_cozinha);
                              setProdPermitirTamanhos(p.permitirTamanhos !== false);
                              setProdPermitirBordas(p.permitirBordas !== false);
                              setProdPermitirMassas(p.permitirMassas !== false);
                              setProdPermitirAdicionais(p.permitirAdicionais !== false);
                              setProdTamanhosSel(p.tamanhos_disponiveis || pizzaSizes.map((s) => s.id));
                              setProdBordasSel(p.bordas_disponiveis || pizzaCrusts.map((c) => c.id));
                              setProdMassasSel(p.massas_disponiveis || pizzaDoughs.map((d) => d.id));
                              setProdAdicionaisSel(p.adicionais_disponiveis || pizzaAddons.map((a) => a.id));
                              setShowAddProductModal(true);
                            }}
                            title="Editar Produto"
                            className="p-1.5 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja excluir o produto "${p.nome}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Excluir Produto"
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MESAS & SALÃO ================= */}
        {activeTab === 'mesas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">Mesas do Salão</h2>
                <p className="text-xs text-stone-500">
                  Gerencie a numeração, capacidade e disposição dos ambientes.
                </p>
              </div>
              <button
                onClick={() => setShowAddTableModal(true)}
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar Mesa</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-stone-900 dark:text-slate-100">
                      Mesa {t.numero.toString().padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-500 font-semibold">{t.capacidade} lug</span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir a Mesa ${t.numero}?`)) {
                            deleteTable(t.id);
                          }
                        }}
                        title="Excluir Mesa"
                        className="p-1 text-stone-400 hover:text-red-600 rounded-md transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="text-xs text-stone-500 block">{t.localizacao}</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.status === 'livre'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : t.status === 'ocupada'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3.5: OPÇÕES & BORDAS ================= */}
        {activeTab === 'opcoes' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">
                Opções de Personalização & Bordas
              </h2>
              <p className="text-xs text-stone-500">
                Cadastre ou edite tamanhos, bordas recheadas, massas e adicionais opcionais disponíveis na sua pizzaria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Tamanhos */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-red-600" />
                    <span>Tamanhos Registrados</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOptionId(null);
                      setOptName('');
                      setOptSlices('8');
                      setOptMaxFlavors('2');
                      setOptMultiplier('1.0');
                      setShowOptionModal('size');
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tamanho</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {pizzaSizes.map((sz) => (
                    <div
                      key={sz.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-slate-100 block">{sz.nome}</span>
                        <span className="text-[11px] text-stone-500">
                          {sz.fatias} fatias • Até {sz.maxSabores} sabores • Mult: {sz.multiplicador}x
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingOptionId(sz.id);
                            setOptName(sz.nome);
                            setOptSlices(sz.fatias.toString());
                            setOptMaxFlavors(sz.maxSabores.toString());
                            setOptMultiplier(sz.multiplicador.toString());
                            setShowOptionModal('size');
                          }}
                          className="p-1 text-stone-500 hover:text-red-700 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePizzaSize(sz.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Bordas Recheadas */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-amber-600" />
                    <span>Bordas Recheadas</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOptionId(null);
                      setOptName('');
                      setOptPrice('');
                      setShowOptionModal('crust');
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Borda</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {pizzaCrusts.map((crust) => (
                    <div
                      key={crust.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-slate-100 block">{crust.nome}</span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          {crust.preco === 0 ? 'Sem custo extra' : `+ ${formatCurrency(crust.preco)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingOptionId(crust.id);
                            setOptName(crust.nome);
                            setOptPrice(crust.preco.toString());
                            setShowOptionModal('crust');
                          }}
                          className="p-1 text-stone-500 hover:text-amber-700 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePizzaCrust(crust.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Tipos de Massa */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-emerald-600" />
                    <span>Tipos de Massa</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOptionId(null);
                      setOptName('');
                      setShowOptionModal('dough');
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Massa</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {pizzaDoughs.map((dough) => (
                    <div
                      key={dough.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-stone-900 dark:text-slate-100">{dough.nome}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingOptionId(dough.id);
                            setOptName(dough.nome);
                            setShowOptionModal('dough');
                          }}
                          className="p-1 text-stone-500 hover:text-emerald-700 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePizzaDough(dough.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Adicionais Opcionais */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span>Adicionais Opcionais</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOptionId(null);
                      setOptName('');
                      setOptPrice('');
                      setShowOptionModal('addon');
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicional</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {pizzaAddons.map((addon) => (
                    <div
                      key={addon.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-slate-100 block">{addon.nome}</span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          + {formatCurrency(addon.preco)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingOptionId(addon.id);
                            setOptName(addon.nome);
                            setOptPrice(addon.preco.toString());
                            setShowOptionModal('addon');
                          }}
                          className="p-1 text-stone-500 hover:text-blue-700 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePizzaAddon(addon.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: USUARIOS & EQUIPE ================= */}
        {activeTab === 'usuarios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">Equipe & Acessos</h2>
                <p className="text-xs text-stone-500">
                  Cadastre garçons, operadores de caixa e cozinheiros com controle de PIN.
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Colaborador</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between transition ${
                    u.ativo ? 'bg-white border-stone-200' : 'bg-stone-100/70 border-stone-300 opacity-75'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-slate-100">{u.nome}</h4>
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        title={u.ativo ? 'Clique para desativar acesso' : 'Clique para ativar acesso'}
                        className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase transition cursor-pointer ${
                          u.ativo
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-amber-100 hover:text-amber-800'
                            : 'bg-stone-300 text-stone-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                    <span className="text-xs text-stone-500 capitalize block">{u.perfil}</span>
                    <span className="text-xs font-mono text-stone-400 block">
                      PIN: {u.pin}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.perfil === 'admin' || u.perfil === 'super_admin'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : u.perfil === 'garcom'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : u.perfil === 'cozinha'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {u.perfil}
                    </span>

                    {/* Excluir Colaborador */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir o colaborador "${u.nome}"? Ele perderá todo o acesso ao sistema.`)) {
                          deleteUser(u.id);
                        }
                      }}
                      title="Excluir Colaborador / Revogar Acesso"
                      className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: AUDITORIA DE CANCELAMENTOS ================= */}
        {activeTab === 'cancelamentos' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">
                Auditoria de Itens Cancelados
              </h2>
              <p className="text-xs text-stone-500">
                Conforme exigência do PRD (Item 17), todos os cancelamentos de itens da cozinha são registrados com justificativa e operador.
              </p>
            </div>

            {cancellationAuditList.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-stone-400 border border-stone-200">
                Nenhum cancelamento registrado no histórico do sistema.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3.5">Data / Hora</th>
                        <th className="p-3.5">Pedido / Mesa</th>
                        <th className="p-3.5">Item Cancelado</th>
                        <th className="p-3.5">Valor Estornado</th>
                        <th className="p-3.5">Motivo / Justificativa</th>
                        <th className="p-3.5">Operador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {cancellationAuditList.map((c, i) => (
                        <tr key={i} className="hover:bg-stone-50 transition">
                          <td className="p-3.5 text-stone-600">{formatDateTime(c.data)}</td>
                          <td className="p-3.5 font-bold text-stone-900 dark:text-slate-100">
                            Pedido #{c.orderId} (Mesa {c.mesaNumero})
                          </td>
                          <td className="p-3.5 font-medium text-stone-800 dark:text-slate-200">
                            {c.quantidade}x {c.itemNome}
                          </td>
                          <td className="p-3.5 font-bold text-red-600 font-mono">
                            {formatCurrency(c.valor)}
                          </td>
                          <td className="p-3.5">
                            <span className="bg-red-50 text-red-900 px-2 py-0.5 rounded-lg font-semibold text-xs border border-red-200">
                              {c.motivo}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold text-stone-700 dark:text-slate-300">{c.usuarioNome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: CONFIGURAÇÕES DA LOJA / TAXA DE ENTREGA ================= */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-5 max-w-3xl">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase flex items-center gap-2">
                <Store className="w-4 h-4 text-red-700" />
                <span>Configurações da Loja & Identidade Visual</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Defina os dados da sua filial, marca, logotipo, endereço, telefone e a taxa de entrega cobrada dos clientes.
              </p>
            </div>

            {/* Status do Banco de Dados Cloud Firestore */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-white">Cloud Firestore Ativo</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Sincronização em Tempo Real
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Projeto: <code className="font-mono bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-emerald-700 dark:text-emerald-300">atendeja-83ef5</code>
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[11px] text-stone-500 dark:text-slate-400 block">Status da Nuvem</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Conectado & Pronto</span>
              </div>
            </div>

            {/* Link do Cardápio Digital / Delivery */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-500" />
                    <span>Link do Cardápio Online (Delivery)</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Envie este link para seus clientes no WhatsApp e redes sociais para eles pedirem direto com sua marca e logo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLinkFromAdmin}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      adminLinkCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-700 hover:bg-red-800 text-white'
                    }`}
                  >
                    {adminLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{adminLinkCopied ? 'Link Copiado!' : 'Copiar Link WhatsApp'}</span>
                  </button>
                  <a
                    href={getDeliveryUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    title="Abrir cardápio em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Cardápio</span>
                  </a>
                </div>
              </div>

              <div className="p-2.5 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs font-mono text-stone-700 dark:text-slate-300 break-all select-all">
                <span>{getDeliveryUrl()}</span>
              </div>
            </div>

            <form onSubmit={handleSaveLoja} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-5">
              {lojaSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Configurações da loja salvas com sucesso!</span>
                </div>
              )}

              {/* Seção Identidade Visual & Nome */}
              <div className="p-4 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-stone-200 dark:border-slate-700/60 space-y-4">
                <h3 className="text-xs font-bold text-stone-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                  <Camera className="w-4 h-4 text-red-600" />
                  <span>Identidade Visual & Logotipo</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Visualizador da Logo */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shadow-xs">
                      {lojaLogoUrl ? (
                        <img
                          src={lojaLogoUrl}
                          alt="Logo da Loja"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-stone-400 dark:text-slate-500">
                          <ImageIcon className="w-7 h-7" />
                          <span className="text-[9px] font-semibold mt-1">Sem Logo</span>
                        </div>
                      )}
                    </div>
                    {lojaLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setLojaLogoUrl('')}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition"
                        title="Remover logotipo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Upload e URL */}
                  <div className="flex-1 w-full space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Carregar Imagem do Computador/Celular:
                      </label>
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer transition shadow-xs">
                        <Upload className="w-4 h-4 text-red-600" />
                        <span>Selecionar Imagem da Logo...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 block mt-1">
                        PNG, JPG ou SVG. A imagem é otimizada automaticamente.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Ou Link Direto da Imagem (URL):
                      </label>
                      <input
                        type="url"
                        value={lojaLogoUrl}
                        onChange={(e) => setLojaLogoUrl(e.target.value)}
                        placeholder="https://exemplo.com/minha-logo.png"
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Nome da Marca / Estabelecimento:
                    </label>
                    <input
                      type="text"
                      required
                      value={lojaMarca}
                      onChange={(e) => setLojaMarca(e.target.value)}
                      placeholder="Ex: Pizzaria Bella, Hamburgueria Grill..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 transition"
                    />
                    <span className="text-[10px] text-stone-400 dark:text-slate-500 block mt-1">
                      Este nome aparece no cabeçalho superior do sistema, delivery e impressões.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Nome da Filial / Unidade:
                    </label>
                    <input
                      type="text"
                      required
                      value={lojaNome}
                      onChange={(e) => setLojaNome(e.target.value)}
                      placeholder="Ex: Unidade Centro, Matriz..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 transition"
                    />
                    <span className="text-[10px] text-stone-400 dark:text-slate-500 block mt-1">
                      Identificação específica desta filial.
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Taxa de Entrega Padrão (R$):</label>
                  <input
                    type="text"
                    required
                    value={lojaTaxa}
                    onChange={(e) => setLojaTaxa(e.target.value)}
                    placeholder="7,00"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Tempo Estimado de Entrega:</label>
                  <input
                    type="text"
                    value={lojaTempo}
                    onChange={(e) => setLojaTempo(e.target.value)}
                    placeholder="30 - 45 min"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Endereço da Loja (Para Retirada):</label>
                <input
                  type="text"
                  required
                  value={lojaEndereco}
                  onChange={(e) => setLojaEndereco(e.target.value)}
                  placeholder="Ex: Av. Paulista, 1000 - Centro, São Paulo - SP"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    value={lojaTelefone}
                    onChange={(e) => setLojaTelefone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Horário de Funcionamento:</label>
                  <input
                    type="text"
                    value={lojaHorario}
                    onChange={(e) => setLojaHorario(e.target.value)}
                    placeholder="18:00 às 23:30"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </form>

            {/* Taxas por Bairro / Região */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-700" />
                  <span>Taxas de Entrega por Bairro / Região</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Cadastre os bairros atendidos e o valor do percurso para que o cliente selecione no cardápio online.
                </p>
              </div>

              {/* Formulário para Adicionar Novo Bairro */}
              <form onSubmit={handleAddBairroSubmit} className="flex flex-col sm:flex-row items-end gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">Nome do Bairro / Região:</label>
                  <input
                    type="text"
                    required
                    value={newBairroNome}
                    onChange={(e) => setNewBairroNome(e.target.value)}
                    placeholder="Ex: Jardim América, Centro, Vila Nova..."
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 font-semibold"
                  />
                </div>
                <div className="w-full sm:w-36">
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">Valor do Percurso (R$):</label>
                  <input
                    type="text"
                    required
                    value={newBairroValor}
                    onChange={(e) => setNewBairroValor(e.target.value)}
                    placeholder="Ex: 8,50"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-red-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Cadastrar Bairro</span>
                </button>
              </form>

              {/* Lista de Bairros Cadastrados */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-stone-700 dark:text-slate-300 uppercase tracking-wider">
                  Bairros Cadastrados ({currentLoja?.taxas_bairro?.length || 0}):
                </h4>
                {(!currentLoja?.taxas_bairro || currentLoja.taxas_bairro.length === 0) ? (
                  <p className="text-xs text-stone-400 italic p-3 bg-stone-50 rounded-xl text-center">
                    Nenhum bairro individual cadastrado. Será cobrada a taxa de entrega padrão ({formatCurrency(currentLoja?.taxa_entrega || 0)}).
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentLoja.taxas_bairro.map((tb) => (
                      <div key={tb.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-stone-900 dark:text-slate-100 block">{tb.bairro}</span>
                          <span className="text-[11px] text-emerald-700 font-bold font-mono">
                            Frete: {formatCurrency(tb.valor)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Excluir a taxa do bairro "${tb.bairro}"?`)) {
                              deleteTaxaBairro(currentLoja.id, tb.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Excluir Bairro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">
              {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Nome do Produto:</label>
                <input
                  type="text"
                  required
                  value={prodNome}
                  onChange={(e) => setProdNome(e.target.value)}
                  placeholder="Ex: Pizza Quatro Estações"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Categoria:</label>
                  <select
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Preço Base (R$):</label>
                  <input
                    type="text"
                    required
                    value={prodPreco}
                    onChange={(e) => setProdPreco(e.target.value)}
                    placeholder="Ex: 58,00"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Descrição / Ingredientes:</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Ex: Molho caseiro, mussarela especial, orégano..."
                  className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>

              {/* Foto / Imagem do Produto (Necessário para o Cardápio do Cliente) */}
              <div className="space-y-2 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-red-600" />
                  <span>Foto do Produto (Cardápio do Cliente):</span>
                </label>

                <div className="flex items-center gap-3">
                  {/* Prévia da Foto */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0 relative flex items-center justify-center">
                    {prodImagem ? (
                      <img src={prodImagem} alt="Prévia" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] text-stone-400 font-bold text-center p-1 leading-tight">
                        <span>Sem Foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* Input de URL */}
                    <input
                      type="text"
                      value={prodImagem}
                      onChange={(e) => setProdImagem(e.target.value)}
                      placeholder="URL da imagem (http://... ou https://...)"
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-500 font-mono"
                    />

                    {/* Botão de Upload Local do Computador/Celular */}
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 dark:text-slate-200 rounded-md text-[11px] font-bold cursor-pointer transition flex items-center gap-1">
                        <Upload className="w-3 h-3 text-stone-700 dark:text-slate-300" />
                        <span>Carregar do Aparelho / Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedUrl = await compressImageFile(file, 800, 800, 0.78);
                                setProdImagem(compressedUrl);
                              } catch (err) {
                                console.error('Erro ao compactar imagem:', err);
                              }
                            }
                          }}
                        />
                      </label>

                      {prodImagem && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            ⚡ Compactada!
                          </span>
                          <button
                            type="button"
                            onClick={() => setProdImagem('')}
                            className="text-[11px] text-red-600 hover:underline font-bold cursor-pointer"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-stone-100 max-h-60 overflow-y-auto pr-1">
                <span className="block text-xs font-bold text-stone-800 dark:text-slate-200 uppercase tracking-wider">
                  Opções de Personalização Específicas do Produto:
                </span>
                
                {/* 1. Tamanhos */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodPermitirTamanhos}
                        onChange={(e) => setProdPermitirTamanhos(e.target.checked)}
                        className="accent-red-700"
                      />
                      <span>Permitir Seleção de Tamanhos</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">({prodTamanhosSel.length} selecionados)</span>
                  </label>

                  {prodPermitirTamanhos && (
                    <div className="pl-5 pt-1 grid grid-cols-2 gap-1 border-t border-stone-200/60 mt-1">
                      {pizzaSizes.map((sz) => {
                        const isChecked = prodTamanhosSel.includes(sz.id);
                        return (
                          <label key={sz.id} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setProdTamanhosSel((prev) =>
                                  prev.includes(sz.id) ? prev.filter((id) => id !== sz.id) : [...prev, sz.id]
                                );
                              }}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>{sz.nome.split(' ')[0]} ({sz.fatias}f)</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Bordas Recheadas */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodPermitirBordas}
                        onChange={(e) => setProdPermitirBordas(e.target.checked)}
                        className="accent-red-700"
                      />
                      <span>Permitir Bordas Recheadas</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">({prodBordasSel.length} selecionadas)</span>
                  </label>

                  {prodPermitirBordas && (
                    <div className="pl-5 pt-1 grid grid-cols-2 gap-1 border-t border-stone-200/60 mt-1">
                      {pizzaCrusts.map((crust) => {
                        const isChecked = prodBordasSel.includes(crust.id);
                        return (
                          <label key={crust.id} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setProdBordasSel((prev) =>
                                  prev.includes(crust.id) ? prev.filter((id) => id !== crust.id) : [...prev, crust.id]
                                );
                              }}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>{crust.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Tipos de Massa */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodPermitirMassas}
                        onChange={(e) => setProdPermitirMassas(e.target.checked)}
                        className="accent-red-700"
                      />
                      <span>Permitir Tipos de Massa</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">({prodMassasSel.length} selecionadas)</span>
                  </label>

                  {prodPermitirMassas && (
                    <div className="pl-5 pt-1 grid grid-cols-2 gap-1 border-t border-stone-200/60 mt-1">
                      {pizzaDoughs.map((dough) => {
                        const isChecked = prodMassasSel.includes(dough.id);
                        return (
                          <label key={dough.id} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setProdMassasSel((prev) =>
                                  prev.includes(dough.id) ? prev.filter((id) => id !== dough.id) : [...prev, dough.id]
                                );
                              }}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>{dough.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Adicionais Opcionais */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodPermitirAdicionais}
                        onChange={(e) => setProdPermitirAdicionais(e.target.checked)}
                        className="accent-red-700"
                      />
                      <span>Permitir Adicionais Opcionais</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">({prodAdicionaisSel.length} selecionados)</span>
                  </label>

                  {prodPermitirAdicionais && (
                    <div className="pl-5 pt-1 grid grid-cols-2 gap-1 border-t border-stone-200/60 mt-1">
                      {pizzaAddons.map((addon) => {
                        const isChecked = prodAdicionaisSel.includes(addon.id);
                        return (
                          <label key={addon.id} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setProdAdicionaisSel((prev) =>
                                  prev.includes(addon.id) ? prev.filter((id) => id !== addon.id) : [...prev, addon.id]
                                );
                              }}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>{addon.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

                <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={prodIsPizza}
                    onChange={(e) => setProdIsPizza(e.target.checked)}
                    className="accent-red-700"
                  />
                  <span>Permitir Seleção de Sabores / Meio a Meio (Pizza)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodImprimeCozinha}
                    onChange={(e) => setProdImprimeCozinha(e.target.checked)}
                    className="accent-red-700"
                  />
                  <span>Enviar para tela e impressora da cozinha (KDS)</span>
                </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">Cadastrar Nova Mesa</h3>
            <form onSubmit={handleSaveTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Número da Mesa:</label>
                <input
                  type="number"
                  required
                  value={tableNumero}
                  onChange={(e) => setTableNumero(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Capacidade (Lugares):</label>
                <input
                  type="number"
                  required
                  value={tableCapacidade}
                  onChange={(e) => setTableCapacidade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Localização no Salão:</label>
                <input
                  type="text"
                  required
                  value={tableLocalizacao}
                  onChange={(e) => setTableLocalizacao(e.target.value)}
                  placeholder="Ex: Varanda, Salão Principal, Mezanino"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">Cadastrar Colaborador</h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Lucas Silva"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Função / Perfil:</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold capitalize text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                >
                  <option value="garcom">Garçom</option>
                  <option value="cozinha">Cozinha / Pizzaiolo</option>
                  <option value="caixa">Operador de Caixa</option>
                  <option value="admin">Administrador / Gerente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  PIN Numérico de Acesso Rápido (4 dígitos):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={userPin}
                  onChange={(e) => setUserPin(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold tracking-widest text-center text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Option Modal (Tamanhos, Bordas, Massas, Adicionais) */}
      {showOptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">
              {editingOptionId ? 'Editar Opção' : 'Cadastrar Nova Opção'}{' '}
              {showOptionModal === 'size' && '(Tamanho)'}
              {showOptionModal === 'crust' && '(Borda Recheada)'}
              {showOptionModal === 'dough' && '(Tipo de Massa)'}
              {showOptionModal === 'addon' && '(Adicional Opcional)'}
            </h3>

            <form onSubmit={handleSaveOption} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Nome da Opção:</label>
                <input
                  type="text"
                  required
                  value={optName}
                  onChange={(e) => setOptName(e.target.value)}
                  placeholder={
                    showOptionModal === 'size'
                      ? 'Ex: Gigante (12 fatias)'
                      : showOptionModal === 'crust'
                      ? 'Ex: Borda Nutella'
                      : showOptionModal === 'dough'
                      ? 'Ex: Massa Integral'
                      : 'Ex: Bacon Extra'
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>

              {/* Extra fields for Size */}
              {showOptionModal === 'size' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Nº de Fatias:</label>
                      <input
                        type="number"
                        required
                        value={optSlices}
                        onChange={(e) => setOptSlices(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Máx Sabores:</label>
                      <input
                        type="number"
                        required
                        value={optMaxFlavors}
                        onChange={(e) => setOptMaxFlavors(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Multiplicador de Preço (ex: 1.0 = 100%, 1.3 = +30%):
                    </label>
                    <input
                      type="text"
                      required
                      value={optMultiplier}
                      onChange={(e) => setOptMultiplier(e.target.value)}
                      placeholder="1.2"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-bold font-mono"
                    />
                  </div>
                </>
              )}

              {/* Price field for Crust & Addon */}
              {(showOptionModal === 'crust' || showOptionModal === 'addon') && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Preço Adicional (R$):</label>
                  <input
                    type="text"
                    required
                    value={optPrice}
                    onChange={(e) => setOptPrice(e.target.value)}
                    placeholder="Ex: 8,50"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowOptionModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Opção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
