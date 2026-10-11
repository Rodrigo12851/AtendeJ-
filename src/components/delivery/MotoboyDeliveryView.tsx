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
  Info,
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
  const [showItensModal, setShowItensModal] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // Atualiza relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Encontra pedido
  const orderList = allOrders && allOrders.length > 0 ? allOrders : orders;
  const order = orderList.find((o) => o.id === pedidoId);
  const loja = lojas.find((l) => l.id === order?.loja_id) || lojas[0];

  const endereco = order?.cliente_endereco || order?.delivery_info?.endereco || '';
  const telefone = order?.cliente_telefone || order?.delivery_info?.telefone || '';
  const cleanPhone = telefone.replace(/\D/g, '');

  const activeItens = order ? order.itens.filter((it) => it.status === 'ativo') : [];
  const orderTotal = order
    ? activeItens.reduce((acc, it) => acc + it.preco_total, 0) + (order.taxa_entrega || 0)
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

  // Cálculo de expiração LGPD (5 min após entrega)
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

  // Tela de Expiração LGPD
  if (order && isExpired) {
    return (
      <div className="h-screen w-full bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full bg-white border border-slate-200/80 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-600 border-2 border-white text-white rounded-full flex items-center justify-center shadow-md">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider inline-block">
              ✓ Entrega Concluída
            </span>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Acesso Expirado por Segurança
            </h1>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Os dados de contato e endereço expiram 5 minutos após a entrega por segurança e LGPD.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Pedido:</span>
              <span className="font-mono font-black text-slate-900">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Loja:</span>
              <span className="font-bold text-slate-800 truncate max-w-[170px]">{loja?.nome}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Concluído
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">🛵 Obrigado! Pode fechar esta aba.</p>
        </div>
      </div>
    );
  }

  // Pedido não encontrado
  if (!order) {
    return (
      <div className="h-screen w-full bg-slate-50 text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Pedido #{pedidoId} não localizado</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Verifique o link ou se o pedido ainda está sincronizando.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-100/90 text-slate-800 font-sans flex flex-col justify-between overflow-hidden select-none">
      
      {/* 1. TOPO COMPACTO: Marca, Pedido, Status e Relógio */}
      <header className="bg-white border-b border-slate-200 px-3.5 py-2 shrink-0 shadow-2xs">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bike className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">Entregador</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono font-black text-sm text-slate-900">#{order.id}</span>
              </div>
              <h1 className="text-xs font-bold text-slate-700 truncate leading-tight">
                {loja?.nome || 'AtendeJá Delivery'}
              </h1>
            </div>
          </div>

          {/* Badge de Status Atual */}
          <div className="flex flex-col items-end shrink-0">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-2xs flex items-center gap-1 ${
                isEntregue
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : order.status === 'a_caminho'
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isEntregue ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                  <span>ENTREGUE</span>
                </>
              ) : order.status === 'a_caminho' ? (
                <>
                  <Bike className="w-3 h-3 text-blue-600 animate-pulse stroke-[2.5]" />
                  <span>A CAMINHO</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-amber-600 stroke-[2.5]" />
                  <span>PRONTO</span>
                </>
              )}
            </span>
            {isEntregue && (
              <span className="text-[9px] font-mono text-orange-600 font-bold mt-0.5 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                LGPD: {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 2. CORPO PRINCIPAL COMPACTO (TUDO CABE EM UMA TELA SEM ROLAGEM) */}
      <main className="max-w-lg w-full mx-auto p-3 flex-1 flex flex-col justify-between gap-2 min-h-0 overflow-hidden">
        
        {/* CARD 1: CLIENTE & CONTATO RÁPIDO */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                Cliente
              </span>
              <p className="text-sm font-black text-slate-900 truncate mt-0.5 leading-snug">
                {order.cliente_nome || 'Cliente não identificado'}
              </p>
            </div>
            {telefone && (
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                {telefone}
              </span>
            )}
          </div>

          {telefone && (
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${cleanPhone}`}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition border border-slate-200 shadow-2xs"
              >
                <Phone className="w-4 h-4 text-slate-700" />
                <span>Ligar</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* CARD 2: ENDEREÇO & BOTÕES DE GPS (MAPS & WAZE) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2 shrink-0">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                Endereço de Entrega
              </span>
              <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mt-1">
                {endereco || 'Endereço não informado'}
              </p>
            </div>
          </div>

          {endereco && (
            <div className="grid grid-cols-2 gap-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>Google Maps</span>
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>Waze</span>
              </a>
            </div>
          )}
        </div>

        {/* CARD 3: PAGAMENTO, TOTAL & TROCO (EM LINHA COMPACTA) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Cobrança
              </span>
            </div>

            <span className="font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              {order.forma_pagamento || 'Não informada'}
            </span>
          </div>

          {/* Valor Total Destaque */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600">Total a Cobrar:</span>
            <span className="font-mono font-black text-lg text-emerald-600 leading-none">
              {formatCurrency(orderTotal)}
            </span>
          </div>

          {/* Troco Destaque em 1 linha */}
          {trocoValor > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <span>⚠️</span>
                <span>Troco p/ {formatCurrency(order.troco_para || 0)}</span>
              </span>
              <span className="font-black font-mono text-red-600">
                Devolver: {formatCurrency(trocoValor)}
              </span>
            </div>
          )}
        </div>

        {/* CARD 4: BOTÃO DISCRETO PARA VER ITENS (NÃO OCUPA A TELA) */}
        <button
          type="button"
          onClick={() => setShowItensModal(true)}
          className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-between shadow-2xs cursor-pointer shrink-0 transition"
        >
          <div className="flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-purple-600" />
            <span>Itens do Pedido ({activeItens.length})</span>
            {order.observacao && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Contém observações" />
            )}
          </div>
          <span className="text-[11px] text-orange-600 font-extrabold flex items-center gap-0.5">
            Ver detalhes <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </button>

      </main>

      {/* 3. RODAPÉ FIXO COMPACTO COM O BOTÃO DE AÇÃO */}
      <footer className="bg-white border-t border-slate-200 p-3 shrink-0 shadow-lg">
        <div className="max-w-lg mx-auto">
          {isEntregue ? (
            <div className="py-3 px-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>ENTREGA CONCLUÍDA COM SUCESSO!</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={isFinishing}
              onClick={handleFinalizarEntrega}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              {isFinishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Finalizando no Caixa...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Finalizar Entrega</span>
                  <ArrowRight className="w-4 h-4 opacity-80" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>

      {/* MODAL COMPACTO DE ITENS (ABRE APENAS SE O MOTOBOY QUISER CONFERIR) */}
      {showItensModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-sm w-full bg-white rounded-3xl p-4 shadow-2xl max-h-[85vh] flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span>Itens do Pedido #{order.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowItensModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 text-xs divide-y divide-slate-100">
              {activeItens.map((item, idx) => (
                <div key={item.id || idx} className="pt-2 first:pt-0">
                  <div className="flex justify-between items-start font-bold text-slate-900">
                    <div>
                      <span className="text-orange-600 mr-1.5 font-black">{item.quantidade}x</span>
                      <span>{item.nome}</span>
                    </div>
                    <span className="font-mono text-slate-700">{formatCurrency(item.preco_total)}</span>
                  </div>

                  {(item.tamanho || item.borda_recheada || item.tipo_massa) && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {[
                        item.tamanho ? `Tam: ${item.tamanho}` : null,
                        item.borda_recheada ? `Borda: ${item.borda_recheada}` : null,
                        item.tipo_massa ? `Massa: ${item.tipo_massa}` : null,
                      ].filter(Boolean).join(' • ')}
                    </p>
                  )}

                  {item.sabores && item.sabores.length > 0 && (
                    <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
                      Sabores: {item.sabores.map((s) => s.nome).join(' / ')}
                    </p>
                  )}

                  {item.observacao && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-md mt-1 italic">
                      Obs: "{item.observacao}"
                    </p>
                  )}
                </div>
              ))}

              {order.observacao && (
                <div className="pt-2.5 mt-2 border-t border-dashed border-slate-200 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl">
                  <strong>Observação Geral:</strong> {order.observacao}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowItensModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
