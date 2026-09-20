import React, { useState } from 'react';
import {
  ArrowLeft,
  PlusCircle,
  ArrowRightLeft,
  Receipt,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  Bell,
} from 'lucide-react';
import { Comanda, Table, Order, OrderItem } from '../../types';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { CancelarItemModal } from './CancelarItemModal';
import { TransferirMesaModal } from './TransferirMesaModal';
import { ReceiptModal } from '../ReceiptModal';

interface ComandaDetalhesProps {
  table: Table;
  comanda: Comanda;
  orders: Order[];
  availableTables: Table[];
  onBack: () => void;
  onAddNewOrder: () => void;
  onCancelItem: (orderId: number, itemId: string, motivo: string) => void;
  onTransferTable: (targetMesaId: string) => void;
  onRequestBill: () => void;
  onGoToCheckout?: () => void;
  userRole: string;
}

export const ComandaDetalhes: React.FC<ComandaDetalhesProps> = ({
  table,
  comanda,
  orders,
  availableTables,
  onBack,
  onAddNewOrder,
  onCancelItem,
  onTransferTable,
  onRequestBill,
  onGoToCheckout,
  userRole,
}) => {
  const [cancellingItem, setCancellingItem] = useState<{ item: OrderItem; orderId: number } | null>(
    null
  );
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // All orders tied to this comanda
  const comandaOrders = orders.filter((o) => comanda.pedidos_ids.includes(o.id));

  // Check if any order is ready
  const readyOrders = comandaOrders.filter((o) => o.status === 'pronto');

  const handleConfirmCancel = (motivo: string) => {
    if (cancellingItem) {
      onCancelItem(cancellingItem.orderId, cancellingItem.item.id, motivo);
      setCancellingItem(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-stone-900 dark:text-slate-100 pb-24">
      {/* Sticky Refined Subheader */}
      <header className="sticky top-[50px] md:top-[112px] z-30 bg-stone-900 dark:bg-slate-950 text-white border-b border-stone-800 dark:border-slate-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-200 border border-stone-700 dark:border-slate-700 bg-stone-800 dark:bg-slate-800 hover:bg-stone-700 dark:hover:bg-slate-700 py-1.5 px-3 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar / Mesas</span>
          </button>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <span className="bg-red-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-md uppercase">
                MESA {table.numero.toString().padStart(2, '0')}
              </span>
              <span className="font-mono text-amber-300 text-xs font-bold tracking-wider">
                {comanda.numero}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowReceiptModal(true)}
            className="p-2 rounded-lg border border-stone-700 dark:border-slate-700 bg-stone-800 dark:bg-slate-800 text-amber-400 hover:bg-stone-700 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Conferência de Conta"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-4 space-y-4">
        {/* Status Notification Banner for Waiter */}
        {readyOrders.length > 0 && (
          <div className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-xs flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-700 rounded-lg">
                <Bell className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  Aviso da Cozinha!
                </h4>
                <p className="text-xs font-bold">
                  {readyOrders.length === 1
                    ? `Pedido #${readyOrders[0].id} está pronto para servir na mesa!`
                    : `${readyOrders.length} pedidos prontos para servir na mesa!`}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase bg-white text-emerald-900 px-2.5 py-1 rounded-md shrink-0">
              PRONTO
            </span>
          </div>
        )}

        {/* Overview Card */}
        <div className="bg-white dark:bg-slate-900 p-5 border border-stone-200/90 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                {table.status === 'aguardando_fechamento' ? 'Aguardando Fechamento' : 'Mesa Ocupada'}
              </span>
              <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                Aberta às {formatTime(comanda.abertura)}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-slate-300">
              Garçom responsável: <strong className="text-stone-900 dark:text-slate-100">{comanda.garcom_nome}</strong>
            </p>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Localização: {table.localizacao} • Capacidade: {table.capacidade} lugares
            </p>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100 dark:border-slate-800">
            <span className="text-[11px] uppercase font-medium text-stone-400 block">Total Consumido</span>
            <span className="text-3xl font-mono font-black tracking-tight text-stone-900 dark:text-slate-100">
              {formatCurrency(comanda.total)}
            </span>
            {comanda.desconto > 0 && (
              <span className="block text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                Desconto: -{formatCurrency(comanda.desconto)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Hub */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={onAddNewOrder}
            className="py-3 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Novo Pedido</span>
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="py-3 px-3 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-800 dark:text-slate-200 font-semibold text-xs border border-stone-200 dark:border-slate-800 rounded-xl shadow-2xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-stone-600 dark:text-slate-400" />
            <span>Transferir Mesa</span>
          </button>

          <button
            onClick={() => setShowReceiptModal(true)}
            className="py-3 px-3 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-800 dark:text-slate-200 font-semibold text-xs border border-stone-200 dark:border-slate-800 rounded-xl shadow-2xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-stone-600 dark:text-slate-400" />
            <span>Ver Conta</span>
          </button>

          {table.status !== 'aguardando_fechamento' ? (
            <button
              onClick={onRequestBill}
              className="py-3 px-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-stone-900 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Pedir Conta</span>
            </button>
          ) : (
            <div className="py-3 px-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 text-center">
              <span>Aguardando Caixa</span>
            </div>
          )}
        </div>

        {/* If user is Cashier or Admin, offer direct shortcut to Checkout */}
        {(userRole === 'caixa' || userRole === 'admin') && onGoToCheckout && (
          <button
            onClick={onGoToCheckout}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Ir para Fechamento & Pagamento no Caixa</span>
          </button>
        )}

        {/* Chronological Orders History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              Histórico de Pedidos Enviados ({comandaOrders.length})
            </h3>
          </div>

          {comandaOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 text-center text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-2xs">
              <p className="text-sm font-medium">Nenhum pedido enviado nesta comanda ainda.</p>
              <button
                onClick={onAddNewOrder}
                className="mt-3 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-red-700 cursor-pointer"
              >
                + Adicionar Primeiro Pedido
              </button>
            </div>
          ) : (
            comandaOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 p-4 border border-stone-200 dark:border-slate-800 rounded-xl shadow-2xs space-y-3"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900 dark:text-slate-100">
                      PEDIDO #{order.id}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      às {formatTime(order.criado_em)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      order.status === 'novo'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : order.status === 'em_preparo'
                        ? 'bg-blue-50 text-blue-900 border-blue-200'
                        : order.status === 'pronto'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-stone-100 text-stone-700 dark:text-slate-300 border-stone-200'
                    }`}
                  >
                    {order.status === 'novo' && '● NOVO'}
                    {order.status === 'em_preparo' && '● EM PREPARO'}
                    {order.status === 'pronto' && '● PRONTO'}
                    {order.status === 'cancelado' && '● CANCELADO'}
                  </span>
                </div>

                {/* Items in this Order */}
                <div className="space-y-2 divide-y divide-stone-100">
                  {order.itens.map((item) => (
                    <div
                      key={item.id}
                      className={`pt-2 first:pt-0 flex items-start justify-between gap-2 ${
                        item.status === 'cancelado' ? 'opacity-40' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-mono font-semibold bg-stone-100 border border-stone-200 text-stone-800 dark:text-slate-200 px-1.5 py-0.5 rounded">
                            {item.quantidade}x
                          </span>
                          <span
                            className={`text-xs font-bold text-stone-900 dark:text-slate-100 ${
                              item.status === 'cancelado' ? 'line-through text-stone-400' : ''
                            }`}
                          >
                            {item.nome}
                          </span>
                        </div>

                        {item.sabores && item.sabores.length > 0 && (
                          <p className="text-xs text-stone-600 pl-6 mt-0.5">
                            Sabores: {item.sabores.join(' + ')}
                          </p>
                        )}
                        {item.borda && item.borda.nome !== 'Sem borda' && (
                          <p className="text-xs text-stone-500 pl-6 mt-0.5">
                            {item.borda.nome}
                          </p>
                        )}
                        {item.observacao && (
                          <p className="text-xs text-amber-800 font-medium pl-6 mt-0.5 italic">
                            Obs: {item.observacao}
                          </p>
                        )}

                        {item.status === 'cancelado' && item.cancelamento && (
                          <p className="text-xs text-red-600 font-semibold pl-6 mt-0.5">
                            Cancelado: {item.cancelamento.motivo} (por {item.cancelamento.usuario_nome})
                          </p>
                        )}
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold ${
                            item.status === 'cancelado'
                              ? 'line-through text-stone-400'
                              : 'text-stone-900 dark:text-slate-100'
                          }`}
                        >
                          {formatCurrency(item.preco_total)}
                        </span>

                        {item.status === 'ativo' && (
                          <button
                            type="button"
                            onClick={() => setCancellingItem({ item, orderId: order.id })}
                            className="p-1 text-stone-400 hover:text-red-600 transition cursor-pointer"
                            title="Cancelar item"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {order.observacao && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-stone-800 dark:text-slate-200 font-medium">
                    <span className="font-bold text-amber-900">Obs Geral:</span> {order.observacao}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Cancel Item Modal */}
      {cancellingItem && (
        <CancelarItemModal
          item={cancellingItem.item}
          orderId={cancellingItem.orderId}
          onClose={() => setCancellingItem(null)}
          onConfirm={handleConfirmCancel}
        />
      )}

      {/* Transfer Table Modal */}
      {showTransferModal && (
        <TransferirMesaModal
          currentTable={table}
          availableTables={availableTables}
          onClose={() => setShowTransferModal(false)}
          onConfirm={(targetMesaId) => {
            onTransferTable(targetMesaId);
            setShowTransferModal(false);
          }}
        />
      )}

      {/* Mobile Floating Action Button for Quick Order */}
      <div className="sm:hidden fixed bottom-5 right-4 z-20">
        <button
          onClick={onAddNewOrder}
          className="py-3 px-4 bg-red-600 active:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 border border-red-500 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>NOVO PEDIDO +</span>
        </button>
      </div>

      {/* Receipt / Account Modal */}
      {showReceiptModal && (
        <ReceiptModal
          comanda={comanda}
          orders={orders}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};
