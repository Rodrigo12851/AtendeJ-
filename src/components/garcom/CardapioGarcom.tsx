import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
  LayoutGrid,
  List,
  Check,
} from 'lucide-react';
import { Product, OrderItem, Category } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { playAddPop } from '../../utils/audio';
import { PizzaCustomizerModal } from './PizzaCustomizerModal';

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
  const [activeCategory, setActiveCategory] = useState<string>('pizzas');
  const [searchTerm, setSearchTerm] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [layoutMode, setLayoutMode] = useState<'compact' | 'cards'>('compact');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 1500);
  };

  // Filter products based on search term or category
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      return products.filter(
        (p) =>
          p.ativo &&
          (p.nome.toLowerCase().includes(term) ||
            p.descricao.toLowerCase().includes(term) ||
            p.codigo_interno.toLowerCase().includes(term))
      );
    }
    if (activeCategory === 'todas') {
      return products.filter((p) => p.ativo);
    }
    return products.filter((p) => p.ativo && p.categoria_id === activeCategory);
  }, [products, activeCategory, searchTerm]);

  // Helper to find simple items in cart (not customized pizzas)
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

    playAddPop();
    const cartInfo = getCartInfoForProduct(product.id);

    // If item is already in cart and handler is available, increment quantity
    if (cartInfo.inCart && onUpdateCartQuantity && cartInfo.firstIndex >= 0) {
      onUpdateCartQuantity(cartInfo.firstIndex, cartInfo.totalQty + 1);
      showToast(`+1 ${product.nome}`);
      return;
    }

    const orderItem: OrderItem = {
      id: `item_quick_${Date.now()}_${Math.random()}`,
      produto_id: product.id,
      nome: product.nome,
      quantidade: 1,
      preco_unitario: product.preco,
      preco_total: product.preco,
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
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] text-stone-900 dark:text-slate-100 pb-28">
      {/* Quick Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white border border-stone-700 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Compact Header for Mobile & Desktop */}
      <header className="sticky top-[50px] md:top-[112px] z-30 bg-stone-900 text-white border-b border-stone-800 shadow-md">
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
            {/* Layout Toggle: Compact (Mobile Best) vs Cards */}
            <div className="flex items-center bg-stone-800 border border-stone-700 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setLayoutMode('compact')}
                className={`p-1.5 rounded cursor-pointer transition ${
                  layoutMode === 'compact'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Modo Compacto (ideal para celular)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('cards')}
                className={`p-1.5 rounded cursor-pointer transition ${
                  layoutMode === 'cards'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Modo Cards Expandido"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cart Button with Counter */}
            <button
              onClick={onOpenCart}
              className="relative p-2 border border-stone-700 bg-stone-800 text-white hover:bg-stone-700 rounded-lg transition cursor-pointer"
              title="Abrir Carrinho"
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

        {/* Quick Category Carousel */}
        {!searchTerm && (
          <div className="flex gap-1.5 overflow-x-auto px-3 sm:px-4 pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategory('todas')}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition shrink-0 rounded-lg border cursor-pointer ${
                activeCategory === 'todas'
                  ? 'bg-red-600 text-white border-red-500 shadow-xs'
                  : 'bg-stone-800/90 text-stone-300 border-stone-700/80 hover:bg-stone-700'
              }`}
            >
              🍽️ Todas
            </button>

            {categories
              .filter((c) => c.ativo)
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition flex items-center gap-1.5 shrink-0 rounded-lg border cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-red-600 text-white border-red-500 shadow-xs'
                      : 'bg-stone-800/90 text-stone-300 border-stone-700/80 hover:bg-stone-700'
                  }`}
                >
                  <span>{cat.icone}</span>
                  <span>{cat.nome}</span>
                </button>
              ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="p-2.5 sm:p-4 max-w-5xl mx-auto w-full flex-1">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <p className="text-base font-bold">Nenhum produto encontrado.</p>
            <p className="text-xs mt-1 text-stone-400">Tente pesquisar outro termo ou categoria.</p>
          </div>
        ) : layoutMode === 'compact' ? (
          /* ==================================================================== */
          /* MODO COMPACTO: Ideal para celular (posicionamento rápido e esguio)  */
          /* ==================================================================== */
          <div className="space-y-1.5">
            {filteredProducts.map((product) => {
              const cartInfo = getCartInfoForProduct(product.id);

              return (
                <div
                  key={product.id}
                  className={`bg-white px-3 py-2 sm:py-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs hover:border-stone-300 ${
                    cartInfo.inCart ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200/90'
                  }`}
                >
                  {/* Left: Product Info */}
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-stone-400 font-medium shrink-0 uppercase">
                        {product.codigo_interno}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100 truncate">
                        {product.nome}
                      </h3>
                      {product.destaque && (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md uppercase shrink-0">
                          Top
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate leading-tight mt-0.5">
                      {product.descricao}
                    </p>
                  </div>

                  {/* Right: Price + Fast Actions */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-mono font-bold tracking-tight text-stone-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(product.preco)}
                      </span>
                      {product.isPizza && (
                        <span className="block text-[9px] text-stone-400 uppercase font-medium">
                          A partir de
                        </span>
                      )}
                    </div>

                    {/* Action Controls */}
                    {product.isPizza ? (
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(product)}
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Montar</span>
                        {cartInfo.inCart && (
                          <span className="bg-amber-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ml-0.5">
                            {cartInfo.totalQty}
                          </span>
                        )}
                      </button>
                    ) : cartInfo.inCart ? (
                      /* Inline Counter if already in cart */
                      <div className="flex items-center bg-stone-100 border border-stone-300 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleQuickDecrease(product)}
                          className="w-7 h-7 bg-white border border-stone-200 text-stone-800 dark:text-slate-200 rounded-md flex items-center justify-center font-bold text-xs hover:bg-stone-50 active:bg-stone-200 transition cursor-pointer"
                          title="Diminuir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-stone-900 dark:text-slate-100">
                          {cartInfo.totalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          className="w-7 h-7 bg-red-600 text-white rounded-md flex items-center justify-center font-bold text-xs hover:bg-red-700 active:bg-red-800 transition cursor-pointer"
                          title="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      /* Quick Add Button */
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(product)}
                        className="py-1.5 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================================================================== */
          /* MODO CARDS: Visualização expandida tradicional                       */
          /* ==================================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const cartInfo = getCartInfoForProduct(product.id);

              return (
                <div
                  key={product.id}
                  className={`bg-white p-3.5 border rounded-2xl shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all ${
                    cartInfo.inCart ? 'border-amber-300 bg-amber-50/15' : 'border-stone-200/90'
                  }`}
                >
                  <div>
                    {product.imagem && (
                      <div className="w-full h-28 mb-2.5 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                        <img src={product.imagem} alt={product.nome} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-medium text-stone-400 uppercase">
                        {product.codigo_interno}
                      </span>
                      {product.destaque && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Destaque
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 mt-1">{product.nome}</h3>
                    <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                      {product.descricao}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-medium">
                        {product.isPizza ? 'A partir de' : 'Valor'}
                      </span>
                      <span className="text-base font-mono font-bold tracking-tight text-stone-900 dark:text-slate-100">
                        {formatCurrency(product.preco)}
                      </span>
                    </div>

                    {product.isPizza ? (
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(product)}
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Montar</span>
                        {cartInfo.inCart && (
                          <span className="bg-amber-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ml-0.5">
                            {cartInfo.totalQty}
                          </span>
                        )}
                      </button>
                    ) : cartInfo.inCart ? (
                      <div className="flex items-center bg-stone-100 border border-stone-300 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleQuickDecrease(product)}
                          className="w-7 h-7 bg-white border border-stone-200 text-stone-800 dark:text-slate-200 rounded-md flex items-center justify-center font-bold text-xs hover:bg-stone-50 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-stone-900 dark:text-slate-100">
                          {cartInfo.totalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          className="w-7 h-7 bg-red-600 text-white rounded-md flex items-center justify-center font-bold text-xs hover:bg-red-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(product)}
                        className="py-1.5 px-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar (Thumb Zone) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 sm:p-3.5 bg-white/95 backdrop-blur-sm border-t border-stone-200 shadow-xl rounded-t-2xl">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div className="pl-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase">TOTAL:</span>
                <span className="text-lg sm:text-xl font-mono font-bold tracking-tight text-stone-900 dark:text-slate-100">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">
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
    </div>
  );
};
