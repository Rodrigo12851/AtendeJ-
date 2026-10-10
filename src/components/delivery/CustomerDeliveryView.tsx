import React, { useState, useMemo, useEffect } from 'react';
import {
  Pizza,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  Send,
  X,
  Search,
  Sun,
  Moon,
  Flame,
  ChevronRight,
  Heart,
  ShieldCheck,
  History,
  RotateCcw,
  Sparkles,
  Lock,
  Store,
  Menu,
  Bell,
  Home,
  Utensils,
  FileText,
  User,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, OrderItem, Loja } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getStoreOpenStatus } from '../../utils/storeHours';
import { PizzaCustomizerModal } from '../garcom/PizzaCustomizerModal';

const CUSTOMER_PROFILE_KEY = 'atendeja_customer_profile_v1';
const CUSTOMER_ORDERS_KEY = 'atendeja_customer_orders_v1';
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
  { id: 'add_molho_barbecue', nome: 'Pote Molho Barbecue', preco: 3.5 },
  { id: 'add_maionese_verde', nome: 'Pote Maionese Verde', preco: 3.5 },
  { id: 'add_cheddar_creme', nome: 'Cheddar Cremoso Extra', preco: 5.0 },
];

interface CustomerDeliveryViewProps {
  lojaSlug: string;
}

