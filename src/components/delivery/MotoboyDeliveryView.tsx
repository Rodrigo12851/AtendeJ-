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
  ArrowRight,
  Sparkles,
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
  const [showItens, setShowItens] = useState(false);
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

  // If link has expired (> 5 minutes after delivery), protect customer data completely (MODO CLARO)
  if (order && isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-white">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 text-center space-y-5 shadow-xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Shield & Lock Icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-600 border-2 border-white text-white rounded-full flex items-center justify-center shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-black uppercase tracking-wider inline-block">
              ✓ Entrega Concluída • Dados Protegidos
            </span>
            <h1 className="text-xl font-black text-slate-900 pt-1 tracking-tight">
              Acesso Expirado por Segurança
            </h1>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
              Este pedido foi finalizado com sucesso. Por motivos de privacidade e conformidade com a LGPD, o endereço e telefone do cliente expiraram <strong>5 minutos</strong> após a entrega.
            </p>
          </div>

          {/* Resumo do Pedido Entregue */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Pedido:</span>
              <span className="font-mono font-black text-slate-900 text-sm">#{order.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Estabelecimento:</span>
              <span className="font-bold text-slate-800">{loja?.nome || 'Pizzaria'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Horário da Entrega:</span>
              <span className="font-mono text-emerald-700 font-bold">
                {order.entregue_em ? formatDateTime(order.entregue_em) : 'Finalizado'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-400 font-medium">Status no Sistema:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Entregue & Fechado
              </span>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">🛵 Obrigado pelo seu trabalho na entrega!</p>
            <p className="text-[11px] text-slate-400">Você já pode fechar esta aba com tranquilidade.</p>
          </div>
        </div>
      </div>
    );
  }

  // If order was not found yet (MODO CLARO)
  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Pedido #{pedidoId} não localizado</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Verifique se o link foi aberto corretamente ou se o pedido ainda está sincronizando com o sistema da pizzaria.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-32 selection:bg-orange-500 selection:text-white">
      {/* Top Header - Modo Claro com logo e destaque */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Bike className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-orange-600 font-black flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Painel do Entregador</span>
              </div>
              <h1 className="text-base font-black text-slate-900 leading-tight truncate max-w-[200px]">
                {loja?.nome || 'AtendeJá Delivery'}
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Comanda / Pedido</span>
            <span className="font-mono font-black text-lg text-slate-900 leading-none">#{order.id}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto p-4 space-y-3.5">

        {/* Status Card - Moderno, Claro e Vibrante */}
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isEntregue
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : order.status === 'a_caminho'
              ? 'bg-blue-50/80 border-blue-200 text-blue-950'
              : order.status === 'pronto'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-orange-50/80 border-orange-200 text-orange-950'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isEntregue
                    ? 'bg-emerald-500 text-white'
                    : order.status === 'a_caminho'
                    ? 'bg-blue-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isEntregue ? (
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <Bike className="w-6 h-6 stroke-[2.5] animate-pulse" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Status da Entrega
                </span>
                <span className="text-base font-black tracking-tight">
                  {isEntregue
                    ? 'ENTREGA CONCLUÍDA'
                    : order.status === 'a_caminho'
                    ? 'A CAMINHO DO CLIENTE'
                    : order.status === 'pronto'
                    ? 'PRONTO PARA DESPACHO'
                    : 'EM PRODUÇÃO'}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono font-semibold text-slate-500 bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
              <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              {order.criado_em ? formatDateTime(order.criado_em) : '--:--'}
            </div>
          </div>

          {isEntregue && (
            <div className="mt-3 pt-3 border-t border-emerald-200/70 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span>Pedido baixado e fechado automaticamente no caixa!</span>
            </div>
          )}
        </div>

        {/* Countdown Banner de Expiração / Proteção de Dados (5 minutos) */}
        {isEntregue && (
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-2xl text-slate-700 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-xs leading-tight">
                  Proteção LGPD Ativa
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Os dados do cliente expirarão em:
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 bg-white border border-orange-300 rounded-xl font-mono font-black text-orange-600 text-xs shrink-0 flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 animate-spin text-orange-500" />
              <span>
                {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Card: Cliente */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-black">
                👤
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Cliente
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              ID #{order.id}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3">
            <p className="text-base font-black text-slate-900 leading-snug">
              {order.cliente_nome || 'Cliente não identificado'}
            </p>
            {telefone ? (
              <p className="text-xs text-slate-600 font-mono font-semibold mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{telefone}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Telefone não informado</p>
            )}
          </div>

          {telefone && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${cleanPhone}`}
                className="py-3 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition border border-slate-200/80 shadow-2xs"
              >
                <Phone className="w-4 h-4 text-slate-700" />
                <span>Ligar</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Card: Endereço & Rotas GPS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs font-black">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Endereço de Entrega
            </h2>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl">
            <p className="text-sm font-bold text-slate-900 leading-snug">
              {endereco || 'Endereço não informado'}
            </p>
          </div>

          {endereco && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/20"
              >
                <Navigation className="w-4 h-4" />
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-md shadow-sky-500/20"
              >
                <Navigation className="w-4 h-4" />
                <span>Waze</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            </div>
          )}
        </div>

        {/* Card: Pagamento & Cobrança */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Cobrança & Pagamento
            </h2>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Forma de Pagamento:</span>
              <span className="font-black uppercase text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[11px] shadow-2xs">
                {order.forma_pagamento || 'Não informada'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Taxa de Entrega:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(order.taxa_entrega || 0)}
              </span>
            </div>

            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-black text-slate-800">Total a Cobrar:</span>
              <span className="font-mono font-black text-xl text-emerald-600">
                {formatCurrency(orderTotal)}
              </span>
            </div>
          </div>

          {/* Troco Destaque */}
          {trocoValor > 0 && (
            <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Levar Troco para:</span>
                </span>
                <span className="font-mono font-black text-sm">{formatCurrency(order.troco_para || 0)}</span>
              </div>
              <div className="flex items-center justify-between font-black text-amber-950 text-sm pt-1.5 border-t border-amber-200">
                <span>Valor a Devolver:</span>
                <span className="font-mono text-base text-red-600">{formatCurrency(trocoValor)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card: Itens do Pedido (Colapsável) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
          <button
            type="button"
            onClick={() => setShowItens(!showItens)}
            className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-600 cursor-pointer py-1"
          >
            <span className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <span>Itens do Pedido ({order.itens.length})</span>
            </span>
            <div className="flex items-center gap-1 text-slate-400 font-semibold text-xs">
              <span>{showItens ? 'Ocultar' : 'Ver Detalhes'}</span>
              {showItens ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
            </div>
          </button>

          {showItens && (
            <div className="space-y-2.5 pt-3 divide-y divide-slate-100 border-t border-slate-100 mt-2">
              {order.itens
                .filter((it) => it.status === 'ativo')
                .map((item, idx) => (
                  <div key={item.id || idx} className="pt-2.5 first:pt-0 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 leading-snug">
                        <span className="text-orange-600 font-black mr-1.5">{item.quantidade}x</span>
                        <span>{item.nome}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700 shrink-0">
                        {formatCurrency(item.preco_total)}
                      </span>
                    </div>

                    {/* Tamanho / Borda / Massa */}
                    {(item.tamanho || item.borda_recheada || item.tipo_massa) && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
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
                      <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
                        Sabores: {item.sabores.map((s) => s.nome).join(' / ')}
                      </p>
                    )}

                    {/* Observação do Item */}
                    {item.observacao && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 p-1.5 rounded-md mt-1 italic">
                        Obs: "{item.observacao}"
                      </p>
                    )}
                  </div>
                ))}

              {order.observacao && (
                <div className="pt-3 mt-2 border-t border-dashed border-slate-200 text-xs text-amber-900 bg-amber-50/80 border border-amber-200 p-3 rounded-xl space-y-0.5">
                  <strong className="block text-[11px] uppercase tracking-wider text-amber-700">Observação Geral do Pedido:</strong>
                  <p>{order.observacao}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 z-40 shadow-xl shadow-slate-900/10">
        <div className="max-w-lg mx-auto">
          {isEntregue ? (
            <div className="py-3.5 px-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center text-emerald-800 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
              <span>ENTREGA FINALIZADA COM SUCESSO!</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={isFinishing}
              onClick={handleFinalizarEntrega}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
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
                  <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
