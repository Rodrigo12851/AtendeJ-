import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
  Check,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { Product, OrderItem, Category, ItemAddon } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { playAddPop } from '../../utils/audio';
import { PizzaCustomizerModal } from './PizzaCustomizerModal';

const DEFAULT_FOOD_IMG = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80';

const DEFAULT_BURGER_ADDONS: ItemAddon[] = [
  { id: 'add_bacon', nome: 'Bacon Crocante Extra', preco: 5.0 },
  { id: 'add_cheddar', nome: 'Cheddar Cremoso Melt', preco: 4.5 },
  { id: 'add_smash', nome: 'Smash Burger 90g Extra', preco: 8.5 },
  { id: 'add_cebola', nome: 'Cebola Caramelizada', preco: 3.5 },
  { id: 'add_maionese', nome: 'Maionese Especial da Casa', preco: 3.0 },
  { id: 'add_ovo', nome: 'Ovo Frito na Manteiga', preco: 3.0 },
];

const DEFAULT_PORTION_ADDONS: ItemAddon[] = [
  { id: 'add_queijo', nome: 'Queijo Parmesão / Ralado Extra', preco: 5.0 },
  { id: 'add_bacon_cubos', nome: 'Farofa de Bacon Crocante', preco: 6.0 },
  { id: 'add_cheddar_dose', nome: 'Dose Extra de Cheddar Cremoso', preco: 5.0 },
  { id: 'add_molho_especial', nome: 'Pote de Molho Especial (Gourmet)', preco: 4.0 },
];

interface CardapioGarcomProps {
  mesaNumero: number;
  comandaNumero: string;
  categories: Category[];
  products: Product[];
  cartItems: OrderItem[];
  onBack: () => void;
  onAddToCart: (item: OrderItem) => void;
  onUpdateCartQuantity?: (index: number, newQty: number) => void;
  onRemoveCartItem?: (index: number) => void;
  onOpenCart: () => void;
}

