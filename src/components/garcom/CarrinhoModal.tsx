import React, { useState } from 'react';
import { X, Trash2, Send, Plus, Minus, MessageSquare, Tag } from 'lucide-react';
import { OrderItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CarrinhoModalProps {
  mesaNumero: number;
  comandaNumero: string;
  cartItems: OrderItem[];
  onClose: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onAddMoreProducts: () => void;
  onSendToKitchen: (observacaoGeral: string) => void;
}

const QUICK_OBS = [
  'Sem gelo',
  'Gelo e limão',
  'Sem cebola',
  'Bem passada',
  'Caprichar no queijo',
  'Para viagem',
];

export const CarrinhoModal: React.FC<CarrinhoModalProps> = ({
  mesaNumero,
  comandaNumero,
  cartItems,
  onClose,
  onRemoveItem,
  onUpdateQuantity,
  onAddMoreProducts,
  onSendToKitchen,
}) => {
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [isSending, setIsSending] = useState(false);

  const cartTotal = cartItems.reduce((acc, it) => acc + it.preco_total, 0);
  const totalItemCount = cartItems.reduce((acc, it) => acc + it.quantidade, 0);

  const handleSend = () => {
    if (cartItems.length === 0) return;
    setIsSending(true);
    setTimeout(() => {
      onSendToKitchen(observacaoGeral);
      setIsSending(false);
    }, 350);
  };

  const handleAppendObs = (tag: string) => {
    if (!observacaoGeral) {
      setObservacaoGeral(tag);
    } else if (!observacaoGeral.includes(tag)) {
      setObservacaoGeral(`${observacaoGeral}, ${tag}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                MESA {mesaNumero.toString().padStart(2, '0')}
              </span>
              <span className="text-amber-300 text-xs font-bold tracking-wider font-mono">
                {comandaNumero}
              </span>
            </div>
            <h3 className="text-sm font-bold tracking-tight text-stone-100 mt-1">
              Itens do Pedido ({totalItemCount} {totalItemCount === 1 ? 'item' : 'itens'})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Cart Items */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-stone-100 bg-white">
          {cartItems.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <p className="text-sm font-medium">O carrinho do pedido está vazio.</p>
              <button
                onClick={onAddMoreProducts}
                className="mt-3 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-red-700 cursor-pointer"
              >
                + Adicionar Produtos
              </button>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div key={index} className="pt-3 first:pt-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100 truncate">
                      {item.nome}
                    </h4>
                    {item.sabores && item.sabores.length > 0 && (
                      <p className="text-xs text-stone-600">
                        {item.sabores.join(' + ')}
                      </p>
                    )}
                    {item.borda && item.borda.nome !== 'Sem borda' && (
                      <p className="text-xs text-stone-500">
                        Borda: {item.borda.nome}
                      </p>
                    )}
                    {item.observacao && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block mt-0.5 font-medium italic">
                        Obs: {item.observacao}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-bold text-stone-900 dark:text-slate-100 whitespace-nowrap">
                      {formatCurrency(item.preco_total)}
                    </span>
                    {item.quantidade > 1 && (
                      <span className="block text-[10px] text-stone-400 font-mono">
                        {item.quantidade} × {formatCurrency(item.preco_unitario)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity adjustments & delete (Touch-friendly for mobile) */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center bg-stone-100 border border-stone-200 rounded-xl p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(index, Math.max(1, item.quantidade - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-50 active:bg-stone-200 cursor-pointer shadow-2xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs sm:text-sm font-mono font-bold text-stone-900 dark:text-slate-100 w-8 text-center">
                      {item.quantidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(index, item.quantidade + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-50 active:bg-stone-200 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="text-stone-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 active:bg-red-100 transition cursor-pointer"
                    title="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Quick Notes for Mobile */}
          {cartItems.length > 0 && (
            <div className="pt-3 space-y-2">
              <label className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                Observação Geral da Cozinha:
              </label>

              {/* Fast Chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_OBS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAppendObs(tag)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg border border-stone-200 transition cursor-pointer active:scale-95"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={observacaoGeral}
                onChange={(e) => setObservacaoGeral(e.target.value)}
                placeholder='Ex: "Entregar bebidas primeiro", "Mesa com pressa"'
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white text-stone-800 dark:text-slate-200"
              />
            </div>
          )}
        </div>

        {/* Footer with Subtotal and Action Buttons */}
        <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 space-y-2.5 shrink-0">
          <div className="flex items-baseline justify-between">
            <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
              Total do Pedido:
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black tracking-tight text-stone-900 dark:text-slate-100">
              {formatCurrency(cartTotal)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAddMoreProducts}
              className="flex-1 py-3 px-2.5 bg-white hover:bg-stone-100 text-stone-800 dark:text-slate-200 font-bold text-xs border border-stone-200 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Itens</span>
            </button>

            <button
              type="button"
              disabled={cartItems.length === 0 || isSending}
              onClick={handleSend}
              className="flex-2 py-3 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'ENVIANDO...' : 'ENVIAR COZINHA'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
