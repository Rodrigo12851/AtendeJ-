import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat,
  Clock,
  Printer,
  CheckCircle,
  Play,
  Check,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatTime, getElapsedMinutes } from '../../utils/formatters';
import { KitchenTicketModal } from '../KitchenTicketModal';

export const CozinhaView: React.FC = () => {
  const { orders, updateOrderStatus, audioEnabled, setAudioEnabled } = useStore();
  const [filterTab, setFilterTab] = useState<'ativos' | 'novos' | 'preparo' | 'prontos' | 'todos'>(
    'ativos'
  );
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [, setTick] = useState(0);

  // Live timer tick every 15 seconds to update elapsed minutes dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.status === 'cancelado') return filterTab === 'todos';
      if (filterTab === 'ativos') return order.status === 'novo' || order.status === 'em_preparo';
      if (filterTab === 'novos') return order.status === 'novo';
      if (filterTab === 'preparo') return order.status === 'em_preparo';
      if (filterTab === 'prontos') return order.status === 'pronto';
      return true;
    });
  }, [orders, filterTab]);

  // Counts for tabs
  const countNovos = orders.filter((o) => o.status === 'novo').length;
  const countPreparo = orders.filter((o) => o.status === 'em_preparo').length;
  const countProntos = orders.filter((o) => o.status === 'pronto').length;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] text-stone-900 dark:text-slate-100 pb-20">
      {/* KDS Trattoria Header */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white border-b border-stone-800 shadow-md px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  KDS — Painel da Cozinha
                </h1>
                <span className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Organizado por ordem de chegada • Atualização em tempo real
              </p>
            </div>
          </div>

          {/* Sound toggle & Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer ${
                audioEnabled
                  ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300'
                  : 'border-stone-700 bg-stone-800 text-stone-400 hover:text-white'
              }`}
              title={audioEnabled ? 'Alerta sonoro ativado' : 'Alerta sonoro desativado'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Som</span>
            </button>

            {/* Filter Tabs */}
            <div className="flex bg-stone-800/90 p-1 rounded-xl border border-stone-700/70 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setFilterTab('ativos')}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  filterTab === 'ativos'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Fila Ativa ({countNovos + countPreparo})
              </button>
              <button
                onClick={() => setFilterTab('novos')}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  filterTab === 'novos'
                    ? 'bg-amber-400 text-stone-950 shadow-xs font-bold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <span>Novos</span>
                {countNovos > 0 && (
                  <span className="bg-stone-900 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {countNovos}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterTab('preparo')}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  filterTab === 'preparo'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <span>No Forno</span>
                {countPreparo > 0 && (
                  <span className="bg-stone-900 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {countPreparo}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterTab('prontos')}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  filterTab === 'prontos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <span>Prontos</span>
                {countProntos > 0 && (
                  <span className="bg-stone-900 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {countProntos}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main KDS Grid */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        {filteredOrders.length === 0 ? (
          <div className="py-24 text-center text-stone-500 space-y-2">
            <CheckCircle className="w-10 h-10 text-stone-400 mx-auto" />
            <p className="text-sm font-bold text-stone-800 dark:text-slate-200">Nenhum pedido nesta fila no momento.</p>
            <p className="text-xs text-stone-500">
              Novos pedidos enviados pelos garçons surgirão aqui instantaneamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const elapsedMinutes = getElapsedMinutes(order.criado_em);
              const isOverdue = elapsedMinutes >= 15 && order.status !== 'pronto';
              const activeItens = order.itens.filter((it) => it.status === 'ativo');

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Card Header */}
                  <div
                    className={`p-3.5 flex items-center justify-between border-b ${
                      order.status === 'novo'
                        ? 'bg-amber-50/90 dark:bg-slate-800 text-amber-950 dark:text-amber-200 border-amber-200/70 dark:border-slate-700'
                        : order.status === 'em_preparo'
                        ? 'bg-orange-50/90 dark:bg-slate-800 text-orange-950 dark:text-orange-200 border-orange-200/70 dark:border-slate-700'
                        : order.status === 'pronto'
                        ? 'bg-emerald-50/90 dark:bg-slate-800 text-emerald-950 dark:text-emerald-200 border-emerald-200/70 dark:border-slate-700'
                        : 'bg-stone-50 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-stone-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-tight text-stone-900 dark:text-white">
                          Pedido #{order.id}
                        </span>
                        {order.tipo_pedido === 'delivery' ? (
                          <span className="bg-red-600 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                            🛵 DELIVERY
                          </span>
                        ) : (
                          <span className="bg-stone-900 dark:bg-slate-950 text-white border border-transparent dark:border-slate-700 font-mono font-bold text-xs px-2.5 py-0.5 rounded-md uppercase">
                            MESA {(order.mesa_numero || 0).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-600 dark:text-slate-400 block mt-0.5">
                        {order.tipo_pedido === 'delivery' ? (
                          <>Cliente: <strong className="text-stone-900 dark:text-white">{order.cliente_nome}</strong> ({order.cliente_telefone})</>
                        ) : (
                          <>Garçom: <strong className="text-stone-900 dark:text-white">{order.garcom_nome}</strong></>
                        )}
                      </span>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-xs font-mono font-bold text-stone-700 dark:text-slate-300">
                        {formatTime(order.criado_em)}
                      </span>

                      {/* Elapsed Timer with Alert */}
                      <div
                        className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md mt-1 ${
                          isOverdue
                            ? 'bg-red-600 text-white animate-pulse'
                            : elapsedMinutes >= 10
                            ? 'bg-amber-200 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                            : 'bg-stone-100 dark:bg-slate-950 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700'
                        }`}
                      >
                        {isOverdue && <AlertTriangle className="w-3 h-3 text-white" />}
                        <Clock className="w-3 h-3" />
                        <span>{elapsedMinutes} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body with Detailed Items */}
                  <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-72 bg-white dark:bg-slate-900">
                    {activeItens.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-50/90 dark:bg-slate-950 p-2.5 rounded-xl border border-stone-200/80 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="bg-red-600 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                            {item.quantidade}x
                          </span>
                          <span className="font-bold text-xs text-stone-900 dark:text-white uppercase tracking-tight">
                            {item.nome}
                          </span>
                        </div>

                        {item.sabores && item.sabores.length > 0 && (
                          <div className="pl-4 font-bold text-xs text-stone-800 dark:text-slate-200">
                            {item.sabores.join(' + ')}
                          </div>
                        )}

                        {item.borda && item.borda.nome !== 'Sem borda' && (
                          <div className="pl-4 text-xs text-stone-600 dark:text-slate-400">
                            Borda: <span className="font-semibold text-stone-800 dark:text-slate-200">{item.borda.nome}</span>
                          </div>
                        )}

                        {item.massa && (
                          <div className="pl-4 text-xs text-stone-500 dark:text-slate-400">
                            Massa: {item.massa}
                          </div>
                        )}

                        {item.adicionais && item.adicionais.length > 0 && (
                          <div className="pl-4 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                            + {item.adicionais.map((a) => a.nome).join(', ')}
                          </div>
                        )}

                        {item.observacao && (
                          <div className="mt-1 p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-900 dark:text-amber-200 font-medium text-xs">
                            Obs: {item.observacao.toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}

                    {order.observacao && (
                      <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-red-900 dark:text-red-200 font-semibold text-xs">
                        Obs Pedido: {order.observacao.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Card Footer with Action Buttons */}
                  <div className="p-3 bg-stone-50 dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(order)}
                      className="p-2.5 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 rounded-xl shadow-2xs transition cursor-pointer"
                      title="Imprimir comanda de produção"
                    >
                      <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </button>

                    {order.status === 'novo' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'em_preparo')}
                        className="flex-1 py-2.5 px-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-300" />
                        <span>INICIAR PREPARO</span>
                      </button>
                    )}

                    {order.status === 'em_preparo' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'pronto')}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>MARCAR COMO PRONTO</span>
                      </button>
                    )}

                    {order.status === 'pronto' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'entregue')}
                        className="flex-1 py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 font-semibold text-xs border border-stone-200 dark:border-slate-700 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Entregue ao Garçom</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Kitchen Thermal Ticket Modal */}
      {printingOrder && (
        <KitchenTicketModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
};
