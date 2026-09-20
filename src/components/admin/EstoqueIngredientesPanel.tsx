import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Check,
  Edit2,
  Trash2,
  PackageCheck,
  Copy,
  RefreshCw,
  X,
  SlidersHorizontal,
  ChevronDown,
  Warehouse,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Ingredient } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const EstoqueIngredientesPanel: React.FC = () => {
  const {
    ingredients,
    updateIngredientStock,
    adjustIngredientStock,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    batchRestockIngredients,
  } = useStore();

  // Search, Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'critico' | 'zerado' | 'adequado'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<'menor_estoque' | 'maior_estoque' | 'nome' | 'categoria'>('menor_estoque');

  // Inline editing of quantity
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [tempQty, setTempQty] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchDelta, setBatchDelta] = useState<number>(10);

  // Quick feedback toast
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'warning' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3200);
  };

  // Form State for Add / Edit
  const [formNome, setFormNome] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formCategoria, setFormCategoria] = useState('Laticínios & Queijos');
  const [formQuantidade, setFormQuantidade] = useState('10');
  const [formUnidade, setFormUnidade] = useState('kg');
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState('10');
  const [formCusto, setFormCusto] = useState('0');
  const [formLocal, setFormLocal] = useState('Câmara Fria 01');
  const [formObs, setFormObs] = useState('');

  // Categories list derived from ingredients
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    ingredients.forEach((i) => {
      if (i.categoria) set.add(i.categoria);
    });
    return Array.from(set).sort();
  }, [ingredients]);

  // Low stock items: STRICT threshold < 10 as requested
  const lowStockItems = useMemo(() => {
    return ingredients.filter((i) => i.quantidade < 10);
  }, [ingredients]);

  const zeroStockItems = useMemo(() => {
    return ingredients.filter((i) => i.quantidade === 0);
  }, [ingredients]);

  const totalValueInStock = useMemo(() => {
    return ingredients.reduce((acc, curr) => {
      const cost = curr.custo_unitario || 0;
      return acc + curr.quantidade * cost;
    }, 0);
  }, [ingredients]);

  // Filtered & Sorted Ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients
      .filter((ing) => {
        // Status filter
        if (statusFilter === 'critico' && ing.quantidade >= 10) return false;
        if (statusFilter === 'zerado' && ing.quantidade > 0) return false;
        if (statusFilter === 'adequado' && ing.quantidade < 10) return false;

        // Category filter
        if (categoryFilter !== 'todas' && ing.categoria !== categoryFilter) return false;

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesName = ing.nome.toLowerCase().includes(q);
          const matchesCode = ing.codigo?.toLowerCase().includes(q);
          const matchesCategory = ing.categoria?.toLowerCase().includes(q);
          const matchesLocal = ing.local_armazenamento?.toLowerCase().includes(q);
          if (!matchesName && !matchesCode && !matchesCategory && !matchesLocal) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'menor_estoque') {
          // Critical items (< 10) first, sorted ascending
          return a.quantidade - b.quantidade;
        }
        if (sortBy === 'maior_estoque') {
          return b.quantidade - a.quantidade;
        }
        if (sortBy === 'nome') {
          return a.nome.localeCompare(b.nome);
        }
        if (sortBy === 'categoria') {
          return a.categoria.localeCompare(b.categoria);
        }
        return 0;
      });
  }, [ingredients, statusFilter, categoryFilter, searchTerm, sortBy]);

  // Handlers for quick adjustment
  const handleQuickAdjust = (ing: Ingredient, delta: number) => {
    adjustIngredientStock(ing.id, delta, `Ajuste rápido (${delta > 0 ? `+${delta}` : delta} ${ing.unidade})`);
    showFeedback(
      `${delta > 0 ? `+${delta}` : delta} ${ing.unidade} ajustado em "${ing.nome}". Novo estoque: ${Math.max(0, ing.quantidade + delta)} ${ing.unidade}`,
      ing.quantidade + delta < 10 ? 'warning' : 'success'
    );
  };

  const handleStartEditingQty = (ing: Ingredient) => {
    setEditingQtyId(ing.id);
    setTempQty(ing.quantidade.toString());
  };

  const handleSaveInlineQty = (ing: Ingredient) => {
    const val = parseFloat(tempQty.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      updateIngredientStock(ing.id, val, `Ajuste manual direto`);
      showFeedback(`Estoque de "${ing.nome}" atualizado para ${val} ${ing.unidade}.`);
    }
    setEditingQtyId(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setFormNome(ing.nome);
    setFormCodigo(ing.codigo || '');
    setFormCategoria(ing.categoria);
    setFormQuantidade(ing.quantidade.toString());
    setFormUnidade(ing.unidade);
    setFormEstoqueMinimo(ing.estoque_minimo?.toString() || '10');
    setFormCusto(ing.custo_unitario?.toString() || '0');
    setFormLocal(ing.local_armazenamento || 'Câmara Fria 01');
    setFormObs(ing.observacao || '');
    setShowAddModal(true);
  };

  // Open New Modal
  const handleOpenNew = () => {
    setEditingIngredient(null);
    setFormNome('');
    setFormCodigo(`ING-${(ingredients.length + 1).toString().padStart(3, '0')}`);
    setFormCategoria(categoriesList[0] || 'Laticínios & Queijos');
    setFormQuantidade('15');
    setFormUnidade('un');
    setFormEstoqueMinimo('10');
    setFormCusto('15');
    setFormLocal('Câmara Fria 01');
    setFormObs('');
    setShowAddModal(true);
  };

  // Submit Modal
  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    const qty = Math.max(0, parseFloat(formQuantidade.replace(',', '.')) || 0);
    const minEstoque = parseFloat(formEstoqueMinimo.replace(',', '.')) || 10;
    const custo = parseFloat(formCusto.replace(',', '.')) || 0;

    if (editingIngredient) {
      updateIngredient({
        ...editingIngredient,
        nome: formNome.trim(),
        codigo: formCodigo.trim() || editingIngredient.codigo,
        categoria: formCategoria,
        quantidade: qty,
        unidade: formUnidade,
        estoque_minimo: minEstoque,
        custo_unitario: custo,
        local_armazenamento: formLocal.trim(),
        observacao: formObs.trim(),
      });
      showFeedback(`Ingrediente "${formNome}" atualizado com sucesso!`);
    } else {
      addIngredient({
        nome: formNome.trim(),
        codigo: formCodigo.trim() || `ING-${Date.now().toString().slice(-4)}`,
        categoria: formCategoria,
        quantidade: qty,
        unidade: formUnidade,
        estoque_minimo: minEstoque,
        custo_unitario: custo,
        local_armazenamento: formLocal.trim(),
        observacao: formObs.trim(),
      });
      showFeedback(`Novo ingrediente "${formNome}" cadastrado!`);
    }

    setShowAddModal(false);
  };

  // Batch restock all critical items
  const handleBatchRestockCritical = () => {
    if (lowStockItems.length === 0) return;
    const itemsToUpdate = lowStockItems.map((item) => ({
      id: item.id,
      delta: batchDelta,
    }));
    batchRestockIngredients(itemsToUpdate);
    showFeedback(`+${batchDelta} unidades adicionadas a todos os ${lowStockItems.length} itens com estoque baixo!`);
    setShowBatchModal(false);
  };

  // Copy shopping list to clipboard
  const handleCopyShoppingList = () => {
    if (lowStockItems.length === 0) {
      showFeedback('Nenhum item com estoque baixo no momento!', 'success');
      return;
    }
    const lines = [
      `=== LISTA DE REPOSIÇÃO DE ESTOQUE (PIZZARIA ITÁLIA) ===`,
      `Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
      `Total de itens críticos (< 10 un): ${lowStockItems.length}`,
      ``,
      ...lowStockItems.map(
        (i, idx) =>
          `${idx + 1}. [${i.codigo}] ${i.nome} - Atual: ${i.quantidade} ${i.unidade} (Mín: ${i.estoque_minimo} ${i.unidade}) | Local: ${i.local_armazenamento || 'N/A'}`
      ),
      ``,
      `*Gerado automaticamente pelo Painel de Gestão de Estoque*`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    showFeedback('Lista de reposição copiada para a Área de Transferência!');
  };

  return (
    <div id="estoque-ingredientes-panel" className="space-y-5">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          id="stock-feedback-toast"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-lg flex items-center gap-3 transition-all animate-bounce ${
            feedbackMsg.type === 'warning'
              ? 'bg-amber-500 text-stone-950 font-bold border-amber-600'
              : 'bg-stone-900 text-white font-semibold border-stone-800'
          }`}
        >
          {feedbackMsg.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-stone-950" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-xs sm:text-sm">{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="ml-2 text-xs opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= 1. VISUAL ALERT FOR LOW QUANTITY (< 10 UNITS) ================= */}
      {lowStockItems.length > 0 ? (
        <div
          id="alerta-estoque-critico-banner"
          className="border border-red-200 bg-red-50/90 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden"
        >
          {/* Accent top stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-red-700 text-white rounded-xl shadow-xs flex-shrink-0 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-red-950 tracking-tight flex items-center gap-2">
                    <span>Alerta de Estoque Baixo</span>
                    <span className="bg-red-700 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                      {lowStockItems.length} {lowStockItems.length === 1 ? 'item crítico' : 'itens críticos'} (&lt; 10 un)
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  Os seguintes ingredientes estão com quantidade abaixo de <strong>10 unidades</strong> no estoque.
                  Ajuste ou reponha imediatamente para evitar interrupções nos pedidos da cozinha.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for Low Stock */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
              <button
                id="btn-filtrar-criticos"
                onClick={() => setStatusFilter(statusFilter === 'critico' ? 'todos' : 'critico')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'critico'
                    ? 'bg-red-700 text-white border-red-700 shadow-xs'
                    : 'bg-white text-red-800 border-red-200 hover:bg-red-100/60 shadow-2xs'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{statusFilter === 'critico' ? 'Ver Todos os Itens' : 'Filtrar Críticos'}</span>
              </button>

              <button
                id="btn-repor-massa-modal"
                onClick={() => setShowBatchModal(true)}
                className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Repor em Lote (+{batchDelta})</span>
              </button>

              <button
                id="btn-copiar-lista-compras"
                onClick={handleCopyShoppingList}
                className="px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-stone-200 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                title="Copiar lista de compras para pedidos de reposição"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Lista</span>
              </button>
            </div>
          </div>

          {/* Quick chips showing critical items with instant +10 buttons */}
          <div className="mt-3.5 pt-3.5 border-t border-red-200/80 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-900 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-600" /> Reposição Imediata:
            </span>
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="inline-flex items-center gap-1.5 bg-white border border-red-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 dark:text-slate-200 shadow-2xs"
              >
                <span className="font-bold text-red-700 font-mono">{item.quantidade} {item.unidade}</span>
                <span className="text-stone-700 dark:text-slate-300 font-medium truncate max-w-[140px] sm:max-w-[200px]">{item.nome}</span>
                <button
                  id={`btn-chip-repor-${item.id}`}
                  onClick={() => handleQuickAdjust(item, 10)}
                  title={`Adicionar rapidamente +10 ${item.unidade} a ${item.nome}`}
                  className="ml-1 px-1.5 py-0.5 bg-red-700 hover:bg-red-800 text-white font-bold text-[10px] rounded cursor-pointer transition"
                >
                  +10
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          id="alerta-estoque-ok-banner"
          className="border border-emerald-200 bg-emerald-50/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide">
                Estoque Regularizado
              </h4>
              <p className="text-xs text-emerald-800">
                Nenhum ingrediente possui quantidade inferior a 10 unidades. Todas as operações estão seguras.
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyShoppingList}
            className="px-3.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Exportar Lista</span>
          </button>
        </div>
      )}

      {/* ================= 2. KPI / STATS BAR ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Ingredientes */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-1">
            <span>Total Cadastrados</span>
            <Boxes className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-slate-100">
            {ingredients.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {categoriesList.length} categorias ativas
          </div>
        </div>

        {/* Itens com Estoque Baixo (< 10) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'critico' ? 'todos' : 'critico')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            lowStockItems.length > 0
              ? 'bg-red-50/80 border-red-200 shadow-xs hover:bg-red-100/70'
              : 'bg-white border-stone-200 shadow-xs hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={lowStockItems.length > 0 ? 'text-red-900' : 'text-stone-500'}>
              Estoque Baixo (&lt; 10 un)
            </span>
            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-red-600 animate-pulse' : 'text-stone-400'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold ${lowStockItems.length > 0 ? 'text-red-700' : 'text-stone-900 dark:text-slate-100'}`}>
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-red-700 mt-1 font-semibold">
            {lowStockItems.length > 0 ? '⚠️ Requer reposição imediata' : 'Nenhum item em alerta'}
          </div>
        </div>

        {/* Itens Zerados (0 un) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'zerado' ? 'todos' : 'zerado')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            zeroStockItems.length > 0
              ? 'bg-amber-50/80 border-amber-200 shadow-xs hover:bg-amber-100/70'
              : 'bg-white border-stone-200 shadow-xs hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={zeroStockItems.length > 0 ? 'text-amber-900' : 'text-stone-500'}>
              Zerados / Em Ruptura
            </span>
            <Flame className={`w-4 h-4 ${zeroStockItems.length > 0 ? 'text-amber-600' : 'text-stone-400'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold ${zeroStockItems.length > 0 ? 'text-amber-700' : 'text-stone-900 dark:text-slate-100'}`}>
            {zeroStockItems.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {zeroStockItems.length > 0 ? 'Itens esgotados na despensa' : 'Nenhum ingrediente zerado'}
          </div>
        </div>

        {/* Valor Total do Estoque */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-1">
            <span>Custo Total em Estoque</span>
            <Warehouse className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 truncate">
            {formatCurrency(totalValueInStock)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Calculado com base no custo unitário
          </div>
        </div>
      </div>

      {/* ================= 3. CONTROLS TOOLBAR (SEARCH, FILTER, SORT, NEW) ================= */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-busca-ingrediente"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ingrediente, código, local ou categoria..."
              className="w-full pl-10 pr-8 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 text-stone-900 dark:text-slate-100 font-medium placeholder:text-stone-400 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Add New & Batch Restock */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="btn-abrir-novo-ingrediente"
              onClick={handleOpenNew}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Ingrediente</span>
            </button>

            <button
              id="btn-repor-em-lote"
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-xs text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Repor em Lote</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Sort Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-2 border-t border-stone-100 text-xs">
          {/* Status quick filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-semibold text-stone-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Status:
            </span>
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1 rounded-lg border transition cursor-pointer text-xs font-semibold whitespace-nowrap ${
                statusFilter === 'todos'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-stone-100 text-stone-700 dark:text-slate-300 border-stone-200 hover:bg-stone-200'
              }`}
            >
              Todos ({ingredients.length})
            </button>
            <button
              onClick={() => setStatusFilter('critico')}
              className={`px-3 py-1 rounded-lg border transition cursor-pointer text-xs font-semibold flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'critico'
                  ? 'bg-red-700 text-white border-red-700 shadow-2xs'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/70'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Baixo (&lt; 10)</span>
              <span className="ml-1 px-1.5 bg-red-800 text-white text-[10px] rounded-full font-mono font-bold">
                {lowStockItems.length}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('zerado')}
              className={`px-3 py-1 rounded-lg border transition cursor-pointer text-xs font-semibold whitespace-nowrap ${
                statusFilter === 'zerado'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
              }`}
            >
              Zerado ({zeroStockItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('adequado')}
              className={`px-3 py-1 rounded-lg border transition cursor-pointer text-xs font-semibold whitespace-nowrap ${
                statusFilter === 'adequado'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              Adequado (≥ 10) ({ingredients.length - lowStockItems.length})
            </button>
          </div>

          {/* Category Dropdown & Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Select */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-stone-500 font-semibold">Cat:</span>
              <select
                id="select-filtro-categoria"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
              >
                <option value="todas">Todas Categorias</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-stone-400" />
              <select
                id="select-ordenacao-estoque"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-800 dark:text-slate-200 focus:outline-none focus:border-red-600"
              >
                <option value="menor_estoque">Menor Estoque (Críticos 1º)</option>
                <option value="maior_estoque">Maior Estoque 1º</option>
                <option value="nome">Nome (A - Z)</option>
                <option value="categoria">Categoria</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. INGREDIENTS TABLE & QUICK ADJUST CARDS ================= */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table Header / Subtitle */}
        <div className="p-3.5 sm:p-4 bg-stone-50/80 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-red-600" />
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100 uppercase tracking-wide">
              Tabela de Controle de Estoque & Reposição Rápida
            </h3>
          </div>
          <div className="text-[11px] text-stone-500 font-medium">
            Mostrando {filteredIngredients.length} de {ingredients.length} itens cadastrados
          </div>
        </div>

        {filteredIngredients.length === 0 ? (
          <div className="p-10 text-center text-stone-500 space-y-2">
            <Boxes className="w-10 h-10 mx-auto text-stone-300" />
            <p className="text-sm font-semibold">Nenhum ingrediente encontrado com os filtros atuais.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setCategoryFilter('todas');
              }}
              className="text-xs text-red-700 underline font-bold cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-900 text-stone-300 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5 font-semibold">Código</th>
                  <th className="p-3.5 font-semibold">Ingrediente</th>
                  <th className="p-3.5 font-semibold">Categoria / Local</th>
                  <th className="p-3.5 font-semibold text-center">Status / Alerta</th>
                  <th className="p-3.5 font-semibold text-center min-w-[150px]">Estoque Atual</th>
                  <th className="p-3.5 font-semibold text-center min-w-[200px]">Ajuste Rápido</th>
                  <th className="p-3.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredIngredients.map((ing) => {
                  const isLowStock = ing.quantidade < 10;
                  const isZero = ing.quantidade === 0;

                  return (
                    <tr
                      key={ing.id}
                      id={`row-ing-${ing.id}`}
                      className={`transition ${
                        isZero
                          ? 'bg-amber-50/50 hover:bg-amber-50/80'
                          : isLowStock
                          ? 'bg-red-50/40 hover:bg-red-50/70'
                          : 'hover:bg-stone-50/80'
                      }`}
                    >
                      {/* Código */}
                      <td className="p-3.5 font-mono font-bold text-stone-500 text-[11px] whitespace-nowrap">
                        {ing.codigo || '—'}
                      </td>

                      {/* Nome do Ingrediente */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          {isLowStock && (
                            <span
                              title="Estoque abaixo de 10 unidades!"
                              className="w-2 h-2 rounded-full bg-red-600 animate-ping flex-shrink-0"
                            />
                          )}
                          <span className="font-bold text-stone-900 dark:text-slate-100 text-xs sm:text-sm">
                            {ing.nome}
                          </span>
                        </div>
                        {ing.observacao && (
                          <span className="text-[10px] text-stone-500 block truncate max-w-[240px] mt-0.5" title={ing.observacao}>
                            {ing.observacao}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 block mt-0.5 font-mono">
                          Atualizado: {formatDateTime(ing.ultima_atualizacao)}
                        </span>
                      </td>

                      {/* Categoria / Local */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-block bg-stone-100 text-stone-800 dark:text-slate-200 px-2.5 py-0.5 rounded-md text-[10px] font-semibold border border-stone-200">
                          {ing.categoria}
                        </span>
                        {ing.local_armazenamento && (
                          <span className="block text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                            <Warehouse className="w-3 h-3 text-stone-400" /> {ing.local_armazenamento}
                          </span>
                        )}
                      </td>

                      {/* Status / Alerta Visual */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isZero ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 text-white font-bold text-[10px] rounded-md uppercase">
                            <Flame className="w-3 h-3 text-amber-400" /> Esgotado (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-700 text-white font-bold text-[10px] rounded-md uppercase animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-300" /> Baixo (&lt; 10)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold text-[10px] rounded-md border border-emerald-200 uppercase">
                            <Check className="w-3 h-3 text-emerald-600" /> Regular
                          </span>
                        )}
                      </td>

                      {/* Estoque Atual (com Edição Direta Inline) */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {editingQtyId === ing.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={tempQty}
                              onChange={(e) => setTempQty(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineQty(ing);
                                if (e.key === 'Escape') setEditingQtyId(null);
                              }}
                              autoFocus
                              className="w-20 px-2 py-1 bg-white border-2 border-stone-900 rounded-lg text-xs font-bold text-center focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveInlineQty(ing)}
                              className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer shadow-2xs"
                              title="Salvar quantidade"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingQtyId(null)}
                              className="p-1 bg-stone-200 text-stone-700 dark:text-slate-300 rounded-lg hover:bg-stone-300 cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEditingQty(ing)}
                            title="Clique para editar diretamente"
                            className="cursor-pointer group inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-stone-200 hover:border-stone-400 transition"
                          >
                            <span
                              className={`text-sm sm:text-base font-extrabold font-mono ${
                                isLowStock ? 'text-red-700' : 'text-stone-900 dark:text-slate-100'
                              }`}
                            >
                              {ing.quantidade}
                            </span>
                            <span className="text-xs text-stone-500 font-medium">{ing.unidade}</span>
                            <Edit2 className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        )}
                        <div className="text-[10px] text-stone-400 mt-1">
                          Mínimo: {ing.estoque_minimo || 10} {ing.unidade}
                        </div>
                      </td>

                      {/* Quick Adjust Buttons (-5, -1, +1, +5, +10) */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center border border-stone-200 bg-white rounded-lg shadow-2xs divide-x divide-stone-200 overflow-hidden">
                          {/* -5 */}
                          <button
                            id={`btn-minus-5-${ing.id}`}
                            onClick={() => handleQuickAdjust(ing, -5)}
                            disabled={ing.quantidade <= 0}
                            title={`Remover 5 ${ing.unidade}`}
                            className="px-2 py-1 bg-stone-50 hover:bg-red-50 text-stone-700 dark:text-slate-300 hover:text-red-700 font-bold text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            -5
                          </button>

                          {/* -1 */}
                          <button
                            id={`btn-minus-1-${ing.id}`}
                            onClick={() => handleQuickAdjust(ing, -1)}
                            disabled={ing.quantidade <= 0}
                            title={`Remover 1 ${ing.unidade}`}
                            className="px-2 py-1 bg-stone-50 hover:bg-red-50 text-stone-700 dark:text-slate-300 hover:text-red-700 font-bold text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            -1
                          </button>

                          {/* +1 */}
                          <button
                            id={`btn-plus-1-${ing.id}`}
                            onClick={() => handleQuickAdjust(ing, 1)}
                            title={`Adicionar 1 ${ing.unidade}`}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 text-stone-700 dark:text-slate-300 hover:text-emerald-700 font-bold text-xs transition cursor-pointer"
                          >
                            +1
                          </button>

                          {/* +5 */}
                          <button
                            id={`btn-plus-5-${ing.id}`}
                            onClick={() => handleQuickAdjust(ing, 5)}
                            title={`Adicionar 5 ${ing.unidade}`}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 text-stone-700 dark:text-slate-300 hover:text-emerald-700 font-bold text-xs transition cursor-pointer"
                          >
                            +5
                          </button>

                          {/* +10 */}
                          <button
                            id={`btn-plus-10-${ing.id}`}
                            onClick={() => handleQuickAdjust(ing, 10)}
                            title={`Adicionar 10 ${ing.unidade}`}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            id={`btn-edit-ing-${ing.id}`}
                            onClick={() => handleOpenEdit(ing)}
                            title="Editar cadastro do ingrediente"
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 dark:text-slate-300 rounded-lg border border-stone-200 cursor-pointer transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-del-ing-${ing.id}`}
                            onClick={() => {
                              if (confirm(`Deseja realmente remover o ingrediente "${ing.nome}" do estoque?`)) {
                                deleteIngredient(ing.id);
                                showFeedback(`Ingrediente "${ing.nome}" removido do estoque.`, 'warning');
                              }
                            }}
                            title="Excluir ingrediente"
                            className="p-1.5 bg-stone-100 hover:bg-red-50 text-red-600 rounded-lg border border-stone-200 cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: NOVO / EDITAR INGREDIENTE ================= */}
      {showAddModal && (
        <div
          id="modal-cadastro-ingrediente"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden my-8">
            {/* Header */}
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  {editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente no Estoque'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveIngredient} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Nome & Código */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                    Nome do Ingrediente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Queijo Mussarela Ralada"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-900 dark:text-slate-100 focus:outline-none focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="ING-001"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-semibold text-stone-900 dark:text-slate-100 focus:outline-none focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              {/* Categoria & Local */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-900 dark:text-slate-100 focus:outline-none focus:border-red-600"
                  >
                    <option value="Laticínios & Queijos">Laticínios & Queijos</option>
                    <option value="Carnes & Embutidos">Carnes & Embutidos</option>
                    <option value="Molhos & Condimentos">Molhos & Condimentos</option>
                    <option value="Massas & Farinhas">Massas & Farinhas</option>
                    <option value="Hortifrúti & Vegetais">Hortifrúti & Vegetais</option>
                    <option value="Sobremesas & Confeitaria">Sobremesas & Confeitaria</option>
                    <option value="Bebidas & Bar">Bebidas & Bar</option>
                    <option value="Embalagens & Descartáveis">Embalagens & Descartáveis</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                    Local de Armazenamento
                  </label>
                  <input
                    type="text"
                    value={formLocal}
                    onChange={(e) => setFormLocal(e.target.value)}
                    placeholder="Ex: Câmara Fria 01, Despensa"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-900 dark:text-slate-100 focus:outline-none focus:bg-white focus:border-red-600"
                  />
                </div>
              </div>

              {/* Quantidade Inicial, Unidade & Estoque Mínimo */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={formQuantidade}
                    onChange={(e) => setFormQuantidade(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold text-stone-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                    Unidade
                  </label>
                  <select
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="un">un (unidades)</option>
                    <option value="kg">kg (quilos)</option>
                    <option value="g">g (gramas)</option>
                    <option value="L">L (litros)</option>
                    <option value="pacotes">pacotes</option>
                    <option value="latas">latas</option>
                    <option value="bisnagas">bisnagas</option>
                    <option value="garrafas">garrafas</option>
                    <option value="maços">maços</option>
                    <option value="sacos">sacos</option>
                    <option value="potes">potes</option>
                    <option value="barris">barris</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                    Alerta Mínimo
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={formEstoqueMinimo}
                    onChange={(e) => setFormEstoqueMinimo(e.target.value)}
                    title="Quantidade que ativa o alerta de estoque baixo (padrão 10)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold text-stone-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Custo Unitário */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                  Custo Unitário Estimado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCusto}
                  onChange={(e) => setFormCusto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-medium text-stone-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              {/* Observação */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                  Observações / Fornecedor
                </label>
                <textarea
                  rows={2}
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  placeholder="Ex: Marca Scala. Fornecedor Distribuidora São Paulo..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 dark:text-slate-100 focus:outline-none resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 dark:text-slate-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingIngredient ? 'Salvar Alterações' : 'Cadastrar Ingrediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPOSIÇÃO EM LOTE ================= */}
      {showBatchModal && (
        <div
          id="modal-reposicao-lote"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-bold uppercase text-stone-900 dark:text-slate-100">
                  Reposição Rápida em Lote
                </h3>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-stone-400 hover:text-stone-700 dark:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Adicione estoque automaticamente aos <strong>{lowStockItems.length} itens críticos</strong> com
              quantidade menor que 10 unidades.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 uppercase mb-1">
                Quantidade a Adicionar por Item:
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[5, 10, 20, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBatchDelta(val)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      batchDelta === val ? 'bg-red-700 text-white border-red-700 shadow-2xs' : 'bg-stone-100 text-stone-800 dark:text-slate-200 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                value={batchDelta}
                onChange={(e) => setBatchDelta(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold font-mono text-stone-900 dark:text-slate-100 focus:outline-none focus:border-red-600"
              />
            </div>

            {lowStockItems.length > 0 ? (
              <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 max-h-36 overflow-y-auto text-[11px] space-y-1">
                <span className="font-bold text-red-900 block mb-1">Itens que receberão reposição:</span>
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-stone-700 dark:text-slate-300">
                    <span className="truncate max-w-[240px]">{item.nome}</span>
                    <span className="font-bold text-red-700 font-mono">
                      {item.quantidade} ➔ {item.quantidade + batchDelta} {item.unidade}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-semibold text-center">
                Nenhum item com estoque baixo no momento!
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={lowStockItems.length === 0}
                onClick={handleBatchRestockCritical}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmar Reposição (+{batchDelta})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
