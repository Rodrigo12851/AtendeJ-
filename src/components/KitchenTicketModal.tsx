import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { Order } from '../types';
import { formatTime, formatDateTime, formatCurrency } from '../utils/formatters';
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
  const isDelivery = order.origem === 'delivery' || order.tipo_pedido === 'delivery' || !order.mesa_numero;
  const endereco = order.delivery_info?.endereco || order.cliente_endereco;
  const telefone = order.delivery_info?.telefone || order.cliente_telefone;

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
      {/* Header */}
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
        <h2 className="text-base font-black tracking-wider uppercase">{effectiveBrand}</h2>
        {currentLoja?.nome && (
          <p className="text-[10px] uppercase font-bold text-stone-700">{currentLoja.nome}</p>
        )}
        <div className="font-bold text-xs">
          *** COMANDA DE PRODUÇÃO ***
        </div>
        <div className="text-sm font-black pt-0.5">
          PEDIDO #{order.id}
        </div>

        {isDelivery ? (
          <div className="text-xs font-black border-2 border-black py-0.5 px-2 inline-block my-1 rounded-sm uppercase">
            🛵 DELIVERY - ENTREGA EM CASA
          </div>
        ) : (
          <div className="text-sm font-black border-2 border-black py-0.5 px-2 inline-block my-1 rounded-sm uppercase">
            MESA {order.mesa_numero ? order.mesa_numero.toString().padStart(2, '0') : '00'}
          </div>
        )}

        {order.cliente_nome && (
          <div className="font-black text-xs uppercase pt-0.5">
            CLIENTE: {order.cliente_nome}
          </div>
        )}

        {order.garcom_nome && (
          <div className="text-[11px]">
            Atendente: {order.garcom_nome}
          </div>
        )}

        {/* Delivery Details */}
        {isDelivery && (endereco || telefone) && (
          <div className="mt-1.5 p-1.5 border border-black text-left rounded-sm space-y-0.5 text-[11px]">
            {endereco && (
              <p className="font-bold">
                📍 {endereco}
              </p>
            )}
            {telefone && (
              <p className="font-bold">
                📞 {telefone}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="py-2.5 border-b-2 border-dashed border-black space-y-2.5">
        <div className="font-black text-[11px] pb-1 border-b border-black flex justify-between">
          <span>QTD ITEM</span>
          <span>SUBTOTAL</span>
        </div>

        {activeItens.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between items-start font-black text-xs">
              <span className="leading-tight">
                [{item.quantidade}x] {item.nome.toUpperCase()}
              </span>
              <span className="shrink-0 ml-1 font-mono">
                {formatCurrency(item.preco_total)}
              </span>
            </div>

            {item.sabores && item.sabores.length > 0 && (
              <div className="pl-3 font-bold text-[11px]">
                › Sabores: {item.sabores.join(' + ')}
              </div>
            )}

            {item.borda && item.borda.nome !== 'Sem borda' && (
              <div className="pl-3 text-[11px] font-medium">
                › Borda: {item.borda.nome}
              </div>
            )}

            {item.massa && (
              <div className="pl-3 text-[11px]">
                › Massa: {item.massa}
              </div>
            )}

            {item.adicionais && item.adicionais.length > 0 && (
              <div className="pl-3 text-[11px]">
                › Adic: {item.adicionais.map((a) => a.nome).join(', ')}
              </div>
            )}

            {item.observacao && (
              <div className="mt-1 p-1 border border-black rounded-sm font-black text-[11px] bg-white">
                ** OBS: {item.observacao.toUpperCase()} **
              </div>
            )}
          </div>
        ))}

        {order.observacao && (
          <div className="mt-2 p-1.5 border-2 border-black rounded-sm font-black text-xs">
            *** OBS DO PEDIDO: {order.observacao.toUpperCase()} ***
          </div>
        )}
      </div>

      {/* Financial summary (Crucial for delivery) */}
      <div className="py-2 border-b-2 border-dashed border-black space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal Itens:</span>
          <span className="font-mono">{formatCurrency(orderSubtotal)}</span>
        </div>
        {order.taxa_entrega !== undefined && order.taxa_entrega > 0 && (
          <div className="flex justify-between">
            <span>Taxa de Entrega:</span>
            <span className="font-mono">{formatCurrency(order.taxa_entrega)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
          <span>TOTAL:</span>
          <span className="font-mono">{formatCurrency(orderTotal)}</span>
        </div>
      </div>

      {/* Footer / Timestamps */}
      <div className="pt-2 text-center space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Data / Hora:</span>
          <span className="font-mono font-bold">
            {formatDateTime(order.criado_em)}
          </span>
        </div>
        <p className="pt-1 font-bold">================================</p>
        <p className="text-[9px] uppercase">*** CONTROLE DE COZINHA & DELIVERY ***</p>
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
          <div className="p-4 sm:p-6 bg-stone-200 dark:bg-slate-950 flex justify-center max-h-[60vh] overflow-y-auto">
            <div
              className={`bg-white shadow-md p-4 transition-all duration-200 border border-stone-300 ${
                paperSize === '58mm' ? 'w-[230px]' : 'w-[310px]'
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
