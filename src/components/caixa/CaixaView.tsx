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
  ShoppingBag,
  UtensilsCrossed,
  X,
  Copy,
  ExternalLink,
  MessageCircle,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Comanda, Order, Table, PaymentMethod, CashEntry, OrderStatus, Product, OrderItem, Category } from '../../types';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { ReceiptModal } from '../ReceiptModal';
import { KitchenTicketModal } from '../KitchenTicketModal';
import { PizzaCustomizerModal } from '../garcom/PizzaCustomizerModal';
import { NfceModal } from './NfceModal';
import { playAddPop, playKitchenBell } from '../../utils/audio';
import { sortOrdersNovosFirst, filterAndSortCaixaChannelOrders, formatOrderDateTimeCaixa } from '../../utils/orderSorting';

const DEFAULT_FOOD_IMG = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80';

const DEFAULT_BURGER_ADDONS = [
  { id: 'add_bacon', nome: 'Bacon Crocante Extra', preco: 5.0 },
  { id: 'add_cheddar', nome: 'Cheddar Cremoso Melt', preco: 4.5 },
  { id: 'add_smash', nome: 'Smash Burger 90g Extra', preco: 8.5 },
  { id: 'add_cebola', nome: 'Cebola Caramelizada', preco: 3.5 },
  { id: 'add_maionese', nome: 'Maionese Especial da Casa', preco: 3.0 },
  { id: 'add_ovo', nome: 'Ovo Frito na Manteiga', preco: 3.0 },
];

const DEFAULT_PORTION_ADDONS = [
  { id: 'add_queijo', nome: 'Queijo Parmesão / Ralado Extra', preco: 5.0 },
  { id: 'add_bacon_cubos', nome: 'Farofa de Bacon Crocante', preco: 6.0 },
  { id: 'add_cheddar_dose', nome: 'Dose Extra de Cheddar Cremoso', preco: 5.0 },
  { id: 'add_molho_especial', nome: 'Pote de Molho Especial (Gourmet)', preco: 4.0 },
];

