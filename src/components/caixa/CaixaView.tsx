import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  Users,
  Printer,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Lock,
  Unlock,
  Percent,
  Search,
  ChefHat,
  Bike,
  Clock,
  Check,
  AlertTriangle,
  Flame,
  ArrowRight,
  Phone,
  MapPin,
  Share2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Comanda, Order, Table, PaymentMethod, CashEntry, OrderStatus } from '../../types';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { ReceiptModal } from '../ReceiptModal';
import { KitchenTicketModal } from '../KitchenTicketModal';

export const CaixaView: React.FC = () => {
  const {
    tables,
    comandas,
    orders,
    cashRegister,
    currentUser,
    registerPayment,
    applyDiscount,
    closeComanda,
    openCashRegister,
    closeCashRegister,
    addCashEntry,
    updateOrderStatus,
    currentLoja,
  } = useStore();

  const [caixaActiveTab, setCaixaActiveTab] = useState<'comandas' | 'pedidos'>('comandas');
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'todas' | 'fechar'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedDeliveryLink, setCopiedDeliveryLink] = useState(false);

  const handleCopyDeliveryLink = () => {
    const slug = currentLoja?.slug || 'loja-centro';
    let url = `${window.location.origin}/?loja=${slug}`;
    if (currentLoja?.marca) url += `&marca=${encodeURIComponent(currentLoja.marca)}`;
    if (currentLoja?.nome) url += `&nome=${encodeURIComponent(currentLoja.nome)}`;
    if (currentLoja?.logo_url && !currentLoja.logo_url.startsWith('data:')) {
      url += `&logo=${encodeURIComponent(currentLoja.logo_url)}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedDeliveryLink(true);
    setTimeout(() => setCopiedDeliveryLink(false), 2500);
  };

  // Pedidos & Delivery tracking state
  const [pedidosFilterStatus, setPedidosFilterStatus] = useState<string>('todos');
  const [pedidosSearch, setPedidosSearch] = useState<string>('');
  const [deliveryFilter, setDeliveryFilter] = useState<'todos' | 'novo' | 'em_preparo' | 'a_caminho' | 'entregue'>('todos');
  const [deliverySearch, setDeliverySearch] = useState<string>('');
  const [printingOrder, setPrintingOrder] = useState<{ order: Order; autoPrint: boolean } | null>(null);

  // Modals inside Caixa
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showOpenRegisterModal, setShowOpenRegisterModal] = useState(false);
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
  const [showCashEntryModal, setShowCashEntryModal] = useState<'suprimento' | 'sangria' | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Split bill states
  const [splitMode, setSplitMode] = useState<'nenhum' | 'igual' | 'itens'>('nenhum');
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(2);
  const [selectedItemIdsForSplit, setSelectedItemIdsForSplit] = useState<string[]>([]);
  const [payerName, setPayerName] = useState('');

  // Payment form states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [trocoParaInput, setTrocoParaInput] = useState<string>('');

  // Discount form
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('Desconto de Cortesia do Gerente');

  // Cash Register form
  const [initialCashInput, setInitialCashInput] = useState<string>('300,00');
  const [entryAmountInput, setEntryAmountInput] = useState<string>('');
  const [entryReasonInput, setEntryReasonInput] = useState<string>('');
  const [closeNotesInput, setCloseNotesInput] = useState<string>('');

  // Active open comandas
  const openComandas = useMemo(() => {
    return comandas.filter((c) => c.status === 'aberta');
  }, [comandas]);

  // Selected comanda object
  const activeComanda = useMemo(() => {
    return comandas.find((c) => c.id === selectedComandaId) || null;
  }, [comandas, selectedComandaId]);

  // Associated table
  const activeTable = useMemo(() => {
    if (!activeComanda) return null;
    return tables.find((t) => t.id === activeComanda.mesa_id) || null;
  }, [tables, activeComanda]);

  // Orders and active items for active comanda
  const activeComandaOrders = useMemo(() => {
    if (!activeComanda) return [];
    return orders.filter((o) => activeComanda.pedidos_ids.includes(o.id));
  }, [orders, activeComanda]);

  const allActiveItems = useMemo(() => {
    return activeComandaOrders.flatMap((o) => o.itens.filter((it) => it.status === 'ativo'));
  }, [activeComandaOrders]);

  // Financial calculations
  const totalPaid = activeComanda
    ? activeComanda.pagamentos.reduce((acc, p) => acc + p.valor, 0)
    : 0;
  const remainingBalance = activeComanda ? Math.max(0, activeComanda.total - totalPaid) : 0;

  // Calculate split by items amount
  const splitItemsTotal = useMemo(() => {
    return allActiveItems
      .filter((it) => selectedItemIdsForSplit.includes(it.id))
      .reduce((sum, it) => sum + it.preco_total, 0);
  }, [allActiveItems, selectedItemIdsForSplit]);

  // Handle setting default amount when selecting comanda or split
  const fillSuggestedAmount = (val: number) => {
    setPaymentAmountInput(val.toFixed(2));
  };

  // Register payment handler
  const handleAddPayment = () => {
    if (!activeComanda) return;
    const val = parseFloat(paymentAmountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const trocoPara = trocoParaInput ? parseFloat(trocoParaInput.replace(',', '.')) : undefined;

    registerPayment(
      activeComanda.id,
      selectedPaymentMethod,
      val,
      trocoPara,
      payerName.trim() || undefined,
      splitMode === 'itens' ? selectedItemIdsForSplit : undefined
    );

    // Reset inputs
    setPaymentAmountInput('');
    setTrocoParaInput('');
    setPayerName('');
    setSelectedItemIdsForSplit([]);
  };

  // Open discount modal with current comanda discount prefilled
  const handleOpenDiscountModal = () => {
    if (!activeComanda) return;
    setDiscountValue(
      activeComanda.desconto > 0 ? activeComanda.desconto.toFixed(2).replace('.', ',') : ''
    );
    setDiscountReason(
      activeComanda.motivo_desconto
        ? activeComanda.motivo_desconto.replace(/\s*\(Autorizado por:.*?\)/, '')
        : 'Desconto de Cortesia do Gerente'
    );
    setShowDiscountModal(true);
  };

  // Complete checkout & close comanda
  const handleFinalizeComanda = () => {
    if (!activeComanda) return;
    if (remainingBalance > 0.05) {
      alert('Não é possível fechar comanda com saldo pendente!');
      return;
    }
    closeComanda(activeComanda.id);
    setSelectedComandaId(null);
  };

  // Total sales in this shift
  const shiftSalesTotal = useMemo(() => {
    return comandas
      .filter((c) => c.status === 'fechada')
      .reduce((acc, c) => acc + c.total, 0);
  }, [comandas]);

  // Payment breakdown in cash register
  const paymentBreakdown = useMemo(() => {
    const breakdown: Record<PaymentMethod, number> = {
      dinheiro: 0,
      pix: 0,
      debito: 0,
      credito: 0,
      vale: 0,
    };

    comandas.forEach((c) => {
      c.pagamentos.forEach((p) => {
        if (breakdown[p.forma_pagamento] !== undefined) {
          breakdown[p.forma_pagamento] += p.valor;
        }
      });
    });

    return breakdown;
  }, [comandas]);

  // Orders filtering and status counts for Caixa Pedidos tab
  const filteredCaixaOrders = useMemo(() => {
    return orders.filter((order) => {
      if (pedidosFilterStatus !== 'todos' && order.status !== pedidosFilterStatus) {
        return false;
      }
      if (pedidosSearch) {
        const query = pedidosSearch.toLowerCase();
        const matchId = order.id.toLowerCase().includes(query);
        const matchMesa = order.mesa_numero?.toString().includes(query);
        const matchCliente = order.cliente_nome?.toLowerCase().includes(query);
        const matchGarcom = order.garcom_nome?.toLowerCase().includes(query);
        const matchTel = order.delivery_info?.telefone?.includes(query);
        const matchEndereco = order.delivery_info?.endereco?.toLowerCase().includes(query);
        if (!matchId && !matchMesa && !matchCliente && !matchGarcom && !matchTel && !matchEndereco) {
          return false;
        }
      }
      return true;
    });
  }, [orders, pedidosFilterStatus, pedidosSearch]);

  const countNovos = useMemo(() => orders.filter((o) => o.status === 'novo').length, [orders]);
  const countPreparo = useMemo(() => orders.filter((o) => o.status === 'em_preparo').length, [orders]);
  const countProntos = useMemo(() => orders.filter((o) => o.status === 'pronto').length, [orders]);
  const countACaminho = useMemo(() => orders.filter((o) => o.status === 'a_caminho').length, [orders]);
  const countEntregues = useMemo(() => orders.filter((o) => o.status === 'entregue').length, [orders]);

  const countNovosDelivery = useMemo(() => {
    return orders.filter((o) => {
      const isDeliv = o.tipo_pedido === 'delivery' || o.tipo_pedido === 'retirada' || !o.mesa_numero || o.origem === 'delivery';
      return (isDeliv || o.status === 'novo') && o.status === 'novo';
    }).length;
  }, [orders]);

  const deliveryOrders = useMemo(() => {
    return orders.filter((o) => {
      const isDeliv = o.tipo_pedido === 'delivery' || o.tipo_pedido === 'retirada' || !o.mesa_numero || o.origem === 'delivery';
      if (deliveryFilter === 'todos') {
        return isDeliv || o.status === 'novo';
      }
      if (deliveryFilter === 'novo') {
        return o.status === 'novo';
      }
      return isDeliv && o.status === deliveryFilter;
    }).filter((o) => {
      if (!deliverySearch) return true;
      const q = deliverySearch.toLowerCase();
      const nome = (o.cliente_nome || '').toLowerCase();
      const fone = (o.cliente_telefone || o.delivery_info?.telefone || '').toLowerCase();
      const end = (o.cliente_endereco || o.delivery_info?.endereco || '').toLowerCase();
      const id = o.id.toString();
      return nome.includes(q) || fone.includes(q) || end.includes(q) || id.includes(q);
    });
  }, [orders, deliveryFilter, deliverySearch]);

  const handleConfirmOrder = (order: Order) => {
    updateOrderStatus(order.id, 'em_preparo');
    setPrintingOrder({ order, autoPrint: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] text-stone-900 dark:bg-slate-950 dark:text-slate-100 pb-20">
      {/* Top Cashier Bar */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white border-b border-stone-800 shadow-md px-4 py-3.5">
        <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                Painel do Caixa & Pagamentos
              </h1>
              <p className="text-xs text-stone-400">
                Operador: <strong className="text-emerald-400">{currentUser.nome}</strong> • Status do Caixa:{' '}
                <span
                  className={`font-bold uppercase ${
                    cashRegister.status === 'aberto' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {cashRegister.status}
                </span>
              </p>
            </div>
          </div>

          {/* Cash Register Actions */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {cashRegister.status === 'fechado' ? (
              <button
                onClick={() => setShowOpenRegisterModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Caixa</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowCashEntryModal('suprimento')}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Suprimento</span>
                </button>
                <button
                  onClick={() => setShowCashEntryModal('sangria')}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sangria</span>
                </button>
                <button
                  onClick={() => setShowCloseRegisterModal(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>Fechar Caixa</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Caixa Sub-Tabs Navigation */}
      <div className="bg-stone-900 text-white border-b border-stone-800 px-4 py-2 sticky top-[69px] z-20 shadow-xs">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCaixaActiveTab('comandas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                caixaActiveTab === 'comandas'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Comandas & Mesas ({openComandas.length})</span>
            </button>

            <button
              onClick={() => setCaixaActiveTab('pedidos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
                caixaActiveTab === 'pedidos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Gestão de Pedidos & Produção</span>
              {countNovos > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-full animate-pulse">
                  {countNovos} {countNovos === 1 ? 'novo' : 'novos'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {caixaActiveTab === 'comandas' && (
        <main className="max-w-[1920px] mx-auto w-full p-3 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* Coluna 1: Delivery & Pedidos de Casa (Vermelho no diagrama) */}
          <div className="lg:col-span-4 xl:col-span-3 2xl:col-span-3 space-y-3 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs p-3.5 space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg">
                    <Bike className="w-4 h-4" />
                  </span>
                  <h2 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                    Delivery / Pedidos de Casa
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyDeliveryLink}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer shadow-xs ${
                      copiedDeliveryLink
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700'
                    }`}
                    title="Copiar link do cardápio online com marca e logo da loja para enviar no WhatsApp"
                  >
                    <Share2 className="w-3 h-3 text-amber-500" />
                    <span>{copiedDeliveryLink ? 'Copiado!' : 'Link Cardápio'}</span>
                  </button>
                  {countNovosDelivery > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-red-600 text-white rounded-full animate-pulse shadow-xs">
                      {countNovosDelivery} {countNovosDelivery === 1 ? 'novo' : 'novos'}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    deliveryFilter === 'todos'
                      ? 'bg-stone-900 dark:bg-slate-800 text-white border-stone-900 dark:border-slate-700 shadow-2xs'
                      : 'bg-stone-50 dark:bg-slate-950 text-stone-600 dark:text-slate-400 border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-900'
                  }`}
                >
                  Todos ({deliveryOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('novo')}
                  className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    deliveryFilter === 'novo'
                      ? 'bg-red-600 text-white border-red-700 shadow-2xs'
                      : 'bg-red-50 dark:bg-slate-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100/70'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Novos ({countNovosDelivery})
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('em_preparo')}
                  className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    deliveryFilter === 'em_preparo'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-amber-50 dark:bg-slate-950 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100/70'
                  }`}
                >
                  Preparo
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('a_caminho')}
                  className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    deliveryFilter === 'a_caminho'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                      : 'bg-purple-50 dark:bg-slate-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 hover:bg-purple-100/70'
                  }`}
                >
                  A Caminho
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={deliverySearch}
                  onChange={(e) => setDeliverySearch(e.target.value)}
                  placeholder="Buscar cliente, rua, fone..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-700 transition"
                />
              </div>

              {/* Delivery Orders List */}
              <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1 flex-1">
                {deliveryOrders.length === 0 ? (
                  <div className="py-10 text-center text-stone-400 dark:text-slate-500 text-xs space-y-1.5">
                    <Bike className="w-8 h-8 mx-auto opacity-40 text-purple-400" />
                    <p className="font-semibold text-stone-600 dark:text-slate-400">Nenhum pedido de delivery encontrado.</p>
                    <p className="text-[11px]">Novos pedidos de clientes em casa aparecerão aqui automaticamente.</p>
                  </div>
                ) : (
                  deliveryOrders.map((order) => {
                    const isNovo = order.status === 'novo';
                    const isPreparo = order.status === 'em_preparo';
                    const isPronto = order.status === 'pronto';
                    const isACaminho = order.status === 'a_caminho';
                    const isEntregue = order.status === 'entregue';
                    const isDelivery = order.tipo_pedido === 'delivery' || !order.mesa_numero;

                    const orderTotal =
                      order.itens
                        .filter((it) => it.status === 'ativo')
                        .reduce((acc, it) => acc + it.preco_total, 0) + (order.taxa_entrega || 0);

                    const endereco = order.cliente_endereco || order.delivery_info?.endereco;
                    const telefone = order.cliente_telefone || order.delivery_info?.telefone;

                    return (
                      <div
                        key={order.id}
                        className={`p-3 rounded-xl border text-xs transition shadow-2xs space-y-2 relative ${
                          isNovo
                            ? 'bg-red-50/50 dark:bg-slate-950 border-2 border-red-500 ring-2 ring-red-500/20'
                            : isPreparo
                            ? 'bg-amber-50/40 dark:bg-slate-950 border-2 border-amber-400/90 dark:border-amber-500'
                            : isPronto
                            ? 'bg-emerald-50/30 dark:bg-slate-950 border-2 border-emerald-500'
                            : isACaminho
                            ? 'bg-purple-50/30 dark:bg-slate-950 border-2 border-purple-500'
                            : 'bg-stone-50/70 dark:bg-slate-950 border border-stone-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-stone-900 dark:text-white">
                              #{order.id}
                            </span>
                            {isDelivery ? (
                              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-purple-600 text-white rounded">
                                DELIVERY 🛵
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-stone-900 dark:bg-slate-800 text-white rounded">
                                MESA {order.mesa_numero?.toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          {isNovo && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-red-600 text-white rounded-md animate-pulse">
                              ● NOVO
                            </span>
                          )}
                          {isPreparo && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-amber-500 text-white rounded-md flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" /> PREPARO
                            </span>
                          )}
                          {isPronto && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-600 text-white rounded-md flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> PRONTO
                            </span>
                          )}
                          {isACaminho && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-purple-600 text-white rounded-md flex items-center gap-1">
                              <Bike className="w-2.5 h-2.5" /> A CAMINHO
                            </span>
                          )}
                          {isEntregue && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-stone-700 text-stone-300 rounded-md">
                              ENTREGUE
                            </span>
                          )}
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-0.5 text-[11px] leading-tight">
                          <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1">
                            <span className="text-emerald-500">👤</span>
                            <span className="truncate">{order.cliente_nome || 'Cliente'}</span>
                          </div>
                          {telefone && (
                            <div className="text-stone-500 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{telefone}</span>
                            </div>
                          )}
                          {endereco && (
                            <div className="text-stone-700 dark:text-slate-300 flex items-start gap-1">
                              <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0 mt-0.5" />
                              <span className="text-[10px] leading-tight font-medium truncate">{endereco}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-stone-400 font-mono pt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatTime(order.criado_em)}</span>
                          </div>
                        </div>

                        {/* Items mini list */}
                        <div className="pt-1.5 border-t border-stone-200/70 dark:border-slate-800/80 space-y-1">
                          {order.itens
                            .filter((it) => it.status === 'ativo')
                            .map((it, idx) => (
                              <div key={idx} className="flex justify-between items-baseline text-[11px]">
                                <span className="truncate text-stone-800 dark:text-slate-200">
                                  {it.quantidade}x {it.nome}
                                </span>
                                <span className="font-mono text-stone-600 dark:text-slate-400 text-[10px] ml-1">
                                  {formatCurrency(it.preco_total)}
                                </span>
                              </div>
                            ))}
                        </div>

                        {/* Total & Action Buttons */}
                        <div className="pt-1.5 border-t border-stone-200/70 dark:border-slate-800/80 flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                            {formatCurrency(orderTotal)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPrintingOrder({ order, autoPrint: false })}
                              className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 rounded-lg text-xs transition cursor-pointer"
                              title="Reimprimir comanda de produção"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-500" />
                            </button>

                            {isNovo && (
                              <button
                                type="button"
                                onClick={() => handleConfirmOrder(order)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                                title="Confirmar pedido e imprimir comanda"
                              >
                                <Printer className="w-3 h-3 text-amber-300" />
                                <span>Confirmar</span>
                              </button>
                            )}

                            {isPreparo && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'pronto')}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Check className="w-3 h-3" />
                                <span>Pronto</span>
                              </button>
                            )}

                            {isPronto && isDelivery && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'a_caminho')}
                                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Bike className="w-3 h-3" />
                                <span>Despachar</span>
                              </button>
                            )}

                            {isPronto && !isDelivery && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'entregue')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Check className="w-3 h-3" />
                                <span>Entregar</span>
                              </button>
                            )}

                            {isACaminho && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'entregue')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Check className="w-3 h-3" />
                                <span>Concluir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Coluna 2: Comandas Abertas (Mesas) & Resumo do Caixa (Centro) */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-stone-700 dark:text-slate-300 uppercase tracking-wider">
                Comandas Abertas ({openComandas.length})
              </h2>

              <div className="flex bg-stone-100 dark:bg-slate-950 p-1 rounded-xl border border-stone-200 dark:border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setFilterMode('todas')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterMode === 'todas'
                      ? 'bg-stone-900 dark:bg-slate-800 text-white shadow-2xs'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterMode('fechar')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    filterMode === 'fechar'
                      ? 'bg-amber-400 dark:bg-amber-500 text-stone-950 font-bold shadow-2xs'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <span>Pedindo Conta</span>
                </button>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar comanda # ou mesa..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            {/* Comandas List */}
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {openComandas.length === 0 ? (
                <div className="py-12 text-center text-stone-400 dark:text-slate-500 text-xs">
                  Nenhuma comanda aberta no momento.
                </div>
              ) : (
                openComandas
                  .filter((cmd) => {
                    const table = tables.find((t) => t.id === cmd.mesa_id);
                    if (filterMode === 'fechar' && table?.status !== 'aguardando_fechamento') {
                      return false;
                    }
                    if (searchQuery) {
                      return (
                        cmd.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        cmd.mesa_numero.toString().includes(searchQuery) ||
                        (cmd.cliente_nome && cmd.cliente_nome.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        cmd.garcom_nome.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                    }
                    return true;
                  })
                  .map((cmd) => {
                    const table = tables.find((t) => t.id === cmd.mesa_id);
                    const isSelected = cmd.id === selectedComandaId;
                    const isWaitingClose = table?.status === 'aguardando_fechamento';

                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => {
                          setSelectedComandaId(cmd.id);
                          setSplitMode('nenhum');
                          setPaymentAmountInput(cmd.total.toFixed(2));
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer relative ${
                          isSelected
                            ? 'bg-stone-900 dark:bg-slate-800 text-white border-2 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                            : isWaitingClose
                            ? 'bg-amber-50/90 dark:bg-slate-950 text-stone-900 dark:text-white border-2 border-amber-400/80 dark:border-amber-500 hover:bg-amber-100/80 dark:hover:bg-slate-900'
                            : 'bg-stone-50/80 dark:bg-slate-950 hover:bg-stone-100/80 dark:hover:bg-slate-900 text-stone-900 dark:text-white border border-stone-200 dark:border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-400' : 'text-stone-500 dark:text-slate-400'}`}>
                              {cmd.numero}
                            </span>
                            <span className="font-bold text-sm text-stone-900 dark:text-white">
                              Mesa {cmd.mesa_numero.toString().padStart(2, '0')}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-500 text-slate-950 rounded-md shadow-xs">
                                ✓ SELECIONADA
                              </span>
                            )}
                            {isWaitingClose && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-600 text-white rounded-full animate-pulse">
                                Conta Solicitada
                              </span>
                            )}
                          </div>
                          {cmd.cliente_nome && (
                            <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 block mt-0.5">
                              👤 Cliente: {cmd.cliente_nome}
                            </span>
                          )}
                          <span className={`text-xs block mt-1 ${isSelected ? 'text-stone-300 dark:text-slate-300' : 'text-stone-500 dark:text-slate-400'}`}>
                            Garçom: {cmd.garcom_nome} • {formatTime(cmd.abertura)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className={`text-sm font-mono font-bold block ${isWaitingClose && !isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-white'}`}>
                            {formatCurrency(cmd.total)}
                          </span>
                          <span className="text-[10px] font-mono opacity-60 text-stone-500 dark:text-slate-400">
                            {cmd.pedidos_ids.length} pedidos
                          </span>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Quick Cash Summary Widget */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">Resumo do Caixa</span>
              <span className="text-xs text-stone-500 dark:text-slate-400 font-mono">
                Abertura: <strong className="text-stone-800 dark:text-slate-200">{formatCurrency(cashRegister.valor_inicial)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-stone-50 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800">
                <span className="text-[10px] text-stone-500 dark:text-slate-400 block uppercase font-medium">Dinheiro</span>
                <span className="font-bold text-stone-900 dark:text-white font-mono">
                  {formatCurrency(paymentBreakdown.dinheiro)}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50/70 dark:bg-slate-950 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-medium">PIX</span>
                <span className="font-bold text-emerald-950 dark:text-emerald-300 font-mono">
                  {formatCurrency(paymentBreakdown.pix)}
                </span>
              </div>
              <div className="p-2.5 bg-sky-50/70 dark:bg-slate-950 rounded-xl border border-sky-200/70 dark:border-sky-800/60">
                <span className="text-[10px] text-sky-700 dark:text-sky-400 block uppercase font-medium">Débito</span>
                <span className="font-bold text-sky-950 dark:text-sky-300 font-mono">
                  {formatCurrency(paymentBreakdown.debito)}
                </span>
              </div>
              <div className="p-2.5 bg-purple-50/70 dark:bg-slate-950 rounded-xl border border-purple-200/70 dark:border-purple-800/60">
                <span className="text-[10px] text-purple-700 dark:text-purple-400 block uppercase font-medium">Crédito</span>
                <span className="font-bold text-purple-950 dark:text-purple-300 font-mono">
                  {formatCurrency(paymentBreakdown.credito)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout & Payment Workspace (Shifted right, 5 cols on xl/2xl) */}
        <div className="lg:col-span-4 xl:col-span-5 2xl:col-span-5">
          {!activeComanda ? (
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs p-12 text-center text-stone-400 dark:text-slate-400 h-full flex flex-col items-center justify-center space-y-3 min-h-[400px]">
              <Receipt className="w-12 h-12 text-stone-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-stone-800 dark:text-slate-200">Selecione uma comanda ao lado</p>
              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-sm">
                Ao selecionar uma mesa ou comanda, você poderá conferir o consumo, aplicar descontos, dividir a conta entre pessoas ou itens e registrar pagamentos.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
              {/* Comanda Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-stone-900 dark:text-slate-100">
                      Mesa {activeComanda.mesa_numero.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs font-mono font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                      {activeComanda.numero}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    {activeComanda.cliente_nome && (
                      <span className="text-emerald-500 font-bold mr-2">
                        👤 Cliente: {activeComanda.cliente_nome} •
                      </span>
                    )}
                    Garçom: <strong className="text-stone-700 dark:text-slate-300">{activeComanda.garcom_nome}</strong> • Aberta às {formatTime(activeComanda.abertura)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Imprimir Conta</span>
                  </button>

                  <button
                    onClick={handleOpenDiscountModal}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                      activeComanda.desconto > 0
                        ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {activeComanda.desconto > 0
                        ? `Desconto: -${formatCurrency(activeComanda.desconto)}`
                        : 'Desconto'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Items Breakdown list */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                {allActiveItems.map((item) => (
                  <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-stone-900 dark:text-slate-100">
                        {item.quantidade}x {item.nome}
                      </span>
                      {item.sabores && item.sabores.length > 0 && (
                        <p className="text-[11px] text-stone-500 dark:text-slate-400">
                          Sabores: {item.sabores.join(' + ')}
                        </p>
                      )}
                      {item.borda && item.borda.nome !== 'Sem borda' && (
                        <p className="text-[11px] text-stone-500 dark:text-slate-400">{item.borda.nome}</p>
                      )}
                    </div>
                    <span className="font-bold text-stone-900 dark:text-slate-100 font-mono">
                      {formatCurrency(item.preco_total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Totals Summary Bar */}
              <div className="bg-stone-50/90 dark:bg-slate-950 p-4 rounded-xl border border-stone-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-slate-400">
                  <span>Subtotal dos produtos:</span>
                  <span className="font-semibold font-mono text-stone-900 dark:text-slate-200">{formatCurrency(activeComanda.subtotal)}</span>
                </div>
                {activeComanda.desconto > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Desconto:</span>
                    <span className="font-mono">- {formatCurrency(activeComanda.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline font-bold text-sm pt-2 border-t border-stone-200 dark:border-slate-800 text-stone-900 dark:text-slate-100">
                  <span>Total da Comanda:</span>
                  <span className="text-base font-bold font-mono text-stone-900 dark:text-white">{formatCurrency(activeComanda.total)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-1">
                    <span>Total Pago até agora:</span>
                    <span className="font-mono">{formatCurrency(totalPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-red-600 dark:text-red-400 pt-1 border-t border-stone-200/60 dark:border-slate-800">
                  <span>Saldo Restante:</span>
                  <span className="font-bold font-mono">{formatCurrency(remainingBalance)}</span>
                </div>
              </div>

              {/* Bill Splitting Hub */}
              <div className="bg-stone-50/70 dark:bg-slate-950 p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-slate-200">
                    <Users className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>Divisão de Conta</span>
                  </div>

                  <div className="flex gap-1 bg-stone-200/80 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => {
                        setSplitMode('nenhum');
                        fillSuggestedAmount(remainingBalance);
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        splitMode === 'nenhum'
                          ? 'bg-stone-900 text-white dark:bg-slate-700 dark:text-white shadow-2xs'
                          : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                      }`}
                    >
                      Integral
                    </button>
                    <button
                      onClick={() => {
                        setSplitMode('igual');
                        const perPerson = remainingBalance / splitPeopleCount;
                        fillSuggestedAmount(perPerson);
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        splitMode === 'igual'
                          ? 'bg-stone-900 text-white dark:bg-slate-700 dark:text-white shadow-2xs'
                          : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                      }`}
                    >
                      Por Pessoas
                    </button>
                    <button
                      onClick={() => {
                        setSplitMode('itens');
                        setSelectedItemIdsForSplit([]);
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        splitMode === 'itens'
                          ? 'bg-stone-900 text-white dark:bg-slate-700 dark:text-white shadow-2xs'
                          : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                      }`}
                    >
                      Por Itens
                    </button>
                  </div>
                </div>

                {/* Submode 1: Equal Split */}
                {splitMode === 'igual' && (
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-800 dark:text-slate-200 font-semibold">Dividir em quantas pessoas?</span>
                      <div className="flex items-center gap-1.5">
                        {[2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              setSplitPeopleCount(num);
                              fillSuggestedAmount(remainingBalance / num);
                            }}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition border cursor-pointer ${
                              splitPeopleCount === num
                                ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                                : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 bg-stone-50 dark:bg-slate-950 rounded-lg border border-stone-200 dark:border-slate-800 flex items-center justify-between font-semibold text-stone-800 dark:text-slate-200">
                      <span>{formatCurrency(remainingBalance)} ÷ {splitPeopleCount} pessoas:</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">
                        {formatCurrency(remainingBalance / splitPeopleCount)} / pessoa
                      </span>
                    </div>
                  </div>
                )}

                {/* Submode 2: Split by Items */}
                {splitMode === 'itens' && (
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-stone-200 dark:border-slate-800 space-y-2.5 text-xs">
                    <span className="font-semibold text-stone-800 dark:text-slate-200 block text-xs">
                      Selecione os itens que esta pessoa vai pagar:
                    </span>
                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                      {allActiveItems.map((item) => {
                        const isChecked = selectedItemIdsForSplit.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isChecked
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-medium shadow-2xs'
                                : 'border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 text-stone-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let next = [];
                                  if (e.target.checked) {
                                    next = [...selectedItemIdsForSplit, item.id];
                                  } else {
                                    next = selectedItemIdsForSplit.filter((id) => id !== item.id);
                                  }
                                  setSelectedItemIdsForSplit(next);
                                  const totalSelected = allActiveItems
                                    .filter((it) => next.includes(it.id))
                                    .reduce((s, it) => s + it.preco_total, 0);
                                  fillSuggestedAmount(totalSelected);
                                }}
                                className="accent-red-600"
                              />
                              <span>
                                {item.quantidade}x {item.nome}
                              </span>
                            </div>
                            <span className="font-mono font-bold">{formatCurrency(item.preco_total)}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="p-2.5 bg-stone-50 dark:bg-slate-950 rounded-lg border border-stone-200 dark:border-slate-800 flex items-center justify-between font-semibold text-stone-800 dark:text-slate-200">
                      <span>Total dos itens selecionados:</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">
                        {formatCurrency(splitItemsTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods & Execution */}
              {remainingBalance > 0 ? (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300 block">
                    Registrar Forma de Pagamento
                  </span>

                  {/* Payment Method Selector Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('pix')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        selectedPaymentMethod === 'pix'
                          ? 'bg-stone-900 text-white border-stone-900 dark:bg-slate-800 dark:border-emerald-500 dark:text-emerald-400 shadow-xs'
                          : 'bg-stone-50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-emerald-500" />
                      <span>PIX</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('credito')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        selectedPaymentMethod === 'credito'
                          ? 'bg-stone-900 text-white border-stone-900 dark:bg-slate-800 dark:border-blue-500 dark:text-blue-400 shadow-xs'
                          : 'bg-stone-50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-blue-500" />
                      <span>Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('debito')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        selectedPaymentMethod === 'debito'
                          ? 'bg-stone-900 text-white border-stone-900 dark:bg-slate-800 dark:border-cyan-500 dark:text-cyan-400 shadow-xs'
                          : 'bg-stone-50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-cyan-500" />
                      <span>Débito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('dinheiro')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        selectedPaymentMethod === 'dinheiro'
                          ? 'bg-stone-900 text-white border-stone-900 dark:bg-slate-800 dark:border-amber-500 dark:text-amber-400 shadow-xs'
                          : 'bg-stone-50 hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 text-amber-500" />
                      <span>Dinheiro</span>
                    </button>
                  </div>

                  {/* Payment Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Valor a Receber (R$):
                      </label>
                      <input
                        type="text"
                        value={paymentAmountInput}
                        onChange={(e) => setPaymentAmountInput(e.target.value)}
                        placeholder="Ex: 50,00"
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-sm font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
                      />
                    </div>

                    {selectedPaymentMethod === 'dinheiro' && (
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Troco para quanto? (Opcional):
                        </label>
                        <input
                          type="text"
                          value={trocoParaInput}
                          onChange={(e) => setTrocoParaInput(e.target.value)}
                          placeholder="Ex: 100,00"
                          className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-sm font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
                        />
                        {trocoParaInput &&
                          parseFloat(trocoParaInput.replace(',', '.')) >
                            parseFloat(paymentAmountInput.replace(',', '.') || '0') && (
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mt-1">
                              Troco a devolver:{' '}
                              <strong className="font-mono">
                                {formatCurrency(
                                  parseFloat(trocoParaInput.replace(',', '.')) -
                                    parseFloat(paymentAmountInput.replace(',', '.'))
                                )}
                              </strong>
                            </span>
                          )}
                      </div>
                    )}

                    {splitMode !== 'nenhum' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Identificação do Pagador (Opcional):
                        </label>
                        <input
                          type="text"
                          value={payerName}
                          onChange={(e) => setPayerName(e.target.value)}
                          placeholder="Ex: João, Maria, Amigo 1"
                          className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="w-full py-3 bg-stone-900 dark:bg-emerald-600 hover:bg-stone-800 dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
                    <span>Lançar Pagamento de {paymentAmountInput ? `R$ ${paymentAmountInput}` : '...'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center space-y-1">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase">Conta totalmente quitada!</h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Todos os pagamentos foram confirmados com sucesso.
                  </p>
                </div>
              )}

              {/* Already Registered Payments List */}
              {activeComanda.pagamentos.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                    Pagamentos Registrados:
                  </span>
                  <div className="space-y-1.5">
                    {activeComanda.pagamentos.map((pag) => (
                      <div
                        key={pag.id}
                        className="flex justify-between items-center text-xs p-2.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl"
                      >
                        <span className="font-semibold text-stone-900 dark:text-slate-100 uppercase">
                          • {pag.forma_pagamento} {pag.pagador_nome ? `(${pag.pagador_nome})` : ''}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                            {formatCurrency(pag.valor)}
                          </span>
                          {pag.troco && pag.troco > 0 ? (
                            <span className="text-[11px] text-stone-500 dark:text-slate-400 block font-mono">
                              (Troco: {formatCurrency(pag.troco)})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Closure Button */}
              <div className="pt-3 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={remainingBalance > 0.05}
                  onClick={handleFinalizeComanda}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>Fechar Comanda e Liberar Mesa</span>
                </button>
                {remainingBalance > 0.05 && (
                  <p className="text-xs text-center text-stone-500 dark:text-slate-400 mt-2">
                    * Quite o saldo restante de <span className="font-bold font-mono text-stone-900 dark:text-slate-200">{formatCurrency(remainingBalance)}</span> para liberar a mesa.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      )}

      {/* Tab 2: Gestão de Pedidos & Produção */}
      {caixaActiveTab === 'pedidos' && (
        <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-4 flex-1">
          {/* Top Bar for Pedidos: Status Filter Chips & Search */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPedidosFilterStatus('todos')}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  pedidosFilterStatus === 'todos'
                    ? 'bg-stone-900 dark:bg-slate-800 text-white border-stone-900 dark:border-slate-700 shadow-xs'
                    : 'bg-stone-100 dark:bg-slate-950 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:bg-stone-200/70'
                }`}
              >
                TODOS ({orders.length})
              </button>

              <button
                type="button"
                onClick={() => setPedidosFilterStatus('novo')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  pedidosFilterStatus === 'novo'
                    ? 'bg-red-700 text-white border-red-800 shadow-xs'
                    : 'bg-red-50 dark:bg-slate-950 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-100/70'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                NOVOS ({countNovos})
              </button>

              <button
                type="button"
                onClick={() => setPedidosFilterStatus('em_preparo')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  pedidosFilterStatus === 'em_preparo'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-amber-50 dark:bg-slate-950 text-amber-900 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/70'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                EM PREPARO ({countPreparo})
              </button>

              <button
                type="button"
                onClick={() => setPedidosFilterStatus('pronto')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  pedidosFilterStatus === 'pronto'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-emerald-50 dark:bg-slate-950 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/70'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                PRONTOS ({countProntos})
              </button>

              <button
                type="button"
                onClick={() => setPedidosFilterStatus('a_caminho')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  pedidosFilterStatus === 'a_caminho'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-purple-50 dark:bg-slate-950 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-900/60 hover:bg-purple-100/70'
                }`}
              >
                <Bike className="w-3.5 h-3.5 text-purple-500" />
                A CAMINHO ({countACaminho})
              </button>

              <button
                type="button"
                onClick={() => setPedidosFilterStatus('entregue')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  pedidosFilterStatus === 'entregue'
                    ? 'bg-stone-800 text-white border-stone-700 shadow-xs'
                    : 'bg-stone-100 dark:bg-slate-950 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:bg-stone-200/70'
                }`}
              >
                ENTREGUES ({countEntregues})
              </button>
            </div>

            {/* Pedidos Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-400" />
              <input
                type="text"
                value={pedidosSearch}
                onChange={(e) => setPedidosSearch(e.target.value)}
                placeholder="Buscar cliente, mesa, fone..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-700"
              />
            </div>
          </div>

          {/* Pedidos Grid Cards */}
          {filteredCaixaOrders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <ChefHat className="w-10 h-10 text-stone-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-stone-800 dark:text-slate-200">
                Nenhum pedido encontrado neste filtro.
              </p>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Novos pedidos recebidos via mesa ou delivery aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCaixaOrders.map((order) => {
                const isNovo = order.status === 'novo';
                const isPreparo = order.status === 'em_preparo';
                const isPronto = order.status === 'pronto';
                const isACaminho = order.status === 'a_caminho';
                const isEntregue = order.status === 'entregue';
                const isDelivery = order.origem === 'delivery';

                const totalOrder = order.itens
                  .filter((it) => it.status === 'ativo')
                  .reduce((acc, it) => acc + it.preco_total, 0);

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border transition shadow-xs flex flex-col justify-between overflow-hidden ${
                      isNovo
                        ? 'bg-red-50/40 dark:bg-slate-900 border-2 border-red-500 ring-2 ring-red-500/20'
                        : isPreparo
                        ? 'bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-500/80'
                        : isPronto
                        ? 'bg-white dark:bg-slate-900 border-2 border-emerald-500'
                        : isACaminho
                        ? 'bg-white dark:bg-slate-900 border-2 border-purple-500'
                        : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 opacity-80'
                    }`}
                  >
                    {/* Header */}
                    <div className="p-3.5 bg-stone-50 dark:bg-slate-950 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isDelivery ? (
                          <span className="px-2.5 py-1 text-xs font-black uppercase bg-purple-600 text-white rounded-lg flex items-center gap-1 shadow-xs">
                            <Bike className="w-3.5 h-3.5" /> DELIVERY
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-black uppercase bg-stone-900 dark:bg-slate-800 text-white rounded-lg shadow-xs">
                            MESA {order.mesa_numero?.toString().padStart(2, '0') || '00'}
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-stone-500 dark:text-slate-400">
                          #{order.id}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {isNovo && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-red-600 text-white rounded-md animate-pulse">
                          ● NOVO PEDIDO
                        </span>
                      )}
                      {isPreparo && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-500 text-white rounded-md flex items-center gap-1">
                          <Flame className="w-3 h-3" /> EM PREPARO
                        </span>
                      )}
                      {isPronto && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-600 text-white rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" /> PRONTO
                        </span>
                      )}
                      {isACaminho && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-600 text-white rounded-md flex items-center gap-1">
                          <Bike className="w-3 h-3" /> A CAMINHO
                        </span>
                      )}
                      {isEntregue && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-stone-700 text-stone-200 rounded-md">
                          ENTREGUE
                        </span>
                      )}
                    </div>

                    {/* Body: Customer info & Items */}
                    <div className="p-4 space-y-3 flex-1 text-xs">
                      {/* Customer / Waiter / Delivery Address info */}
                      <div className="bg-stone-50/80 dark:bg-slate-950 p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 space-y-1">
                        {order.cliente_nome && (
                          <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                            <span className="text-emerald-500">👤</span>
                            <span>Cliente: {order.cliente_nome}</span>
                          </div>
                        )}
                        {order.garcom_nome && (
                          <div className="text-stone-600 dark:text-slate-400">
                            Atendente: {order.garcom_nome}
                          </div>
                        )}
                        {order.delivery_info?.telefone && (
                          <div className="text-stone-600 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{order.delivery_info.telefone}</span>
                          </div>
                        )}
                        {order.delivery_info?.endereco && (
                          <div className="text-stone-700 dark:text-slate-300 flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight font-medium">
                              {order.delivery_info.endereco}
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-stone-400 font-mono pt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Recebido às {formatTime(order.criado_em)}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 divide-y divide-stone-100 dark:divide-slate-800/80">
                        {order.itens
                          .filter((it) => it.status === 'ativo')
                          .map((it, idx) => (
                            <div key={idx} className="pt-1.5 first:pt-0">
                              <div className="flex items-center justify-between font-semibold text-stone-900 dark:text-white">
                                <span>
                                  {it.quantidade}x {it.nome}
                                </span>
                                <span className="font-mono text-stone-700 dark:text-slate-300">
                                  {formatCurrency(it.preco_total)}
                                </span>
                              </div>
                              {it.sabores && it.sabores.length > 0 && (
                                <p className="text-[10px] text-stone-500 dark:text-slate-400 pl-2">
                                  › {it.sabores.join(' + ')}
                                </p>
                              )}
                              {it.observacao && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold pl-2">
                                  Obs: {it.observacao}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>

                      {order.observacao && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-900 dark:text-amber-300 font-semibold text-[11px]">
                          Obs Geral: {order.observacao}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Total & Actions */}
                    <div className="p-3.5 bg-stone-50 dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-xs text-stone-600 dark:text-slate-400">Total do Pedido:</span>
                        <span className="text-sm font-mono text-stone-900 dark:text-white">
                          {formatCurrency(totalOrder)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrintingOrder({ order, autoPrint: false })}
                          className="px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                          title="Imprimir comanda térmica do pedido"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-500" />
                          <span>Imprimir</span>
                        </button>

                        {/* Lifecycle buttons */}
                        {isNovo && (
                          <button
                            type="button"
                            onClick={() => handleConfirmOrder(order)}
                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                            title="Confirma pedido, avança para preparo e dispara impressão automática"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-300" />
                            <span>Confirmar & Imprimir 🖨️</span>
                          </button>
                        )}

                        {isPreparo && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'pronto')}
                            className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Marcar Pronto 🍕</span>
                          </button>
                        )}

                        {isPronto && isDelivery && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'a_caminho')}
                            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Despachar / A Caminho 🛵</span>
                          </button>
                        )}

                        {isPronto && !isDelivery && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'entregue')}
                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Entregue na Mesa ✓</span>
                          </button>
                        )}

                        {isACaminho && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'entregue')}
                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar Entrega Concluída 🏠</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && activeComanda && (
        <ReceiptModal
          comanda={activeComanda}
          orders={orders}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && activeComanda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-stone-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">Aplicar Desconto na Comanda</h3>
              <span className="text-xs font-mono font-bold text-stone-500 dark:text-slate-400">
                Subtotal: {formatCurrency(activeComanda.subtotal)}
              </span>
            </div>

            {activeComanda.desconto > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold block">Desconto atual aplicado:</span>
                  <span className="text-emerald-950 dark:text-emerald-200 font-mono font-bold text-sm">
                    {formatCurrency(activeComanda.desconto)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    applyDiscount(activeComanda.id, 0, '');
                    setDiscountValue('');
                    setShowDiscountModal(false);
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
                >
                  Remover Desconto
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Valor do Desconto (R$):
              </label>
              <input
                type="text"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Ex: 15,00 (ou 0 para remover)"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-sm font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
              <span className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 block">
                Digite 0 ou deixe vazio para remover o desconto.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Motivo / Justificativa:
              </label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Ex: Cortesia, fidelidade, parceria"
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-stone-800 dark:text-slate-200 focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div className="flex justify-between items-center gap-2 pt-2 border-t border-stone-200 dark:border-slate-800">
              {activeComanda.desconto > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    applyDiscount(activeComanda.id, 0, '');
                    setDiscountValue('');
                    setShowDiscountModal(false);
                  }}
                  className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                >
                  Zerar Desconto
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const cleaned = discountValue.trim().replace(',', '.');
                    const val = cleaned === '' ? 0 : parseFloat(cleaned);
                    if (!isNaN(val)) {
                      applyDiscount(activeComanda.id, Math.max(0, val), discountReason);
                    }
                    setShowDiscountModal(false);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Register Abertura Modal */}
      {showOpenRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-stone-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">Abertura de Caixa</h3>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Informe o valor de fundo de troco inicial disponível na gaveta para iniciar a operação.
            </p>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Valor Inicial / Fundo de Troco (R$):
              </label>
              <input
                type="text"
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-sm font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowOpenRegisterModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(initialCashInput.replace(',', '.'));
                  openCashRegister(isNaN(val) ? 0 : val);
                  setShowOpenRegisterModal(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Confirmar Abertura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Entry (Suprimento ou Sangria) Modal */}
      {showCashEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-stone-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100 capitalize">
              Lançar {showCashEntryModal}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Valor (R$):</label>
              <input
                type="text"
                value={entryAmountInput}
                onChange={(e) => setEntryAmountInput(e.target.value)}
                placeholder="Ex: 50,00"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-sm font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Motivo / Justificativa:
              </label>
              <input
                type="text"
                value={entryReasonInput}
                onChange={(e) => setEntryReasonInput(e.target.value)}
                placeholder="Ex: Pagamento de fornecedor, reforço troco"
                className="w-full px-3.5 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-stone-800 dark:text-slate-200 focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCashEntryModal(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(entryAmountInput.replace(',', '.'));
                  if (!isNaN(val) && val > 0) {
                    addCashEntry(showCashEntryModal, entryReasonInput || 'Operação de caixa', val);
                  }
                  setShowCashEntryModal(null);
                  setEntryAmountInput('');
                  setEntryReasonInput('');
                }}
                className="px-4 py-2 text-xs font-bold bg-stone-900 dark:bg-slate-700 hover:bg-stone-800 dark:hover:bg-slate-600 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Confirmar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Register Close Modal (PRD Section 24) */}
      {showCloseRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">Fechamento do Caixa</h3>
            <div className="bg-stone-50 dark:bg-slate-950 p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-slate-400">
                <span>Fundo inicial:</span>
                <span className="font-semibold font-mono text-stone-900 dark:text-slate-200">{formatCurrency(cashRegister.valor_inicial)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-slate-400">
                <span>Total Dinheiro:</span>
                <span className="font-semibold font-mono text-stone-900 dark:text-slate-200">{formatCurrency(paymentBreakdown.dinheiro)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-slate-400">
                <span>Total PIX:</span>
                <span className="font-semibold font-mono text-stone-900 dark:text-slate-200">{formatCurrency(paymentBreakdown.pix)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-slate-400">
                <span>Total Cartão Débito:</span>
                <span className="font-semibold font-mono text-stone-900 dark:text-slate-200">{formatCurrency(paymentBreakdown.debito)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-slate-400">
                <span>Total Cartão Crédito:</span>
                <span className="font-semibold font-mono text-stone-900 dark:text-slate-200">{formatCurrency(paymentBreakdown.credito)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 dark:border-slate-800 font-bold text-sm text-stone-900 dark:text-slate-100">
                <span>Total do Turno:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(
                    cashRegister.valor_inicial +
                      paymentBreakdown.dinheiro +
                      paymentBreakdown.pix +
                      paymentBreakdown.debito +
                      paymentBreakdown.credito
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Observações do Fechamento (Opcional):
              </label>
              <textarea
                rows={2}
                value={closeNotesInput}
                onChange={(e) => setCloseNotesInput(e.target.value)}
                placeholder="Observações sobre conferência de gaveta..."
                className="w-full p-2.5 text-xs bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCloseRegisterModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  const final =
                    cashRegister.valor_inicial +
                    paymentBreakdown.dinheiro +
                    paymentBreakdown.pix +
                    paymentBreakdown.debito +
                    paymentBreakdown.credito;
                  closeCashRegister(final, closeNotesInput);
                  setShowCloseRegisterModal(false);
                }}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Ticket Production Modal (Auto or Manual print) */}
      {printingOrder && (
        <KitchenTicketModal
          order={printingOrder.order}
          autoPrint={printingOrder.autoPrint}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
};
