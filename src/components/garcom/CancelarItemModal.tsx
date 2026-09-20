import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { OrderItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CancelarItemModalProps {
  item: OrderItem;
  orderId: number;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

const MOTIVOS_CANCELAMENTO = [
  'Cliente desistiu',
  'Pedido lançado errado',
  'Produto indisponível na cozinha',
  'Erro de digitação do garçom',
  'Demora excessiva no preparo',
  'Outro motivo',
];

export const CancelarItemModal: React.FC<CancelarItemModalProps> = ({
  item,
  orderId,
  onClose,
  onConfirm,
}) => {
  const [motivoSelecionado, setMotivoSelecionado] = useState(MOTIVOS_CANCELAMENTO[0]);
  const [motivoCustom, setMotivoCustom] = useState('');

  const handleConfirm = () => {
    const finalMotivo =
      motivoSelecionado === 'Outro motivo'
        ? motivoCustom.trim() || 'Outro motivo não especificado'
        : motivoSelecionado;
    onConfirm(finalMotivo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight">Cancelar Item do Pedido #{orderId}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-200">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">
              Item a ser cancelado:
            </span>
            <p className="text-sm font-bold text-stone-900 dark:text-slate-100 mt-0.5">
              {item.quantidade}x {item.nome}
            </p>
            <p className="text-xs text-red-700 font-semibold mt-0.5 font-mono">
              Valor a estornar da comanda: {formatCurrency(item.preco_total)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Selecione o motivo do cancelamento (obrigatório):
            </label>
            <div className="space-y-1.5">
              {MOTIVOS_CANCELAMENTO.map((motivo) => (
                <label
                  key={motivo}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    motivoSelecionado === motivo
                      ? 'border-red-600 bg-red-50/60 text-red-900 font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    checked={motivoSelecionado === motivo}
                    onChange={() => setMotivoSelecionado(motivo)}
                    className="accent-red-600"
                  />
                  <span>{motivo}</span>
                </label>
              ))}
            </div>
          </div>

          {motivoSelecionado === 'Outro motivo' && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Especifique a justificativa:
              </label>
              <textarea
                rows={2}
                value={motivoCustom}
                onChange={(e) => setMotivoCustom(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden text-stone-800 dark:text-slate-200"
              />
            </div>
          )}

          <p className="text-[11px] text-stone-400 italic">
            * Conforme as regras da pizzaria, este cancelamento será registrado permanentemente para fins de auditoria interna.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-200/80 rounded-xl transition cursor-pointer"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition cursor-pointer active:scale-98"
          >
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  );
};
