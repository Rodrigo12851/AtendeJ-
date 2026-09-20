import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, OrderItem, Loja } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { PizzaCustomizerModal } from '../garcom/PizzaCustomizerModal';

interface CustomerDeliveryViewProps {
  lojaSlug: string;
}

export const CustomerDeliveryView: React.FC<CustomerDeliveryViewProps> = ({ lojaSlug }) => {
  const { lojas, allProducts, categories, createDeliveryOrder, isDarkMode, setDarkMode } = useStore();

  // Bairro Selecionado State
  const [selectedBairroId, setSelectedBairroId] = useState<string>('');

  // Search Query State
  const [searchQuery, setSearchQuery] = useState('');

  // Find store by slug or fallback, with query param overrides for external devices
  const targetLoja: Loja = useMemo(() => {
    const found =
      lojas.find((l) => l.slug.toLowerCase() === lojaSlug.toLowerCase()) ||
      lojas.find((l) => l.id === lojaSlug) ||
      lojas[0];

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

  // Set document title to brand name
  React.useEffect(() => {
    const brandDisplay = targetLoja.marca ? `${targetLoja.marca} - ${targetLoja.nome}` : targetLoja.nome;
    document.title = `${brandDisplay} | Cardápio Digital & Delivery`;
  }, [targetLoja]);

  // Products belonging to this store
  const storeProducts = useMemo(() => {
    return allProducts.filter((p) => !p.loja_id || p.loja_id === targetLoja.id);
  }, [allProducts, targetLoja]);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<string>('pizzas');

  // Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState<Product | null>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);

  // Checkout Form State
  const [tipoPedido, setTipoPedido] = useState<'delivery' | 'retirada'>('delivery');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [trocoPara, setTrocoPara] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState<number | null>(null);

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

  // Special Offer Product for Banner
  const specialOfferProduct = useMemo(() => {
    return storeProducts.find((p) => p.isPizza && p.destaque) || storeProducts[0];
  }, [storeProducts]);

  // Add regular product directly to cart
  const handleAddRegularProduct = (product: Product) => {
    if (product.isPizza || product.permitirTamanhos || product.permitirBordas) {
      setSelectedPizza(product);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.produto_id === product.id);
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

    setSubmittedOrderNumber(newOrder.id);
    setCart([]);
    setShowCartModal(false);
  };

  // Theme Classes
  const bgClass = isDarkMode ? 'bg-[#121216] text-white' : 'bg-[#FAF7F2] text-stone-900 dark:text-slate-100';
  const cardBgClass = isDarkMode ? 'bg-[#1A1A22] border-stone-800' : 'bg-white border-stone-200';
  const inputBgClass = isDarkMode
    ? 'bg-[#242430] border-2 border-stone-600 text-white placeholder-stone-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'bg-white border-2 border-stone-300 text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/20 shadow-2xs';
  const headerBgClass = isDarkMode ? 'bg-[#181820] border-stone-800' : 'bg-stone-900 text-white border-stone-800';

  return (
    <div className={`min-h-screen font-sans pb-28 transition-colors duration-200 ${bgClass}`}>
      {/* Top Delivery Header */}
      <header className={`sticky top-0 z-30 shadow-md border-b px-4 py-3.5 ${headerBgClass}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden">
              {targetLoja.logo_url ? (
                <img
                  src={targetLoja.logo_url}
                  alt={targetLoja.marca || targetLoja.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Pizza className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  🛵 Delivery Online
                </span>
                <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Loja Aberta
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                {targetLoja.marca ? (
                  <>
                    <span>{targetLoja.marca}</span>
                    <span className="text-xs sm:text-sm font-medium text-stone-400 ml-2">
                      ({targetLoja.nome})
                    </span>
                  </>
                ) : (
                  targetLoja.nome
                )}
              </h1>
              <p className="text-xs text-stone-400 flex flex-wrap items-center gap-2">
                <span>📍 {targetLoja.endereco || 'Atendimento Delivery'}</span>
                <span>•</span>
                <span>📞 {targetLoja.telefone}</span>
              </p>
            </div>
          </div>

          {/* Right Header Stats & Theme Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
            <div className="flex items-center gap-3 bg-stone-950/80 px-3 py-1.5 rounded-2xl border border-stone-800 text-xs font-semibold">
              <div>
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Taxa de Entrega</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}
                </span>
              </div>
              <div className="border-l border-stone-800 pl-3">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Tempo Estimado</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {targetLoja.tempo_estimado_entrega || '30 - 45 min'}
                </span>
              </div>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-300 transition cursor-pointer border border-stone-700 shadow-2xs"
              title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-300" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 pt-5 space-y-6">
        {/* Search Bar (Estilo Gama's Burger) */}
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquise por pizza, sabor, bebida, porção ou sobremesa..."
            className={`w-full pl-12 pr-4 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold shadow-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 transition ${inputBgClass}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
            >
              Limpar ✕
            </button>
          )}
        </div>

        {/* Order Submitted Success View */}
        {submittedOrderNumber !== null ? (
          <div className={`p-8 rounded-3xl border shadow-xl text-center space-y-4 max-w-md mx-auto my-8 animate-in zoom-in-95 ${cardBgClass}`}>
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black">Pedido Recebido com Sucesso!</h2>
            <p className="text-xs text-stone-500">
              Seu pedido <span className="font-mono font-bold text-red-600">#{submittedOrderNumber}</span> foi enviado diretamente para a cozinha da <strong className="text-stone-900 dark:text-white">{targetLoja.marca ? `${targetLoja.marca} - ${targetLoja.nome}` : targetLoja.nome}</strong>.
            </p>
            <div className={`p-4 rounded-2xl text-xs text-left space-y-1 font-medium ${isDarkMode ? 'bg-stone-900' : 'bg-stone-50'}`}>
              <p>📍 {clienteEndereco}</p>
              <p>📞 {clienteNome} — {clienteTelefone}</p>
              <p>💰 Forma: <span className="uppercase font-bold">{formaPagamento}</span></p>
            </div>
            <button
              onClick={() => setSubmittedOrderNumber(null)}
              className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Fazer Outro Pedido
            </button>
          </div>
        ) : (
          <>
            {/* Promotional Banner (Oferta do Dia - Estilo Gama's Burger Reference) */}
            {specialOfferProduct && !searchQuery && (
              <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-red-900 via-red-800 to-amber-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-red-700/50">
                <div className="space-y-3 z-10 max-w-md">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-red-700" />
                    OFERTA DO DIA DE HOJE
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    {specialOfferProduct.nome}
                  </h2>
                  <p className="text-xs text-red-100/90 line-clamp-2">
                    {specialOfferProduct.descricao}
                  </p>
                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300">
                      {formatCurrency(specialOfferProduct.preco)}
                    </span>
                    <span className="text-xs font-mono line-through text-red-300/80">
                      {formatCurrency(specialOfferProduct.preco * 1.2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddRegularProduct(specialOfferProduct)}
                    className="mt-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span>{specialOfferProduct.isPizza ? 'PEÇA AGORA (ESCOLHER SABORES)' : 'ADICIONAR DA PROMOÇÃO'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative shrink-0 w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                  <img
                    src={specialOfferProduct.imagem || 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600'}
                    alt={specialOfferProduct.nome}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                </div>
              </div>
            )}

            {/* Circular Category Buttons (Estilo Gama's Burger Reference Image) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Categorias do Cardápio:
              </h3>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setActiveCategory('todos')}
                  className={`flex flex-col items-center gap-1.5 shrink-0 transition cursor-pointer ${
                    activeCategory === 'todos' ? 'scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-md border-2 ${
                      activeCategory === 'todos'
                        ? 'bg-red-600 border-red-500 text-white ring-4 ring-red-500/20'
                        : isDarkMode
                        ? 'bg-[#1E1E28] border-stone-700 text-stone-300'
                        : 'bg-white border-stone-200 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    🍽️
                  </div>
                  <span className="text-[11px] font-bold">Todos</span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex flex-col items-center gap-1.5 shrink-0 transition cursor-pointer ${
                      activeCategory === cat.id ? 'scale-105' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-md border-2 ${
                        activeCategory === cat.id
                          ? 'bg-red-600 border-red-500 text-white ring-4 ring-red-500/20'
                          : isDarkMode
                          ? 'bg-[#1E1E28] border-stone-700 text-stone-300'
                          : 'bg-white border-stone-200 text-stone-700 dark:text-slate-300'
                      }`}
                    >
                      {cat.icone}
                    </div>
                    <span className="text-[11px] font-bold tracking-tight">{cat.nome}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section: "Mais Pedidos" (Featured Vertical Gallery Cards with Top Photos) */}
            {!searchQuery && activeCategory === 'pizzas' && featuredProducts.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-black tracking-tight uppercase flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-600" />
                    Mais Pedidos da Casa
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {featuredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className={`rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group ${cardBgClass}`}
                    >
                      <div className="relative h-32 sm:h-36 overflow-hidden bg-stone-800">
                        <img
                          src={prod.imagem || 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600'}
                          alt={prod.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <button
                          onClick={() => toggleFavorite(prod.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-900/70 text-white hover:text-red-500 transition cursor-pointer backdrop-blur-xs"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              favorites.includes(prod.id) ? 'fill-red-500 text-red-500' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold leading-tight line-clamp-1">
                            {prod.nome}
                          </h4>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">
                            {prod.descricao}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                          <span className="text-sm font-mono font-black text-amber-500">
                            {formatCurrency(prod.preco)}
                          </span>
                          <button
                            onClick={() => handleAddRegularProduct(prod)}
                            className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Product Grid with Photos & Meio-a-Meio Customizer */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight uppercase">
                {activeCategory === 'todos' ? 'Cardápio Completo' : `Itens de ${activeCategory.toUpperCase()}`}
              </h3>

              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-stone-500">
                  <p className="text-xs font-semibold">Nenhum produto encontrado para sua busca.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col sm:flex-row justify-between p-3 gap-3 ${cardBgClass}`}
                    >
                      {/* Product Photo */}
                      <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-stone-800">
                        <img
                          src={product.imagem || 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600'}
                          alt={product.nome}
                          className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        />
                        {product.isPizza && (
                          <span className="absolute bottom-1 left-1 bg-amber-500 text-stone-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                            Meio a Meio 🍕
                          </span>
                        )}
                      </div>

                      {/* Product Details & Actions */}
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold leading-tight">
                              {product.nome}
                            </h4>
                            <button
                              onClick={() => toggleFavorite(product.id)}
                              className="text-stone-400 hover:text-red-500 cursor-pointer"
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  favorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''
                                }`}
                              />
                            </button>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                            {product.descricao}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                          <span className="text-sm sm:text-base font-mono font-black text-amber-500">
                            {formatCurrency(product.preco)}
                          </span>

                          <button
                            onClick={() => handleAddRegularProduct(product)}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{product.isPizza ? 'Escolher Sabores' : 'Adicionar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && submittedOrderNumber === null && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <button
            onClick={() => setShowCartModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-sm transition cursor-pointer border border-red-500 animate-in slide-in-from-bottom-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-mono font-bold text-white">
                {cart.reduce((a, c) => a + c.quantidade, 0)}
              </div>
              <span className="uppercase tracking-wider text-xs">Ver Meu Pedido</span>
            </div>
            <span className="font-mono text-base font-black text-amber-300">
              {formatCurrency(cartTotal)}
            </span>
          </button>
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

              <button
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>ENVIAR PEDIDO DE DELIVERY</span>
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
    </div>
  );
};