export const CustomerDeliveryView: React.FC<CustomerDeliveryViewProps> = ({ lojaSlug }) => {
  const {
    lojas,
    allProducts,
    categories,
    createDeliveryOrder,
    isDarkMode,
    setDarkMode,
    allOrders,
    orders,
  } = useStore();

  // Bairro Selecionado State
  const [selectedBairroId, setSelectedBairroId] = useState<string>('');

  // Search Query State
  const [searchQuery, setSearchQuery] = useState('');

  // Find store by slug or ID. NUNCA faz fallback para outra loja caso tenha sido excluída!
  const targetLoja: Loja | null = useMemo(() => {
    const found =
      lojas.find((l) => l.slug.toLowerCase() === lojaSlug.toLowerCase()) ||
      lojas.find((l) => l.id.toLowerCase() === lojaSlug.toLowerCase());

    if (!found) return null;

    const urlParams = new URLSearchParams(window.location.search);
    const paramMarca = urlParams.get('marca');
    const paramNome = urlParams.get('nome');
    const paramLogo = urlParams.get('logo');

    return {
      ...found,
      marca: paramMarca || found.marca,
      nome: paramNome || found.nome,
      logo_url: paramLogo || found.logo_url,
    };
  }, [lojas, lojaSlug]);

  // Relógio em tempo real: atualiza a cada 15 segundos para refletir abertura/fechamento instantâneo
  const [currentClockTime, setCurrentClockTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClockTime(new Date());
    }, 15000); // 15 segundos
    return () => clearInterval(timer);
  }, []);

  // Store status and operating hours (calculated accurately in real-time)
  const storeStatus = useMemo(() => {
    if (!targetLoja) {
      return {
        isOpen: false,
        statusLabel: 'Fechada',
        statusClass: 'text-red-500',
        badgeBg: 'bg-red-500/15 text-red-600',
        horarioFormatado: '',
        mensagem: 'Estabelecimento fechado',
      };
    }
    return getStoreOpenStatus(targetLoja, currentClockTime);
  }, [targetLoja, currentClockTime]);

  // Set document title to brand name
  React.useEffect(() => {
    if (!targetLoja) {
      document.title = 'Estabelecimento Não Encontrado | AtendeJá';
      return;
    }
    const brandDisplay = targetLoja.marca ? `${targetLoja.marca} - ${targetLoja.nome}` : targetLoja.nome;
    document.title = `${brandDisplay} | Cardápio Digital & Delivery`;
  }, [targetLoja]);

  // Products belonging to this store
  const storeProducts = useMemo(() => {
    if (!targetLoja) return [];
    return allProducts.filter((p) => p.loja_id === targetLoja.id);
  }, [allProducts, targetLoja]);

  // Exibe apenas categorias que possuem produtos cadastrados nesta loja específica
  const availableCategories = useMemo(() => {
    return categories.filter((cat) =>
      storeProducts.some((p) => p.categoria_id === cat.id && p.ativo)
    );
  }, [categories, storeProducts]);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  // Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [currentTab, setCurrentTab] = useState<'inicio' | 'cardapio' | 'pedidos' | 'favoritos' | 'perfil'>('inicio');
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState<Product | null>(null);
  const [selectedBurgerOrItem, setSelectedBurgerOrItem] = useState<Product | null>(null);
  const [itemModalQtd, setItemModalQtd] = useState<number>(1);
  const [selectedItemAddons, setSelectedItemAddons] = useState<{ id: string; nome: string; preco: number }[]>([]);
  const [itemModalObs, setItemModalObs] = useState<string>('');

  const availableAddonsForCurrentItem = useMemo(() => {
    if (!selectedBurgerOrItem) return [];
    if (selectedBurgerOrItem.categoria_id === 'porcoes') return DEFAULT_PORTION_ADDONS;
    return DEFAULT_BURGER_ADDONS;
  }, [selectedBurgerOrItem]);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showStoreInfoDrawer, setShowStoreInfoDrawer] = useState(false);

  // Checkout Form State
  const [tipoPedido, setTipoPedido] = useState<'delivery' | 'retirada'>('delivery');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [trocoPara, setTrocoPara] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState<number | null>(null);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [customerOrderIds, setCustomerOrderIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Load saved customer profile on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(CUSTOMER_PROFILE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.nome) setClienteNome(parsed.nome);
        if (parsed.telefone) setClienteTelefone(parsed.telefone);
        if (parsed.endereco) setClienteEndereco(parsed.endereco);
        if (parsed.selectedBairroId) setSelectedBairroId(parsed.selectedBairroId);
        if (parsed.tipoPedido) setTipoPedido(parsed.tipoPedido);
        setProfileLoaded(true);
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil salvo:', e);
    }
  }, []);

  // Customer order history (matched by saved order IDs or customer phone number)
  const customerOrders = useMemo(() => {
    const cleanPhone = clienteTelefone.replace(/\D/g, '');
    const pool = allOrders && allOrders.length > 0 ? allOrders : orders;

    return pool
      .filter((o) => {
        if (customerOrderIds.includes(o.id)) return true;
        if (cleanPhone.length >= 8 && o.cliente_telefone) {
          const orderPhone = o.cliente_telefone.replace(/\D/g, '');
          if (orderPhone && (orderPhone.includes(cleanPhone) || cleanPhone.includes(orderPhone))) {
            return true;
          }
        }
        return false;
      })
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  }, [allOrders, orders, customerOrderIds, clienteTelefone]);

  // Check if there is an active order in progress
  const activeOrder = useMemo(() => {
    return customerOrders.find((o) => ['novo', 'em_preparo', 'pronto', 'a_caminho'].includes(o.status));
  }, [customerOrders]);

  // Cart totals
  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + item.preco_total, 0), [cart]);
  const selectedBairro = useMemo(() => {
    if (!targetLoja.taxas_bairro || !selectedBairroId) return null;
    return targetLoja.taxas_bairro.find((tb) => tb.id === selectedBairroId) || null;
  }, [targetLoja.taxas_bairro, selectedBairroId]);

  const deliveryFee = useMemo(() => {
    if (tipoPedido === 'retirada') return 0;
    if (selectedBairro) return selectedBairro.valor;
    return targetLoja.taxa_entrega || 0;
  }, [tipoPedido, selectedBairro, targetLoja.taxa_entrega]);
  const cartTotal = cartSubtotal + deliveryFee;

  // Toggle Favorite
  const toggleFavorite = (prodId: string) => {
    setFavorites((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  // Filter products by active category & search query
  const filteredProducts = useMemo(() => {
    return storeProducts.filter((p) => {
      if (!p.ativo) return false;
      const matchesCategory = activeCategory === 'todos' || p.categoria_id === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descricao.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [storeProducts, activeCategory, searchQuery]);

  // Featured Products ("Mais Pedidos")
  const featuredProducts = useMemo(() => {
    return storeProducts.filter((p) => p.destaque && p.ativo).slice(0, 4);
  }, [storeProducts]);

  // Banner Offers Carousel (produtos em destaque ou primeiros produtos da loja)
  const bannerOffers = useMemo(() => {
    const list = storeProducts.filter((p) => p.destaque && p.ativo);
    if (list.length > 0) return list.slice(0, 5);
    return storeProducts.filter((p) => p.ativo).slice(0, 5);
  }, [storeProducts]);

  const [bannerIndex, setBannerIndex] = useState(0);

  const specialOfferProduct = useMemo(() => {
    if (bannerOffers.length === 0) return null;
    return bannerOffers[bannerIndex % bannerOffers.length];
  }, [bannerOffers, bannerIndex]);

  // Categorias exibidas nos círculos (apenas as que possuem produtos cadastrados nesta loja)
  const displayCategoryCircles = useMemo(() => {
    const iconMap: Record<string, string> = {
      hamburgueres: '🍔',
      combos: '🍟',
      bebidas: '🥤',
      porcoes: '🍗',
      lanches: '🌭',
      sobremesas: '🍰',
      pizzas: '🍕',
      pizzas_doces: '🍫',
      promocoes: '🔥',
    };

    const list: { id: string; label: string; icon: string }[] = [];

    // Inclui apenas categorias que realmente possuem produtos cadastrados nesta loja
    availableCategories.forEach((cat) => {
      list.push({
        id: cat.id,
        label: cat.nome,
        icon: iconMap[cat.id] || cat.icone || '🍽️',
      });
    });

    // Se houver produto em promoção/destaque, inclui Promoções caso ainda não esteja na lista
    if (specialOfferProduct && !list.some((c) => c.id === 'promocoes')) {
      list.push({ id: 'promocoes', label: 'Promoções', icon: '🔥' });
    }

    return list;
  }, [availableCategories, specialOfferProduct]);

  const handleOpenItemCustomizer = (product: Product) => {
    if (!storeStatus.isOpen) {
      alert(`O estabelecimento está fechado no momento!\nHorário de atendimento: ${storeStatus.horarioFormatado}.\nNovos pedidos não estão sendo aceitos agora.`);
      return;
    }
    setSelectedBurgerOrItem(product);
    setItemModalQtd(1);
    setSelectedItemAddons([]);
    setItemModalObs('');
  };

  const handleConfirmCustomItem = () => {
    if (!selectedBurgerOrItem) return;
    if (!storeStatus.isOpen) {
      alert(`O estabelecimento está fechado no momento!\nHorário de atendimento: ${storeStatus.horarioFormatado}.`);
      setSelectedBurgerOrItem(null);
      return;
    }

    const extrasTotal = selectedItemAddons.reduce((acc, curr) => acc + curr.preco, 0);
    const precoUnitarioTotal = selectedBurgerOrItem.preco + extrasTotal;
    const precoTotal = precoUnitarioTotal * itemModalQtd;

    const newItem: OrderItem = {
      id: `cust_item_${Date.now()}_${Math.random()}`,
      produto_id: selectedBurgerOrItem.id,
      nome: selectedBurgerOrItem.nome,
      quantidade: itemModalQtd,
      preco_unitario: precoUnitarioTotal,
      preco_total: precoTotal,
      adicionais: selectedItemAddons.map((a) => ({ nome: a.nome, preco: a.preco })),
      observacao: itemModalObs.trim() || undefined,
      status: 'ativo',
    };

    setCart((prev) => [...prev, newItem]);
    setSelectedBurgerOrItem(null);
    setItemModalQtd(1);
    setSelectedItemAddons([]);
    setItemModalObs('');
  };

  // Add regular product directly to cart or open customizer
  const handleAddRegularProduct = (product: Product) => {
    if (!storeStatus.isOpen) {
      alert(`O estabelecimento está fechado no momento!\nHorário de funcionamento: ${storeStatus.horarioFormatado}.\nNovos pedidos não estão sendo aceitos agora.`);
      return;
    }

    if (product.isPizza || product.permitirTamanhos || product.permitirBordas) {
      setSelectedPizza(product);
      return;
    }

    if (
      product.categoria_id === 'lanches' ||
      product.categoria_id === 'hamburgueres' ||
      product.categoria_id === 'porcoes' ||
      product.permitirAdicionais
    ) {
      handleOpenItemCustomizer(product);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.produto_id === product.id && (!item.adicionais || item.adicionais.length === 0) && !item.observacao
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const currentItem = updated[existingIdx];
        const newQty = currentItem.quantidade + 1;
        updated[existingIdx] = {
          ...currentItem,
          quantidade: newQty,
          preco_total: newQty * currentItem.preco_unitario,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `cust_item_${Date.now()}_${Math.random()}`,
          produto_id: product.id,
          nome: product.nome,
          quantidade: 1,
          preco_unitario: product.preco,
          preco_total: product.preco,
          status: 'ativo',
        },
      ];
    });
  };

  // Add Pizza from Customizer Modal (Handles 2+ flavors meio-a-meio)
  const handleAddPizzaToCart = (pizzaItem: OrderItem) => {
    if (!storeStatus.isOpen) {
      alert(`O estabelecimento está fechado no momento!\nHorário de atendimento: ${storeStatus.horarioFormatado}.`);
      setSelectedPizza(null);
      return;
    }
    setCart((prev) => [...prev, pizzaItem]);
    setSelectedPizza(null);
  };

  // Remove / Update Qty
  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantidade: newQty,
        preco_total: newQty * updated[index].preco_unitario,
      };
      return updated;
    });
  };

  // Submit Order
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeStatus.isOpen) {
      alert(`O estabelecimento está fechado no momento!\nHorário de funcionamento: ${storeStatus.horarioFormatado}.\nNovos pedidos não podem ser enviados.`);
      return;
    }
    if (cart.length === 0 || !clienteNome || !clienteTelefone) return;
    const finalEndereco =
      tipoPedido === 'retirada'
        ? `Retirada na Loja: ${targetLoja.nome}`
        : selectedBairro
        ? `${clienteEndereco.trim()} (Bairro: ${selectedBairro.bairro})`
        : clienteEndereco;

    const newOrder = createDeliveryOrder(
      targetLoja.id,
      {
        nome: clienteNome,
        telefone: clienteTelefone,
        endereco: finalEndereco,
        formaPagamento,
        trocoPara: trocoPara ? parseFloat(trocoPara.replace(',', '.')) : undefined,
        tipoPedido,
      },
      cart,
      observacaoGeral
    );

    // Save profile to localStorage so the customer never needs to retype
    try {
      localStorage.setItem(
        CUSTOMER_PROFILE_KEY,
        JSON.stringify({
          nome: clienteNome,
          telefone: clienteTelefone,
          endereco: clienteEndereco,
          selectedBairroId,
          tipoPedido,
        })
      );
      setProfileLoaded(true);

      const updatedIds = [newOrder.id, ...customerOrderIds.filter((id) => id !== newOrder.id)].slice(0, 50);
      localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify(updatedIds));
      setCustomerOrderIds(updatedIds);
    } catch (err) {
      console.warn('Erro ao salvar no localStorage:', err);
    }

    setSubmittedOrderNumber(newOrder.id);
    setCart([]);
    setShowCartModal(false);
  };

  // Repeat Order from History (1-Click)
  const handleRepeatOrder = (pastOrder: (typeof customerOrders)[0]) => {
    const clonedItems: OrderItem[] = pastOrder.itens.map((item, idx) => ({
      ...item,
      id: `rep_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      pedido_id: undefined,
      status: 'ativo' as const,
    }));

    setCart(clonedItems);
    setShowOrderHistoryModal(false);
    setShowCartModal(true);
  };

  // Theme Classes
  const bgClass = isDarkMode ? 'bg-[#121216] text-white' : 'bg-[#FAF7F2] text-stone-900 dark:text-slate-100';
  const cardBgClass = isDarkMode ? 'bg-[#1A1A22] border-stone-800' : 'bg-white border-stone-200';
  const inputBgClass = isDarkMode
    ? 'bg-[#242430] border-2 border-stone-600 text-white placeholder-stone-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'bg-white border-2 border-stone-300 text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/20 shadow-2xs';
  const headerBgClass = isDarkMode ? 'bg-[#181820] border-stone-800' : 'bg-stone-900 text-white border-stone-800';

  // Check if store is suspended
  const isSuspended = !targetLoja.ativa || targetLoja.status_assinatura === 'suspenso';

  if (isSuspended) {
    return (
      <div className={`min-h-screen font-sans flex flex-col items-center justify-center p-4 transition-colors duration-200 ${bgClass}`}>
        <div className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border shadow-xl text-center space-y-6 ${cardBgClass} border-red-500/30`}>
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              Cardápio Indisponível
            </span>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white">
              {targetLoja.marca || targetLoja.nome}
            </h1>
            <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">
              Este estabelecimento está <strong>temporariamente indisponível</strong> no momento. O atendimento online e a realização de novos pedidos estão suspensos pela administração.
            </p>
          </div>

          {targetLoja.telefone && (
            <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 text-xs text-stone-600 dark:text-stone-300">
              <span>Para mais informações, consulte o estabelecimento:</span>
              <strong className="text-stone-900 dark:text-white block mt-1 font-mono text-sm">{targetLoja.telefone}</strong>
            </div>
          )}

          {customerOrders.length > 0 && (
            <button
              onClick={() => setShowOrderHistoryModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <History className="w-4 h-4 text-stone-950" />
              <span>Consultar Meus Pedidos Anteriores ({customerOrders.length})</span>
            </button>
          )}
        </div>

        {/* Modal de Histórico de Pedidos caso o cliente queira consultar pedidos anteriores */}
        {showOrderHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border ${cardBgClass} max-h-[90vh] flex flex-col`}>
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">Meus Pedidos Anteriores</h3>
                </div>
                <button
                  onClick={() => setShowOrderHistoryModal(false)}
                  className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {customerOrders.map((ord) => (
                  <div key={ord.id} className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-stone-900 dark:text-white">Pedido #{ord.id}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md uppercase bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500">
                      {new Date(ord.criado_em).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Total: R$ {(ord.itens.reduce((acc, it) => acc + (it.preco_total || it.preco_unitario * it.quantidade), 0) + (ord.taxa_entrega || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!targetLoja) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50 dark:ring-red-950/30">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1 rounded-full">
              Loja Indisponível
            </span>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mt-3">
              Estabelecimento Não Encontrado
            </h2>
            <p className="text-stone-600 dark:text-stone-300 text-sm mt-2">
              Este cardápio digital ou estabelecimento não existe mais ou foi desativado da plataforma AtendeJá.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderStoreIcon = (size: 'sm' | 'lg' = 'sm') => {
    const text = `${targetLoja.marca || ''} ${targetLoja.nome || ''}`.toLowerCase();
    const isBurger = text.includes('burger') || text.includes('hamburg') || text.includes('smash');
    const fallbackEmoji = isBurger ? '🍔' : (text.includes('pizza') || text.includes('pizzaria') ? '🍕' : '🍽️');

    if (targetLoja.logo_url) {
      return (
        <img
          src={targetLoja.logo_url}
          alt={targetLoja.marca || targetLoja.nome}
          className="w-full h-full object-cover"
          onError={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="${size === 'sm' ? 'text-base' : 'text-3xl'}">${fallbackEmoji}</span>`;
            }
          }}
        />
      );
    }
    if (isBurger) {
      return <span className={size === 'sm' ? 'text-base' : 'text-3xl'}>🍔</span>;
    }
    const isPizza = text.includes('pizza') || text.includes('pizzaria');
    if (isPizza) {
      return size === 'sm' ? <Pizza className="w-4 h-4" /> : <Pizza className="w-8 h-8" />;
    }
    return <span className={size === 'sm' ? 'text-base' : 'text-3xl'}>🍽️</span>;
  };

  return (
    <div className={`min-h-screen font-sans pb-28 transition-colors duration-200 ${bgClass}`}>
      {/* 1. Top App Header (Expansivo no PC com abas no centro e compacto no Mobile) */}
      <header className={`sticky top-0 z-30 px-3 sm:px-6 py-3 border-b shadow-xs transition-colors ${isDarkMode ? 'bg-[#16161D] border-stone-800' : 'bg-[#F5F6F8] border-stone-200'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Hamburger Menu Button & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            <button
              onClick={() => setShowStoreInfoDrawer(true)}
              className="p-1.5 sm:p-2 -ml-1 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer shrink-0"
              title="Informações do Estabelecimento"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="text-left min-w-0 flex-1">
              <h1 className="text-xs sm:text-base font-black tracking-tight text-stone-900 dark:text-white uppercase truncate flex items-center gap-1">
                <span className="shrink-0">{targetLoja.nome.toLowerCase().includes('burger') || (targetLoja.marca && targetLoja.marca.toLowerCase().includes('burger')) ? '🍔' : '🍽️'}</span>
                <span className="truncate">{targetLoja.marca || targetLoja.nome}</span>
              </h1>
              <div className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 sm:gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden">
                <span className="truncate max-w-[80px] sm:max-w-none font-medium">
                  {targetLoja.marca ? targetLoja.nome : 'Hamburgueria'}
                </span>
                <span className="text-stone-300 dark:text-stone-600 shrink-0">•</span>
                <span className="font-semibold text-stone-700 dark:text-stone-300 shrink-0">
                  {storeStatus.horarioFormatado}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs (Exatamente como na Imagem 2) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <button
              onClick={() => { setSearchQuery(''); setCurrentTab('inicio'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                currentTab === 'inicio'
                  ? 'bg-[#FF8A00] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-[#FF8A00]'
              }`}
            >
              Início
            </button>
            <button
              onClick={() => { setSearchQuery(''); setCurrentTab('cardapio'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                currentTab === 'cardapio'
                  ? 'bg-[#FF8A00] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-[#FF8A00]'
              }`}
            >
              Cardápio
            </button>
            <button
              onClick={() => { setSearchQuery(''); setCurrentTab('pedidos'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                currentTab === 'pedidos'
                  ? 'bg-[#FF8A00] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-[#FF8A00]'
              }`}
            >
              <span>Meus Pedidos</span>
              {customerOrders.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-mono">
                  {customerOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setSearchQuery(''); setCurrentTab('favoritos'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                currentTab === 'favoritos'
                  ? 'bg-[#FF8A00] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-[#FF8A00]'
              }`}
            >
              <span>Favoritos</span>
              {favorites.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-mono">
                  {favorites.length}
                </span>
              )}
            </button>
          </nav>

          {/* Right: Theme Toggle, Bell, Profile & Cart with Store Status Badge underneath */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                onClick={() => setDarkMode(!isDarkMode)}
                className="p-2 rounded-xl text-stone-700 dark:text-amber-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
                title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>

              <button
                onClick={() => {
                  if (customerOrders.length > 0) setCurrentTab('pedidos');
                  else if (cart.length > 0) setShowCartModal(true);
                  else alert('Nenhuma notificação nova no momento.');
                }}
                className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition relative cursor-pointer"
                title="Notificações e Pedidos Ativos"
              >
                <Bell className="w-5 h-5" />
                {(activeOrder || customerOrders.length > 0) && (
                  <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-stone-900">
                    {activeOrder ? '!' : customerOrders.length}
                  </span>
                )}
              </button>

              {/* Profile Button on Desktop */}
              <button
                onClick={() => setCurrentTab('perfil')}
                className="hidden md:flex p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
                title="Meu Perfil"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Cart Shortcut in Header */}
              <button
                onClick={() => setShowCartModal(true)}
                className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition relative cursor-pointer"
                title="Sacola de Compras"
              >
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 bg-[#FF8A00] text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-stone-900">
                    {cart.reduce((a, c) => a + c.quantidade, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Badge Aberto / Fechado posicionado exatamente ABAIXO dos ícones (sino/sacola) */}
            <div className="flex items-center justify-end pr-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                  storeStatus.isOpen
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    storeStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span>{storeStatus.isOpen ? 'Aberto' : 'Fechado'}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Expansive Container (max-w-7xl no PC) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 space-y-5">
        {/* Search Bar (Pill Estilo Imagem 2, responsivo) */}
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquise por hambúrguer, combo, bebida..."
            className={`w-full pl-12 pr-10 py-3.5 rounded-full text-xs sm:text-sm font-semibold shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#FF8A00] transition border ${
              isDarkMode
                ? 'bg-[#1E1E28] border-stone-700 text-white placeholder-stone-400'
                : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Banner de Loja Fechada (Exibido apenas quando a loja estiver fechada) */}
        {!storeStatus.isOpen && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-200 shadow-xs flex items-center gap-3 animate-in fade-in">
            <Clock className="w-5 h-5 text-red-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-red-700 dark:text-red-300">Loja Fechada no momento: </span>
              <span>Nosso horário de funcionamento é <strong>{storeStatus.horarioFormatado}</strong>. Novos pedidos não estão sendo aceitos agora.</span>
            </div>
          </div>
        )}

        {/* Order Submitted Success View */}
        {submittedOrderNumber !== null ? (
          <div className={`p-8 rounded-3xl border shadow-xl text-center space-y-4 max-w-md mx-auto my-6 animate-in zoom-in-95 ${cardBgClass}`}>
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black">Pedido Recebido com Sucesso!</h2>
            <p className="text-xs text-stone-500">
              Seu pedido <span className="font-mono font-bold text-[#FF8A00]">#{submittedOrderNumber}</span> foi enviado diretamente para a cozinha da <strong className="text-stone-900 dark:text-white">{targetLoja.marca || targetLoja.nome}</strong>.
            </p>
            <div className={`p-4 rounded-2xl text-xs text-left space-y-1 font-medium ${isDarkMode ? 'bg-stone-900' : 'bg-stone-50'}`}>
              <p>📍 {clienteEndereco}</p>
              <p>📞 {clienteNome} — {clienteTelefone}</p>
              <p>💰 Forma: <span className="uppercase font-bold">{formaPagamento}</span></p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setSubmittedOrderNumber(null);
                  setCurrentTab('pedidos');
                }}
                className="flex-1 py-3 px-4 bg-[#FF8A00] hover:bg-[#E07A00] text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Acompanhar Pedido</span>
              </button>

              <button
                onClick={() => setSubmittedOrderNumber(null)}
                className="flex-1 py-3 px-4 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fazer Outro Pedido
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* ABA: INÍCIO (EXPANSIVO NO PC CONFORME IMAGEM 2)           */}
            {/* ======================================================== */}
            {currentTab === 'inicio' && !searchQuery && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. Hero Banner / Super Combo (Compacto e horizontal lado a lado no celular, espaçoso no PC) */}
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg bg-gradient-to-r from-[#4A044E] via-[#58085C] to-[#2E0233] text-white p-3.5 sm:p-6 lg:p-8 border border-purple-900/40 flex flex-row items-center justify-between gap-2.5 sm:gap-6">
                  {/* Left Carousel Arrow */}
                  {bannerOffers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBannerIndex((prev) => (prev > 0 ? prev - 1 : bannerOffers.length - 1))}
                      className="absolute left-1.5 sm:left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center font-bold text-xs sm:text-sm z-20 cursor-pointer transition shadow-md"
                      title="Oferta anterior"
                    >
                      ‹
                    </button>
                  )}

                  {/* Right Carousel Arrow */}
                  {bannerOffers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBannerIndex((prev) => (prev + 1) % bannerOffers.length)}
                      className="absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center font-bold text-xs sm:text-sm z-20 cursor-pointer transition shadow-md"
                      title="Próxima oferta"
                    >
                      ›
                    </button>
                  )}

                  {/* Banner Left Content */}
                  <div className="space-y-1 sm:space-y-2 z-10 flex-1 min-w-0 pl-5 sm:pl-8">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 rounded-full bg-white/20 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider backdrop-blur-xs truncate max-w-[130px] sm:max-w-none">
                        {targetLoja.nome.toLowerCase().includes('burger') || (targetLoja.marca && targetLoja.marca.toLowerCase().includes('burger'))
                          ? 'BURGER ARTESANAL'
                          : 'OFERTA ESPECIAL'}
                      </span>
                      {bannerOffers.length > 0 && (
                        <span className="text-[10px] sm:text-[11px] font-bold text-white/70 font-mono tracking-wider shrink-0">
                          {(bannerIndex % bannerOffers.length) + 1}/{bannerOffers.length}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight text-white drop-shadow-xs truncate">
                      {specialOfferProduct ? specialOfferProduct.nome : 'DOUBLE CHEDDAR'}
                    </h2>
                    <p className="text-[11px] sm:text-sm text-pink-200/90 font-medium uppercase line-clamp-1 sm:line-clamp-2">
                      {specialOfferProduct ? specialOfferProduct.descricao : '2 CARNES + CHEDDAR MELT'}
                    </p>

                    <div className="flex items-baseline gap-1.5 sm:gap-2 pt-0.5">
                      <span className="text-lg sm:text-2xl md:text-3xl font-black font-mono text-[#FF8A00] drop-shadow-xs">
                        {formatCurrency(specialOfferProduct ? specialOfferProduct.preco : 31.90)}
                      </span>
                      <span className="text-[10px] sm:text-xs line-through text-white/50 font-mono">
                        {formatCurrency(specialOfferProduct ? specialOfferProduct.preco * 1.15 : 34.90)}
                      </span>
                    </div>

                    <div className="pt-1 sm:pt-2">
                      <button
                        onClick={() => {
                          if (specialOfferProduct) handleAddRegularProduct(specialOfferProduct);
                          else {
                            setActiveCategory('lanches');
                            setCurrentTab('cardapio');
                          }
                        }}
                        className="px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#1A1A1E] hover:bg-black active:scale-95 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider transition shadow-md cursor-pointer inline-flex items-center gap-1 sm:gap-1.5"
                      >
                        <span>VER MAIS</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Banner Image (Lado a lado, compacto no mobile) */}
                  <div className="w-24 h-24 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shrink-0 border border-white/20 bg-stone-900 pr-0 mr-5 sm:mr-8">
                    <img
                      src={specialOfferProduct?.imagem || DEFAULT_FOOD_IMG}
                      alt="Oferta"
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                      }}
                    />
                  </div>

                  {/* Carousel Dots */}
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5">
                    {bannerOffers.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setBannerIndex(idx)}
                        className={`transition-all rounded-full cursor-pointer ${
                          idx === (bannerIndex % bannerOffers.length)
                            ? 'w-4 sm:w-5 h-1 sm:h-1.5 bg-[#FF8A00]'
                            : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Círculos de Categorias (Apenas categorias com produtos cadastrados, halo ativo e tamanho compacto no mobile) */}
                {displayCategoryCircles.length > 0 && (
                  <div className="py-1">
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                      {displayCategoryCircles.map((catItem) => {
                        const isCatActive = activeCategory === catItem.id;
                        return (
                          <button
                            key={catItem.id}
                            onClick={() => {
                              setActiveCategory(catItem.id);
                              setCurrentTab('cardapio');
                            }}
                            className="flex flex-col items-center gap-1 sm:gap-1.5 group cursor-pointer shrink-0"
                          >
                            <div
                              className={`w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl transition-all ${
                                isCatActive
                                  ? 'bg-[#FF8A00] text-white ring-4 ring-[#FF8A00]/30 border-2 border-[#FF8A00] shadow-md scale-105'
                                  : 'bg-[#FF8A00] hover:bg-[#E07A00] active:scale-95 text-white shadow-xs group-hover:shadow-md'
                              }`}
                            >
                              {catItem.icon}
                            </div>
                            <span
                              className={`text-[10px] sm:text-xs tracking-tight text-center max-w-[70px] sm:max-w-[85px] truncate ${
                                isCatActive
                                  ? 'font-black text-[#FF8A00]'
                                  : 'font-bold text-stone-800 dark:text-stone-200'
                              }`}
                            >
                              {catItem.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Seção "Mais pedidos" / Categoria Ativa (com contador de itens à direita) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white tracking-tight">
                      {activeCategory === 'todos'
                        ? 'Mais pedidos'
                        : availableCategories.find((c) => c.id === activeCategory)?.nome || 'Mais pedidos'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {(activeCategory === 'todos' ? (featuredProducts.length || storeProducts.length) : filteredProducts.length)}{' '}
                        {(activeCategory === 'todos' ? (featuredProducts.length || storeProducts.length) : filteredProducts.length) === 1 ? 'item' : 'itens'}
                      </span>
                      <button
                        onClick={() => {
                          setActiveCategory('todos');
                          setCurrentTab('cardapio');
                        }}
                        className="text-xs font-bold text-[#FF8A00] hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                      >
                        <span>Ver todos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean Product Cards Grid (1 col mobile, 2 col tablet, 3 col desktop - Expansivo!) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(featuredProducts.length > 0 ? featuredProducts : storeProducts.slice(0, 6)).map((prod) => {
                      const isFav = favorites.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleAddRegularProduct(prod)}
                          className={`rounded-2xl p-3 sm:p-3.5 border shadow-xs hover:shadow-md transition-all flex gap-3 cursor-pointer group ${
                            isDarkMode ? 'bg-[#1E1E28] border-stone-800/80' : 'bg-white border-stone-100'
                          }`}
                        >
                          {/* Square Left Image */}
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                            <img
                              src={prod.imagem || DEFAULT_FOOD_IMG}
                              alt={prod.nome}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                              }}
                            />
                            {prod.isPizza && (
                              <span className="absolute bottom-1 left-1 bg-[#FF8A00] text-white font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase">
                                🍕 Meio a Meio
                              </span>
                            )}
                          </div>

                          {/* Info on Right */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-black text-sm text-stone-900 dark:text-white leading-tight line-clamp-1">
                                  {prod.nome}
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(prod.id);
                                  }}
                                  className="p-1 text-stone-400 hover:text-red-500 transition shrink-0 cursor-pointer"
                                >
                                  <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                                </button>
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-snug">
                                {prod.descricao || 'Preparado artesanalmente com ingredientes selecionados.'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[#FF8A00] font-black text-base sm:text-lg font-mono">
                                {formatCurrency(prod.preco)}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddRegularProduct(prod);
                                }}
                                disabled={!storeStatus.isOpen}
                                className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center transition shadow-xs active:scale-90 ${
                                  !storeStatus.isOpen
                                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                                    : 'bg-[#FF8A00] hover:bg-[#E07A00] text-white cursor-pointer'
                                }`}
                                title="Adicionar ao pedido"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA: CARDÁPIO (EXPANSIVO NO PC COM 3 COLUNAS)            */}
            {/* ======================================================== */}
            {(currentTab === 'cardapio' || searchQuery) && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Header da Aba: Título da Categoria + Badge de Itens */}
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight">
                    {searchQuery
                      ? `Resultados para "${searchQuery}"`
                      : activeCategory === 'todos'
                      ? 'Todos os Lanches'
                      : availableCategories.find((c) => c.id === activeCategory)?.nome || 'Cardápio'}
                  </h2>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* Barra de Filtro de Categorias (Horizontal Scroll) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setActiveCategory('todos')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeCategory === 'todos'
                        ? 'bg-[#FF8A00] text-white shadow-xs'
                        : isDarkMode
                        ? 'bg-[#1E1E28] text-stone-300 border border-stone-800'
                        : 'bg-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    Todos
                  </button>

                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-[#FF8A00] text-white shadow-xs'
                          : isDarkMode
                          ? 'bg-[#1E1E28] text-stone-300 border border-stone-800'
                          : 'bg-white text-stone-700 border border-stone-200'
                      }`}
                    >
                      {cat.icone} {cat.nome}
                    </button>
                  ))}
                </div>

                {/* Lista de Produtos (Cards Imagem 2 em 3 Colunas no PC) */}
                {filteredProducts.length === 0 ? (
                  <div className="py-16 text-center text-stone-500 space-y-2 p-6 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800">
                    <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum produto encontrado.</p>
                    <p className="text-xs">Tente buscar por outro termo ou selecione outra categoria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((prod) => {
                      const isFav = favorites.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleAddRegularProduct(prod)}
                          className={`rounded-2xl p-3 sm:p-3.5 border shadow-xs hover:shadow-md transition-all flex gap-3 cursor-pointer group ${
                            isDarkMode ? 'bg-[#1E1E28] border-stone-800/80' : 'bg-white border-stone-100'
                          }`}
                        >
                          {/* Square Left Image */}
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                            <img
                              src={prod.imagem || DEFAULT_FOOD_IMG}
                              alt={prod.nome}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                              }}
                            />
                            {prod.isPizza && (
                              <span className="absolute bottom-1 left-1 bg-[#FF8A00] text-white font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase">
                                🍕 Meio a Meio
                              </span>
                            )}
                          </div>

                          {/* Info on Right */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-black text-sm text-stone-900 dark:text-white leading-tight line-clamp-1">
                                  {prod.nome}
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(prod.id);
                                  }}
                                  className="p-1 text-stone-400 hover:text-red-500 transition shrink-0 cursor-pointer"
                                >
                                  <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                                </button>
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-snug">
                                {prod.descricao || 'Preparado artesanalmente com ingredientes selecionados.'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[#FF8A00] font-black text-base sm:text-lg font-mono">
                                {formatCurrency(prod.preco)}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddRegularProduct(prod);
                                }}
                                disabled={!storeStatus.isOpen}
                                className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center transition shadow-xs active:scale-90 ${
                                  !storeStatus.isOpen
                                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                                    : 'bg-[#FF8A00] hover:bg-[#E07A00] text-white cursor-pointer'
                                }`}
                                title="Adicionar ao pedido"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA: PEDIDOS (Histórico e Acompanhamento)                 */}
            {/* ======================================================== */}
            {currentTab === 'pedidos' && !searchQuery && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">Meus Pedidos</h2>
                  <span className="text-xs font-bold text-stone-500">{customerOrders.length} no total</span>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="py-16 text-center text-stone-500 p-6 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-[#FF8A00] flex items-center justify-center mx-auto text-2xl">
                      🛍️
                    </div>
                    <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">Você ainda não fez nenhum pedido</h4>
                    <p className="text-xs text-stone-500">Seus pedidos realizados ficarão salvos aqui para você acompanhar em tempo real.</p>
                    <button
                      onClick={() => setCurrentTab('cardapio')}
                      className="px-4 py-2.5 rounded-xl bg-[#FF8A00] text-white font-bold text-xs shadow-md cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Ir ao Cardápio</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerOrders.map((ord) => {
                      const totalItemsCount = ord.itens.reduce((acc, it) => acc + it.quantidade, 0);
                      const formattedDate = new Date(ord.criado_em).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const orderTotal = ord.itens.reduce((acc, it) => acc + it.preco_total, 0) + (ord.taxa_entrega || 0);

                      let statusLabel = 'Aguardando Confirmação';
                      let statusBadgeClass = 'bg-amber-500/20 text-amber-500 border-amber-500/30';
                      if (ord.status === 'em_preparo') {
                        statusLabel = '🔥 Em Preparo';
                        statusBadgeClass = 'bg-orange-500/20 text-orange-500 border-orange-500/30 animate-pulse';
                      } else if (ord.status === 'pronto') {
                        statusLabel = '🍕 Pronto';
                        statusBadgeClass = 'bg-blue-500/20 text-blue-500 border-blue-500/30';
                      } else if (ord.status === 'a_caminho') {
                        statusLabel = '🛵 A Caminho';
                        statusBadgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/40 animate-pulse';
                      } else if (ord.status === 'entregue') {
                        statusLabel = '✅ Entregue';
                        statusBadgeClass = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
                      }

                      return (
                        <div
                          key={ord.id}
                          className={`p-4 rounded-2xl border transition shadow-xs ${cardBgClass} space-y-3`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-[#FF8A00]">Pedido #{ord.id}</span>
                                <span className="text-[11px] text-stone-500">• {formattedDate}</span>
                              </div>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                                {ord.tipo_pedido === 'retirada' ? '🛍️ Retirada no Balcão' : `🛵 ${ord.cliente_endereco || 'Entrega'}`}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${statusBadgeClass}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 space-y-1 text-xs">
                            {ord.itens.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px]">
                                <span>{it.quantidade}x {it.nome}</span>
                                <span className="font-mono font-bold text-stone-500">{formatCurrency(it.preco_total)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
                            <div>
                              <span className="text-[10px] text-stone-400 font-bold uppercase block">Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})</span>
                              <span className="font-mono font-black text-sm text-[#FF8A00]">{formatCurrency(orderTotal)}</span>
                            </div>
                            <button
                              onClick={() => handleRepeatOrder(ord)}
                              className="px-3 py-1.5 bg-[#FF8A00] hover:bg-[#E07A00] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Repetir Pedido</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA: FAVORITOS (Expansivo no PC)                         */}
            {/* ======================================================== */}
            {currentTab === 'favoritos' && !searchQuery && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">Meus Favoritos</h2>
                  <span className="text-xs font-bold text-stone-500">{favorites.length} salvos</span>
                </div>

                {favorites.length === 0 ? (
                  <div className="py-16 text-center text-stone-500 p-6 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
                    <Heart className="w-12 h-12 text-stone-300 mx-auto" />
                    <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">Nenhum favorito salvo ainda</h4>
                    <p className="text-xs text-stone-500">Toque no coração de qualquer produto para adicionar à sua lista favorita.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeProducts.filter((p) => favorites.includes(p.id)).map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddRegularProduct(prod)}
                        className={`rounded-2xl p-3 sm:p-3.5 border shadow-xs hover:shadow-md transition-all flex gap-3 cursor-pointer group ${
                          isDarkMode ? 'bg-[#1E1E28] border-stone-800/80' : 'bg-white border-stone-100'
                        }`}
                      >
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                          <img
                            src={prod.imagem || DEFAULT_FOOD_IMG}
                            alt={prod.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-black text-sm text-stone-900 dark:text-white leading-tight line-clamp-1">{prod.nome}</h4>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(prod.id);
                                }}
                                className="p-1 text-red-500 cursor-pointer"
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </button>
                            </div>
                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">{prod.descricao}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[#FF8A00] font-black text-base font-mono">{formatCurrency(prod.preco)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddRegularProduct(prod);
                              }}
                              className="w-8 h-8 rounded-xl bg-[#FF8A00] text-white flex items-center justify-center font-bold"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA: PERFIL                                              */}
            {/* ======================================================== */}
            {currentTab === 'perfil' && !searchQuery && (
              <div className="space-y-4 animate-in fade-in duration-200 max-w-2xl mx-auto">
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">Meu Perfil de Entrega</h2>
                <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${cardBgClass}`}>
                  <div className="flex items-center gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                    <div className="w-12 h-12 rounded-full bg-[#FF8A00]/20 text-[#FF8A00] flex items-center justify-center text-xl font-bold">
                      {clienteNome ? clienteNome.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-stone-900 dark:text-white">{clienteNome || 'Cliente AtendeJá'}</h3>
                      <p className="text-xs text-stone-500">{clienteTelefone || 'Telefone não configurado'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-stone-700 dark:text-stone-300">Seu Nome:</label>
                      <input
                        type="text"
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        placeholder="Nome completo"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${inputBgClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-stone-700 dark:text-stone-300">WhatsApp / Telefone:</label>
                      <input
                        type="text"
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(e.target.value)}
                        placeholder="(11) 98765-4321"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${inputBgClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-stone-700 dark:text-stone-300">Endereço de Entrega Principal:</label>
                      <input
                        type="text"
                        value={clienteEndereco}
                        onChange={(e) => setClienteEndereco(e.target.value)}
                        placeholder="Rua, Número, Apto / Ponto de Referência"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${inputBgClass}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem(
                            CUSTOMER_PROFILE_KEY,
                            JSON.stringify({
                              nome: clienteNome,
                              telefone: clienteTelefone,
                              endereco: clienteEndereco,
                              selectedBairroId,
                              tipoPedido,
                            })
                          );
                          alert('Dados de perfil salvos com sucesso!');
                        } catch {
                          alert('Erro ao salvar perfil.');
                        }
                      }}
                      className="w-full py-3 bg-[#FF8A00] hover:bg-[#E07A00] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Salvar Dados de Entrega
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ======================================================== */}
      {/* BARRA FLUTUANTE DE PEDIDO / SACOLA                       */}
      {/* ======================================================== */}
      {cart.length > 0 && submittedOrderNumber === null && (
        <>
          {/* Mobile Bottom Floating Cart (acima do dock) */}
          <div className="md:hidden fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-3">
            <button
              onClick={() => setShowCartModal(true)}
              className="w-full bg-[#FF8A00] hover:bg-[#E07A00] active:bg-[#C96C00] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm transition cursor-pointer border border-amber-400"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center font-mono font-bold text-xs text-white">
                  {cart.reduce((a, c) => a + c.quantidade, 0)}
                </div>
                <span className="uppercase tracking-wider text-xs">Ver Sacola</span>
              </div>
              <span className="font-mono text-base font-black text-white">
                {formatCurrency(cartTotal)}
              </span>
            </button>
          </div>

          {/* Desktop Floating Cart Pill (canto inferior direito) */}
          <div className="hidden md:flex fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5">
            <button
              onClick={() => setShowCartModal(true)}
              className="bg-[#FF8A00] hover:bg-[#E07A00] active:bg-[#C96C00] text-white p-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-4 font-bold text-sm transition cursor-pointer border border-amber-400"
            >
              <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center font-mono font-black text-sm text-white">
                {cart.reduce((a, c) => a + c.quantidade, 0)}
              </div>
              <div className="text-left">
                <span className="uppercase tracking-wider text-[11px] block text-white/80">Sua Sacola</span>
                <span className="font-mono text-base font-black">{formatCurrency(cartTotal)}</span>
              </div>
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* BARRA DE NAVEGAÇÃO FLUTUANTE INFERIOR (Apenas no Mobile) */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 max-w-md mx-auto bg-white/95 dark:bg-[#1A1A22]/95 backdrop-blur-md rounded-full shadow-2xl border border-stone-200/80 dark:border-stone-800 py-2 px-3 flex justify-around items-center z-40">
        {[
          { tab: 'inicio' as const, label: 'Início', icon: Home },
          { tab: 'cardapio' as const, label: 'Cardápio', icon: Utensils },
          { tab: 'pedidos' as const, label: 'Pedidos', icon: FileText, badge: activeOrder ? '!' : undefined },
          { tab: 'favoritos' as const, label: 'Favoritos', icon: Heart, count: favorites.length },
          { tab: 'perfil' as const, label: 'Perfil', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => {
                setSearchQuery('');
                setCurrentTab(item.tab);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition cursor-pointer relative ${
                isActive ? 'text-[#FF8A00]' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive && item.tab === 'favoritos' ? 'fill-[#FF8A00]' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-stone-900 animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-3.5 h-0.5 bg-[#FF8A00] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Drawer / Modal de Informações do Estabelecimento (Ao clicar no botão hambúrguer) */}
      {showStoreInfoDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl border ${cardBgClass}`}>
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF8A00] text-white flex items-center justify-center font-bold text-sm">
                  {renderStoreIcon('sm')}
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase">{targetLoja.marca || targetLoja.nome}</h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase">{targetLoja.marca ? targetLoja.nome : 'Hamburgueria Artesanal'}</p>
                </div>
              </div>
              <button onClick={() => setShowStoreInfoDrawer(false)} className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900/80 space-y-1">
                <span className="font-bold text-stone-700 dark:text-stone-300 block">📍 Endereço:</span>
                <p className="text-stone-500 dark:text-stone-400">{targetLoja.endereco || 'Atendimento Delivery e Balcão'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900/80 space-y-1">
                <span className="font-bold text-stone-700 dark:text-stone-300 block">⏰ Horário de Funcionamento:</span>
                <p className="text-stone-500 dark:text-stone-400">{storeStatus.horarioFormatado}</p>
                <span className={`inline-block mt-1 font-bold ${storeStatus.isOpen ? 'text-emerald-500' : 'text-red-500'}`}>
                  {storeStatus.isOpen ? '● Aberto agora' : '● Fechado no momento'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900/80 space-y-1">
                <span className="font-bold text-stone-700 dark:text-stone-300 block">🛵 Tempo & Taxa de Entrega:</span>
                <p className="text-stone-500 dark:text-stone-400">
                  Tempo estimado: {targetLoja.tempo_estimado_entrega || '30 - 45 min'} • Taxa: {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}
                </p>
              </div>

              {targetLoja.telefone && (
                <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900/80 space-y-1">
                  <span className="font-bold text-stone-700 dark:text-stone-300 block">📞 Contato / WhatsApp:</span>
                  <a href={`tel:${targetLoja.telefone.replace(/\D/g, '')}`} className="text-[#FF8A00] font-bold hover:underline">
                    {targetLoja.telefone}
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowStoreInfoDrawer(false)}
              className="w-full py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs cursor-pointer"
            >
              Fechar Informações
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1A22] text-stone-900 dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-5 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div>
                <h3 className="text-sm font-bold text-white">Finalizar Pedido — {targetLoja.marca ? `${targetLoja.marca} (${targetLoja.nome})` : targetLoja.nome}</h3>
                <p className="text-xs text-stone-400">Preencha seus dados para a entrega</p>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-1.5 bg-stone-800 text-stone-300 hover:text-white rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items & Form */}
            <form onSubmit={handleConfirmOrder} className="p-5 overflow-y-auto space-y-4 flex-1">
              {profileLoaded && clienteNome && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Seus dados foram preenchidos automaticamente do seu último pedido!</span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2 border-b border-stone-100 dark:border-stone-800 pb-4">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Itens Escolhidos:</h4>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-stone-200 dark:border-stone-800 last:border-0">
                    <div>
                      <span className="font-bold">{item.quantidade}x {item.nome}</span>
                      {item.sabores && item.sabores.length > 0 && (
                        <p className="text-[11px] text-amber-500 font-semibold">{item.sabores.join(' + ')}</p>
                      )}
                      {item.borda && item.borda.nome !== 'Sem borda' && (
                        <p className="text-[10px] text-stone-400">Borda: {item.borda.nome}</p>
                      )}
                      {item.adicionais && item.adicionais.length > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          + {item.adicionais.map((a) => a.nome).join(', ')}
                        </p>
                      )}
                      {item.observacao && (
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 italic">
                          Obs: "{item.observacao}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-500">{formatCurrency(item.preco_total)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-stone-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery vs. Retirada Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Como deseja receber o pedido?
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoPedido('delivery')}
                    className={`p-3 rounded-2xl border-2 text-left font-bold text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      tipoPedido === 'delivery'
                        ? 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200 shadow-xs'
                        : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="text-base">🛵</span>
                    <span>Entrega em Domicílio</span>
                    <span className="text-[10px] font-normal text-stone-500 dark:text-stone-400">
                      Taxa: {targetLoja.taxa_entrega ? formatCurrency(targetLoja.taxa_entrega) : 'Grátis'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoPedido('retirada')}
                    className={`p-3 rounded-2xl border-2 text-left font-bold text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      tipoPedido === 'retirada'
                        ? 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200 shadow-xs'
                        : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="text-base">🛍️</span>
                    <span>Buscar no Local (Retirada)</span>
                    <span className="text-[10px] font-normal text-emerald-600 font-bold">Sem taxa de entrega</span>
                  </button>
                </div>

                {/* Notice for Retirada */}
                {tipoPedido === 'retirada' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <span>📍 Local de Retirada:</span> {targetLoja.nome}
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      {targetLoja.endereco || 'Salão Principal / Balcão'}
                    </p>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-stone-800 dark:text-stone-200">
                      Seu Nome Completo: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      placeholder="Ex: Ana Maria Silva"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${inputBgClass}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-stone-800 dark:text-stone-200">
                      Telefone / WhatsApp: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clienteTelefone}
                      onChange={(e) => setClienteTelefone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${inputBgClass}`}
                    />
                  </div>

                  {tipoPedido === 'delivery' && (
                    <>
                      {/* Seleção de Bairro se a loja possuir taxas por bairro */}
                      {targetLoja.taxas_bairro && targetLoja.taxas_bairro.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold mb-1 text-stone-800 dark:text-stone-200">
                            Selecione seu Bairro / Região: <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={selectedBairroId}
                            onChange={(e) => setSelectedBairroId(e.target.value)}
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold ${inputBgClass}`}
                          >
                            <option value="">Selecione o bairro para ver o valor da entrega...</option>
                            {targetLoja.taxas_bairro.map((tb) => (
                              <option key={tb.id} value={tb.id} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">
                                📍 {tb.bairro} — Frete: {formatCurrency(tb.valor)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold mb-1 text-stone-800 dark:text-stone-200">
                          Endereço de Entrega Completo: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={clienteEndereco}
                          onChange={(e) => setClienteEndereco(e.target.value)}
                          placeholder="Rua, Número, Apto / Ponto de Referência"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${inputBgClass}`}
                        />
                      </div>
                    </>
                  )}

                  {/* Visual Payment Methods */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                      Forma de Pagamento: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormaPagamento('pix')}
                        className={`p-2.5 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          formaPagamento === 'pix'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                            : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span>⚡</span>
                        <span>PIX na Entrega</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormaPagamento('dinheiro')}
                        className={`p-2.5 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          formaPagamento === 'dinheiro'
                            ? 'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                            : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span>💵</span>
                        <span>Dinheiro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormaPagamento('debito')}
                        className={`p-2.5 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          formaPagamento === 'debito'
                            ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200'
                            : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span>💳</span>
                        <span>Débito (Cartão)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormaPagamento('credito')}
                        className={`p-2.5 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          formaPagamento === 'credito'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200'
                            : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span>💳</span>
                        <span>Crédito (Cartão)</span>
                      </button>
                    </div>

                    {formaPagamento === 'dinheiro' && (
                      <div className="pt-1">
                        <label className="block text-xs font-bold mb-1 text-amber-900 dark:text-amber-300">
                          Troco para quanto? (Deixe em branco se não precisar de troco):
                        </label>
                        <input
                          type="text"
                          value={trocoPara}
                          onChange={(e) => setTrocoPara(e.target.value)}
                          placeholder="Ex: R$ 50,00 ou 100,00"
                          className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold ${inputBgClass}`}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-stone-800 dark:text-stone-200">
                      Observações do Pedido (Opcional):
                    </label>
                    <input
                      type="text"
                      value={observacaoGeral}
                      onChange={(e) => setObservacaoGeral(e.target.value)}
                      placeholder="Ex: Sem cebola, tocar campainha..."
                      className={`w-full px-3.5 py-2 rounded-xl text-xs ${inputBgClass}`}
                    />
                  </div>
                </div>
              </div>

              {/* Total Breakdown */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-1 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Taxa de Entrega:</span>
                  <span className="font-mono">{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total Final:</span>
                  <span className="font-mono text-amber-500">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              {/* LGPD Consent Disclaimer */}
              <div className="p-3 bg-stone-100/80 dark:bg-stone-800/80 rounded-xl border border-stone-200/90 dark:border-stone-700/80 text-[11px] text-stone-600 dark:text-stone-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacidade & LGPD:</strong> Seus dados de contato e endereço são utilizados exclusivamente para o preparo e entrega deste pedido por este estabelecimento.
                </span>
              </div>

              <button
                type="submit"
                disabled={!storeStatus.isOpen}
                className={`w-full py-3.5 font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                  !storeStatus.isOpen
                    ? 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {!storeStatus.isOpen
                    ? `LOJA FECHADA NO MOMENTO (${storeStatus.horarioFormatado})`
                    : 'ENVIAR PEDIDO DE DELIVERY'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pizza Customizer Modal (Handles 2+ flavors meio-a-meio, crusts & doughs) */}
      {selectedPizza && (
        <PizzaCustomizerModal
          baseProduct={selectedPizza}
          onClose={() => setSelectedPizza(null)}
          onConfirm={handleAddPizzaToCart}
        />
      )}

      {/* Modal de Adicionais & Personalização de Burgers, Lanches e Porções */}
      {selectedBurgerOrItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1A22] text-stone-900 dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Header com imagem */}
            <div className="relative h-44 sm:h-48 w-full bg-stone-800 overflow-hidden shrink-0">
              <img
                src={selectedBurgerOrItem.imagem || DEFAULT_FOOD_IMG}
                alt={selectedBurgerOrItem.nome}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                }}
              />
              <button
                onClick={() => setSelectedBurgerOrItem(null)}
                className="absolute top-3 right-3 p-2 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full backdrop-blur-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-3 bg-stone-900/85 text-amber-400 font-mono font-black text-sm px-3 py-1 rounded-xl backdrop-blur-xs">
                Base: {formatCurrency(selectedBurgerOrItem.preco)}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white">
                  {selectedBurgerOrItem.nome}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  {selectedBurgerOrItem.descricao}
                </p>
              </div>

              {/* Lista de Adicionais */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <span>Turbine seu pedido (Adicionais)</span>
                  <span className="text-[10px] text-stone-400 lowercase font-normal">opcional</span>
                </div>

                <div className="space-y-2">
                  {availableAddonsForCurrentItem.map((addon) => {
                    const isSelected = selectedItemAddons.some((a) => a.id === addon.id);
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
                                setSelectedItemAddons((prev) => prev.filter((a) => a.id !== addon.id));
                              } else {
                                setSelectedItemAddons((prev) => [...prev, addon]);
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
                  value={itemModalObs}
                  onChange={(e) => setItemModalObs(e.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne, sem picles, molho à parte..."
                  className={`w-full p-3 rounded-2xl text-xs resize-none h-16 ${inputBgClass}`}
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
                    onClick={() => setItemModalQtd((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white font-bold flex items-center justify-center hover:bg-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-sm w-4 text-center">
                    {itemModalQtd}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemModalQtd((q) => q + 1)}
                    className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white font-bold flex items-center justify-center hover:bg-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <button
                type="button"
                onClick={handleConfirmCustomItem}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-between cursor-pointer"
              >
                <span>Adicionar à Sacola</span>
                <span className="font-mono">
                  {formatCurrency(
                    (selectedBurgerOrItem.preco + selectedItemAddons.reduce((a, c) => a + c.preco, 0)) * itemModalQtd
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBurgerOrItem(null)}
                className="w-full py-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Voltar ao Cardápio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico de Pedidos ("Meus Pedidos") */}
      {showOrderHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1A22] text-stone-900 dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Meus Pedidos</h3>
                  <p className="text-[11px] text-stone-400">
                    Histórico salvo neste aparelho com status em tempo real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderHistoryModal(false)}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Orders List Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {customerOrders.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-2xl">
                    🍕
                  </div>
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    Nenhum pedido encontrado neste aparelho
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                    Assim que você enviar seu primeiro pedido pelo cardápio, ele ficará salvo aqui com status em tempo real e você poderá repeti-lo com apenas 1 clique!
                  </p>
                  <button
                    onClick={() => setShowOrderHistoryModal(false)}
                    className="mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Ver Cardápio
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((ord) => {
                    const orderDate = new Date(ord.criado_em);
                    const formattedDate = isNaN(orderDate.getTime())
                      ? 'Hoje'
                      : `${orderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

                    const totalItemsCount = ord.itens.reduce((acc, it) => acc + it.quantidade, 0);
                    const orderTotal = ord.itens.reduce((acc, it) => acc + it.preco_total, 0) + (ord.taxa_entrega || 0);

                    // Status Badge config
                    let statusLabel = 'Aguardando Confirmação';
                    let statusBadgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                    let statusDotClass = 'bg-amber-400';

                    if (ord.status === 'em_preparo') {
                      statusLabel = '🔥 No Forno / Em Preparo';
                      statusBadgeClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                      statusDotClass = 'bg-orange-400 animate-pulse';
                    } else if (ord.status === 'pronto') {
                      statusLabel = '🍕 Pronto para Entrega';
                      statusBadgeClass = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                      statusDotClass = 'bg-blue-400';
                    } else if (ord.status === 'a_caminho') {
                      statusLabel = '🛵 Saiu para Entrega';
                      statusBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse';
                      statusDotClass = 'bg-purple-400';
                    } else if (ord.status === 'entregue') {
                      statusLabel = '✅ Entregue com Sucesso';
                      statusBadgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                      statusDotClass = 'bg-emerald-400';
                    } else if (ord.status === 'cancelado') {
                      statusLabel = '❌ Cancelado';
                      statusBadgeClass = 'bg-red-500/20 text-red-400 border-red-500/30';
                      statusDotClass = 'bg-red-400';
                    }

                    return (
                      <div
                        key={ord.id}
                        className={`p-4 rounded-2xl border transition shadow-2xs ${cardBgClass} space-y-3`}
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-red-600 dark:text-red-400">
                                Pedido #{ord.id}
                              </span>
                              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                                • {formattedDate}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                              {ord.tipo_pedido === 'retirada' ? '🛍️ Retirada no Balcão' : `🛵 ${ord.cliente_endereco || 'Entrega em domicílio'}`}
                            </p>
                          </div>

                          <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 shrink-0 ${statusBadgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                            <span>{statusLabel}</span>
                          </div>
                        </div>

                        {/* Items preview */}
                        <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-1 text-xs">
                          {ord.itens.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px]">
                              <span className="font-medium text-stone-800 dark:text-stone-200">
                                {it.quantidade}x {it.nome}
                                {it.sabores && it.sabores.length > 0 && (
                                  <span className="text-amber-500 ml-1">({it.sabores.join(' + ')})</span>
                                )}
                              </span>
                              <span className="font-mono text-stone-500 dark:text-stone-400">
                                {formatCurrency(it.preco_total)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer: Total & Repeat Button */}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">
                              Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})
                            </span>
                            <span className="font-mono font-black text-sm text-amber-500">
                              {formatCurrency(orderTotal)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRepeatOrder(ord)}
                            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                            title="Adicionar todos os itens deste pedido ao carrinho e finalizar"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Repetir Pedido</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
