import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Product, OrderItem, Category } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { playAddPop } from '../../utils/audio';
import { PizzaCustomizerModal } from './PizzaCustomizerModal';

const DEFAULT_FOOD_IMG = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80';

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
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
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
            p.descricao?.toLowerCase().includes(term) ||
            p.codigo_interno?.toLowerCase().includes(term))
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
              🍽️ Todas
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
                  <span>{cat.icone || '🍽️'}</span>
                  <span>{cat.nome}</span>
                </button>
              ))}
          </div>
        )}
      </header>

      {/* Main Content Area (Layout idêntico ao cardápio do cliente, otimizado para celular do garçom) */}
      <main className="p-3 sm:p-4 max-w-5xl mx-auto w-full flex-1">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-stone-500 space-y-2 p-6 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800">
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum produto encontrado.</p>
            <p className="text-xs text-stone-400">Tente pesquisar outro termo ou categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
            {filteredProducts.map((product) => {
              const cartInfo = getCartInfoForProduct(product.id);
              const finalPrice = product.em_promocao && product.preco_promocional ? product.preco_promocional : product.preco;

              return (
                <div
                  key={product.id}
                  onClick={() => handleQuickAdd(product)}
                  className={`rounded-2xl p-3 sm:p-3.5 border shadow-xs hover:shadow-md transition-all flex gap-3 cursor-pointer group relative bg-white border-stone-200/90 dark:bg-[#1E1E28] dark:border-stone-800 ${
                    cartInfo.inCart ? 'border-[#FF8A00] ring-2 ring-[#FF8A00]/25' : ''
                  }`}
                >
                  {/* Foto quadrada à esquerda com cantos arredondados */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
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
                        🍕 Pizza
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
                        <h4 className="font-black text-sm text-stone-900 dark:text-white leading-tight line-clamp-1 flex items-center gap-1">
                          <span className="truncate">{product.nome}</span>
                          {product.destaque && <span className="shrink-0 text-xs">🔥</span>}
                        </h4>
                        {product.codigo_interno && (
                          <span className="text-[10px] font-mono font-medium text-stone-400 uppercase shrink-0">
                            {product.codigo_interno}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-snug">
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
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Montar</span>
                          {cartInfo.inCart && (
                            <span className="bg-stone-950 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ml-0.5">
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
    </div>
  );
};
