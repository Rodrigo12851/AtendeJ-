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

  // Tela de Expiração LGPD (Modo Claro)
  if (order && isExpired) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full bg-white border border-slate-200/90 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center">
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
            <p className="text-slate-500 text-xs leading-relaxed">
              Por privacidade e LGPD, os dados do cliente foram desativados após 5 minutos da entrega.
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
                <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium">🛵 Obrigado! Pode fechar esta aba.</p>
        </div>
      </div>
    );
  }

  // Pedido não encontrado (Modo Claro)
  if (!order) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex items-center justify-center p-4">
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
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-slate-900 font-sans flex flex-col justify-start pb-28 selection:bg-orange-500 selection:text-white">
      
      {/* 1. CABEÇALHO (MODO CLARO) */}
      <header className="bg-white border-b border-slate-200/90 px-4 pt-3 pb-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="text-orange-600">
              <Bike className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">ENTREGADOR</span>
                <span className="text-lg font-black text-slate-900 font-mono leading-none">#{order.id}</span>
              </div>
              <div className="text-xs text-slate-500 font-bold leading-none mt-1 truncate max-w-[170px]">
                {loja?.nome || 'Filial — Shopping'}
              </div>
            </div>
          </div>
        </div>

        {/* Badge Status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 font-black text-xs tracking-wide shrink-0 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
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

      {/* 2. CONTEÚDO PRINCIPAL - CARDS EM MODO CLARO */}
      <main className="max-w-md w-full mx-auto px-4 py-3 space-y-3">
        
        {/* CARD 1: CLIENTE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          {/* Linha superior: Avatar, Nome Completo e Telefone */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 text-base border border-slate-200">
              👤
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                CLIENTE
              </span>
              <p className="text-base font-black text-slate-900 mt-1 leading-snug break-words">
                {order.cliente_nome || 'Cliente não informado'}
              </p>
              {telefone ? (
                <p className="text-xs text-slate-600 font-mono mt-0.5 leading-none flex items-center gap-1 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{telefone}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5 leading-none">Sem telefone cadastrado</p>
              )}
            </div>
          </div>

          {/* Linha inferior: Botões WhatsApp e Ligar */}
          {telefone && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
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
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-200/80"
              >
                <Phone className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Ligar</span>
              </a>
            </div>
          )}
        </div>

        {/* CARD 2: ENDEREÇO DE ENTREGA + MAPA */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 border border-red-100">
                <MapPin className="w-5 h-5 fill-red-600 text-red-600" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                  ENDEREÇO DE ENTREGA
                </span>
                <p className="text-sm font-black text-slate-900 leading-snug mt-1 line-clamp-2">
                  {enderecoLimpo || 'Endereço não informado'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-none">
                  Bairro: <strong className="text-slate-800">{bairro}</strong>
                </p>

                {/* Tags Tipo e Distância */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold flex items-center gap-1 leading-none border border-slate-200">
                    <Home className="w-3 h-3 text-slate-500" />
                    <span>Residencial</span>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold flex items-center gap-1 leading-none border border-slate-200">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>3,4 km</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mini preview do mapa (Claro) */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-24 h-20 rounded-xl overflow-hidden relative shrink-0 border border-slate-200 bg-slate-100 block group hover:border-blue-500 transition"
              title="Abrir no Google Maps"
            >
              <svg className="w-full h-full opacity-60" viewBox="0 0 100 80" fill="none">
                <path d="M-10 20 L110 50" stroke="#cbd5e1" strokeWidth="5" />
                <path d="M20 -10 L60 90" stroke="#cbd5e1" strokeWidth="5" />
                <path d="M70 -10 L30 90" stroke="#e2e8f0" strokeWidth="4" />
                <path d="M-10 65 L110 25" stroke="#e2e8f0" strokeWidth="4" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-5 h-5 fill-red-600 text-red-600 drop-shadow" />
              </div>
              <div className="absolute bottom-1 left-1 right-1 bg-white/95 py-0.5 px-1 rounded text-[8px] font-bold text-slate-700 flex items-center justify-center gap-0.5 leading-none shadow-2xs border border-slate-200">
                <Navigation className="w-2 h-2 text-blue-600" />
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
              className="py-2.5 px-3 bg-[#1D63FF] hover:bg-[#1553dd] active:scale-95 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-md shadow-[#1D63FF]/20"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <div className="text-left leading-tight">
                <div className="text-xs font-black">Navegar</div>
                <div className="text-[9px] text-blue-100 font-normal">Google Maps</div>
              </div>
            </a>

            <button
              type="button"
              onClick={handleCopyAddress}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition border border-slate-200 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>{copiedAddress ? 'Copiado!' : 'Copiar endereço'}</span>
            </button>
          </div>
        </div>

        {/* CARD 3: COBRANÇA */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                COBRANÇA
              </span>
            </div>

            <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-emerald-700 text-xs font-black uppercase flex items-center gap-1">
              <span>❖</span>
              <span>{order.forma_pagamento || 'PIX'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs text-slate-500 block font-bold leading-none">Total a cobrar</span>
              <span className="text-2xl font-black text-emerald-600 font-mono leading-tight mt-0.5 block">
                {formatCurrency(orderTotal)}
              </span>
            </div>

            <div className="p-2.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left max-w-[180px]">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 leading-none">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>A receber</span>
              </div>
              <p className="text-[10px] text-emerald-900 leading-tight mt-1 font-medium">
                {trocoValor > 0
                  ? `Troco p/ ${formatCurrency(order.troco_para || 0)}`
                  : 'Confirmar com o cliente na entrega.'}
              </p>
            </div>
          </div>
        </div>

        {/* CARD 4: ITENS DO PEDIDO */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-slate-900">
                ITENS DO PEDIDO ({activeItens.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowItensModal(true)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Ver detalhes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {firstItem && (
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white shrink-0 border border-slate-200 flex items-center justify-center text-lg shadow-2xs">
                  🍔
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate leading-tight">
                    {firstItem.nome}
                  </p>
                  <p className="text-[11px] text-orange-600 font-mono font-bold leading-none mt-0.5">
                    {firstItem.quantidade}x
                  </p>
                </div>
              </div>

              <div className="font-mono font-bold text-xs text-slate-900 shrink-0">
                {formatCurrency(firstItem.preco_total)}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* 3. BARRA INFERIOR FIXADA NO RODAPÉ (MODO CLARO) */}
      <footer className="fixed bottom-0 left-0 right-0 px-4 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/90 space-y-2 z-40 max-w-md mx-auto shadow-lg shadow-slate-900/5">
        
        {/* Ação 1: Chegou ao local? */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 leading-none">Chegou no local?</p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Confirme que está no endereço do cliente.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setChegouAoLocal(!chegouAoLocal)}
            className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              chegouAoLocal
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{chegouAoLocal ? 'No endereço' : 'Cheguei ao endereço'}</span>
          </button>
        </div>

        {/* Ação 2: Confirmar Entrega */}
        {isEntregue ? (
          <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center text-emerald-800 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ENTREGA CONFIRMADA COM SUCESSO!</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isFinishing}
            onClick={handleFinalizarEntrega}
            className="w-full py-3.5 px-4 bg-[#00A859] hover:bg-[#00914c] active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-between transition shadow-md shadow-[#00A859]/25 cursor-pointer"
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

      {/* MODAL DE DETALHES DOS ITENS (MODO CLARO) */}
      {showItensModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl p-4 shadow-2xl max-h-[80vh] flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span>Itens do Pedido #{order.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowItensModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 text-xs divide-y divide-slate-100">
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
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-md mt-1 italic border border-amber-200">
                      Obs: "{item.observacao}"
                    </p>
                  )}
                </div>
              ))}

              {order.observacao && (
                <div className="pt-2 mt-2 border-t border-dashed border-slate-200 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <strong>Observação:</strong> {order.observacao}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowItensModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition shadow-md"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
