import React, { useState, useEffect } from 'react';
import {
  Bike,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Receipt,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface MotoboyDeliveryViewProps {
  pedidoId: number;
  token?: string;
}

export const MotoboyDeliveryView: React.FC<MotoboyDeliveryViewProps> = ({
  pedidoId,
}) => {
  const { orders, allOrders, lojas, updateOrderStatus, closeComanda } = useStore();
  const [isFinishing, setIsFinishing] = useState(false);
  const [showItens, setShowItens] = useState(true);
  const [justCompleted, setJustCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // Interval to update current timestamp every second for accurate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Find order across current orders or allOrders
  const orderList = allOrders && allOrders.length > 0 ? allOrders : orders;
  const order = orderList.find((o) => o.id === pedidoId);
  const loja = lojas.find((l) => l.id === order?.loja_id) || lojas[0];

  const endereco = order?.cliente_endereco || order?.delivery_info?.endereco || '';
  const telefone = order?.cliente_telefone || order?.delivery_info?.telefone || '';
  const cleanPhone = telefone.replace(/\D/g, '');

  const orderTotal = order
    ? order.itens
        .filter((it) => it.status === 'ativo')
        .reduce((acc, it) => acc + it.preco_total, 0) + (order.taxa_entrega || 0)
    : 0;

  const trocoValor =
    order?.troco_para && order.troco_para > orderTotal
      ? order.troco_para - orderTotal
      : 0;

  const handleFinalizarEntrega = async () => {
    if (!order) return;
    if (order.status === 'entregue') return;

    const confirmAction = window.confirm(
      `Confirmar que o Pedido #${order.id} foi entregue com sucesso para ${order.cliente_nome || 'o cliente'}?`
    );
    if (!confirmAction) return;

    setIsFinishing(true);
    try {
      updateOrderStatus(order.id, 'entregue');
      if (order.comanda_id) {
        closeComanda(order.comanda_id);
      }
      setJustCompleted(true);
      setCompletedAt(Date.now());
    } catch (err) {
      console.error('Erro ao finalizar entrega:', err);
      alert('Ocorreu um erro ao atualizar o status. Tente novamente.');
    } finally {
      setIsFinishing(false);
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(endereco)}`;
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá ${order?.cliente_nome || 'Cliente'}! Sou o entregador da ${loja?.nome || 'Pizzaria'} com o seu Pedido #${order?.id}.`
  )}`;

  // Expiration calculation: 5 minutes after delivery confirmation
  const isEntregue = order?.status === 'entregue' || justCompleted;
  const entregueTimestamp = order?.entregue_em
    ? new Date(order.entregue_em).getTime()
    : completedAt || 0;

  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const elapsedSinceEntregue = isEntregue && entregueTimestamp > 0 ? now - entregueTimestamp : 0;
  const isExpired = isEntregue && entregueTimestamp > 0 && elapsedSinceEntregue >= FIVE_MINUTES_MS;
  const remainingMs = Math.max(0, FIVE_MINUTES_MS - elapsedSinceEntregue);
  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);

  // If link has expired (> 5 minutes after delivery), protect customer data completely
  if (order && isExpired) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-600 selection:text-white">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header Shield & Lock Icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 border-2 border-stone-900 text-white rounded-full flex items-center justify-center shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider inline-block">
              ✓ Entrega Concluída • Acesso Expirado
            </span>
            <h1 className="text-xl font-black text-white pt-1">
              Dados do Cliente Protegidos
            </h1>
            <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
              Este pedido foi finalizado com sucesso. Por motivos de segurança e privacidade do cliente, as informações de endereço e contato ficam disponíveis por apenas <strong>5 minutos</strong> após a entrega e foram desativadas.
            </p>
          </div>

          {/* Resumo do Pedido Entregue */}
          <div className="p-4 bg-stone-950/80 border border-stone-800/80 rounded-2xl text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Pedido:</span>
              <span className="font-mono font-black text-white">#{order.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Estabelecimento:</span>
              <span className="font-bold text-stone-200">{loja?.nome || 'Pizzaria'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Horário da Entrega:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {order.entregue_em ? formatDateTime(order.entregue_em) : 'Finalizado'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <span className="text-stone-500 font-medium">Status no Sistema:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Entregue & Fechado
              </span>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-stone-500 space-y-1">
            <p className="font-semibold text-stone-300">🛵 Obrigado pelo seu trabalho na entrega!</p>
            <p className="text-[11px]">Você já pode fechar esta aba com segurança.</p>
          </div>
        </div>
      </div>
    );
  }

  // If order was not found yet
  if (!order) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Pedido #{pedidoId} não localizado</h2>
          <p className="text-stone-400 text-sm">
            Verifique se o link foi aberto corretamente ou se o pedido ainda está sincronizando com o sistema.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans pb-28 selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-purple-400 font-extrabold flex items-center gap-1">
                <span>Painel do Entregador</span>
              </div>
              <h1 className="text-sm font-black text-white leading-tight truncate max-w-[180px]">
                {loja?.nome || 'AtendeJá Delivery'}
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-stone-400 block font-medium">Pedido</span>
            <span className="font-mono font-black text-base text-white">#{order.id}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto p-4 space-y-3.5">
        {/* Status Banner */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isEntregue
              ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
              : order.status === 'a_caminho'
              ? 'bg-purple-950/50 border-purple-500/60 text-purple-200'
              : 'bg-amber-950/50 border-amber-500/60 text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {isEntregue ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <Bike className="w-6 h-6 text-purple-400 shrink-0 animate-bounce" />
              )}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                  Status da Entrega
                </span>
                <span className="text-base font-black">
                  {isEntregue
                    ? 'ENTREGA CONCLUÍDA'
                    : order.status === 'a_caminho'
                    ? 'A CAMINHO DO CLIENTE'
                    : order.status === 'pronto'
                    ? 'PRONTO PARA DESPACHO'
                    : 'EM ANDAMENTO'}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] opacity-75 font-mono">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              {order.criado_em ? formatDateTime(order.criado_em) : '--:--'}
            </div>
          </div>

          {isEntregue && (
            <div className="mt-3 pt-3 border-t border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Pedido finalizado no sistema e no painel do caixa!</span>
            </div>
          )}
        </div>

        {/* Countdown Banner de Expiração / Proteção de Dados (5 minutos) */}
        {isEntregue && (
          <div className="p-3.5 bg-purple-950/40 border border-purple-500/40 rounded-2xl text-purple-200 text-xs flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-white text-xs leading-tight">
                  Privacidade do Cliente Ativa
                </p>
                <p className="text-[11px] text-purple-300/80 leading-tight mt-0.5">
                  Por segurança, os dados do cliente expiram em:
                </p>
              </div>
            </div>

            <div className="px-2.5 py-1.5 bg-purple-900/60 border border-purple-400/50 rounded-xl font-mono font-black text-amber-300 text-xs shrink-0 flex items-center gap-1.5 shadow-xs">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>
                {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Card: Cliente */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <span>👤 Cliente</span>
            </h2>
            <span className="text-[11px] font-mono font-bold text-stone-500">#{order.id}</span>
          </div>

          <div>
            <p className="text-base font-black text-white leading-tight">
              {order.cliente_nome || 'Cliente não identificado'}
            </p>
            {telefone ? (
              <p className="text-xs text-stone-400 font-mono mt-0.5">{telefone}</p>
            ) : (
              <p className="text-xs text-stone-500 mt-0.5">Telefone não informado</p>
            )}
          </div>

          {telefone && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${cleanPhone}`}
                className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border border-stone-700"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ligar</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Card: Endereço & Rotas GPS */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>Endereço de Entrega</span>
          </h2>

          <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-xl">
            <p className="text-sm font-semibold text-stone-100 leading-snug">
              {endereco || 'Endereço não informado'}
            </p>
          </div>

          {endereco && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Waze</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          )}
        </div>

        {/* Card: Pagamento & Cobrança */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cobrança & Pagamento</span>
          </h2>

          <div className="p-3.5 bg-stone-950/70 border border-stone-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Forma de Pagamento:</span>
              <span className="font-extrabold uppercase text-stone-200 bg-stone-800 px-2 py-0.5 rounded text-[11px]">
                {order.forma_pagamento || 'Não informada'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Taxa de Entrega:</span>
              <span className="font-mono font-medium text-stone-300">
                {formatCurrency(order.taxa_entrega || 0)}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
              <span className="text-sm font-bold text-stone-200">Total a Cobrar:</span>
              <span className="font-mono font-black text-lg text-emerald-400">
                {formatCurrency(orderTotal)}
              </span>
            </div>
          </div>

          {/* Troco Destaque */}
          {trocoValor > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>⚠️ Levar Troco para:</span>
                <span className="font-mono text-sm">{formatCurrency(order.troco_para || 0)}</span>
              </div>
              <div className="flex items-center justify-between font-extrabold text-amber-300 text-sm pt-1 border-t border-amber-500/20">
                <span>Valor a Devolver:</span>
                <span className="font-mono">{formatCurrency(trocoValor)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card: Itens do Pedido (Colapsável) */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-2">
          <button
            type="button"
            onClick={() => setShowItens(!showItens)}
            className="w-full flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-stone-400 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-purple-400" />
              <span>Itens do Pedido ({order.itens.length})</span>
            </span>
            {showItens ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showItens && (
            <div className="space-y-2 pt-2 divide-y divide-stone-800/80">
              {order.itens
                .filter((it) => it.status === 'ativo')
                .map((item, idx) => (
                  <div key={item.id || idx} className="pt-2 first:pt-0 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-stone-200">
                        <span className="text-purple-400 mr-1.5">{item.quantidade}x</span>
                        <span>{item.nome}</span>
                      </div>
                      <span className="font-mono text-stone-400 shrink-0">
                        {formatCurrency(item.preco_total)}
                      </span>
                    </div>

                    {/* Tamanho / Borda / Massa */}
                    {(item.tamanho || item.borda_recheada || item.tipo_massa) && (
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {[
                          item.tamanho ? `Tam: ${item.tamanho}` : null,
                          item.borda_recheada ? `Borda: ${item.borda_recheada}` : null,
                          item.tipo_massa ? `Massa: ${item.tipo_massa}` : null,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}

                    {/* Sabores divididos */}
                    {item.sabores && item.sabores.length > 0 && (
                      <p className="text-[11px] text-purple-300 mt-0.5">
                        Sabores: {item.sabores.map((s) => s.nome).join(' / ')}
                      </p>
                    )}

                    {/* Observação */}
                    {item.observacao && (
                      <p className="text-[11px] text-amber-300/90 mt-0.5 italic">
                        Obs: "{item.observacao}"
                      </p>
                    )}
                  </div>
                ))}

              {order.observacao && (
                <div className="pt-2.5 mt-2 border-t border-dashed border-stone-800 text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl">
                  <strong>Observação Geral:</strong> {order.observacao}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 p-3 z-40 shadow-2xl">
        <div className="max-w-lg mx-auto">
          {isEntregue ? (
            <div className="py-3 px-4 bg-emerald-600/20 border border-emerald-500/50 rounded-2xl text-center text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Entrega Finalizada com Sucesso!</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={isFinishing}
              onClick={handleFinalizarEntrega}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            >
              {isFinishing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Atualizando no Sistema...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Finalizar Entrega</span>
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