export const CaixaView: React.FC = () => {
  const {
    tables,
    comandas,
    orders,
    products,
    categories,
    cashRegister,
    currentUser,
    registerPayment,
    applyDiscount,
    closeComanda,
    ensureOrderComanda,
    openCashRegister,
    closeCashRegister,
    addCashEntry,
    updateOrderStatus,
    updateOrderNfce,
    updateComandaNfce,
    currentLoja,
    currentLojaId,
    createDeliveryOrder,
    openComanda,
    addOrderToComanda,
  } = useStore();

  const [caixaActiveTab, setCaixaActiveTab] = useState<'comandas' | 'balcao' | 'pedidos'>('comandas');
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
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

  // Motoboy unique delivery link modal state
  const [motoboyModalOrder, setMotoboyModalOrder] = useState<Order | null>(null);
  const [copiedMotoboyLink, setCopiedMotoboyLink] = useState(false);

  const getMotoboyLink = (order: Order) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const token = order.motoboy_token || String(order.id);
    return `${origin}${pathname}?motoboy=1&pedido=${order.id}&token=${token}`;
  };

  const handleShareMotoboyLink = (order: Order) => {
    setMotoboyModalOrder(order);
    setCopiedMotoboyLink(false);
  };

  const handleCopyMotoboyLink = async (order: Order) => {
    const link = getMotoboyLink(order);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedMotoboyLink(true);
      setTimeout(() => setCopiedMotoboyLink(false), 2500);
    } catch {
      setCopiedMotoboyLink(false);
    }
  };

  const getMotoboyWhatsAppUrl = (order: Order) => {
    const link = getMotoboyLink(order);
    const totalOrderVal = order.itens
      .filter((it) => it.status === 'ativo')
      .reduce((a, c) => a + c.preco_total, 0) + (order.taxa_entrega || 0);
    const enderecoTxt = order.cliente_endereco || order.delivery_info?.endereco || 'Ver no link';
    const text = `🛵 *ENTREGA PEDIDO #${order.id}*\n\n` +
      `👤 *Cliente:* ${order.cliente_nome || 'Cliente'}\n` +
      `📍 *Endereço:* ${enderecoTxt}\n` +
      `💰 *Total a Cobrar:* ${formatCurrency(totalOrderVal)}\n` +
      `💳 *Forma de Pgto:* ${order.forma_pagamento || 'A combinar'}` +
      (order.troco_para ? ` (Troco para ${formatCurrency(order.troco_para)})` : '') + `\n\n` +
      `👉 *Clique no link para ver a rota no GPS e finalizar a entrega:*\n${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Pedidos & Delivery / Retirada tracking state (Caixa Operacional)
  const [deliveryFilter, setDeliveryFilter] = useState<'todos' | 'novo' | 'em_preparo' | 'a_caminho'>('todos');
  const [deliverySearch, setDeliverySearch] = useState<string>('');

  const [retiradaFilter, setRetiradaFilter] = useState<'todos' | 'novo' | 'em_preparo' | 'pronto'>('todos');
  const [retiradaSearch, setRetiradaSearch] = useState<string>('');

  const [pedidosCanalFilter, setPedidosCanalFilter] = useState<'todos' | 'delivery' | 'retirada' | 'mesa'>('todos');
  const [pedidosFilterStatus, setPedidosFilterStatus] = useState<string>('todos');
  const [pedidosSearch, setPedidosSearch] = useState<string>('');
  const [printingOrder, setPrintingOrder] = useState<{ order: Order; autoPrint: boolean } | null>(null);

  // Modals inside Caixa
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNfceModal, setShowNfceModal] = useState(false);
  const [nfceTarget, setNfceTarget] = useState<Order | Comanda | null>(null);
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

  // Estados para Pedido no Balcão (Aba central do Caixa)
  const [balcaoModalidade, setBalcaoModalidade] = useState<'retirada' | 'mesa'>('retirada');
  const [balcaoSelectedMesaId, setBalcaoSelectedMesaId] = useState<string>('');
  const [balcaoClienteNome, setBalcaoClienteNome] = useState('');
  const [balcaoClienteTelefone, setBalcaoClienteTelefone] = useState('');
  const [balcaoObservacao, setBalcaoObservacao] = useState('');
  const [balcaoFormaPagamento, setBalcaoFormaPagamento] = useState<string>('pix');
  const [balcaoTrocoPara, setBalcaoTrocoPara] = useState<string>('');
  const [balcaoCategoryFilter, setBalcaoCategoryFilter] = useState<string>('todas');
  const [balcaoSearchQuery, setBalcaoSearchQuery] = useState('');
  const [balcaoCart, setBalcaoCart] = useState<OrderItem[]>([]);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedCustomItem, setSelectedCustomItem] = useState<Product | null>(null);
  const [selectedCustomItemAddons, setSelectedCustomItemAddons] = useState<{ id: string; nome: string; preco: number }[]>([]);
  const [customItemModalObs, setCustomItemModalObs] = useState<string>('');
  const [customItemModalQtd, setCustomItemModalQtd] = useState<number>(1);
  const [isSubmittingBalcaoOrder, setIsSubmittingBalcaoOrder] = useState(false);
  const [balcaoCreatedOrder, setBalcaoCreatedOrder] = useState<Order | null>(null);
  const [balcaoErrorMessage, setBalcaoErrorMessage] = useState<string | null>(null);

  const isPizzaProduct = (prod: Product) => {
    if (prod.isPizza) return true;
    const cat = categories.find((c) => c.id === prod.categoria_id);
    return Boolean(cat?.nome?.toLowerCase().includes('pizza') || prod.nome?.toLowerCase().includes('pizza'));
  };

  const hasProductAddons = (prod: Product) => {
    if (isPizzaProduct(prod)) return false;
    if (prod.permitirAdicionais) return true;
    const cat = categories.find((c) => c.id === prod.categoria_id);
    const catName = cat?.nome?.toLowerCase() || '';
    const prodCat = prod.categoria_id?.toLowerCase() || '';
    return (
      prodCat === 'lanches' ||
      prodCat === 'hamburgueres' ||
      prodCat === 'porcoes' ||
      catName.includes('lanche') ||
      catName.includes('burger') ||
      catName.includes('hambúrguer') ||
      catName.includes('porç')
    );
  };

  const getAvailableAddonsForProduct = (prod: Product) => {
    const cat = categories.find((c) => c.id === prod.categoria_id);
    const catName = cat?.nome?.toLowerCase() || '';
    const prodCat = prod.categoria_id?.toLowerCase() || '';
    if (prodCat === 'porcoes' || catName.includes('porç')) {
      return DEFAULT_PORTION_ADDONS;
    }
    return DEFAULT_BURGER_ADDONS;
  };

  const handleOpenItemCustomizerBalcao = (prod: Product) => {
    setSelectedCustomItem(prod);
    setSelectedCustomItemAddons([]);
    setCustomItemModalObs('');
    setCustomItemModalQtd(1);
  };

  const handleConfirmCustomItemBalcao = () => {
    if (!selectedCustomItem) return;
    const extrasTotal = selectedCustomItemAddons.reduce((acc, curr) => acc + curr.preco, 0);
    const precoBase = selectedCustomItem.em_promocao && selectedCustomItem.preco_promocional
      ? selectedCustomItem.preco_promocional
      : selectedCustomItem.preco;
    const precoUnitarioTotal = precoBase + extrasTotal;
    const precoTotal = precoUnitarioTotal * customItemModalQtd;

    const newItem: OrderItem = {
      id: `balcao_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      produto_id: selectedCustomItem.id,
      nome: selectedCustomItem.nome,
      quantidade: customItemModalQtd,
      preco_unitario: precoUnitarioTotal,
      preco_total: precoTotal,
      adicionais: selectedCustomItemAddons.length > 0 ? selectedCustomItemAddons : undefined,
      observacao: customItemModalObs.trim() || undefined,
      status: 'ativo',
    };

    setBalcaoCart((prev) => [...prev, newItem]);
    setSelectedCustomItem(null);
    setSelectedCustomItemAddons([]);
    setCustomItemModalObs('');
    setCustomItemModalQtd(1);
    playAddPop();
  };

  const balcaoProducts = useMemo(() => {
    return products.filter((p) => {
      if (currentLojaId !== 'todas') {
        if (p.loja_id && p.loja_id !== currentLojaId && p.loja_id !== currentLoja?.id) {
          return false;
        }
      }
      if (p.ativo === false || p.disponivel === false) return false;

      if (balcaoCategoryFilter !== 'todas' && p.categoria_id !== balcaoCategoryFilter) {
        return false;
      }

      if (balcaoSearchQuery.trim()) {
        const query = balcaoSearchQuery.toLowerCase();
        const matchesName = p.nome.toLowerCase().includes(query);
        const matchesDesc = p.descricao?.toLowerCase().includes(query);
        const matchesCode = p.codigo_interno?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCode) return false;
      }

      return true;
    });
  }, [products, currentLojaId, currentLoja, balcaoCategoryFilter, balcaoSearchQuery]);

  const balcaoCartTotal = useMemo(() => {
    return balcaoCart.reduce((sum, item) => sum + item.preco_total, 0);
  }, [balcaoCart]);

  const handleAddSimpleProductToBalcao = (prod: Product) => {
    playAddPop();
    setBalcaoCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.produto_id === prod.id && (!it.sabores || it.sabores.length <= 1) && !it.borda && !it.massa && (!it.adicionais || it.adicionais.length === 0)
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        const existing = copy[existingIdx];
        const newQty = existing.quantidade + 1;
        copy[existingIdx] = {
          ...existing,
          quantidade: newQty,
          preco_total: newQty * existing.preco_unitario,
        };
        return copy;
      }

      const finalPrice = prod.em_promocao && prod.preco_promocional ? prod.preco_promocional : prod.preco;
      const newItem: OrderItem = {
        id: `balcao_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        produto_id: prod.id,
        nome: prod.nome,
        quantidade: 1,
        preco_unitario: finalPrice,
        preco_total: finalPrice,
        status: 'ativo',
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateBalcaoItemQuantity = (index: number, delta: number) => {
    setBalcaoCart((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (!item) return prev;
      const newQty = item.quantidade + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index] = {
        ...item,
        quantidade: newQty,
        preco_total: newQty * item.preco_unitario,
      };
      return copy;
    });
  };

  const handleRemoveBalcaoItem = (index: number) => {
    setBalcaoCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalizeBalcaoOrder = async () => {
    if (balcaoCart.length === 0) {
      setBalcaoErrorMessage('Adicione pelo menos um produto ao pedido no balcão.');
      return;
    }

    setIsSubmittingBalcaoOrder(true);
    setBalcaoErrorMessage(null);

    try {
      const activeLojaId = currentLoja?.id || (currentLojaId === 'todas' ? 'loja_centro' : currentLojaId);
      const clienteNomeFinal = balcaoClienteNome.trim() || 'Cliente Balcão';
      const trocoNum = balcaoTrocoPara.trim() ? parseFloat(balcaoTrocoPara.replace(',', '.')) : undefined;

      if (balcaoModalidade === 'mesa') {
        if (!balcaoSelectedMesaId) {
          setBalcaoErrorMessage('Selecione uma mesa para lançar o pedido.');
          setIsSubmittingBalcaoOrder(false);
          return;
        }

        const selectedTable = tables.find((t) => t.id === balcaoSelectedMesaId);
        if (!selectedTable) {
          setBalcaoErrorMessage('Mesa não encontrada.');
          setIsSubmittingBalcaoOrder(false);
          return;
        }

        let comandaId = selectedTable.comanda_atual_id;
        if (!comandaId) {
          const newCmd = openComanda(
            selectedTable.id,
            currentUser.id,
            currentUser.nome,
            clienteNomeFinal
          );
          comandaId = newCmd.id;
        }

        const newOrder = addOrderToComanda(comandaId, balcaoCart, balcaoObservacao.trim() || undefined);
        playKitchenBell();
        setBalcaoCreatedOrder(newOrder);
        setBalcaoCart([]);
        setBalcaoObservacao('');
        setBalcaoTrocoPara('');
        setBalcaoClienteNome('');
        setBalcaoClienteTelefone('');
      } else {
        const newOrder = createDeliveryOrder(
          activeLojaId,
          {
            nome: clienteNomeFinal,
            telefone: balcaoClienteTelefone.trim() || '(Balcão)',
            endereco: `Retirada no Balcão — ${currentLoja?.nome || 'Loja'}`,
            formaPagamento: balcaoFormaPagamento,
            trocoPara: trocoNum,
            tipoPedido: 'retirada',
            bypassStoreOpenCheck: true,
          },
          balcaoCart,
          balcaoObservacao.trim() || undefined
        );

        playKitchenBell();
        setBalcaoCreatedOrder(newOrder);
        setBalcaoCart([]);
        setBalcaoObservacao('');
        setBalcaoTrocoPara('');
        setBalcaoClienteNome('');
        setBalcaoClienteTelefone('');
      }
    } catch (err: any) {
      console.error('Erro ao lançar pedido no balcão:', err);
      setBalcaoErrorMessage(err?.message || 'Erro ao lançar pedido no balcão.');
    } finally {
      setIsSubmittingBalcaoOrder(false);
    }
  };

  // Active open comandas
  const openComandas = useMemo(() => {
    return comandas.filter((c) => c.status === 'aberta');
  }, [comandas]);

  // Selected comanda object
  const activeComanda = useMemo(() => {
    return comandas.find((c) => c.id === selectedComandaId) || null;
  }, [comandas, selectedComandaId]);

  // Selected order (if from Retirada or Delivery)
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      return orders.find((o) => o.id === selectedOrderId) || null;
    }
    if (activeComanda && activeComanda.pedidos_ids.length > 0) {
      return (
        orders.find(
          (o) =>
            activeComanda.pedidos_ids.includes(o.id) &&
            (o.tipo_pedido === 'retirada' || o.tipo_pedido === 'delivery')
        ) || null
      );
    }
    return null;
  }, [orders, selectedOrderId, activeComanda]);

  const isOrderCheckout = useMemo(() => {
    return !!activeOrder && (!activeComanda?.mesa_numero || activeComanda.mesa_numero === 0);
  }, [activeOrder, activeComanda]);

  // Associated table
  const activeTable = useMemo(() => {
    if (!activeComanda) return null;
    return tables.find((t) => t.id === activeComanda.mesa_id) || null;
  }, [tables, activeComanda]);

  // Orders and active items for active comanda
  const activeComandaOrders = useMemo(() => {
    if (!activeComanda) return [];
    const direct = orders.filter((o) => activeComanda.pedidos_ids.includes(o.id));
    if (direct.length > 0) return direct;
    if (activeOrder) return [activeOrder];
    return [];
  }, [orders, activeComanda, activeOrder]);

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

  // Select Order (Retirada ou Delivery) para conferência e pagamento no Caixa
  const handleSelectOrder = (order: Order) => {
    const cmd = ensureOrderComanda(order);
    setSelectedComandaId(cmd.id);
    setSelectedOrderId(order.id);
    setSplitMode('nenhum');
    setPaymentSuccessMessage(null);
    const paid = cmd.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const rem = Math.max(0, cmd.total - paid);
    setPaymentAmountInput(rem > 0 ? rem.toFixed(2).replace('.', ',') : '');

    if (order.forma_pagamento) {
      const clean = order.forma_pagamento.toLowerCase();
      if (clean.includes('pix')) setSelectedPaymentMethod('pix');
      else if (clean.includes('cred') || clean.includes('créd')) setSelectedPaymentMethod('credito');
      else if (clean.includes('deb') || clean.includes('déb')) setSelectedPaymentMethod('debito');
      else if (clean.includes('din') || clean.includes('cash')) setSelectedPaymentMethod('dinheiro');
    }
    if (order.troco_para) {
      setTrocoParaInput(order.troco_para.toFixed(2).replace('.', ','));
    } else {
      setTrocoParaInput('');
    }
  };

  // Select Mesa Comanda
  const handleSelectComanda = (cmd: Comanda) => {
    setSelectedComandaId(cmd.id);
    setSelectedOrderId(null);
    setSplitMode('nenhum');
    setPaymentSuccessMessage(null);
    const paid = cmd.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const rem = Math.max(0, cmd.total - paid);
    setPaymentAmountInput(rem > 0 ? rem.toFixed(2).replace('.', ',') : '');
    setTrocoParaInput('');
  };

  // Register payment handler (com suporte a pagamento misto / múltiplas formas)
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

    const newTotalPaid = totalPaid + val;
    const newRem = Math.max(0, activeComanda.total - newTotalPaid);

    if (newRem > 0.05) {
      setPaymentSuccessMessage(
        `Pagamento parcial de ${formatCurrency(val)} (${selectedPaymentMethod.toUpperCase()}) registrado! Restam ${formatCurrency(newRem)} a receber.`
      );
      setPaymentAmountInput(newRem.toFixed(2).replace('.', ','));
    } else {
      setPaymentSuccessMessage(null);
      setPaymentAmountInput('');
    }

    setTrocoParaInput('');
    setPayerName('');
    setSelectedItemIdsForSplit([]);
  };

  // Fast-track: Quitar todo o saldo restante com 1 clique na forma de pagamento selecionada
  const handleQuickFullPayment = (method?: PaymentMethod) => {
    if (!activeComanda || remainingBalance <= 0) return;
    const met = method || selectedPaymentMethod;
    registerPayment(
      activeComanda.id,
      met,
      remainingBalance,
      undefined,
      payerName.trim() || undefined
    );
    setPaymentAmountInput('');
    setTrocoParaInput('');
    setPaymentSuccessMessage(null);
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

  // Complete checkout & close comanda / finalize order
  const handleFinalizeComanda = () => {
    if (!activeComanda) return;
    if (remainingBalance > 0.05) {
      alert(`Atenção: Quite o saldo restante de ${formatCurrency(remainingBalance)} para concluir a comanda.`);
      return;
    }
    if (activeOrder) {
      updateOrderStatus(activeOrder.id, 'entregue');
    }
    closeComanda(activeComanda.id);
    setSelectedComandaId(null);
    setSelectedOrderId(null);
    setPaymentSuccessMessage(null);
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

  // Channel identification helpers
  const isDeliveryOrder = (o: Order) => {
    if (o.tipo_pedido === 'retirada') return false;
    if (o.mesa_numero) return false;
    return o.tipo_pedido === 'delivery' || o.origem === 'delivery';
  };

  const isRetiradaOrder = (o: Order) => {
    return o.tipo_pedido === 'retirada' || (!o.mesa_numero && !!o.cliente_endereco?.toLowerCase().includes('retirada'));
  };

  const isMesaOrder = (o: Order) => {
    return o.tipo_pedido === 'mesa' || !!o.mesa_numero;
  };

  // Regra de 24 Horas & Exceção do Último Pedido por Categoria / Canal no Caixa:
  // 1. Pedidos só podem ficar até 24 horas no painel do caixa.
  // 2. Se não houver pedidos nas últimas 24h em um canal, o último pedido realizado é mantido.
  // 3. Pedidos mais antigos que 24h ficam posicionados PARA BAIXO na lista da categoria.
  const allDeliveryOrders = useMemo(
    () => filterAndSortCaixaChannelOrders(orders.filter(isDeliveryOrder)),
    [orders]
  );
  const allRetiradaOrders = useMemo(
    () => filterAndSortCaixaChannelOrders(orders.filter(isRetiradaOrder)),
    [orders]
  );
  const allMesaOrders = useMemo(
    () => filterAndSortCaixaChannelOrders(orders.filter(isMesaOrder)),
    [orders]
  );

  // Total de pedidos consolidados visíveis no Caixa (máximo 24h + último retido por canal)
  const caixaTotalOrders = useMemo(() => {
    return [...allDeliveryOrders, ...allRetiradaOrders, ...allMesaOrders];
  }, [allDeliveryOrders, allRetiradaOrders, allMesaOrders]);

  // Operational active lists (excludes 'entregue' and 'cancelado' from Coluna 1 & Coluna 2)
  const activeDeliveryOrders = useMemo(() => {
    return allDeliveryOrders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');
  }, [allDeliveryOrders]);

  const activeRetiradaOrders = useMemo(() => {
    return allRetiradaOrders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');
  }, [allRetiradaOrders]);

  // Mesas comandas abertas (exclui comandas de balcão/delivery na coluna 3)
  const openMesaComandas = useMemo(() => {
    return openComandas.filter((c) => c.mesa_numero > 0);
  }, [openComandas]);

  // Status counts per operational channel
  const countNovosDelivery = useMemo(() => activeDeliveryOrders.filter((o) => o.status === 'novo').length, [activeDeliveryOrders]);
  const countNovosRetirada = useMemo(() => activeRetiradaOrders.filter((o) => o.status === 'novo').length, [activeRetiradaOrders]);
  const countNovosMesa = useMemo(() => allMesaOrders.filter((o) => o.status === 'novo').length, [allMesaOrders]);
  const countNovosTotal = countNovosDelivery + countNovosRetirada + countNovosMesa;

  // Filtered Delivery orders (Coluna 1 - Apenas pedidos ativos pendentes, novos na frente)
  const deliveryOrders = useMemo(() => {
    return activeDeliveryOrders
      .filter((o) => {
        if (deliveryFilter === 'novo' && o.status !== 'novo') return false;
        if (deliveryFilter === 'em_preparo' && o.status !== 'em_preparo') return false;
        if (deliveryFilter === 'a_caminho' && o.status !== 'a_caminho') return false;

        if (deliverySearch) {
          const q = deliverySearch.toLowerCase();
          const nome = (o.cliente_nome || '').toLowerCase();
          const fone = (o.cliente_telefone || o.delivery_info?.telefone || '').toLowerCase();
          const end = (o.cliente_endereco || o.delivery_info?.endereco || '').toLowerCase();
          const id = o.id.toString();
          return nome.includes(q) || fone.includes(q) || end.includes(q) || id.includes(q);
        }
        return true;
      })
      .sort(sortOrdersNovosFirst);
  }, [activeDeliveryOrders, deliveryFilter, deliverySearch]);

  // Filtered Retirada orders (Coluna 2 - Apenas pedidos ativos pendentes, novos na frente)
  const retiradaOrders = useMemo(() => {
    return activeRetiradaOrders
      .filter((o) => {
        if (retiradaFilter === 'novo' && o.status !== 'novo') return false;
        if (retiradaFilter === 'em_preparo' && o.status !== 'em_preparo') return false;
        if (retiradaFilter === 'pronto' && o.status !== 'pronto') return false;

        if (retiradaSearch) {
          const q = retiradaSearch.toLowerCase();
          const nome = (o.cliente_nome || '').toLowerCase();
          const fone = (o.cliente_telefone || o.delivery_info?.telefone || '').toLowerCase();
          const id = o.id.toString();
          return nome.includes(q) || fone.includes(q) || id.includes(q);
        }
        return true;
      })
      .sort(sortOrdersNovosFirst);
  }, [activeRetiradaOrders, retiradaFilter, retiradaSearch]);

  // Orders filtering and status counts for Caixa Pedidos tab (Tab 3 - Gestão de Pedidos & Produção)
  const filteredCaixaOrders = useMemo(() => {
    let source = caixaTotalOrders;
    if (pedidosCanalFilter === 'delivery') source = allDeliveryOrders;
    else if (pedidosCanalFilter === 'retirada') source = allRetiradaOrders;
    else if (pedidosCanalFilter === 'mesa') source = allMesaOrders;

    return source.filter((order) => {
      if (pedidosFilterStatus !== 'todos' && order.status !== pedidosFilterStatus) {
        return false;
      }
      if (pedidosSearch) {
        const query = pedidosSearch.toLowerCase();
        const matchId = order.id.toString().includes(query);
        const matchMesa = order.mesa_numero?.toString().includes(query);
        const matchCliente = order.cliente_nome?.toLowerCase().includes(query);
        const matchGarcom = order.garcom_nome?.toLowerCase().includes(query);
        const matchTel = (order.cliente_telefone || (order.delivery_info as any)?.telefone || '')?.includes(query);
        const matchEndereco = (order.cliente_endereco || (order.delivery_info as any)?.endereco || '')?.toLowerCase().includes(query);
        if (!matchId && !matchMesa && !matchCliente && !matchGarcom && !matchTel && !matchEndereco) {
          return false;
        }
      }
      return true;
    });
  }, [caixaTotalOrders, allDeliveryOrders, allRetiradaOrders, allMesaOrders, pedidosCanalFilter, pedidosFilterStatus, pedidosSearch]);

  // Separated lists per channel for Tab 3 "Todos"
  const pedidosDeliveryList = useMemo(() => filteredCaixaOrders.filter(isDeliveryOrder), [filteredCaixaOrders]);
  const pedidosRetiradaList = useMemo(() => filteredCaixaOrders.filter(isRetiradaOrder), [filteredCaixaOrders]);
  const pedidosMesaList = useMemo(() => filteredCaixaOrders.filter(isMesaOrder), [filteredCaixaOrders]);

  const countNovos = useMemo(() => caixaTotalOrders.filter((o) => o.status === 'novo').length, [caixaTotalOrders]);
  const countPreparo = useMemo(() => caixaTotalOrders.filter((o) => o.status === 'em_preparo').length, [caixaTotalOrders]);
  const countProntos = useMemo(() => caixaTotalOrders.filter((o) => o.status === 'pronto').length, [caixaTotalOrders]);
  const countACaminho = useMemo(() => caixaTotalOrders.filter((o) => o.status === 'a_caminho').length, [caixaTotalOrders]);
  const countEntregues = useMemo(() => caixaTotalOrders.filter((o) => o.status === 'entregue').length, [caixaTotalOrders]);

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
              onClick={() => setCaixaActiveTab('balcao')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
                caixaActiveTab === 'balcao'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Pedido no Balcão</span>
              {balcaoCart.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black bg-white text-stone-950 rounded-full animate-bounce">
                  {balcaoCart.reduce((sum, i) => sum + i.quantidade, 0)}
                </span>
              )}
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
        <main className="max-w-[1920px] mx-auto w-full p-2.5 sm:p-3.5 lg:p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3.5 flex-1">
          {/* Coluna 1: Delivery (Entrega motoboy no endereço) */}
          <div className="col-span-12 md:col-span-1 xl:col-span-3 space-y-3 flex flex-col">
            <div className="bg-emerald-50/60 dark:bg-slate-900 border border-emerald-200/90 dark:border-slate-800 rounded-2xl shadow-xs p-3.5 space-y-3 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/60">
                    <Bike className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      🛵 Delivery
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300/80">
                        {activeDeliveryOrders.length}
                      </span>
                    </h2>
                    <p className="text-[10px] text-emerald-900/80 dark:text-slate-400 font-medium">Entrega motoboy no endereço</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyDeliveryLink}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer shadow-xs ${
                      copiedDeliveryLink
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-emerald-100/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-300 border-emerald-200 dark:border-slate-700'
                    }`}
                    title="Copiar link do cardápio online com marca e logo da loja para o WhatsApp"
                  >
                    <Share2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                    <span>{copiedDeliveryLink ? 'Copiado!' : 'Cardápio'}</span>
                  </button>
                  {countNovosDelivery > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-red-600 text-white rounded-full animate-pulse shadow-xs">
                      {countNovosDelivery} novo{countNovosDelivery > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('todos')}
                  className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    deliveryFilter === 'todos'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white dark:bg-slate-950 text-stone-700 dark:text-slate-400 border-emerald-200 dark:border-slate-800 hover:bg-emerald-100/60'
                  }`}
                >
                  Ativos ({activeDeliveryOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('novo')}
                  className={`px-2 py-0.5 rounded-md border transition flex items-center gap-1 cursor-pointer ${
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
                  className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    deliveryFilter === 'em_preparo'
                      ? 'bg-amber-500 text-stone-950 font-black border-amber-600 shadow-2xs'
                      : 'bg-amber-50 dark:bg-slate-950 text-amber-900 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100/70'
                  }`}
                >
                  Preparo
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('a_caminho')}
                  className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    deliveryFilter === 'a_caminho'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white dark:bg-slate-950 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/60'
                  }`}
                >
                  A Caminho 🛵
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={deliverySearch}
                  onChange={(e) => setDeliverySearch(e.target.value)}
                  placeholder="Buscar cliente, rua, fone..."
                  className="w-full pl-7.5 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-emerald-200/90 dark:border-slate-800 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              {/* Orders List */}
              <div className="space-y-2.5 max-h-[64vh] overflow-y-auto pr-1 flex-1">
                {deliveryOrders.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 dark:text-slate-500 text-xs space-y-1.5">
                    <Bike className="w-8 h-8 mx-auto opacity-50 text-emerald-600 dark:text-emerald-400" />
                    <p className="font-bold text-stone-800 dark:text-slate-300">Nenhum pedido de delivery pendente.</p>
                    <p className="text-[11px] text-stone-600 dark:text-slate-400">Novos pedidos para entrega via motoboy aparecerão aqui automaticamente.</p>
                  </div>
                ) : (
                  deliveryOrders.map((order) => {
                    const isNovo = order.status === 'novo';
                    const isPreparo = order.status === 'em_preparo';
                    const isPronto = order.status === 'pronto';
                    const isACaminho = order.status === 'a_caminho';
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
                            ? 'bg-red-50/50 dark:bg-slate-950 border-2 border-red-500 ring-2 ring-red-500/20 hover:bg-red-50/80'
                            : isPreparo
                            ? 'bg-amber-50/40 dark:bg-slate-950 border-2 border-amber-400/90 dark:border-amber-500 hover:bg-amber-50/70'
                            : isPronto
                            ? 'bg-emerald-50/30 dark:bg-slate-950 border-2 border-emerald-500 hover:bg-emerald-50/60'
                            : isACaminho
                            ? 'bg-purple-50/30 dark:bg-slate-950 border-2 border-purple-500 hover:bg-purple-50/60'
                            : 'bg-stone-50/70 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 hover:bg-stone-100'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-stone-900 dark:text-white">
                              #{order.id}
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-600 text-white rounded flex items-center gap-1 shadow-2xs">
                              <Bike className="w-2.5 h-2.5" /> DELIVERY
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-1">
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
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-700 text-white rounded-md flex items-center gap-1">
                                <Bike className="w-2.5 h-2.5" /> A CAMINHO
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer / Order Info */}
                        <div className="space-y-0.5 text-[11px] leading-tight">
                          <div className="font-black text-stone-950 dark:text-white flex items-center gap-1">
                            <span className="text-emerald-700 dark:text-emerald-400">👤</span>
                            <span className="truncate">{order.cliente_nome || 'Cliente'}</span>
                          </div>
                          {telefone && (
                            <div className="text-stone-600 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{telefone}</span>
                            </div>
                          )}
                          {endereco && (
                            <div className="text-stone-800 dark:text-slate-300 flex items-start gap-1">
                              <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0 mt-0.5" />
                              <span className="text-[10px] leading-tight font-medium" title={endereco}>{endereco}</span>
                            </div>
                          )}
                          {order.forma_pagamento && (
                            <div className="text-[10px] text-stone-600 dark:text-slate-400 pt-0.5">
                              💰 Pgto: <strong className="uppercase">{order.forma_pagamento}</strong>
                              {order.troco_para ? ` (Troco p/ R$ ${order.troco_para.toFixed(2)})` : ''}
                            </div>
                          )}
                          {(() => {
                            const dateInfo = formatOrderDateTimeCaixa(order.criado_em);
                            return (
                              <div className="text-[10px] text-stone-500 font-mono pt-0.5 flex items-center gap-1 flex-wrap">
                                <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                <span className={dateInfo.isOlderThan24h ? 'font-bold text-amber-800 dark:text-amber-300' : ''}>
                                  {dateInfo.text}
                                </span>
                                {dateInfo.isOlderThan24h && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80">
                                    Anterior
                                  </span>
                                )}
                                {order.observacao && (
                                  <span className="text-amber-700 dark:text-amber-400 truncate ml-1 font-sans">
                                    • Obs: {order.observacao}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Items mini list */}
                        <div className="pt-1.5 border-t border-emerald-200/80 dark:border-slate-800/80 space-y-1">
                          {order.itens
                            .filter((it) => it.status === 'ativo')
                            .map((it, idx) => (
                              <div key={idx} className="flex justify-between items-baseline text-[11px]">
                                <span className="truncate text-stone-800 dark:text-slate-200 font-medium">
                                  {it.quantidade}x {it.nome}
                                </span>
                                <span className="font-mono font-bold text-stone-900 dark:text-slate-100 text-[11px] ml-1 shrink-0">
                                  {formatCurrency(it.preco_total)}
                                </span>
                              </div>
                            ))}
                        </div>

                        {/* Total & Action Buttons */}
                        <div className="pt-2 border-t border-emerald-200/80 dark:border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="inline-flex flex-col bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/80 px-2.5 py-1 rounded-xl shadow-2xs">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-800 dark:text-emerald-400">
                              Total
                            </span>
                            <span className="font-mono font-black text-sm sm:text-base text-emerald-950 dark:text-emerald-200 leading-tight">
                              {formatCurrency(orderTotal)}
                            </span>
                            {order.taxa_entrega ? (
                              <span className="text-[9px] font-semibold text-emerald-800 dark:text-emerald-300 font-mono">
                                (+{formatCurrency(order.taxa_entrega)} taxa)
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrintingOrder({ order, autoPrint: false });
                              }}
                              className="p-1.5 bg-white hover:bg-stone-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-emerald-200 dark:border-slate-700 rounded-lg text-xs transition cursor-pointer"
                              title="Reimprimir comanda de produção"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            </button>

                            {isNovo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmOrder(order);
                                }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderStatus(order.id, 'a_caminho');
                                }}
                                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Bike className="w-3 h-3" />
                                <span>Despachar</span>
                              </button>
                            )}

                            {/* Link do Motoboy */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareMotoboyLink(order);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                              title="Copiar link do motoboy ou enviar para o WhatsApp dele"
                            >
                              <Bike className="w-3 h-3 text-emerald-200" />
                              <span>Link Motoboy</span>
                            </button>

                            {/* Confirmar Entrega (caso o motoboy esqueceu de finalizar pelo link) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const confirmOk = window.confirm(
                                  `Confirmar que o Pedido Delivery #${order.id} foi entregue com sucesso ao cliente?`
                                );
                                if (!confirmOk) return;
                                updateOrderStatus(order.id, 'entregue');
                                if (order.comanda_id) {
                                  closeComanda(order.comanda_id);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                              title="Confirmar entrega do pedido (caso o motoboy tenha esquecido de finalizar pelo link)"
                            >
                              <Check className="w-3 h-3 text-white stroke-[2.5]" />
                              <span>Confirmar Entrega</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Coluna 2: Retirada no Balcão (Buscar na Loja) */}
          <div className="col-span-12 md:col-span-1 xl:col-span-3 space-y-3 flex flex-col">
            <div className="bg-amber-50/60 dark:bg-slate-900 border border-amber-200/90 dark:border-slate-800 rounded-2xl shadow-xs p-3.5 space-y-3 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-amber-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      🛍️ Retirada (Buscar)
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-300 font-bold border border-amber-300/80">
                        {activeRetiradaOrders.length}
                      </span>
                    </h2>
                    <p className="text-[10px] text-amber-950/80 dark:text-slate-400 font-medium">Pede no site e retira na loja</p>
                  </div>
                </div>

                {countNovosRetirada > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-red-600 text-white rounded-full animate-pulse shadow-xs">
                    {countNovosRetirada} novo{countNovosRetirada > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setRetiradaFilter('todos')}
                  className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    retiradaFilter === 'todos'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-950 text-stone-700 dark:text-slate-400 border-amber-200 dark:border-slate-800 hover:bg-amber-100/60'
                  }`}
                >
                  Ativos ({activeRetiradaOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRetiradaFilter('novo')}
                  className={`px-2 py-0.5 rounded-md border transition flex items-center gap-1 cursor-pointer ${
                    retiradaFilter === 'novo'
                      ? 'bg-red-600 text-white border-red-700 shadow-2xs'
                      : 'bg-red-50 dark:bg-slate-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100/70'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Novos ({countNovosRetirada})
                </button>
                <button
                  type="button"
                  onClick={() => setRetiradaFilter('em_preparo')}
                  className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    retiradaFilter === 'em_preparo'
                      ? 'bg-amber-500 text-stone-950 font-black border-amber-600 shadow-2xs'
                      : 'bg-amber-100/70 dark:bg-slate-950 text-amber-900 dark:text-amber-400 border-amber-300 dark:border-amber-900/50 hover:bg-amber-100'
                  }`}
                >
                  Preparo
                </button>
                <button
                  type="button"
                  onClick={() => setRetiradaFilter('pronto')}
                  className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    retiradaFilter === 'pronto'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-emerald-50 dark:bg-slate-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100/70'
                  }`}
                >
                  Pronto p/ Retirar 🛍️
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={retiradaSearch}
                  onChange={(e) => setRetiradaSearch(e.target.value)}
                  placeholder="Buscar cliente, fone, #..."
                  className="w-full pl-7.5 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-amber-200/90 dark:border-slate-800 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 transition"
                />
              </div>

              {/* Orders List */}
              <div className="space-y-2.5 max-h-[64vh] overflow-y-auto pr-1 flex-1">
                {retiradaOrders.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 dark:text-slate-500 text-xs space-y-1.5">
                    <ShoppingBag className="w-8 h-8 mx-auto opacity-50 text-amber-600 dark:text-amber-400" />
                    <p className="font-bold text-stone-800 dark:text-slate-300">Nenhum pedido de retirada pendente.</p>
                    <p className="text-[11px] text-stone-600 dark:text-slate-400">Pedidos onde o cliente busca no balcão aparecerão aqui.</p>
                  </div>
                ) : (
                  retiradaOrders.map((order) => {
                    const isNovo = order.status === 'novo';
                    const isPreparo = order.status === 'em_preparo';
                    const isPronto = order.status === 'pronto';
                    const isSelected = selectedOrderId === order.id;

                    const orderTotal = order.itens
                      .filter((it) => it.status === 'ativo')
                      .reduce((acc, it) => acc + it.preco_total, 0);

                    const telefone = order.cliente_telefone || order.delivery_info?.telefone;

                    return (
                      <div
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={`p-3 rounded-xl border text-xs transition shadow-2xs space-y-2 relative cursor-pointer ${
                          isSelected
                            ? 'bg-amber-900/10 dark:bg-amber-950/40 border-2 border-amber-600 ring-2 ring-amber-600/40 shadow-md'
                            : isNovo
                            ? 'bg-red-50/50 dark:bg-slate-950 border-2 border-red-500 ring-2 ring-red-500/20 hover:bg-red-50/80'
                            : isPreparo
                            ? 'bg-amber-50/40 dark:bg-slate-950 border-2 border-amber-400/90 dark:border-amber-500 hover:bg-amber-50/70'
                            : isPronto
                            ? 'bg-emerald-50/30 dark:bg-slate-950 border-2 border-emerald-500 hover:bg-emerald-50/60'
                            : 'bg-white/90 dark:bg-slate-950 border border-amber-200/80 dark:border-slate-800 hover:bg-amber-100/40'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-stone-900 dark:text-white">
                              #{order.id}
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-500 text-white rounded flex items-center gap-1 shadow-2xs">
                              <ShoppingBag className="w-2.5 h-2.5" /> RETIRADA
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-1">
                            {isSelected && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-600 text-white rounded-md shadow-xs animate-pulse">
                                ✓ NO CAIXA
                              </span>
                            )}
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
                          </div>
                        </div>

                        {/* Customer / Order Info */}
                        <div className="space-y-0.5 text-[11px] leading-tight">
                          <div className="font-black text-stone-950 dark:text-white flex items-center gap-1">
                            <span className="text-amber-700 dark:text-amber-400">👤</span>
                            <span className="truncate">{order.cliente_nome || 'Cliente'}</span>
                          </div>
                          {telefone && (
                            <div className="text-stone-600 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{telefone}</span>
                            </div>
                          )}
                          <div className="text-amber-950 dark:text-amber-300 flex items-center gap-1 font-semibold text-[10px] bg-amber-100/70 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60">
                            <ShoppingBag className="w-2.5 h-2.5 text-amber-600" />
                            <span>Retirada no balcão da pizzaria</span>
                          </div>
                          {order.forma_pagamento && (
                            <div className="text-[10px] text-stone-600 dark:text-slate-400 pt-0.5">
                              💰 Pgto: <strong className="uppercase">{order.forma_pagamento}</strong>
                              {order.troco_para ? ` (Troco p/ R$ ${order.troco_para.toFixed(2)})` : ''}
                            </div>
                          )}
                          {(() => {
                            const dateInfo = formatOrderDateTimeCaixa(order.criado_em);
                            return (
                              <div className="text-[10px] text-stone-500 font-mono pt-0.5 flex items-center gap-1 flex-wrap">
                                <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                <span className={dateInfo.isOlderThan24h ? 'font-bold text-amber-800 dark:text-amber-300' : ''}>
                                  {dateInfo.text}
                                </span>
                                {dateInfo.isOlderThan24h && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80">
                                    Anterior
                                  </span>
                                )}
                                {order.observacao && (
                                  <span className="text-amber-700 dark:text-amber-400 truncate ml-1 font-sans">
                                    • Obs: {order.observacao}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Items mini list */}
                        <div className="pt-1.5 border-t border-amber-200/80 dark:border-slate-800/80 space-y-1">
                          {order.itens
                            .filter((it) => it.status === 'ativo')
                            .map((it, idx) => (
                              <div key={idx} className="flex justify-between items-baseline text-[11px]">
                                <span className="truncate text-stone-800 dark:text-slate-200 font-medium">
                                  {it.quantidade}x {it.nome}
                                </span>
                                <span className="font-mono font-bold text-stone-900 dark:text-slate-100 text-[11px] ml-1 shrink-0">
                                  {formatCurrency(it.preco_total)}
                                </span>
                              </div>
                            ))}
                        </div>

                        {/* Total & Action Buttons */}
                        <div className="pt-2 border-t border-amber-200/80 dark:border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="inline-flex flex-col bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/80 px-2.5 py-1 rounded-xl shadow-2xs">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-800 dark:text-amber-400">
                              Total
                            </span>
                            <span className="font-mono font-black text-sm sm:text-base text-amber-950 dark:text-amber-200 leading-tight">
                              {formatCurrency(orderTotal)}
                            </span>
                            <span className="text-[9px] font-semibold text-amber-800 dark:text-amber-300 font-mono">
                              Sem taxa
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrintingOrder({ order, autoPrint: false });
                              }}
                              className="p-1.5 bg-white hover:bg-stone-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-amber-200 dark:border-slate-700 rounded-lg text-xs transition cursor-pointer"
                              title="Reimprimir comanda de produção"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            </button>

                            {isNovo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmOrder(order);
                                }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderStatus(order.id, 'pronto');
                                }}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Check className="w-3 h-3" />
                                <span>Pronto p/ Retirar</span>
                              </button>
                            )}

                            {/* Botão de Enviar ao Caixa para Receber / Entregar */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOrder(order);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95 ${
                                isSelected
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                              }`}
                              title="Conferir itens, mudar forma de pagamento e entregar no Caixa"
                            >
                              <Receipt className="w-3 h-3 text-amber-300" />
                              <span>{isSelected ? 'No Caixa' : 'Receber / Entregar ➔'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Coluna 3: Mesas & Comandas (Salão) + Resumo do Caixa */}
          <div className="col-span-12 md:col-span-1 xl:col-span-3 space-y-3 flex flex-col">
            <div className="bg-sky-50/60 dark:bg-slate-900 border border-sky-200/90 dark:border-slate-800 rounded-2xl shadow-xs p-3.5 space-y-3 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-sky-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 rounded-lg border border-sky-300/80">
                    <UtensilsCrossed className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      🍽️ Mesas & Comandas
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-950 dark:text-sky-300 font-bold border border-sky-300/80">
                        {openMesaComandas.length}
                      </span>
                    </h2>
                    <p className="text-[10px] text-sky-950/80 dark:text-slate-400 font-medium">Consumo presencial no salão</p>
                  </div>
                </div>

                <div className="flex bg-white dark:bg-slate-950 p-0.5 rounded-lg border border-sky-200/90 dark:border-slate-800 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterMode('todas')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      filterMode === 'todas'
                        ? 'bg-sky-700 text-white shadow-2xs font-bold'
                        : 'text-stone-700 dark:text-slate-400 hover:text-stone-950 dark:hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('fechar')}
                    className={`px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                      filterMode === 'fechar'
                        ? 'bg-amber-400 dark:bg-amber-500 text-stone-950 font-bold shadow-2xs'
                        : 'text-stone-700 dark:text-slate-400 hover:text-stone-950 dark:hover:text-white'
                    }`}
                  >
                    <span>Pedindo Conta</span>
                  </button>
                </div>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar comanda # ou mesa..."
                  className="w-full pl-7.5 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-sky-200/90 dark:border-slate-800 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500 transition"
                />
              </div>

              {/* Comandas List */}
              <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1 flex-1">
                {openMesaComandas.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 dark:text-slate-500 text-xs">
                    Nenhuma comanda aberta no salão.
                  </div>
                ) : (
                  openMesaComandas
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
                      const isSelected = selectedComandaId === cmd.id && !selectedOrderId;
                      const isWaitingClose = table?.status === 'aguardando_fechamento';

                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => handleSelectComanda(cmd)}
                          className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between cursor-pointer relative ${
                            isSelected
                              ? 'bg-stone-900 dark:bg-slate-800 text-white border-2 border-sky-500 ring-2 ring-sky-500/40 shadow-lg'
                              : isWaitingClose
                              ? 'bg-amber-50/90 dark:bg-slate-950 text-stone-900 dark:text-white border-2 border-amber-400/80 dark:border-amber-500 hover:bg-amber-100/80 dark:hover:bg-slate-900'
                              : 'bg-white/90 dark:bg-slate-950 hover:bg-sky-100/40 dark:hover:bg-slate-900 text-stone-900 dark:text-white border border-sky-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-mono font-bold ${isSelected ? 'text-sky-400' : 'text-stone-500 dark:text-slate-400'}`}>
                                {cmd.numero}
                              </span>
                              <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-stone-900 dark:text-white'}`}>
                                Mesa {cmd.mesa_numero.toString().padStart(2, '0')}
                              </span>
                              {isSelected && (
                                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-sky-500 text-white rounded-md shadow-xs">
                                  ✓ ATIVA
                                </span>
                              )}
                              {isWaitingClose && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-red-600 text-white rounded-full animate-pulse">
                                  Conta
                                </span>
                              )}
                            </div>
                            {cmd.cliente_nome && (
                              <span className={`text-[11px] font-bold block mt-0.5 ${isSelected ? 'text-sky-300' : 'text-sky-950 dark:text-sky-300'}`}>
                                👤 Cliente: {cmd.cliente_nome}
                              </span>
                            )}
                            <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-stone-200 dark:text-slate-200 font-medium' : 'text-stone-600 dark:text-slate-400'}`}>
                              Garçom: {cmd.garcom_nome} • {formatTime(cmd.abertura)}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={`px-2.5 py-1 rounded-xl border text-right font-mono transition shadow-2xs ${
                              isSelected
                                ? 'bg-sky-500 text-white border-sky-400'
                                : isWaitingClose
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                                : 'bg-stone-100 dark:bg-slate-800 text-stone-900 dark:text-white border-stone-300 dark:border-slate-700'
                            }`}>
                              <span className="text-[9px] uppercase tracking-wider block font-black opacity-75">Total</span>
                              <span className="text-xs sm:text-sm font-black block leading-none">
                                {formatCurrency(cmd.total)}
                              </span>
                            </div>
                            <span className={`text-[10px] font-mono block mt-1 ${isSelected ? 'text-sky-200' : 'text-stone-500 dark:text-slate-400'}`}>
                              {cmd.pedidos_ids.length} {cmd.pedidos_ids.length === 1 ? 'pedido' : 'pedidos'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>

              {/* Resumo do Caixa Widget */}
              <div className="pt-2 border-t border-sky-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold uppercase tracking-wider text-sky-950 dark:text-slate-300 text-[10px]">Resumo do Caixa</span>
                  <span className="text-[11px] text-stone-700 dark:text-slate-300 font-mono">
                    Abertura: <strong className="font-black text-stone-950 dark:text-white">{formatCurrency(cashRegister.valor_inicial)}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                  <div className="p-2 bg-stone-100/90 dark:bg-slate-950 rounded-xl border border-stone-300/80 dark:border-slate-800 shadow-2xs">
                    <span className="text-[9px] text-stone-600 dark:text-slate-400 block uppercase font-bold">Dinheiro</span>
                    <span className="font-black text-stone-950 dark:text-white font-mono text-xs sm:text-sm block">
                      {formatCurrency(paymentBreakdown.dinheiro)}
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-100/80 dark:bg-slate-950 rounded-xl border border-emerald-300/90 dark:border-emerald-800/80 shadow-2xs">
                    <span className="text-[9px] text-emerald-800 dark:text-emerald-400 block uppercase font-bold">PIX</span>
                    <span className="font-black text-emerald-950 dark:text-emerald-300 font-mono text-xs sm:text-sm block">
                      {formatCurrency(paymentBreakdown.pix)}
                    </span>
                  </div>
                  <div className="p-2 bg-sky-100/80 dark:bg-slate-950 rounded-xl border border-sky-300/90 dark:border-sky-800/80 shadow-2xs">
                    <span className="text-[9px] text-sky-800 dark:text-sky-400 block uppercase font-bold">Débito</span>
                    <span className="font-black text-sky-950 dark:text-sky-300 font-mono text-xs sm:text-sm block">
                      {formatCurrency(paymentBreakdown.debito)}
                    </span>
                  </div>
                  <div className="p-2 bg-purple-100/80 dark:bg-slate-950 rounded-xl border border-purple-300/90 dark:border-purple-800/80 shadow-2xs">
                    <span className="text-[9px] text-purple-800 dark:text-purple-400 block uppercase font-bold">Crédito</span>
                    <span className="font-black text-purple-950 dark:text-purple-300 font-mono text-xs sm:text-sm block">
                      {formatCurrency(paymentBreakdown.credito)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 4: Conferência & Pagamento (Workspace - Tom Neutro Suave) */}
          <div className="col-span-12 md:col-span-1 xl:col-span-3 space-y-3 flex flex-col">
          {!activeComanda ? (
            <div className="bg-stone-100/70 dark:bg-slate-900 border border-stone-300/80 dark:border-slate-800 rounded-2xl shadow-xs p-12 text-center text-stone-500 dark:text-slate-400 h-full flex flex-col items-center justify-center space-y-3 min-h-[400px]">
              <Receipt className="w-12 h-12 text-stone-400 dark:text-slate-600" />
              <p className="text-sm font-bold text-stone-800 dark:text-slate-200">Selecione uma comanda ou pedido</p>
              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-sm">
                Ao selecionar uma mesa, retirada ou delivery, você poderá conferir o consumo, aplicar descontos, dividir a conta e registrar pagamentos.
              </p>
            </div>
          ) : (
            <div className="bg-stone-100/70 dark:bg-slate-900 border border-stone-300/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
              {/* Comanda / Pedido Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-stone-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isOrderCheckout && activeOrder ? (
                      activeOrder.tipo_pedido === 'retirada' ? (
                        <>
                          <span className="px-2.5 py-1 text-xs font-black uppercase bg-amber-600 text-white rounded-lg flex items-center gap-1 shadow-xs">
                            <ShoppingBag className="w-3.5 h-3.5" /> RETIRADA (BALCÃO)
                          </span>
                          <span className="text-base font-bold text-stone-900 dark:text-slate-100 font-mono">
                            Pedido #{activeOrder.id}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-1 text-xs font-black uppercase bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-xs">
                            <Bike className="w-3.5 h-3.5" /> DELIVERY
                          </span>
                          <span className="text-base font-bold text-stone-900 dark:text-slate-100 font-mono">
                            Pedido #{activeOrder.id}
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <span className="text-lg font-bold text-stone-900 dark:text-slate-100">
                          Mesa {activeComanda.mesa_numero.toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs font-mono font-bold bg-white dark:bg-slate-800 text-stone-800 dark:text-slate-300 border border-stone-300 dark:border-slate-700 px-2 py-0.5 rounded-md">
                          {activeComanda.numero}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-stone-600 dark:text-slate-400 mt-1 space-y-0.5">
                    {(activeOrder?.cliente_nome || activeComanda.cliente_nome) && (
                      <span className="text-stone-950 dark:text-white font-black block">
                        👤 Cliente: {activeOrder?.cliente_nome || activeComanda.cliente_nome}
                        {(activeOrder?.cliente_telefone || activeOrder?.delivery_info?.telefone) && (
                          <span className="font-normal text-stone-600 ml-1">
                            ({activeOrder?.cliente_telefone || activeOrder?.delivery_info?.telefone})
                          </span>
                        )}
                      </span>
                    )}
                    {isOrderCheckout && activeOrder?.cliente_endereco && (
                      <span className="text-stone-700 dark:text-slate-300 flex items-start gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                        <span>{activeOrder.cliente_endereco}</span>
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400 block">
                      {isOrderCheckout
                        ? `Pedido recebido às ${formatTime(activeOrder?.criado_em || activeComanda.abertura)}`
                        : `Garçom: ${activeComanda.garcom_nome} • Aberta às ${formatTime(activeComanda.abertura)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="px-2.5 py-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                    title="Imprimir Cupom / Conta"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Imprimir</span>
                  </button>

                  <button
                    onClick={() => {
                      setNfceTarget(isOrderCheckout && activeOrder ? activeOrder : activeComanda);
                      setShowNfceModal(true);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                      ((isOrderCheckout && activeOrder ? activeOrder.nfce_info : activeComanda.nfce_info)?.status === 'autorizada')
                        ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                    }`}
                    title="Emitir ou Consultar NFC-e (Nota Fiscal de Consumidor)"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>
                      {((isOrderCheckout && activeOrder ? activeOrder.nfce_info : activeComanda.nfce_info)?.status === 'autorizada')
                        ? 'NFC-e Emitida'
                        : 'Emitir NFC-e'}
                    </span>
                  </button>

                  <button
                    onClick={handleOpenDiscountModal}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                      activeComanda.desconto > 0
                        ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {activeComanda.desconto > 0
                        ? `-${formatCurrency(activeComanda.desconto)}`
                        : 'Desconto'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComandaId(null);
                      setSelectedOrderId(null);
                      setPaymentSuccessMessage(null);
                    }}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Desmarcar / Fechar painel de pagamento"
                  >
                    <X className="w-4 h-4" />
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
                    <span className="font-black text-stone-950 dark:text-white font-mono text-xs sm:text-sm shrink-0">
                      {formatCurrency(item.preco_total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Totals Summary Bar */}
              <div className="bg-stone-50/90 dark:bg-slate-950 p-4 rounded-xl border border-stone-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-stone-700 dark:text-slate-300">
                  <span className="font-medium">Subtotal dos produtos:</span>
                  <span className="font-bold font-mono text-stone-950 dark:text-slate-100 text-xs sm:text-sm">{formatCurrency(activeComanda.subtotal)}</span>
                </div>
                {isOrderCheckout && activeOrder?.taxa_entrega && activeOrder.taxa_entrega > 0 ? (
                  <div className="flex justify-between items-center text-purple-700 dark:text-purple-300 font-bold">
                    <span>Taxa de Entrega:</span>
                    <span className="font-mono text-xs sm:text-sm">+ {formatCurrency(activeOrder.taxa_entrega)}</span>
                  </div>
                ) : null}
                {activeComanda.desconto > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>Desconto:</span>
                    <span className="font-mono text-xs sm:text-sm">- {formatCurrency(activeComanda.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t-2 border-stone-300 dark:border-slate-700">
                  <span className="font-black text-stone-950 dark:text-white text-sm sm:text-base">Total da Conta:</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-stone-950 dark:text-emerald-300 bg-stone-200/80 dark:bg-slate-800 px-3 py-1 rounded-xl border border-stone-300 dark:border-slate-700">
                    {formatCurrency(activeComanda.total)}
                  </span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-800 dark:text-emerald-400 pt-1">
                    <span>Total Pago até agora:</span>
                    <span className="font-mono font-black text-xs sm:text-sm bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-red-200 dark:border-red-900/40">
                  <span className="font-black uppercase tracking-wide text-xs sm:text-sm text-red-700 dark:text-red-400">Saldo Restante:</span>
                  <span className="text-base sm:text-lg font-black font-mono bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 px-3 py-1 rounded-xl border border-red-300 dark:border-red-800">
                    {formatCurrency(remainingBalance)}
                  </span>
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
                      <span className="text-base font-black text-red-600 dark:text-red-400 font-mono">
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
                            <span className="font-mono font-bold text-stone-900 dark:text-white">{formatCurrency(item.preco_total)}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="p-2.5 bg-stone-50 dark:bg-slate-950 rounded-lg border border-stone-200 dark:border-slate-800 flex items-center justify-between font-semibold text-stone-800 dark:text-slate-200">
                      <span>Total dos itens selecionados:</span>
                      <span className="text-base font-black text-red-600 dark:text-red-400 font-mono">
                        {formatCurrency(splitItemsTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods & Execution */}
              {paymentSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{paymentSuccessMessage}</span>
                  </div>
                  <button
                    onClick={() => setPaymentSuccessMessage(null)}
                    className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {remainingBalance > 0 ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                      Registrar Forma de Pagamento
                    </span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-stone-400">Atalho quitar:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickFullPayment('pix')}
                        className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded font-bold cursor-pointer"
                        title="Quitar saldo restante no PIX"
                      >
                        PIX
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFullPayment('dinheiro')}
                        className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded font-bold cursor-pointer"
                        title="Quitar saldo restante no Dinheiro"
                      >
                        Dinheiro
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFullPayment('credito')}
                        className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 rounded font-bold cursor-pointer"
                        title="Quitar saldo restante no Cartão de Crédito"
                      >
                        Cartão
                      </button>
                    </div>
                  </div>

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
                            <div className="mt-2 p-2 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between shadow-2xs">
                              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                Troco a devolver:
                              </span>
                              <span className="text-sm font-black font-mono text-emerald-950 dark:text-emerald-200">
                                {formatCurrency(
                                  parseFloat(trocoParaInput.replace(',', '.')) -
                                    parseFloat(paymentAmountInput.replace(',', '.'))
                                )}
                              </span>
                            </div>
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
                    Pagamentos Registrados ({activeComanda.pagamentos.length}):
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
                          <span className="font-black text-emerald-800 dark:text-emerald-300 font-mono text-xs sm:text-sm">
                            {formatCurrency(pag.valor)}
                          </span>
                          {pag.troco && pag.troco > 0 ? (
                            <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-400 block font-mono">
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
                  {isOrderCheckout && activeOrder ? (
                    activeOrder.tipo_pedido === 'retirada' ? (
                      <>
                        <ShoppingBag className="w-4 h-4 text-white" />
                        <span>Finalizar Pagamento & Entregar no Balcão 🛍️</span>
                      </>
                    ) : (
                      <>
                        <Bike className="w-4 h-4 text-white" />
                        <span>Finalizar Pagamento & Concluir Entrega 🛵</span>
                      </>
                    )
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-white" />
                      <span>Fechar Comanda e Liberar Mesa</span>
                    </>
                  )}
                </button>
                {remainingBalance > 0.05 && (
                  <p className="text-xs text-center text-stone-500 dark:text-slate-400 mt-2">
                    * Quite o saldo restante de{' '}
                    <span className="font-bold font-mono text-stone-900 dark:text-slate-200">
                      {formatCurrency(remainingBalance)}
                    </span>{' '}
                    para {isOrderCheckout ? 'finalizar o pedido e entregar' : 'liberar a mesa'}.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      )}

      {/* Tab 2: Pedido no Balcão (Atendimento e Lançamento de Pedidos pelo Caixa) */}
      {caixaActiveTab === 'balcao' && (
        <main className="max-w-[1920px] mx-auto w-full p-2.5 sm:p-3.5 lg:p-4 space-y-4 flex-1">
          {/* Sucesso / Pedido Criado */}
          {balcaoCreatedOrder && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3.5 w-full md:w-auto">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-emerald-950 dark:text-emerald-200">
                      Pedido #{balcaoCreatedOrder.id} Lançado com Sucesso! 🎉
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                      {balcaoCreatedOrder.tipo_pedido === 'retirada' ? 'Retirada no Balcão' : `Mesa ${balcaoCreatedOrder.mesa_numero}`}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                    Cliente: <strong>{balcaoCreatedOrder.cliente_nome || 'Cliente Balcão'}</strong> • Total:{' '}
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(balcaoCreatedOrder.itens.reduce((a, c) => a + c.preco_total, 0))}
                    </strong>{' '}
                    • Enviado em tempo real à Cozinha.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setPrintingOrder({ order: balcaoCreatedOrder, autoPrint: true })}
                  className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Imprimir Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetCmd = comandas.find(
                      (c) => c.id === balcaoCreatedOrder.comanda_id || c.pedidos_ids?.includes(balcaoCreatedOrder.id)
                    );
                    if (targetCmd) {
                      setSelectedComandaId(targetCmd.id);
                    }
                    setSelectedOrderId(balcaoCreatedOrder.id);
                    setCaixaActiveTab('comandas');
                    setBalcaoCreatedOrder(null);
                  }}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Cobrar no Caixa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBalcaoCreatedOrder(null)}
                  className="px-3.5 py-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ➕ Novo Pedido
                </button>
              </div>
            </div>
          )}

          {/* Erro ao lançar pedido */}
          {balcaoErrorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{balcaoErrorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setBalcaoErrorMessage(null)}
                className="p-1 hover:bg-red-500/20 rounded-lg text-red-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Layout Principal: Catálogo à esquerda (8 cols) e Carrinho/Resumo à direita (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Coluna Esquerda: Catálogo de Produtos e Filtros */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
              {/* Barra de Busca e Categorias */}
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-xs">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={balcaoSearchQuery}
                    onChange={(e) => setBalcaoSearchQuery(e.target.value)}
                    placeholder="Buscar produtos por nome, código ou ingrediente..."
                    className="w-full pl-9 pr-8 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                  />
                  {balcaoSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBalcaoSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtro de Categorias */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setBalcaoCategoryFilter('todas')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer border ${
                      balcaoCategoryFilter === 'todas'
                        ? 'bg-[#FF8A00] text-white border-[#FF8A00] shadow-xs'
                        : 'bg-stone-100 dark:bg-slate-850 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-800 hover:bg-stone-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    🍽️ Todas ({products.filter((p) => p.ativo !== false && p.disponivel !== false).length})
                  </button>

                  {categories
                    .filter((c) => c.ativo !== false)
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((cat) => {
                      const countInCat = products.filter(
                        (p) =>
                          p.categoria_id === cat.id &&
                          p.ativo !== false &&
                          p.disponivel !== false &&
                          (currentLojaId === 'todas' || !p.loja_id || p.loja_id === currentLojaId || p.loja_id === currentLoja?.id)
                      ).length;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setBalcaoCategoryFilter(cat.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer border ${
                            balcaoCategoryFilter === cat.id
                              ? 'bg-[#FF8A00] text-white border-[#FF8A00] shadow-xs'
                              : 'bg-stone-100 dark:bg-slate-850 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-800 hover:bg-stone-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{cat.icone || '🍽️'}</span>
                          <span>{cat.nome}</span>
                          <span className="text-[10px] opacity-80 font-mono">({countInCat})</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Grid de Produtos Balcão (Estilo Cardápio Delivery, só que um pouco maior) */}
              {balcaoProducts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
                  <div className="text-3xl">🔍</div>
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    Nenhum produto encontrado
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Tente buscar por outro termo ou selecione outra categoria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5 sm:gap-4">
                  {balcaoProducts.map((prod) => {
                    const isPizza = isPizzaProduct(prod);
                    const hasAddons = hasProductAddons(prod);
                    const inCartCount = balcaoCart
                      .filter((it) => it.produto_id === prod.id)
                      .reduce((sum, it) => sum + it.quantidade, 0);
                    const finalPrice = prod.em_promocao && prod.preco_promocional ? prod.preco_promocional : prod.preco;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          if (isPizza) setCustomizingProduct(prod);
                          else if (hasAddons) handleOpenItemCustomizerBalcao(prod);
                          else handleAddSimpleProductToBalcao(prod);
                        }}
                        className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group relative ${
                          inCartCount > 0
                            ? 'border-[#FF8A00] ring-2 ring-[#FF8A00]/30 shadow-xs'
                            : 'border-stone-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500'
                        }`}
                      >
                        {/* Foto generosa à esquerda (um pouco maior) */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 bg-stone-100 dark:bg-slate-950 border border-stone-200/60 dark:border-slate-800">
                          <img
                            src={prod.imagem || DEFAULT_FOOD_IMG}
                            alt={prod.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                            }}
                          />
                          {isPizza && (
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#FF8A00] text-white shadow-xs flex items-center gap-1 uppercase">
                              🍕 Pizza
                            </span>
                          )}
                          {!isPizza && hasAddons && (
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-orange-600 text-white shadow-xs flex items-center gap-1 uppercase">
                              ✨ Adicionais
                            </span>
                          )}
                          {prod.em_promocao && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-600 text-white shadow-xs uppercase">
                              Promoção
                            </span>
                          )}
                        </div>

                        {/* Informações à direita */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <h4 className="font-black text-sm sm:text-base text-stone-900 dark:text-white leading-tight line-clamp-1 flex items-center gap-1.5">
                                <span className="truncate">{prod.nome}</span>
                                {prod.destaque && <span className="shrink-0 text-sm">🔥</span>}
                              </h4>
                              {prod.codigo_interno && (
                                <span className="text-[10px] font-mono font-bold text-stone-400 dark:text-slate-500 uppercase shrink-0">
                                  {prod.codigo_interno}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-snug">
                              {prod.descricao || 'Preparado artesanalmente com ingredientes selecionados.'}
                            </p>
                          </div>

                          {/* Linha inferior: Preço e Botão de Ação */}
                          <div className="flex items-center justify-between pt-2.5 mt-auto gap-2">
                            <div className="flex flex-col">
                              {prod.em_promocao && prod.preco_promocional ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base sm:text-lg font-black font-mono text-[#FF8A00]">
                                    {formatCurrency(finalPrice)}
                                  </span>
                                  <span className="text-xs line-through text-stone-400 font-mono">
                                    {formatCurrency(prod.preco)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-base sm:text-lg font-black font-mono text-[#FF8A00]">
                                  {formatCurrency(finalPrice)}
                                </span>
                              )}
                              {isPizza && (
                                <span className="text-[10px] text-stone-400 font-medium uppercase leading-tight">
                                  A partir de
                                </span>
                              )}
                            </div>

                            {/* Botões de Ação */}
                            {isPizza ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomizingProduct(prod);
                                }}
                                className="px-3 py-2 bg-[#FF8A00] hover:bg-[#E07A00] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Montar Pizza</span>
                                {inCartCount > 0 && (
                                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-stone-950 text-white rounded-full font-mono font-bold">
                                    {inCartCount}
                                  </span>
                                )}
                              </button>
                            ) : hasAddons ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenItemCustomizerBalcao(prod);
                                }}
                                className="px-3 py-2 bg-[#FF8A00] hover:bg-[#E07A00] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Personalizar</span>
                                {inCartCount > 0 && (
                                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-stone-950 text-white rounded-full font-mono font-bold">
                                    {inCartCount}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 shrink-0">
                                {inCartCount > 0 ? (
                                  <div className="flex items-center bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const itemIndex = balcaoCart.findIndex(
                                          (it) => it.produto_id === prod.id && (!it.sabores || it.sabores.length <= 1) && !it.borda && !it.massa && (!it.adicionais || it.adicionais.length === 0)
                                        );
                                        if (itemIndex >= 0) handleUpdateBalcaoItemQuantity(itemIndex, -1);
                                      }}
                                      className="w-7 h-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-200 rounded-lg flex items-center justify-center font-bold text-xs hover:bg-stone-50 active:scale-95 transition cursor-pointer"
                                      title="Diminuir"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-6 text-center font-mono font-bold text-xs text-stone-900 dark:text-white">
                                      {inCartCount}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddSimpleProductToBalcao(prod);
                                      }}
                                      className="w-7 h-7 bg-[#FF8A00] text-white rounded-lg flex items-center justify-center font-bold text-xs hover:bg-[#E07A00] active:scale-95 transition cursor-pointer shadow-xs"
                                      title="Aumentar"
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddSimpleProductToBalcao(prod);
                                    }}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FF8A00] hover:bg-[#E07A00] text-white font-bold flex items-center justify-center transition shadow-xs active:scale-90 cursor-pointer shrink-0"
                                    title="Adicionar ao pedido"
                                  >
                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coluna Direita: Carrinho, Dados do Pedido e Finalização */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4 sticky top-[130px]">
                {/* Header do Resumo */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                        Resumo do Pedido no Balcão
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {balcaoCart.length} {balcaoCart.length === 1 ? 'item diferente' : 'itens diferentes'} no carrinho
                      </p>
                    </div>
                  </div>

                  {balcaoCart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBalcaoCart([])}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Seletor de Modalidade: Retirada no Balcão ou Consumo na Mesa */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block">
                    Modalidade do Pedido
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setBalcaoModalidade('retirada')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        balcaoModalidade === 'retirada'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Retirada / Levar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalcaoModalidade('mesa')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        balcaoModalidade === 'mesa'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Na Mesa</span>
                    </button>
                  </div>
                </div>

                {/* Seleção de Mesa (se modalidade === 'mesa') */}
                {balcaoModalidade === 'mesa' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block">
                      Selecione a Mesa *
                    </label>
                    <select
                      value={balcaoSelectedMesaId}
                      onChange={(e) => setBalcaoSelectedMesaId(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/40"
                    >
                      <option value="">Selecione uma mesa...</option>
                      {tables
                        .slice()
                        .sort((a, b) => a.numero - b.numero)
                        .map((tbl) => (
                          <option key={tbl.id} value={tbl.id}>
                            Mesa {tbl.numero} — {tbl.status === 'livre' ? '🟢 Livre' : `🔴 Ocupada ${tbl.cliente_atual_nome ? `(${tbl.cliente_atual_nome})` : ''}`}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Dados do Cliente */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block mb-1">
                      Nome do Cliente {balcaoModalidade === 'retirada' ? '(para chamar na retirada)' : ''}
                    </label>
                    <input
                      type="text"
                      value={balcaoClienteNome}
                      onChange={(e) => setBalcaoClienteNome(e.target.value)}
                      placeholder="Ex: Paulo ou Cliente Balcão"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block mb-1">
                      Telefone / WhatsApp (opcional)
                    </label>
                    <input
                      type="tel"
                      value={balcaoClienteTelefone}
                      onChange={(e) => setBalcaoClienteTelefone(e.target.value)}
                      placeholder="(99) 99999-9999"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento (se Retirada) */}
                {balcaoModalidade === 'retirada' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block">
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'pix', label: 'PIX', icon: QrCode },
                        { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                        { id: 'cartao_debito', label: 'Débito', icon: CreditCard },
                        { id: 'cartao_credito', label: 'Crédito', icon: CreditCard },
                        { id: 'pagar_depois', label: 'Pagar na Retirada', icon: Clock },
                      ].map((fp) => {
                        const Icon = fp.icon;
                        const isSelected = balcaoFormaPagamento === fp.id;
                        return (
                          <button
                            key={fp.id}
                            type="button"
                            onClick={() => setBalcaoFormaPagamento(fp.id)}
                            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-stone-50 dark:bg-slate-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-900'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{fp.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {balcaoFormaPagamento === 'dinheiro' && (
                      <div className="pt-1">
                        <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                          Troco para quanto? (opcional)
                        </label>
                        <input
                          type="text"
                          value={balcaoTrocoPara}
                          onChange={(e) => setBalcaoTrocoPara(e.target.value)}
                          placeholder="Ex: 50,00 ou 100,00"
                          className="w-full px-3 py-1.5 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs font-mono text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Observações Gerais do Pedido */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block">
                    Observações da Comanda / Cozinha
                  </label>
                  <textarea
                    value={balcaoObservacao}
                    onChange={(e) => setBalcaoObservacao(e.target.value)}
                    rows={2}
                    placeholder="Ex: Sem cebola, caprichar no orégano, cliente vai aguardar no balcão..."
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 resize-none"
                  />
                </div>

                {/* Itens do Carrinho */}
                <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    <span>Itens do Pedido ({balcaoCart.reduce((s, i) => s + i.quantidade, 0)})</span>
                    <span>Subtotal</span>
                  </div>

                  {balcaoCart.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-slate-800 rounded-xl">
                      Nenhum item adicionado ainda.<br />
                      Selecione os produtos ao lado para incluir no pedido.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                      {balcaoCart.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl p-2.5 flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="font-bold text-stone-900 dark:text-white leading-tight">
                              {item.nome}
                            </div>
                            {item.tamanho && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-stone-300 font-semibold mr-1">
                                {item.tamanho}
                              </span>
                            )}
                            {item.sabores && item.sabores.length > 1 && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                Sabores: {item.sabores.join(' / ')}
                              </div>
                            )}
                            {item.borda && (
                              <div className="text-[10px] text-stone-500 dark:text-stone-400">
                                Borda: {item.borda.nome}
                              </div>
                            )}
                            {item.adicionais && item.adicionais.length > 0 && (
                              <div className="text-[10px] text-stone-500 dark:text-stone-400">
                                Extras: {item.adicionais.map((a) => a.nome).join(', ')}
                              </div>
                            )}
                            {item.observacao && (
                              <div className="text-[10px] italic text-stone-500 dark:text-stone-400">
                                Obs: {item.observacao}
                              </div>
                            )}
                            <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                              {formatCurrency(item.preco_unitario)} cada
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="font-bold font-mono text-stone-900 dark:text-white">
                              {formatCurrency(item.preco_total)}
                            </span>
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateBalcaoItemQuantity(idx, -1)}
                                className="w-5 h-5 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center font-bold text-[11px] font-mono">
                                {item.quantidade}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateBalcaoItemQuantity(idx, 1)}
                                className="w-5 h-5 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveBalcaoItem(idx)}
                                className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700 ml-0.5 cursor-pointer"
                                title="Remover item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Financeiro e Botão de Ação */}
                <div className="pt-3 border-t border-stone-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Total do Pedido
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(balcaoCartTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={balcaoCart.length === 0 || isSubmittingBalcaoOrder}
                    onClick={handleFinalizeBalcaoOrder}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isSubmittingBalcaoOrder ? (
                      <span>Enviando Pedido à Cozinha...</span>
                    ) : (
                      <>
                        <ChefHat className="w-4 h-4" />
                        <span>Lançar Pedido & Enviar à Cozinha 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Tab 3: Gestão de Pedidos & Produção */}
      {caixaActiveTab === 'pedidos' && (
        <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-4 flex-1">
          {/* Top Bar for Pedidos: Status Filter Chips & Search */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-3">
            {/* Canal Filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold pb-2.5 border-b border-stone-100 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-slate-400 mr-1">Canal:</span>
              <button
                type="button"
                onClick={() => setPedidosCanalFilter('todos')}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  pedidosCanalFilter === 'todos'
                    ? 'bg-stone-900 dark:bg-slate-800 text-white border-stone-900 shadow-2xs'
                    : 'bg-stone-50 dark:bg-slate-950 text-stone-600 dark:text-slate-400 border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-900'
                }`}
              >
                Todos ({caixaTotalOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setPedidosCanalFilter('delivery')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  pedidosCanalFilter === 'delivery'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                    : 'bg-purple-50 dark:bg-slate-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 hover:bg-purple-100/70'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery ({allDeliveryOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPedidosCanalFilter('retirada')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  pedidosCanalFilter === 'retirada'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                    : 'bg-amber-50 dark:bg-slate-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100/70'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Retirada / Buscar ({allRetiradaOrders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPedidosCanalFilter('mesa')}
                className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  pedidosCanalFilter === 'mesa'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : 'bg-emerald-50 dark:bg-slate-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100/70'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Mesas ({allMesaOrders.length})</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
        </div>

          {/* Pedidos Cards View */}
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
          ) : pedidosCanalFilter === 'todos' ? (
            /* Visualização separada em 3 colunas independentes para Canal: Todos (Delivery, Retirada, Mesas) */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {/* Coluna 1: 🛵 Delivery */}
              <div className="bg-emerald-50/60 dark:bg-slate-900/60 border border-emerald-200/90 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80">
                      <Bike className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        🛵 Delivery
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300/80">
                          {pedidosDeliveryList.length}
                        </span>
                      </h3>
                      <p className="text-[10px] text-emerald-950/80 dark:text-slate-400 font-medium">Entregas motoboy com histórico</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {pedidosDeliveryList.length === 0 ? (
                    <p className="text-xs text-stone-400 py-8 text-center font-medium">Nenhum pedido de delivery neste filtro.</p>
                  ) : (
                    pedidosDeliveryList.map((order) => {
                      const isNovo = order.status === 'novo';
                      const isPreparo = order.status === 'em_preparo';
                      const isPronto = order.status === 'pronto';
                      const isACaminho = order.status === 'a_caminho';
                      const isEntregue = order.status === 'entregue';
                      const totalOrder = order.itens
                        .filter((it) => it.status === 'ativo')
                        .reduce((acc, it) => acc + it.preco_total, 0) + (order.taxa_entrega || 0);

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
                              ? 'bg-white dark:bg-slate-900 border-2 border-emerald-600'
                              : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 opacity-90'
                          }`}
                        >
                          <div className="p-3 bg-stone-50 dark:bg-slate-950 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-600 text-white rounded-md flex items-center gap-1 shadow-xs">
                                <Bike className="w-3 h-3" /> DELIVERY
                              </span>
                              <span className="text-xs font-mono font-bold text-stone-500 dark:text-slate-400">
                                #{order.id}
                              </span>
                            </div>
                            <div>
                              {isNovo && <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-red-600 text-white rounded-md animate-pulse">● NOVO</span>}
                              {isPreparo && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500 text-white rounded-md flex items-center gap-1"><Flame className="w-2.5 h-2.5" /> EM PREPARO</span>}
                              {isPronto && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-600 text-white rounded-md flex items-center gap-1"><Check className="w-2.5 h-2.5" /> PRONTO</span>}
                              {isACaminho && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-700 text-white rounded-md flex items-center gap-1"><Bike className="w-2.5 h-2.5" /> A CAMINHO</span>}
                              {isEntregue && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-stone-700 text-stone-200 rounded-md">✓ ENTREGUE</span>}
                            </div>
                          </div>
                          <div className="p-3.5 space-y-2 flex-1 text-xs">
                            <div className="bg-stone-50/80 dark:bg-slate-950 p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 space-y-1">
                              {order.cliente_nome && <div className="font-black text-stone-950 dark:text-white flex items-center gap-1.5"><span className="text-emerald-700 dark:text-emerald-400">👤</span><span>{order.cliente_nome}</span></div>}
                              {(order.delivery_info?.telefone || order.cliente_telefone) && <div className="text-stone-600 dark:text-slate-400 flex items-center gap-1 text-[11px]"><Phone className="w-2.5 h-2.5 text-stone-400" /><span>{order.delivery_info?.telefone || order.cliente_telefone}</span></div>}
                              {(() => {
                                const dateInfo = formatOrderDateTimeCaixa(order.criado_em);
                                return (
                                  <div className="text-[10px] text-stone-500 dark:text-slate-400 font-mono pt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                    <span className={dateInfo.isOlderThan24h ? 'font-bold text-amber-800 dark:text-amber-300' : ''}>
                                      {dateInfo.text}
                                    </span>
                                    {dateInfo.isOlderThan24h && (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80">
                                        Anterior
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1 divide-y divide-stone-100 dark:divide-slate-800/80">
                              {order.itens.filter((it) => it.status === 'ativo').map((it, idx) => (
                                <div key={idx} className="pt-1 first:pt-0 flex justify-between text-[11px]">
                                  <span className="font-medium text-stone-800 dark:text-slate-200">{it.quantidade}x {it.nome}</span>
                                  <span className="font-mono font-bold text-stone-900 dark:text-slate-100 text-[11px] shrink-0">{formatCurrency(it.preco_total)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-stone-50 dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-1 flex-wrap">
                            <div className="inline-flex bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/80 px-2 py-0.5 rounded-lg shadow-2xs">
                              <span className="font-mono font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-tight">
                                {formatCurrency(totalOrder)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setPrintingOrder({ order, autoPrint: false })} className="p-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer shadow-2xs" title="Imprimir"><Printer className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /></button>
                              {isNovo && <button type="button" onClick={() => handleConfirmOrder(order)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs">Confirmar</button>}
                              {isPreparo && <button type="button" onClick={() => updateOrderStatus(order.id, 'a_caminho')} className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs">Despachar</button>}
                              <button
                                type="button"
                                onClick={() => handleShareMotoboyLink(order)}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Link do Motoboy"
                              >
                                <Bike className="w-3 h-3 text-emerald-200" />
                                <span>Link</span>
                              </button>
                              {!isEntregue && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Confirmar que o Pedido #${order.id} foi entregue?`)) {
                                      updateOrderStatus(order.id, 'entregue');
                                      if (order.comanda_id) closeComanda(order.comanda_id);
                                    }
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Confirmar Entrega"
                                >
                                  <Check className="w-3 h-3 text-white stroke-[2.5]" />
                                  <span>Entregue</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setNfceTarget(order);
                                  setShowNfceModal(true);
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs ${
                                  order.nfce_info?.status === 'autorizada'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-50'
                                }`}
                                title={order.nfce_info?.status === 'autorizada' ? `NFC-e #${order.nfce_info.numero} Autorizada` : 'Emitir NFC-e'}
                              >
                                <FileText className="w-3 h-3 text-sky-600" />
                                <span>{order.nfce_info?.status === 'autorizada' ? 'NFC-e ✓' : 'NFC-e'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Coluna 2: 🛍️ Retirada (Buscar) */}
              <div className="bg-amber-50/60 dark:bg-slate-900/60 border border-amber-200/90 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80">
                      <ShoppingBag className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        🛍️ Retirada (Buscar)
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-300 font-bold border border-amber-300/80">
                          {pedidosRetiradaList.length}
                        </span>
                      </h3>
                      <p className="text-[10px] text-amber-950/80 dark:text-slate-400 font-medium">Retiradas no balcão com histórico</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {pedidosRetiradaList.length === 0 ? (
                    <p className="text-xs text-stone-400 py-8 text-center font-medium">Nenhum pedido de retirada neste filtro.</p>
                  ) : (
                    pedidosRetiradaList.map((order) => {
                      const isNovo = order.status === 'novo';
                      const isPreparo = order.status === 'em_preparo';
                      const isPronto = order.status === 'pronto';
                      const isEntregue = order.status === 'entregue';
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
                              : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 opacity-90'
                          }`}
                        >
                          <div className="p-3 bg-stone-50 dark:bg-slate-950 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-600 text-white rounded-md flex items-center gap-1 shadow-xs">
                                <ShoppingBag className="w-3 h-3" /> RETIRADA
                              </span>
                              <span className="text-xs font-mono font-bold text-stone-500 dark:text-slate-400">
                                #{order.id}
                              </span>
                            </div>
                            <div>
                              {isNovo && <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-red-600 text-white rounded-md animate-pulse">● NOVO</span>}
                              {isPreparo && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500 text-white rounded-md flex items-center gap-1"><Flame className="w-2.5 h-2.5" /> EM PREPARO</span>}
                              {isPronto && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-600 text-white rounded-md flex items-center gap-1"><Check className="w-2.5 h-2.5" /> PRONTO</span>}
                              {isEntregue && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-stone-700 text-stone-200 rounded-md">✓ RETIRADO</span>}
                            </div>
                          </div>
                          <div className="p-3.5 space-y-2 flex-1 text-xs">
                            <div className="bg-stone-50/80 dark:bg-slate-950 p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 space-y-1">
                              {order.cliente_nome && <div className="font-black text-stone-950 dark:text-white flex items-center gap-1.5"><span className="text-amber-700 dark:text-amber-400">👤</span><span>{order.cliente_nome}</span></div>}
                              {(order.delivery_info?.telefone || order.cliente_telefone) && <div className="text-stone-600 dark:text-slate-400 flex items-center gap-1 text-[11px]"><Phone className="w-2.5 h-2.5 text-stone-400" /><span>{order.delivery_info?.telefone || order.cliente_telefone}</span></div>}
                              {(() => {
                                const dateInfo = formatOrderDateTimeCaixa(order.criado_em);
                                return (
                                  <div className="text-[10px] text-stone-500 dark:text-slate-400 font-mono pt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                    <span className={dateInfo.isOlderThan24h ? 'font-bold text-amber-800 dark:text-amber-300' : ''}>
                                      {dateInfo.text}
                                    </span>
                                    {dateInfo.isOlderThan24h && (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80">
                                        Anterior
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1 divide-y divide-stone-100 dark:divide-slate-800/80">
                              {order.itens.filter((it) => it.status === 'ativo').map((it, idx) => (
                                <div key={idx} className="pt-1 first:pt-0 flex justify-between text-[11px]">
                                  <span className="font-medium text-stone-800 dark:text-slate-200">{it.quantidade}x {it.nome}</span>
                                  <span className="font-mono font-bold text-stone-900 dark:text-slate-100 text-[11px] shrink-0">{formatCurrency(it.preco_total)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-stone-50 dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-1 flex-wrap">
                            <div className="inline-flex bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/80 px-2 py-0.5 rounded-lg shadow-2xs">
                              <span className="font-mono font-black text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-tight">
                                {formatCurrency(totalOrder)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setPrintingOrder({ order, autoPrint: false })} className="p-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer shadow-2xs" title="Imprimir"><Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /></button>
                              {isNovo && <button type="button" onClick={() => handleConfirmOrder(order)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs">Confirmar</button>}
                              {isPreparo && <button type="button" onClick={() => updateOrderStatus(order.id, 'pronto')} className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs">Pronto</button>}
                              <button type="button" onClick={() => { handleSelectOrder(order); setCaixaActiveTab('comandas'); }} className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs">
                                <Receipt className="w-3 h-3 text-amber-300" />
                                <span>Caixa ➔</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNfceTarget(order);
                                  setShowNfceModal(true);
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs ${
                                  order.nfce_info?.status === 'autorizada'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-50'
                                }`}
                                title={order.nfce_info?.status === 'autorizada' ? `NFC-e #${order.nfce_info.numero} Autorizada` : 'Emitir NFC-e'}
                              >
                                <FileText className="w-3 h-3 text-sky-600" />
                                <span>{order.nfce_info?.status === 'autorizada' ? 'NFC-e ✓' : 'NFC-e'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Coluna 3: 🍽️ Mesas & Salão */}
              <div className="bg-sky-50/60 dark:bg-slate-900/60 border border-sky-200/90 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-sky-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300/80">
                      <UtensilsCrossed className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        🍽️ Mesas & Salão
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-950 dark:text-sky-300 font-bold border border-sky-300/80">
                          {pedidosMesaList.length}
                        </span>
                      </h3>
                      <p className="text-[10px] text-sky-950/80 dark:text-slate-400 font-medium">Consumo em mesas com histórico</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {pedidosMesaList.length === 0 ? (
                    <p className="text-xs text-stone-400 py-8 text-center font-medium">Nenhum pedido de mesa neste filtro.</p>
                  ) : (
                    pedidosMesaList.map((order) => {
                      const isNovo = order.status === 'novo';
                      const isPreparo = order.status === 'em_preparo';
                      const isPronto = order.status === 'pronto';
                      const isEntregue = order.status === 'entregue';
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
                              : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 opacity-90'
                          }`}
                        >
                          <div className="p-3 bg-stone-50 dark:bg-slate-950 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-stone-900 dark:bg-slate-800 text-white rounded-md shadow-xs flex items-center gap-1">
                                <UtensilsCrossed className="w-3 h-3" /> MESA {order.mesa_numero?.toString().padStart(2, '0') || '00'}
                              </span>
                              <span className="text-xs font-mono font-bold text-stone-500 dark:text-slate-400">
                                #{order.id}
                              </span>
                            </div>
                            <div>
                              {isNovo && <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-red-600 text-white rounded-md animate-pulse">● NOVO</span>}
                              {isPreparo && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500 text-white rounded-md flex items-center gap-1"><Flame className="w-2.5 h-2.5" /> EM PREPARO</span>}
                              {isPronto && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-600 text-white rounded-md flex items-center gap-1"><Check className="w-2.5 h-2.5" /> PRONTO</span>}
                              {isEntregue && <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-stone-700 text-stone-200 rounded-md">✓ ENTREGUE</span>}
                            </div>
                          </div>
                          <div className="p-3.5 space-y-2 flex-1 text-xs">
                            <div className="bg-stone-50/80 dark:bg-slate-950 p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 space-y-1">
                              {order.cliente_nome && <div className="font-black text-stone-950 dark:text-white flex items-center gap-1.5"><span className="text-sky-700 dark:text-sky-400">👤</span><span>{order.cliente_nome}</span></div>}
                              {order.garcom_nome && <div className="text-stone-600 dark:text-slate-400 text-[11px]">Atendente: {order.garcom_nome}</div>}
                              {(() => {
                                const dateInfo = formatOrderDateTimeCaixa(order.criado_em);
                                return (
                                  <div className="text-[10px] text-stone-500 dark:text-slate-400 font-mono pt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                    <span className={dateInfo.isOlderThan24h ? 'font-bold text-amber-800 dark:text-amber-300' : ''}>
                                      {dateInfo.text}
                                    </span>
                                    {dateInfo.isOlderThan24h && (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80">
                                        Anterior
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1 divide-y divide-stone-100 dark:divide-slate-800/80">
                              {order.itens.filter((it) => it.status === 'ativo').map((it, idx) => (
                                <div key={idx} className="pt-1 first:pt-0 flex justify-between text-[11px]">
                                  <span className="font-medium text-stone-800 dark:text-slate-200">{it.quantidade}x {it.nome}</span>
                                  <span className="font-mono font-bold text-stone-900 dark:text-slate-100 text-[11px] shrink-0">{formatCurrency(it.preco_total)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-stone-50 dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-1 flex-wrap">
                            <div className="inline-flex bg-sky-100/90 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-800/80 px-2 py-0.5 rounded-lg shadow-2xs">
                              <span className="font-mono font-black text-xs sm:text-sm text-sky-950 dark:text-sky-200 leading-tight">
                                {formatCurrency(totalOrder)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setPrintingOrder({ order, autoPrint: false })} className="p-1.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg text-xs cursor-pointer shadow-2xs" title="Imprimir"><Printer className="w-3.5 h-3.5 text-amber-500" /></button>
                              {isNovo && <button type="button" onClick={() => handleConfirmOrder(order)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs">Confirmar</button>}
                              {isPreparo && <button type="button" onClick={() => updateOrderStatus(order.id, 'pronto')} className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs">Pronto</button>}
                              {isPronto && <button type="button" onClick={() => updateOrderStatus(order.id, 'entregue')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs">Entregue</button>}
                              <button
                                type="button"
                                onClick={() => {
                                  setNfceTarget(order);
                                  setShowNfceModal(true);
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs ${
                                  order.nfce_info?.status === 'autorizada'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-50'
                                }`}
                                title={order.nfce_info?.status === 'autorizada' ? `NFC-e #${order.nfce_info.numero} Autorizada` : 'Emitir NFC-e'}
                              >
                                <FileText className="w-3 h-3 text-sky-600" />
                                <span>{order.nfce_info?.status === 'autorizada' ? 'NFC-e ✓' : 'NFC-e'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Visualização em Grid tradicional para um canal específico (Delivery, Retirada ou Mesas) */
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
                  .reduce((acc, it) => acc + it.preco_total, 0) + (order.taxa_entrega || 0);

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
                        : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 opacity-90'
                    }`}
                  >
                    <div className="p-3.5 bg-stone-50 dark:bg-slate-950 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {order.tipo_pedido === 'retirada' ? (
                          <span className="px-2.5 py-1 text-xs font-black uppercase bg-amber-600 text-white rounded-lg flex items-center gap-1 shadow-xs">
                            <ShoppingBag className="w-3.5 h-3.5" /> RETIRADA
                          </span>
                        ) : isDelivery ? (
                          <span className="px-2.5 py-1 text-xs font-black uppercase bg-purple-600 text-white rounded-lg flex items-center gap-1 shadow-xs">
                            <Bike className="w-3.5 h-3.5" /> DELIVERY
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-black uppercase bg-stone-900 dark:bg-slate-800 text-white rounded-lg shadow-xs flex items-center gap-1">
                            <UtensilsCrossed className="w-3.5 h-3.5" /> MESA {order.mesa_numero?.toString().padStart(2, '0') || '00'}
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-stone-500 dark:text-slate-400">
                          #{order.id}
                        </span>
                      </div>
                      <div>
                        {isNovo && <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-red-600 text-white rounded-md animate-pulse">● NOVO PEDIDO</span>}
                        {isPreparo && <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-500 text-white rounded-md flex items-center gap-1"><Flame className="w-3 h-3" /> EM PREPARO</span>}
                        {isPronto && <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-600 text-white rounded-md flex items-center gap-1"><Check className="w-3 h-3" /> PRONTO</span>}
                        {isACaminho && <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-600 text-white rounded-md flex items-center gap-1"><Bike className="w-3 h-3" /> A CAMINHO</span>}
                        {isEntregue && <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-stone-700 text-stone-200 rounded-md">ENTREGUE</span>}
                      </div>
                    </div>
                    <div className="p-4 space-y-3 flex-1 text-xs">
                      <div className="bg-stone-50/80 dark:bg-slate-950 p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 space-y-1">
                        {order.cliente_nome && <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5"><span className="text-emerald-500">👤</span><span>Cliente: {order.cliente_nome}</span></div>}
                        {order.garcom_nome && <div className="text-stone-600 dark:text-slate-400">Atendente: {order.garcom_nome}</div>}
                        {(order.delivery_info?.telefone || order.cliente_telefone) && <div className="text-stone-600 dark:text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3 text-stone-400" /><span>{order.delivery_info?.telefone || order.cliente_telefone}</span></div>}
                        {order.tipo_pedido === 'retirada' ? (
                          <div className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 text-[11px]"><ShoppingBag className="w-3 h-3 text-amber-500" /><span>Retirada no Balcão</span></div>
                        ) : (order.delivery_info?.endereco || order.cliente_endereco) ? (
                          <div className="text-stone-700 dark:text-slate-300 flex items-start gap-1"><MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" /><span className="text-[11px] leading-tight font-medium">{order.delivery_info?.endereco || order.cliente_endereco}</span></div>
                        ) : null}
                        {(() => {
                          const dateInfo = formatOrderDateTimeCaixa(order.criado_em);
                          return (
                            <div className="text-[10px] text-stone-500 dark:text-slate-400 font-mono pt-0.5 flex items-center gap-1.5 flex-wrap">
                              <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className={dateInfo.isOlderThan24h ? 'font-bold text-amber-800 dark:text-amber-300' : ''}>
                                Recebido {dateInfo.isOlderThan24h ? 'em ' : 'às '}{dateInfo.text}
                              </span>
                              {dateInfo.isOlderThan24h && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80">
                                  Anterior
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 divide-y divide-stone-100 dark:divide-slate-800/80">
                        {order.itens.filter((it) => it.status === 'ativo').map((it, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                            <span className="font-semibold text-stone-900 dark:text-white">{it.quantidade}x {it.nome}</span>
                            <span className="font-mono font-bold text-stone-950 dark:text-slate-100 text-xs shrink-0">{formatCurrency(it.preco_total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3.5 bg-stone-50 dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="inline-flex bg-stone-200/90 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 px-3 py-1 rounded-xl shadow-2xs">
                        <span className="text-sm sm:text-base font-black font-mono text-stone-950 dark:text-white leading-tight">
                          {formatCurrency(totalOrder)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPrintingOrder({ order, autoPrint: false })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"><Printer className="w-3.5 h-3.5 text-amber-500" /></button>
                        {isNovo && <button type="button" onClick={() => handleConfirmOrder(order)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs">Confirmar 🖨️</button>}
                        {isPreparo && <button type="button" onClick={() => updateOrderStatus(order.id, 'pronto')} className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs">Pronto 🍕</button>}
                        {order.tipo_pedido === 'delivery' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleShareMotoboyLink(order)}
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Link do Motoboy"
                            >
                              <Bike className="w-3.5 h-3.5 text-purple-200" />
                              <span>Link Motoboy</span>
                            </button>
                            {!isEntregue && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Confirmar que o Pedido #${order.id} foi entregue?`)) {
                                    updateOrderStatus(order.id, 'entregue');
                                    if (order.comanda_id) closeComanda(order.comanda_id);
                                  }
                                }}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Entregue</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectOrder(order);
                              setCaixaActiveTab('comandas');
                            }}
                            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Caixa ➔</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setNfceTarget(order);
                            setShowNfceModal(true);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs ${
                            order.nfce_info?.status === 'autorizada'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-50'
                          }`}
                          title={order.nfce_info?.status === 'autorizada' ? `NFC-e #${order.nfce_info.numero} Autorizada` : 'Emitir NFC-e'}
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span>{order.nfce_info?.status === 'autorizada' ? 'NFC-e ✓' : 'NFC-e'}</span>
                        </button>
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

      {/* NFC-e Fiscal Modal */}
      {showNfceModal && nfceTarget && currentLoja && (
        <NfceModal
          isOpen={showNfceModal}
          target={nfceTarget}
          currentLoja={currentLoja}
          onClose={() => {
            setShowNfceModal(false);
            setNfceTarget(null);
          }}
          onNfceUpdated={(updatedNfce) => {
            if ('itens' in nfceTarget && typeof nfceTarget.id === 'number') {
              updateOrderNfce(nfceTarget.id, updatedNfce);
            } else if ('pedidos_ids' in nfceTarget) {
              updateComandaNfce((nfceTarget as Comanda).id, updatedNfce);
            }
          }}
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

      {/* Motoboy Link Modal */}
      {motoboyModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    Link do Motoboy • Pedido #{motoboyModalOrder.id}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Acesso direto sem necessidade de login ou senha
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMotoboyModalOrder(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Description */}
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs space-y-1.5 text-purple-900 dark:text-purple-200">
              <p className="font-semibold">
                📱 Esta página leve abre no celular do motoboy com:
              </p>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90">
                <li>Endereço do cliente com GPS (Google Maps e Waze)</li>
                <li>Telefone do cliente com botão para ligar ou abrir WhatsApp</li>
                <li>Valor total a cobrar e troco exato a devolver</li>
                <li>Botão "Finalizar Entrega" para atualizar no sistema</li>
                <li className="font-bold text-emerald-700 dark:text-emerald-400">🛡️ Expira 5 minutos após confirmada a entrega (proteção LGPD)</li>
              </ul>
            </div>

            {/* Link Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Link de Entrega Exclusivo:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getMotoboyLink(motoboyModalOrder)}
                  className="flex-1 px-3 py-2 bg-stone-100 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs font-mono text-stone-800 dark:text-stone-200 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyMotoboyLink(motoboyModalOrder)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs ${
                    copiedMotoboyLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-800 dark:hover:bg-stone-700'
                  }`}
                >
                  {copiedMotoboyLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={getMotoboyWhatsAppUrl(motoboyModalOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </a>

              <a
                href={getMotoboyLink(motoboyModalOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition border border-stone-300 dark:border-stone-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visualizar Tela</span>
              </a>
            </div>

            {/* Close button */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setMotoboyModalOrder(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pizza Customizer Modal for Balcão Order */}
      {customizingProduct && (
        <PizzaCustomizerModal
          baseProduct={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={(item) => {
            setBalcaoCart((prev) => [...prev, item]);
            setCustomizingProduct(null);
            playAddPop();
          }}
        />
      )}

      {/* Modal de Adicionais & Personalização de Burgers, Lanches e Porções no Balcão */}
      {selectedCustomItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1A22] text-stone-900 dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Header com imagem */}
            <div className="relative h-44 sm:h-48 w-full bg-stone-800 overflow-hidden shrink-0">
              <img
                src={selectedCustomItem.imagem || DEFAULT_FOOD_IMG}
                alt={selectedCustomItem.nome}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                }}
              />
              <button
                type="button"
                onClick={() => setSelectedCustomItem(null)}
                className="absolute top-3 right-3 p-2 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full backdrop-blur-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-3 bg-stone-900/85 text-amber-400 font-mono font-black text-sm px-3 py-1 rounded-xl backdrop-blur-xs flex items-center gap-1.5">
                {selectedCustomItem.em_promocao && selectedCustomItem.preco_promocional ? (
                  <>
                    <span>Base: {formatCurrency(selectedCustomItem.preco_promocional)}</span>
                    <span className="text-xs line-through text-stone-400 font-normal">{formatCurrency(selectedCustomItem.preco)}</span>
                    <span className="px-1 py-0.2 rounded bg-red-500 text-white text-[8px] font-sans uppercase">Promo</span>
                  </>
                ) : (
                  <span>Base: {formatCurrency(selectedCustomItem.preco)}</span>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white">
                  {selectedCustomItem.nome}
                </h3>
                {selectedCustomItem.descricao && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    {selectedCustomItem.descricao}
                  </p>
                )}
              </div>

              {/* Lista de Adicionais */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <span>Turbine o pedido (Adicionais)</span>
                  <span className="text-[10px] text-stone-400 lowercase font-normal">opcional</span>
                </div>

                <div className="space-y-2">
                  {getAvailableAddonsForProduct(selectedCustomItem).map((addon) => {
                    const isSelected = selectedCustomItemAddons.some((a) => a.id === addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-stone-900 dark:text-white font-bold ring-1 ring-amber-500/30'
                            : 'bg-stone-50 dark:bg-stone-900/70 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedCustomItemAddons((prev) => prev.filter((a) => a.id !== addon.id));
                              } else {
                                setSelectedCustomItemAddons((prev) => [...prev, addon]);
                              }
                            }}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                          />
                          <span>+ {addon.nome}</span>
                        </div>
                        <span className="font-mono font-bold text-amber-500">
                          +{formatCurrency(addon.preco)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Observações do Item
                </label>
                <textarea
                  value={customItemModalObs}
                  onChange={(e) => setCustomItemModalObs(e.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne, sem picles, molho à parte..."
                  className="w-full p-3 rounded-2xl text-xs bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-slate-800 resize-none h-16 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Seletor de Quantidade */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Quantidade:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomItemModalQtd((q) => Math.max(1, q - 1))}
                    disabled={customItemModalQtd <= 1}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-white flex items-center justify-center font-bold text-sm shadow-2xs disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm text-stone-900 dark:text-white w-6 text-center">
                    {customItemModalQtd}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomItemModalQtd((q) => q + 1)}
                    className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm shadow-2xs hover:bg-amber-400 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Footer com Botão de Confirmação */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/80 space-y-2 shrink-0">
              <button
                type="button"
                onClick={handleConfirmCustomItemBalcao}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-sm flex items-center justify-between px-5 shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                <span>Adicionar ao Pedido</span>
                <span className="font-mono">
                  {formatCurrency(
                    ((selectedCustomItem.em_promocao && selectedCustomItem.preco_promocional ? selectedCustomItem.preco_promocional : selectedCustomItem.preco) +
                      selectedCustomItemAddons.reduce((a, c) => a + c.preco, 0)) *
                      customItemModalQtd
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomItem(null)}
                className="w-full py-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
