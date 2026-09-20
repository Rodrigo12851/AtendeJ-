import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, QrCode } from 'lucide-react';
import { Comanda, Order } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useStore } from '../context/StoreContext';

interface ReceiptModalProps {
  comanda: Comanda;
  orders: Order[];
  pizzariaName?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  comanda,
  orders,
  pizzariaName = 'PIZZARIA ITÁLIA',
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

  const comandaOrders = orders.filter((o) => comanda.pedidos_ids.includes(o.id));
  const allActiveItems = comandaOrders.flatMap((o) => o.itens.filter((it) => it.status === 'ativo'));

  const totalPaid = comanda.pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const remaining = Math.max(0, comanda.total - totalPaid);

  const renderReceiptContent = (isPrintMedia = false) => (
    <div
      className={`font-mono text-black leading-snug select-text ${
        paperSize === '58mm' ? 'text-[10px]' : 'text-xs'
      }`}
      style={{ fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace" }}
    >
      {/* Header */}
      <div className="text-center pb-2 border-b-2 border-dashed border-black space-y-0.5">
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
        <p className="text-[10px]">{currentLoja?.endereco || 'Av. Paulista, 1000 - Bela Vista - SP'}</p>
        {currentLoja?.telefone && (
          <p className="text-[10px]">Tel: {currentLoja.telefone}</p>
        )}
        <p className="text-[10px]">CNPJ: 12.345.678/0001-90</p>

        <div className="font-bold text-xs pt-1">
          *** CONFERÊNCIA DE CONTA ***
        </div>

        <div className="text-sm font-black pt-0.5 border border-black inline-block px-2 py-0.5 my-1">
          MESA {comanda.mesa_numero.toString().padStart(2, '0')} | COMANDA #{comanda.numero}
        </div>

        {comanda.cliente_nome && (
          <p className="text-xs font-black uppercase pt-0.5">
            CLIENTE: {comanda.cliente_nome}
          </p>
        )}

        {comanda.garcom_nome && (
          <p className="text-[11px]">Atendente: {comanda.garcom_nome}</p>
        )}
        <p className="text-[10px]">Abertura: {formatDateTime(comanda.abertura)}</p>
      </div>

      {/* Items Header */}
      <div className="py-1 border-b border-black flex justify-between font-black text-[11px]">
        <span className="w-1/2">ITEM</span>
        <span className="w-1/6 text-center">QTD</span>
        <span className="w-1/3 text-right">VALOR</span>
      </div>

      {/* Items List */}
      <div className="py-2 space-y-1.5 border-b-2 border-dashed border-black">
        {allActiveItems.length === 0 ? (
          <p className="text-center py-1 italic text-[11px]">Nenhum item consumido.</p>
        ) : (
          allActiveItems.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between items-start font-bold">
                <span className="w-1/2 leading-tight uppercase">{item.nome}</span>
                <span className="w-1/6 text-center">{item.quantidade}x</span>
                <span className="w-1/3 text-right font-mono">{formatCurrency(item.preco_total)}</span>
              </div>
              {item.sabores && item.sabores.length > 0 && (
                <p className="text-[10px] pl-2 font-medium">› {item.sabores.join(' + ')}</p>
              )}
              {item.borda && item.borda.preco > 0 && (
                <p className="text-[10px] pl-2">› Borda: {item.borda.nome}</p>
              )}
              {item.massa && (
                <p className="text-[10px] pl-2">› Massa: {item.massa}</p>
              )}
              {item.adicionais && item.adicionais.length > 0 && (
                <p className="text-[10px] pl-2">
                  › Adic: {item.adicionais.map((a) => a.nome).join(', ')}
                </p>
              )}
              {item.observacao && (
                <p className="text-[10px] pl-2 italic">› Obs: {item.observacao}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Financial Totals */}
      <div className="py-2 border-b-2 border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-mono">{formatCurrency(comanda.subtotal)}</span>
        </div>
        {comanda.desconto > 0 && (
          <div className="flex justify-between font-bold">
            <span>Desconto concedido:</span>
            <span className="font-mono">- {formatCurrency(comanda.desconto)}</span>
          </div>
        )}
        {comanda.taxa_servico > 0 && (
          <div className="flex justify-between">
            <span>Taxa de Serviço:</span>
            <span className="font-mono">{formatCurrency(comanda.taxa_servico)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline font-black text-sm pt-1 border-t-2 border-black">
          <span>TOTAL:</span>
          <span className="text-base font-mono">{formatCurrency(comanda.total)}</span>
        </div>
      </div>

      {/* Payments Section */}
      <div className="py-2 border-b-2 border-dashed border-black space-y-1 text-[11px]">
        <div className="font-bold">Formas de Pagamento:</div>
        {comanda.pagamentos.length === 0 ? (
          <div className="italic text-[10px]">Aguardando recebimento no caixa</div>
        ) : (
          comanda.pagamentos.map((pag, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="capitalize">
                • {pag.forma_pagamento} {pag.pagador_nome ? `(${pag.pagador_nome})` : ''}:
              </span>
              <span className="font-bold font-mono">{formatCurrency(pag.valor)}</span>
            </div>
          ))
        )}

        {totalPaid > 0 && (
          <div className="flex justify-between font-black pt-1 border-t border-black">
            <span>Total Pago:</span>
            <span className="font-mono">{formatCurrency(totalPaid)}</span>
          </div>
        )}

        {remaining > 0 ? (
          <div className="flex justify-between font-black text-xs">
            <span>Saldo a Pagar:</span>
            <span className="font-mono">{formatCurrency(remaining)}</span>
          </div>
        ) : (
          <div className="text-center font-black text-xs pt-1 border border-black py-0.5">
            *** CONTA QUITADA ***
          </div>
        )}
      </div>

      {/* QR Code PIX if balance is remaining */}
      {remaining > 0 && (
        <div className="py-2.5 text-center border-b-2 border-dashed border-black flex flex-col items-center justify-center space-y-1">
          <div className="font-black text-[11px]">PAGUE COM PIX NA MESA</div>
          <div className="w-20 h-20 bg-white border-2 border-black p-1 flex items-center justify-center">
            <div className="grid grid-cols-5 gap-0.5 w-full h-full p-0.5 bg-black">
              <div className="bg-white col-span-2 row-span-2"></div>
              <div className="bg-white col-span-1"></div>
              <div className="bg-white col-span-2 row-span-2"></div>
              <div className="bg-white col-span-1"></div>
              <div className="bg-white col-span-3"></div>
              <div className="bg-white col-span-2 row-span-2"></div>
              <div className="bg-white col-span-1"></div>
              <div className="bg-white col-span-2 row-span-2"></div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold">Chave: pix@pizzariaitalia.com.br</span>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2 space-y-0.5 text-[10px]">
        <p className="font-black text-[11px]">Obrigado pela preferência!</p>
        <p>Volte sempre!</p>
        <p className="text-[9px] pt-1">*** NÃO É DOCUMENTO FISCAL ***</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Thermal Print Portal */}
      {printRoot &&
        createPortal(
          <div className={paperSize === '58mm' ? 'thermal-ticket-58mm' : 'thermal-ticket-80mm'}>
            {renderReceiptContent(true)}
          </div>,
          printRoot
        )}

      {/* 2. On-screen Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto no-print">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 my-6">
          {/* Modal Header */}
          <div className="px-5 py-3.5 bg-stone-900 text-white border-b border-stone-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-xs sm:text-sm tracking-tight">Impressão de Conta</h3>
                <p className="text-[10px] text-stone-400">Cupom de conferência e pré-conta</p>
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
              {renderReceiptContent(false)}
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
              <span>Imprimir Conta ({paperSize})</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
