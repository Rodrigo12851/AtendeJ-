import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { Table } from '../../types';

interface TransferirMesaModalProps {
  currentTable: Table;
  availableTables: Table[];
  onClose: () => void;
  onConfirm: (targetMesaId: string) => void;
}

export const TransferirMesaModal: React.FC<TransferirMesaModalProps> = ({
  currentTable,
  availableTables,
  onClose,
  onConfirm,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    availableTables.length > 0 ? availableTables[0].id : ''
  );

  const handleConfirm = () => {
    if (!selectedTargetId) return;
    onConfirm(selectedTargetId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight">Transferir Comanda de Mesa</h3>
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
          <div className="flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="text-center">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Mesa Atual</span>
              <div className="text-xl font-black text-stone-900 dark:text-slate-100">
                Mesa {currentTable.numero.toString().padStart(2, '0')}
              </div>
              <span className="text-[10px] text-stone-500">{currentTable.localizacao}</span>
            </div>

            <div className="text-stone-400 p-2.5 rounded-full bg-white shadow-2xs border border-stone-200">
              <ArrowRightLeft className="w-4 h-4 text-stone-700 dark:text-slate-300" />
            </div>

            <div className="text-center">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Nova Mesa</span>
              <div className="text-xl font-black text-emerald-700">
                {selectedTargetId
                  ? `Mesa ${availableTables.find((t) => t.id === selectedTargetId)?.numero.toString().padStart(2, '0')}`
                  : 'Selecione'}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">Livre</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Selecione a mesa de destino disponível:
            </label>
            {availableTables.length === 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                Não há mesas livres no salão neste momento para efetuar a transferência.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {availableTables.map((tbl) => (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => setSelectedTargetId(tbl.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      selectedTargetId === tbl.id
                        ? 'border-stone-900 bg-stone-100 text-stone-900 dark:text-slate-100 font-bold shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold block">
                        Mesa {tbl.numero.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-stone-500">{tbl.localizacao}</span>
                    </div>
                    {selectedTargetId === tbl.id && (
                      <CheckCircle2 className="w-4 h-4 text-stone-900 dark:text-slate-100" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
            <span className="font-bold text-stone-800 dark:text-slate-200 block">O que é transferido:</span>
            <p>• Comanda ({currentTable.comanda_atual_numero}) com todos os produtos consumidos</p>
            <p>• Histórico completo de pedidos e horários</p>
            <p>• A mesa de origem volta a ficar LIVRE automaticamente</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-200/80 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedTargetId || availableTables.length === 0}
            onClick={handleConfirm}
            className="px-5 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer active:scale-98"
          >
            Confirmar Transferência
          </button>
        </div>
      </div>
    </div>
  );
};