export const CardapioGarcom: React.FC<CardapioGarcomProps> = ({
  mesaNumero,
  comandaNumero,
  categories,
  products,
  cartItems,
  onBack,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveCartItem,
  onOpenCart,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [layoutMode, setLayoutMode] = useState<'cards' | 'compact'>('cards');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  
  // Customization of burgers, snacks and portions with addons
  const [customizingAddonProduct, setCustomizingAddonProduct] = useState<Product | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<ItemAddon[]>([]);
  const [customObs, setCustomObs] = useState('');
  const [customQty, setCustomQty] = useState(1);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 1500);
  };

  // Check if product allows addons (burgers, lanches, porções)
  const productHasAddons = (prod: Product) => {
    if (prod.isPizza) return false;
    const cat = categories.find((c) => c.id === prod.categoria_id);
    const catName = (cat?.nome || '').toLowerCase();
    const prodCat = (prod.categoria_id || '').toLowerCase();
    const prodName = prod.nome.toLowerCase();
    return (
      prodCat.includes('hamburg') ||
      prodCat.includes('burger') ||
      prodCat.includes('lanche') ||
      prodCat.includes('porco') ||
      prodCat.includes('porção') ||
      catName.includes('hamburg') ||
      catName.includes('burger') ||
      catName.includes('lanche') ||
      catName.includes('porç') ||
      prodName.includes('burger') ||
      prodName.includes('burguer') ||
      prodName.includes('lanche') ||
      prodName.includes('batata') ||
      prodName.includes('porção')
    );
  };

  const getAvailableAddonsForProduct = (prod: Product): ItemAddon[] => {
    const cat = categories.find((c) => c.id === prod.categoria_id);
    const catName = (cat?.nome || '').toLowerCase();
    const prodCat = (prod.categoria_id || '').toLowerCase();
    if (prodCat.includes('porco') || prodCat.includes('porção') || catName.includes('porç')) {
      return DEFAULT_PORTION_ADDONS;
    }
    return DEFAULT_BURGER_ADDONS;
  };

  const handleOpenAddonCustomizer = (prod: Product) => {
    setCustomizingAddonProduct(prod);
    setSelectedAddons([]);
    setCustomObs('');
    setCustomQty(1);
  };

  const handleConfirmCustomAddonItem = () => {
    if (!customizingAddonProduct) return;
    const extrasTotal = selectedAddons.reduce((acc, curr) => acc + curr.preco, 0);
    const precoBase = customizingAddonProduct.em_promocao && customizingAddonProduct.preco_promocional
      ? customizingAddonProduct.preco_promocional
      : customizingAddonProduct.preco;
    const precoUnitarioTotal = precoBase + extrasTotal;
    const precoTotal = precoUnitarioTotal * customQty;

    const newItem: OrderItem = {
      id: `item_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      produto_id: customizingAddonProduct.id,
      nome: customizingAddonProduct.nome,
      quantidade: customQty,
      preco_unitario: precoUnitarioTotal,
      preco_total: precoTotal,
      adicionais: selectedAddons.length > 0 ? selectedAddons : undefined,
      observacao: customObs.trim() || undefined,
      status: 'ativo',
    };

    onAddToCart(newItem);
    playAddPop();
    showToast(`${customQty}x ${customizingAddonProduct.nome} adicionado!`);
    setCustomizingAddonProduct(null);
    setSelectedAddons([]);
    setCustomObs('');
    setCustomQty(1);
  };

  // Filter products based on search term or category
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      return products.filter(
        (p) =>
          p.ativo &&
          (p.nome.toLowerCase().includes(term) ||
            p.descricao?.toLowerCase().includes(term) ||
            p.codigo_interno?.toLowerCase().includes(term))
      );
    }
    if (activeCategory === 'todas') {
      return products.filter((p) => p.ativo);
    }
    return products.filter((p) => p.ativo && p.categoria_id === activeCategory);
  }, [products, activeCategory, searchTerm]);

  // Helper to find simple items in cart (not customized pizzas/addons)
  const getCartInfoForProduct = (productId: string) => {
    const matchingIndices: number[] = [];
    let totalQty = 0;
    cartItems.forEach((it, idx) => {
      if (it.produto_id === productId) {
        matchingIndices.push(idx);
        totalQty += it.quantidade;
      }
    });
    return {
      inCart: totalQty > 0,
      totalQty,
      firstIndex: matchingIndices.length > 0 ? matchingIndices[0] : -1,
    };
  };

  const handleQuickAdd = (product: Product) => {
    if (product.isPizza) {
      setCustomizingProduct(product);
      return;
    }

    if (productHasAddons(product)) {
      handleOpenAddonCustomizer(product);
      return;
    }

    playAddPop();
    const cartInfo = getCartInfoForProduct(product.id);

    // If item is already in cart and handler is available, increment quantity
    if (cartInfo.inCart && onUpdateCartQuantity && cartInfo.firstIndex >= 0) {
      onUpdateCartQuantity(cartInfo.firstIndex, cartInfo.totalQty + 1);
      showToast(`+1 ${product.nome}`);
      return;
    }

    const finalPrice = product.em_promocao && product.preco_promocional ? product.preco_promocional : product.preco;
    const orderItem: OrderItem = {
      id: `item_quick_${Date.now()}_${Math.random()}`,
      produto_id: product.id,
      nome: product.nome,
      quantidade: 1,
      preco_unitario: finalPrice,
      preco_total: finalPrice,
      status: 'ativo',
    };
    onAddToCart(orderItem);
    showToast(`+1 ${product.nome}`);
  };

  const handleQuickDecrease = (product: Product) => {
    const cartInfo = getCartInfoForProduct(product.id);
    if (!cartInfo.inCart || cartInfo.firstIndex < 0) return;

    if (cartInfo.totalQty > 1 && onUpdateCartQuantity) {
      onUpdateCartQuantity(cartInfo.firstIndex, cartInfo.totalQty - 1);
      showToast(`-1 ${product.nome}`);
    } else if (onRemoveCartItem) {
      onRemoveCartItem(cartInfo.firstIndex);
      showToast(`Removido: ${product.nome}`);
    }
  };

  const handleConfirmCustomPizza = (item: OrderItem) => {
    onAddToCart(item);
    setCustomizingProduct(null);
    showToast(`Pizza ${item.nome} adicionada!`);
  };

  const cartTotal = cartItems.reduce((sum, it) => sum + it.preco_total, 0);
  const cartItemCount = cartItems.reduce((sum, it) => sum + it.quantidade, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-stone-900 dark:text-slate-100 pb-28">
      {/* Quick Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white border border-stone-700 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Compact Header for Mobile & Desktop */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white border-b border-stone-800 shadow-md">
        {/* Main Header Row */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-stone-200 border border-stone-700 bg-stone-800 hover:bg-stone-700 py-1.5 px-2.5 rounded-lg transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Mesas</span>
          </button>

          <div className="text-center min-w-0">
            <div className="flex items-center gap-1.5 justify-center">
              <span className="bg-red-600 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-md uppercase shrink-0">
                MESA {mesaNumero.toString().padStart(2, '0')}
              </span>
              <span className="font-mono text-amber-300 text-xs font-bold tracking-wider truncate">
                {comandaNumero}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle: Cards vs Compact */}
            <div className="flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700">
              <button
                type="button"
                onClick={() => setLayoutMode('compact')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  layoutMode === 'compact'
                    ? 'bg-[#FF8A00] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Visualização Compacta (Lista Rápida)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('cards')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  layoutMode === 'cards'
                    ? 'bg-[#FF8A00] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cart Button with Counter */}
            <button
              onClick={onOpenCart}
              className="relative p-2 border border-stone-700 bg-stone-800 text-white hover:bg-stone-700 rounded-lg transition cursor-pointer"
              title="Abrir Carrinho da Mesa"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center rounded-full border-2 border-stone-900 animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Compact Search Bar */}
        <div className="px-3 sm:px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou código..."
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-stone-800 text-white placeholder-stone-400 text-xs rounded-lg border border-stone-700 focus:outline-hidden focus:border-red-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs uppercase text-stone-400 hover:text-white cursor-pointer px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Carousel (Pílulas arredondadas estilo cardápio do cliente) */}
        {!searchTerm && (
          <div className="flex gap-1.5 overflow-x-auto px-3 sm:px-4 pb-2.5 no-scrollbar scrollbar-none">
            <button
              onClick={() => setActiveCategory('todas')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                activeCategory === 'todas'
                  ? 'bg-[#FF8A00] text-white border-[#FF8A00] shadow-xs'
                  : 'bg-stone-800 text-stone-300 border-stone-700/80 hover:bg-stone-700'
              }`}
            >
              Todas
            </button>

            {categories
              .filter((c) => c.ativo !== false)
              .sort((a, b) => a.ordem - b.ordem)
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#FF8A00] text-white border-[#FF8A00] shadow-xs'
                      : 'bg-stone-800 text-stone-300 border-stone-700/80 hover:bg-stone-700'
                  }`}
                >
                  {cat.icone && <span>{cat.icone}</span>}
                  <span>{cat.nome}</span>
                </button>
              ))}
          </div>
        )}
      </header>

      {/* Main Content Area: Cards Mode vs Compact List Mode */}
      <main className="p-3 sm:p-5 max-w-[1920px] mx-auto w-full flex-1">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-stone-500 space-y-2 p-6 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800">
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum produto encontrado.</p>
            <p className="text-xs text-stone-400">Tente pesquisar outro termo ou categoria.</p>
          </div>
        ) : layoutMode === 'compact' ? (
          /* ========================================================== */
          /* MODO COMPACTO (LISTA RÁPIDA: 2 COLUNAS NO COMPUTADOR)     */
          /* ========================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
            {filteredProducts.map((product) => {
              const cartInfo = getCartInfoForProduct(product.id);
              const finalPrice = product.em_promocao && product.preco_promocional ? product.preco_promocional : product.preco;
              const hasAddons = productHasAddons(product);

              return (
                <div
                  key={product.id}
                  onClick={() => handleQuickAdd(product)}
                  className={`bg-white dark:bg-[#1E1E28] rounded-xl border border-stone-200/90 dark:border-stone-800 shadow-2xs p-2.5 sm:p-3 flex items-center justify-between gap-2.5 hover:bg-stone-50/80 dark:hover:bg-stone-800/50 hover:border-amber-400/60 dark:hover:border-amber-500/60 transition cursor-pointer ${
                    cartInfo.inCart ? 'bg-amber-50/50 dark:bg-amber-950/20 border-[#FF8A00] ring-1 ring-[#FF8A00]/30' : ''
                  }`}
                >
                  {/* Foto Mini e Nome */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                      <img
                        src={product.imagem || DEFAULT_FOOD_IMG}
                        alt={product.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                          {product.nome}
                        </span>
                        {product.destaque && <span className="text-xs">🔥</span>}
                        {product.isPizza && (
                          <span className="text-[9px] font-black bg-[#FF8A00] text-white px-1.5 py-0.2 rounded-md uppercase">
                            Pizza
                          </span>
                        )}
                        {hasAddons && (
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-400/40 px-1.5 py-0.2 rounded-md uppercase">
                            Adicionais
                          </span>
                        )}
                        {product.codigo_interno && (
                          <span className="text-[9px] font-mono text-stone-400">
                            #{product.codigo_interno}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-black text-xs sm:text-sm text-[#FF8A00]">
                          {formatCurrency(finalPrice)}
                        </span>
                        {product.em_promocao && product.preco_promocional && (
                          <span className="font-mono text-[10px] line-through text-stone-400">
                            {formatCurrency(product.preco)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas no Modo Compacto */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {product.isPizza ? (
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(product)}
                        className="px-2.5 py-1.5 bg-[#FF8A00] hover:bg-[#E07A00] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
                      >
                        <span>Montar</span>
                        {cartInfo.inCart && (
                          <span className="bg-stone-950 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ml-0.5">
                            {cartInfo.totalQty}
                          </span>
                        )}
                      </button>
                    ) : hasAddons ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAddonCustomizer(product)}
                        className="relative w-8 h-8 rounded-xl bg-[#FF8A00] hover:bg-[#E07A00] text-white font-bold flex items-center justify-center transition shadow-xs active:scale-90 cursor-pointer"
                        title="Personalizar adicionais"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        {cartInfo.inCart && (
                          <span className="absolute -top-1.5 -right-1.5 bg-stone-950 text-white text-[10px] min-w-4 h-4 px-1 rounded-full font-mono font-bold flex items-center justify-center border border-white dark:border-stone-900 shadow-xs">
                            {cartInfo.totalQty}
                          </span>
                        )}
                      </button>
                    ) : cartInfo.inCart ? (
                      <div className="flex items-center bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleQuickDecrease(product)}
                          className="w-7 h-7 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-lg flex items-center justify-center font-bold text-xs hover:bg-stone-50 active:scale-95 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-stone-900 dark:text-white">
                          {cartInfo.totalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          className="w-7 h-7 bg-[#FF8A00] text-white rounded-lg flex items-center justify-center font-bold text-xs hover:bg-[#E07A00] active:scale-95 transition cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(product)}
                        className="w-8 h-8 rounded-xl bg-[#FF8A00] hover:bg-[#E07A00] text-white font-bold flex items-center justify-center transition shadow-xs active:scale-90 cursor-pointer"
                        title="Adicionar ao pedido"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================== */
          /* MODO CARDS (ESTILO CARDÁPIO DO CLIENTE COM FOTO E DETALHE) */
          /* ========================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredProducts.map((product) => {
              const cartInfo = getCartInfoForProduct(product.id);
              const finalPrice = product.em_promocao && product.preco_promocional ? product.preco_promocional : product.preco;
              const hasAddons = productHasAddons(product);

              return (
                <div
                  key={product.id}
                  onClick={() => handleQuickAdd(product)}
                  className={`rounded-2xl p-3.5 sm:p-4 border shadow-xs hover:shadow-md transition-all flex gap-3.5 cursor-pointer group relative bg-white border-stone-200/90 dark:bg-[#1E1E28] dark:border-stone-800 ${
                    cartInfo.inCart ? 'border-[#FF8A00] ring-2 ring-[#FF8A00]/25' : ''
                  }`}
                >
                  {/* Foto generosa quadrada à esquerda com cantos arredondados */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
                    <img
                      src={product.imagem || DEFAULT_FOOD_IMG}
                      alt={product.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                      }}
                    />
                    {product.isPizza && (
                      <span className="absolute bottom-1 left-1 bg-[#FF8A00] text-white font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase shadow-xs">
                        Pizza
                      </span>
                    )}
                    {hasAddons && (
                      <span className="absolute bottom-1 left-1 bg-amber-500 text-stone-950 font-black text-[8px] px-1.5 py-0.5 rounded-md uppercase shadow-xs">
                        Adicionais
                      </span>
                    )}
                    {product.em_promocao && (
                      <span className="absolute top-1 left-1 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase shadow-xs">
                        PROMO
                      </span>
                    )}
                  </div>

                  {/* Informações à direita */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-black text-sm sm:text-base text-stone-900 dark:text-white leading-tight line-clamp-2 flex items-center gap-1">
                          <span className="truncate">{product.nome}</span>
                          {product.destaque && <span className="shrink-0 text-xs">🔥</span>}
                        </h4>
                        {product.codigo_interno && (
                          <span className="text-[10px] font-mono font-medium text-stone-400 uppercase shrink-0">
                            {product.codigo_interno}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 sm:line-clamp-3 mt-1.5 leading-snug">
                        {product.descricao || 'Preparado artesanalmente com ingredientes selecionados.'}
                      </p>
                    </div>

                    {/* Preço e Botão de Ação */}
                    <div className="flex items-center justify-between pt-2 mt-auto gap-2">
                      <div className="flex flex-col">
                        {product.em_promocao && product.preco_promocional ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[#FF8A00] font-black text-base sm:text-lg font-mono">
                              {formatCurrency(finalPrice)}
                            </span>
                            <span className="text-xs line-through text-stone-400 font-mono">
                              {formatCurrency(product.preco)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#FF8A00] font-black text-base sm:text-lg font-mono">
                            {formatCurrency(finalPrice)}
                          </span>
                        )}
                        {product.isPizza && (
                          <span className="text-[9px] text-stone-400 uppercase font-medium leading-tight">
                            A partir de
                          </span>
                        )}
                      </div>

                      {product.isPizza ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAdd(product);
                          }}
                          className="px-2.5 py-1.5 bg-[#FF8A00] hover:bg-[#E07A00] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shrink-0"
                        >
                          <span>Montar</span>
                          {cartInfo.inCart && (
                            <span className="bg-stone-950 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ml-0.5">
                              {cartInfo.totalQty}
                            </span>
                          )}
                        </button>
                      ) : hasAddons ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddonCustomizer(product);
                          }}
                          className="relative w-8 h-8 rounded-xl bg-[#FF8A00] hover:bg-[#E07A00] text-white font-bold flex items-center justify-center transition shadow-xs active:scale-90 cursor-pointer shrink-0"
                          title="Personalizar adicionais"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          {cartInfo.inCart && (
                            <span className="absolute -top-1.5 -right-1.5 bg-stone-950 text-white text-[10px] min-w-4 h-4 px-1 rounded-full font-mono font-bold flex items-center justify-center border border-white dark:border-stone-900 shadow-xs">
                              {cartInfo.totalQty}
                            </span>
                          )}
                        </button>
                      ) : cartInfo.inCart ? (
                        <div className="flex items-center bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-0.5 shadow-2xs shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickDecrease(product);
                            }}
                            className="w-7 h-7 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-lg flex items-center justify-center font-bold text-xs hover:bg-stone-50 active:scale-95 transition cursor-pointer"
                            title="Diminuir"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs text-stone-900 dark:text-white">
                            {cartInfo.totalQty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(product);
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
                            handleQuickAdd(product);
                          }}
                          className="w-8 h-8 rounded-xl bg-[#FF8A00] hover:bg-[#E07A00] text-white font-bold flex items-center justify-center transition shadow-xs active:scale-90 cursor-pointer shrink-0"
                          title="Adicionar ao pedido"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
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

      {/* Floating Bottom Action Bar (Thumb Zone para Celular do Garçom) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 sm:p-3.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-t border-stone-200 dark:border-stone-800 shadow-xl rounded-t-2xl">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div className="pl-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase">TOTAL:</span>
                <span className="text-lg sm:text-xl font-mono font-bold tracking-tight text-stone-900 dark:text-slate-100">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                {cartItemCount} {cartItemCount === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>

            <button
              onClick={onOpenCart}
              className="py-2.5 px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Pedido ({cartItemCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Pizza Customizer Modal */}
      {customizingProduct && (
        <PizzaCustomizerModal
          baseProduct={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={handleConfirmCustomPizza}
        />
      )}

      {/* Addon Customizer Modal for Burgers, Snacks and Portions */}
      {customizingAddonProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1A22] text-stone-900 dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Header com imagem */}
            <div className="relative h-44 sm:h-48 w-full bg-stone-800 overflow-hidden shrink-0">
              <img
                src={customizingAddonProduct.imagem || DEFAULT_FOOD_IMG}
                alt={customizingAddonProduct.nome}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_FOOD_IMG) target.src = DEFAULT_FOOD_IMG;
                }}
              />
              <button
                type="button"
                onClick={() => setCustomizingAddonProduct(null)}
                className="absolute top-3 right-3 p-2 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full backdrop-blur-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-3 bg-stone-900/85 text-amber-400 font-mono font-black text-sm px-3 py-1 rounded-xl backdrop-blur-xs flex items-center gap-1.5">
                {customizingAddonProduct.em_promocao && customizingAddonProduct.preco_promocional ? (
                  <>
                    <span>Base: {formatCurrency(customizingAddonProduct.preco_promocional)}</span>
                    <span className="text-xs line-through text-stone-400 font-normal">
                      {formatCurrency(customizingAddonProduct.preco)}
                    </span>
                    <span className="px-1 py-0.2 rounded bg-red-500 text-white text-[8px] font-sans uppercase">Promo</span>
                  </>
                ) : (
                  <span>Base: {formatCurrency(customizingAddonProduct.preco)}</span>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white">
                  {customizingAddonProduct.nome}
                </h3>
                {customizingAddonProduct.descricao && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    {customizingAddonProduct.descricao}
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
                  {getAvailableAddonsForProduct(customizingAddonProduct).map((addon) => {
                    const isSelected = selectedAddons.some((a) => a.id === addon.id);
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
                                setSelectedAddons((prev) => prev.filter((a) => a.id !== addon.id));
                              } else {
                                setSelectedAddons((prev) => [...prev, addon]);
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
                  value={customObs}
                  onChange={(e) => setCustomObs(e.target.value)}
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
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    disabled={customQty <= 1}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-white flex items-center justify-center font-bold text-sm shadow-2xs disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm text-stone-900 dark:text-white w-6 text-center">
                    {customQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => q + 1)}
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
                onClick={handleConfirmCustomAddonItem}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-sm flex items-center justify-between px-5 shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                <span>Adicionar ao Pedido</span>
                <span className="font-mono">
                  {formatCurrency(
                    ((customizingAddonProduct.em_promocao && customizingAddonProduct.preco_promocional
                      ? customizingAddonProduct.preco_promocional
                      : customizingAddonProduct.preco) +
                      selectedAddons.reduce((a, c) => a + c.preco, 0)) *
                      customQty
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCustomizingAddonProduct(null)}
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
