import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { Order } from '../types';
import { formatTime, formatDateTime, formatCurrency, formatPhone } from '../utils/formatters';
import { useStore } from '../context/StoreContext';

interface KitchenTicketModalProps {
  order: Order;
  pizzariaName?: string;
  autoPrint?: boolean;
  onClose: () => void;
}

export const KitchenTicketModal: React.FC<KitchenTicketModalProps> = ({
  order,
  pizzariaName = 'PIZZARIA ITÁLIA',
  autoPrint = false,
  onClose,
}) => {
  const { currentLoja } = useStore();
  const effectiveBrand = currentLoja?.marca || pizzariaName;
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>(() => {
    return (localStorage.getItem('pizzaria_paper_size') as '80mm' | '58mm') || '80mm';
  });
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById('print-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'print-root';
      document.body.appendChild(el);
    }
    setPrintRoot(el);
  }, []);

  const handlePaperSizeChange = (size: '80mm' | '58mm') => {
    setPaperSize(size);
    localStorage.setItem('pizzaria_paper_size', size);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (autoPrint && printRoot) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, printRoot]);

  const activeItens = order.itens.filter((it) => it.status === 'ativo');
  const isRetirada = order.tipo_pedido === 'retirada';
  const isDelivery = (order.origem === 'delivery' || order.tipo_pedido === 'delivery' || !order.mesa_numero) && !isRetirada;
  const isMesa = !isRetirada && !isDelivery;

  const endereco = order.delivery_info?.endereco || order.cliente_endereco;
  const telefone = order.delivery_info?.telefone || order.cliente_telefone;
  const telefoneFormatado = formatPhone(telefone);

  const rawPagto = order.forma_pagamento || order.delivery_info?.forma_pagamento || '';
  const getPaymentLabel = (raw: string) => {
    const l = raw.toLowerCase();
    if (l.includes('pix')) return 'PIX';
    if (l.includes('dinheiro')) return 'DINHEIRO';
    if (l.includes('debito') || l.includes('débito')) return 'CARTÃO DE DÉBITO';
    if (l.includes('credito') || l.includes('crédito')) return 'CARTÃO DE CRÉDITO';
    if (l.includes('pagar_depois') || l.includes('depois')) return 'A PAGAR NO BALCÃO';
    return raw ? raw.toUpperCase() : 'NÃO INFORMADO';
  };
  const paymentMethodLabel = getPaymentLabel(rawPagto);

  const orderSubtotal = activeItens.reduce((acc, it) => acc + it.preco_total, 0);
  const orderTotal = orderSubtotal + (order.taxa_entrega || 0);

  // Render content of thermal ticket
  const renderTicketContent = (isPrintMedia = false) => (
    <div
      className={`font-mono text-black leading-snug select-text ${
        paperSize === '58mm' ? 'text-[10px]' : 'text-xs'
      }`}
      style={{ fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace" }}
    >
      {/* 1. Header: Logo & Estabelecimento */}
      <div className="text-center pb-2 border-b-2 border-dashed border-black space-y-1">
        {currentLoja?.logo_url && (
          <div className="flex justify-center mb-1">
            <img
              src={currentLoja.logo_url}
              alt="Logo"
              className="max-h-12 max-w-[120px] object-contain filter grayscale contrast-200"
            />
          </div>
        )}
        <h2 className="text-base font-black tracking-wider uppercase text-black">{effectiveBrand}</h2>
        {currentLoja?.nome && (
          <p className="text-[10px] uppercase font-bold text-stone-800">{currentLoja.nome}</p>
        )}
        <div className="font-bold text-[11px] tracking-wider uppercase">
          *** COMANDA DE PRODUÇÃO ***
        </div>

        {/* Box Destaque do Número do Pedido */}
        <div className="my-1 py-1 px-3 border-2 border-black inline-block rounded font-black text-base sm:text-lg tracking-wider bg-white">
          PEDIDO #{order.id}
        </div>

        {/* Card Único e Sem Redundância de Canal & Dados do Cliente */}
        {isRetirada && (
          <div className="mt-1 p-2 border-2 border-black rounded text-left space-y-1 bg-white">
            <div className="font-black text-xs uppercase text-center border-b border-black pb-1 tracking-wide">
              🛍️ RETIRADA NO BALCÃO (BUSCAR NA LOJA)
            </div>
            {order.cliente_nome && (
              <div className="font-black text-xs uppercase">
                CLIENTE: <span className="font-mono">{order.cliente_nome}</span>
              </div>
            )}
            {telefoneFormatado && (
              <div className="font-bold text-[11px]">
                📞 CONTATO: <span className="font-mono">{telefoneFormatado}</span>
              </div>
            )}
            {order.garcom_nome && (
              <div className="text-[10px] text-stone-700">
                Atendente: {order.garcom_nome}
              </div>
            )}
          </div>
        )}

        {isDelivery && (
          <div className="mt-1 p-2 border-2 border-black rounded text-left space-y-1 bg-white">
            <div className="font-black text-xs uppercase text-center border-b border-black pb-1 tracking-wide">
              🛵 ENTREGA DELIVERY (EM DOMICÍLIO)
            </div>
            {order.cliente_nome && (
              <div className="font-black text-xs uppercase">
                CLIENTE: <span className="font-mono">{order.cliente_nome}</span>
              </div>
            )}
            {telefoneFormatado && (
              <div className="font-bold text-[11px]">
                📞 CONTATO: <span className="font-mono">{telefoneFormatado}</span>
              </div>
            )}
            {endereco && (
              <div className="font-black text-[11px] leading-tight pt-0.5">
                📍 ENDEREÇO: {endereco}
              </div>
            )}
            {order.motoboy_nome && (
              <div className="text-[10px] font-bold text-stone-700">
                Entregador: {order.motoboy_nome}
              </div>
            )}
          </div>
        )}

        {isMesa && (
          <div className="mt-1 p-2 border-2 border-black rounded text-left space-y-1 bg-white">
            <div className="font-black text-xs uppercase text-center border-b border-black pb-1 tracking-wide">
              🍽️ SALÃO • MESA {order.mesa_numero ? order.mesa_numero.toString().padStart(2, '0') : '00'} (CONSUMO LOCAL)
            </div>
            {order.cliente_nome && (
              <div className="font-black text-xs uppercase">
                CLIENTE: <span className="font-mono">{order.cliente_nome}</span>
              </div>
            )}
            {order.garcom_nome && (
              <div className="text-[10px] text-stone-700">
                Garçom: {order.garcom_nome}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Items Section */}
      <div className="py-2 border-b-2 border-dashed border-black space-y-2">
        <div className="font-black text-[11px] pb-1 border-b border-black flex justify-between tracking-wider">
          <span>QTD ITEM</span>
          <span className="font-mono">SUBTOTAL</span>
        </div>

        {activeItens.map((item, idx) => (
          <div key={idx} className="space-y-0.5 pb-1.5 border-b border-dotted border-stone-300 last:border-b-0">
            <div className="flex justify-between items-baseline gap-1 font-black text-xs">
              <div className="flex items-baseline gap-1 flex-1 min-w-0">
                <span className="font-mono font-black shrink-0">
                  [{item.quantidade}x]
                </span>
                <span className="leading-tight uppercase font-black">
                  {item.nome}
                </span>
              </div>
              <span className="shrink-0 font-mono font-bold text-right ml-1">
                {formatCurrency(item.preco_total)}
              </span>
            </div>

            {/* Sabores da Pizza */}
            {item.sabores && item.sabores.length > 0 && (
              <div className="pl-4 font-bold text-[11px] leading-tight text-stone-900">
                • Sabores: {item.sabores.join(' + ')}
              </div>
            )}

            {/* Tamanho da Pizza */}
            {item.tamanho && (
              <div className="pl-4 text-[10px] font-medium text-stone-800">
                • Tamanho: {item.tamanho}
              </div>
            )}

            {/* Borda */}
            {item.borda && item.borda.nome !== 'Sem borda' && (
              <div className="pl-4 text-[10px] font-bold text-stone-900">
                + Borda: {item.borda.nome}
              </div>
            )}

            {/* Massa */}
            {item.massa && (
              <div className="pl-4 text-[10px] text-stone-700">
                • Massa: {item.massa}
              </div>
            )}

            {/* Adicionais com destaque claro sem quebras forçadas */}
            {item.adicionais && item.adicionais.length > 0 && (
              <div className="pl-4 text-[11px] font-bold space-y-0.5 text-black">
                {item.adicionais.map((adic, aIdx) => (
                  <div key={aIdx} className="leading-tight">
                    <span>+ {adic.nome}</span>
                    {adic.preco > 0 && (
                      <span className="text-[10px] text-stone-600 font-mono ml-1 font-normal">
                        ({formatCurrency(adic.preco)})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Observação do Item (destaque de atenção para a cozinha!) */}
            {item.observacao && (
              <div className="mt-1 ml-5 p-1 border-2 border-black rounded-xs font-black text-[11px] bg-stone-100 leading-tight">
                ⚠️ OBS: {item.observacao.toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {/* Observação Geral do Pedido */}
        {order.observacao && (
          <div className="mt-2 p-1.5 border-2 border-black rounded-xs font-black text-xs bg-stone-50 text-left">
            <div>⚠️ OBSERVAÇÃO DO PEDIDO:</div>
            <div className="text-[11px] font-bold uppercase mt-0.5">{order.observacao}</div>
          </div>
        )}
      </div>

      {/* 3. Forma de Pagamento */}
      <div className="py-1.5 border-b-2 border-dashed border-black text-left text-[11px] space-y-0.5">
        <div className="flex justify-between items-center font-bold">
          <span className="text-stone-700">PAGAMENTO:</span>
          <span className="font-mono font-black uppercase">{paymentMethodLabel}</span>
        </div>
        {order.troco_para ? (
          <div className="flex justify-between items-center text-[10px] font-bold text-stone-800">
            <span>Troco para {formatCurrency(order.troco_para)}:</span>
            <span className="font-mono font-black">Devolver {formatCurrency(order.troco_para - orderTotal)}</span>
          </div>
        ) : null}
      </div>

      {/* 4. Resumo Financeiro */}
      <div className="py-2 border-b-2 border-dashed border-black space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal Itens:</span>
          <span className="font-mono font-bold">{formatCurrency(orderSubtotal)}</span>
        </div>
        {order.taxa_entrega !== undefined && order.taxa_entrega > 0 && (
          <div className="flex justify-between">
            <span>Taxa de Entrega:</span>
            <span className="font-mono font-bold">{formatCurrency(order.taxa_entrega)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm pt-1 border-t-2 border-black">
          <span>TOTAL:</span>
          <span className="font-mono">{formatCurrency(orderTotal)}</span>
        </div>
      </div>

      {/* 5. Rodapé Limpo (sem quebras de caracteres) */}
      <div className="pt-2 text-center space-y-1 text-[10px]">
        <div className="flex justify-between text-stone-700 font-medium">
          <span>Data / Hora:</span>
          <span className="font-mono font-bold">
            {formatDateTime(order.criado_em)}
          </span>
        </div>
        <div className="border-t border-black pt-1.5 space-y-0.5">
          <p className="font-black text-[10px] tracking-wider uppercase">
            *** CONTROLE DE COZINHA & EXPEDIÇÃO ***
          </p>
          <p className="text-[9px] text-stone-500 font-mono">
            AtendeJá • Pedido #{order.id}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Thermal Print Portal (Dedicated container rendered during window.print) */}
      {printRoot &&
        createPortal(
          <div className={paperSize === '58mm' ? 'thermal-ticket-58mm' : 'thermal-ticket-80mm'}>
            {renderTicketContent(true)}
          </div>,
          printRoot
        )}

      {/* 2. On-screen Modal (Interactive preview & printer setup) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto no-print">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 my-6">
          {/* Modal Header */}
          <div className="px-5 py-3.5 bg-stone-900 text-white border-b border-stone-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-xs sm:text-sm tracking-tight">Comanda de Produção</h3>
                <p className="text-[10px] text-stone-400">Impressão térmica para Cozinha / Delivery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Paper Size Selector (80mm vs 58mm) */}
          <div className="px-5 py-2.5 bg-stone-100 dark:bg-slate-950 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-stone-700 dark:text-slate-300 text-[11px]">
              Tamanho da Bobina:
            </span>
            <div className="flex items-center gap-1 bg-stone-200 dark:bg-slate-900 p-0.5 rounded-xl border border-stone-300 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handlePaperSizeChange('80mm')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  paperSize === '80mm'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                80mm (Padrão)
              </button>
              <button
                type="button"
                onClick={() => handlePaperSizeChange('58mm')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  paperSize === '58mm'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                58mm (Mini / POS)
              </button>
            </div>
          </div>

          {/* Paper Preview Area */}
          <div className="p-4 sm:p-6 bg-stone-200 dark:bg-slate-950 flex justify-center max-h-[75vh] overflow-y-auto">
            <div
              className={`bg-white text-black shadow-lg p-4 transition-all duration-200 border border-stone-300 rounded-xs ${
                paperSize === '58mm' ? 'w-[250px]' : 'w-[330px]'
              }`}
            >
              {renderTicketContent(false)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between border-t border-stone-200 dark:border-slate-800 gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-amber-500 dark:hover:bg-amber-400 hover:bg-stone-800 active:bg-black text-white dark:text-stone-950 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 text-amber-400 dark:text-stone-950" />
              <span>Imprimir Agora ({paperSize})</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
