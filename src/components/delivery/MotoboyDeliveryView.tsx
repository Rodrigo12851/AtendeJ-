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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  ArrowRight,
  Copy,
  Home,
  CheckCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/formatters';

interface MotoboyDeliveryViewProps {
  pedidoId: number;
  token?: string;
}

export const MotoboyDeliveryView: React.FC<MotoboyDeliveryViewProps> = ({
  pedidoId,
}) => {
  const { orders, allOrders, lojas, updateOrderStatus, closeComanda } = useStore();
  const [isFinishing, setIsFinishing] = useState(false);
  const [chegouAoLocal, setChegouAoLocal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
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

  const rawEndereco = order?.cliente_endereco || order?.delivery_info?.endereco || '';
  // Limpa repetições de bairro se houver
  const enderecoLimpo = rawEndereco.replace(/\s*\([^)]*Bairro[^)]*\)/gi, '').trim();
  const bairro = order?.delivery_info?.bairro || 'Centro';
  const telefone = order?.cliente_telefone || order?.delivery_info?.telefone || '';
  const cleanPhone = telefone.replace(/\D/g, '');

  const activeItens = order ? order.itens.filter((it) => it.status === 'ativo') : [];
  const firstItem = activeItens[0];
  const orderTotal = order
    ? activeItens.reduce((acc, it) => acc + it.preco_total, 0) + (order.taxa_entrega || 0)
    : 0;

  const trocoValor =
    order?.troco_para && order.troco_para > orderTotal
      ? order.troco_para - orderTotal
      : 0;

  const handleCopyAddress = () => {
    if (!enderecoLimpo) return;
    navigator.clipboard.writeText(enderecoLimpo);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

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

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoLimpo)}`;
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
      <div className="min-h-screen w-full bg-[#0B1017] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full bg-[#121A24] border border-[#1E293B] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-600 border-2 border-[#121A24] text-white rounded-full flex items-center justify-center shadow-md">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider inline-block">
              ✓ Entrega Concluída
            </span>
            <h1 className="text-lg font-black text-white tracking-tight">
              Acesso Expirado por Segurança
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Por privacidade e LGPD, os dados do cliente foram desativados após 5 minutos da entrega.
            </p>
          </div>

          <div className="p-3 bg-[#0B1017] border border-[#1E293B] rounded-xl text-left space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Pedido:</span>
              <span className="font-mono font-black text-white">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Loja:</span>
              <span className="font-bold text-white truncate max-w-[170px]">{loja?.nome}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium">🛵 Obrigado! Pode fechar esta aba.</p>
        </div>
      </div>
    );
  }

  // Pedido não encontrado
  if (!order) {
    return (
      <div className="min-h-screen w-full bg-[#0B1017] text-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-[#121A24] border border-[#1E293B] rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-white">Pedido #{pedidoId} não localizado</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Verifique o link ou se o pedido ainda está sincronizando.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0B1017] text-white font-sans flex flex-col justify-start pb-24 selection:bg-emerald-500 selection:text-white">
      
      {/* 1. CABEÇALHO */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-[#121A24] border border-[#1E293B] flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="text-orange-500">
              <Bike className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">ENTREGADOR</span>
                <span className="text-lg font-black text-white font-mono leading-none">#{order.id}</span>
              </div>
              <div className="text-xs text-slate-400 font-medium leading-none mt-1 truncate max-w-[170px]">
                {loja?.nome || 'Filial — Shopping'}
              </div>
            </div>
          </div>
        </div>

        {/* Badge Status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/70 bg-[#1A1608] text-amber-400 font-black text-xs tracking-wide shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span className="uppercase">
            {isEntregue
              ? 'CONCLUÍDO'
              : order.status === 'a_caminho'
              ? 'A CAMINHO'
              : order.status === 'pronto'
              ? 'PRONTO'
              : 'PREPARO'}
          </span>
        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL - CARDS COM LETRAS LEGÍVEIS E ESPAÇAMENTO COMPACTO REAL */}
      <main className="max-w-md w-full mx-auto px-4 py-2 space-y-3">
        
        {/* CARD 1: CLIENTE */}
        <div className="bg-[#121A24] border border-[#1E293B] rounded-2xl p-3.5 shadow-lg space-y-3">
          {/* Linha superior: Avatar, Nome Completo e Telefone */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1E293B] text-slate-300 flex items-center justify-center shrink-0 text-base border border-slate-700/50">
              👤
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                CLIENTE
              </span>
              <p className="text-base font-black text-white mt-1 leading-snug break-words">
                {order.cliente_nome || 'Cliente não informado'}
              </p>
              {telefone ? (
                <p className="text-xs text-slate-400 font-mono mt-0.5 leading-none flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{telefone}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-0.5 leading-none">Sem telefone cadastrado</p>
              )}
            </div>
          </div>

          {/* Linha inferior: Botões WhatsApp e Ligar amplos e confortáveis */}
          {telefone && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1E293B]/70">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#00A859] hover:bg-[#00914c] active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-[#00A859]/20"
              >
                <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:${cleanPhone}`}
                className="py-2.5 px-3 bg-[#1E293B] hover:bg-[#283548] active:scale-95 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-700/60"
              >
                <Phone className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Ligar</span>
              </a>
            </div>
          )}
        </div>

        {/* CARD 2: ENDEREÇO DE ENTREGA + MAPA */}
        <div className="bg-[#121A24] border border-[#1E293B] rounded-2xl p-3.5 shadow-lg space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 fill-red-500 text-red-500" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                  ENDEREÇO DE ENTREGA
                </span>
                <p className="text-sm font-black text-white leading-snug mt-1 line-clamp-2">
                  {enderecoLimpo || 'Endereço não informado'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-none">
                  Bairro: {bairro}
                </p>

                {/* Tags Tipo e Distância */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-[#1E293B] text-slate-300 rounded-md text-[10px] font-bold flex items-center gap-1 leading-none">
                    <Home className="w-3 h-3 text-slate-400" />
                    <span>Residencial</span>
                  </span>
                  <span className="px-2 py-0.5 bg-[#1E293B] text-slate-300 rounded-md text-[10px] font-bold flex items-center gap-1 leading-none">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>3,4 km</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mini preview do mapa */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-24 h-20 rounded-xl overflow-hidden relative shrink-0 border border-slate-700/60 bg-[#0F172A] block group"
              title="Abrir no Google Maps"
            >
              <svg className="w-full h-full opacity-40" viewBox="0 0 100 80" fill="none">
                <path d="M-10 20 L110 50" stroke="#334155" strokeWidth="4" />
                <path d="M20 -10 L60 90" stroke="#334155" strokeWidth="4" />
                <path d="M70 -10 L30 90" stroke="#334155" strokeWidth="3" />
                <path d="M-10 65 L110 25" stroke="#334155" strokeWidth="3" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-5 h-5 fill-red-500 text-red-500 drop-shadow" />
              </div>
              <div className="absolute bottom-1 left-1 right-1 bg-[#121A24]/90 py-0.5 px-1 rounded text-[8px] font-bold text-slate-200 flex items-center justify-center gap-0.5 leading-none">
                <Navigation className="w-2 h-2 text-blue-400" />
                <span>Ver no mapa</span>
              </div>
            </a>
          </div>

          {/* Botões Navegar e Copiar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-[#1D63FF] hover:bg-[#1553dd] active:scale-95 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-xs"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <div className="text-left leading-tight">
                <div className="text-xs font-black">Navegar</div>
                <div className="text-[9px] text-blue-200 font-normal">Google Maps</div>
              </div>
            </a>

            <button
              type="button"
              onClick={handleCopyAddress}
              className="py-2.5 px-3 bg-[#1E293B] hover:bg-[#283548] active:scale-95 text-slate-200 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition border border-slate-700/60 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-slate-400" />
              <span>{copiedAddress ? 'Copiado!' : 'Copiar endereço'}</span>
            </button>
          </div>
        </div>

        {/* CARD 3: COBRANÇA */}
        <div className="bg-[#121A24] border border-[#1E293B] rounded-2xl p-3.5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                COBRANÇA
              </span>
            </div>

            <div className="px-2.5 py-1 bg-[#1E293B] border border-slate-700/60 rounded-lg text-emerald-400 text-xs font-extrabold uppercase flex items-center gap-1">
              <span>❖</span>
              <span>{order.forma_pagamento || 'PIX'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs text-slate-400 block font-medium leading-none">Total a cobrar</span>
              <span className="text-2xl font-black text-emerald-400 font-mono leading-tight mt-0.5 block">
                {formatCurrency(orderTotal)}
              </span>
            </div>

            <div className="p-2 px-3 bg-[#0C1E1B] border border-emerald-500/30 rounded-xl text-left max-w-[170px]">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 leading-none">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>A receber</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight mt-1">
                {trocoValor > 0
                  ? `Troco p/ ${formatCurrency(order.troco_para || 0)}`
                  : 'Confirmar com o cliente na entrega.'}
              </p>
            </div>
          </div>
        </div>

        {/* CARD 4: ITENS DO PEDIDO */}
        <div className="bg-[#121A24] border border-[#1E293B] rounded-2xl p-3 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-white">
                ITENS DO PEDIDO ({activeItens.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowItensModal(true)}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <span>Ver detalhes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {firstItem && (
            <div className="flex items-center justify-between gap-2 p-2 bg-[#0B1017] rounded-xl border border-[#1E293B]/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-800 shrink-0 border border-slate-700/60 flex items-center justify-center text-lg">
                  🍔
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-white truncate leading-tight">
                    {firstItem.nome}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono leading-none mt-0.5">
                    {firstItem.quantidade}x
                  </p>
                </div>
              </div>

              <div className="font-mono font-bold text-xs text-white shrink-0">
                {formatCurrency(firstItem.preco_total)}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* 3. BARRA INFERIOR FIXADA NO RODAPÉ */}
      <footer className="fixed bottom-0 left-0 right-0 px-4 py-2.5 bg-[#0B1017]/95 backdrop-blur-md border-t border-[#1E293B] space-y-2 z-40 max-w-md mx-auto">
        
        {/* Ação 1: Chegou ao local? */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white leading-none">Chegou no local?</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Confirme que está no endereço do cliente.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setChegouAoLocal(!chegouAoLocal)}
            className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              chegouAoLocal
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#122E26] text-emerald-400 border border-emerald-500/40 hover:bg-[#173b30]'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{chegouAoLocal ? 'No endereço' : 'Cheguei ao endereço'}</span>
          </button>
        </div>

        {/* Ação 2: Confirmar Entrega */}
        {isEntregue ? (
          <div className="w-full py-3 px-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl text-center text-emerald-400 text-xs font-black flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>ENTREGA CONFIRMADA COM SUCESSO!</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isFinishing}
            onClick={handleFinalizarEntrega}
            className="w-full py-3 px-4 bg-[#00A859] hover:bg-[#00914c] active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-between transition shadow-lg shadow-[#00A859]/25 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Bike className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black leading-tight">Confirmar entrega</div>
                <div className="text-[10px] text-emerald-100 font-normal leading-none">
                  Finalize apenas ao entregar o pedido.
                </div>
              </div>
            </div>

            {isFinishing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        )}

      </footer>

      {/* MODAL DE DETALHES DOS ITENS */}
      {showItensModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-sm w-full bg-[#121A24] border border-[#1E293B] rounded-3xl p-4 shadow-2xl max-h-[80vh] flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-400" />
                <span>Itens do Pedido #{order.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowItensModal(false)}
                className="w-7 h-7 rounded-full bg-[#1E293B] text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 text-xs divide-y divide-[#1E293B]">
              {activeItens.map((item, idx) => (
                <div key={item.id || idx} className="pt-2 first:pt-0">
                  <div className="flex justify-between items-start font-bold text-white">
                    <div>
                      <span className="text-orange-500 mr-1.5 font-black">{item.quantidade}x</span>
                      <span>{item.nome}</span>
                    </div>
                    <span className="font-mono text-slate-300">{formatCurrency(item.preco_total)}</span>
                  </div>

                  {(item.tamanho || item.borda_recheada || item.tipo_massa) && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {[
                        item.tamanho ? `Tam: ${item.tamanho}` : null,
                        item.borda_recheada ? `Borda: ${item.borda_recheada}` : null,
                        item.tipo_massa ? `Massa: ${item.tipo_massa}` : null,
                      ].filter(Boolean).join(' • ')}
                    </p>
                  )}

                  {item.sabores && item.sabores.length > 0 && (
                    <p className="text-[11px] text-purple-300 font-semibold mt-0.5">
                      Sabores: {item.sabores.map((s) => s.nome).join(' / ')}
                    </p>
                  )}

                  {item.observacao && (
                    <p className="text-[11px] text-amber-300 bg-amber-500/10 p-1.5 rounded-md mt-1 italic border border-amber-500/20">
                      Obs: "{item.observacao}"
                    </p>
                  )}
                </div>
              ))}

              {order.observacao && (
                <div className="pt-2 mt-2 border-t border-dashed border-[#1E293B] text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl">
                  <strong>Observação:</strong> {order.observacao}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowItensModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer transition"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
