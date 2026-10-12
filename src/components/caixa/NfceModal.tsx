import React, { useState } from 'react';
import { Order, Comanda, Loja, NfceInfo } from '../../types';
import { emitirNfce } from '../../services/nfceService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  RefreshCw,
  QrCode,
  ShieldCheck,
  ExternalLink,
  Receipt,
  User,
} from 'lucide-react';

interface NfceModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: Order | Comanda | null;
  currentLoja: Loja;
  onNfceUpdated: (updatedNfce: NfceInfo) => void;
}

export const NfceModal: React.FC<NfceModalProps> = ({
  isOpen,
  onClose,
  target,
  currentLoja,
  onNfceUpdated,
}) => {
  if (!isOpen || !target) return null;

  const currentNfce = target.nfce_info;
  const isAlreadyEmitted = currentNfce?.status === 'autorizada';

  const [cpfInput, setCpfInput] = useState(currentNfce?.cpf_consumidor || '');
  const [isEmitting, setIsEmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    currentNfce?.status === 'rejeitada' ? currentNfce.mensagem_sefaz || 'Nota rejeitada' : null
  );
  const [copiedKey, setCopiedKey] = useState(false);

  const fiscalConfig = currentLoja.fiscal_config;
  const isDelivery = 'origem' in target && (target as Order).origem === 'delivery';
  const targetId = target.id || (target as Comanda).numero;
  const targetTitle = 'mesa_numero' in target && target.mesa_numero
    ? `Mesa ${String(target.mesa_numero).padStart(2, '0')}`
    : `Pedido #${targetId}`;

  // Formatação de CPF enquanto digita
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) {
      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (v.length > 6) {
      v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (v.length > 3) {
      v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    setCpfInput(v);
  };

  // Disparo de Emissão
  const handleEmitir = async () => {
    setIsEmitting(true);
    setErrorMessage(null);

    try {
      const result = await emitirNfce(target, currentLoja, cpfInput.trim() || undefined);
      onNfceUpdated(result);

      if (result.status === 'rejeitada') {
        setErrorMessage(result.mensagem_sefaz || 'Nota rejeitada pela SEFAZ.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha na comunicação com o serviço fiscal.');
    } finally {
      setIsEmitting(false);
    }
  };

  // Copiar Chave de Acesso
  const handleCopyChave = () => {
    if (currentNfce?.chave_acesso) {
      navigator.clipboard.writeText(currentNfce.chave_acesso);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // Disparo de Impressão Térmica
  const handlePrintDanfe = () => {
    window.print();
  };

  const rawItens = 'itens' in target ? target.itens : [];
  const activeItens = rawItens.filter((it) => it.status === 'ativo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-stone-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-700 to-sky-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span>NFC-e — Cupom Fiscal Eletrônico</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/30 border border-sky-300/30 font-mono">
                  {targetTitle}
                </span>
              </h3>
              <p className="text-[11px] text-sky-200">
                {currentLoja.marca || currentLoja.nome} • CNPJ: {fiscalConfig?.cnpj || currentLoja.cnpj || 'Não configurado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Banner de Modo Desenvolvedor / Homologação */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🧪</span>
              <div>
                <span className="font-bold text-amber-950 dark:text-amber-200 block text-xs">
                  Modo de Desenvolvedor / Testes Ativo
                </span>
                <span className="text-[11px] text-amber-800 dark:text-amber-400">
                  Emissão simulada com Chave SEFAZ de 44 dígitos e QR Code para testar cupom e impressão física. Sem valor fiscal.
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 shrink-0">
              Homologação
            </span>
          </div>

          {/* Mensagem de Erro / Rejeição se houver */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-2xl text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Rejeição da SEFAZ:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* ESTADO 1: NOTA FISCAL JÁ AUTORIZADA */}
          {isAlreadyEmitted && currentNfce ? (
            <div className="space-y-4">
              {/* Card de Status Autorizado */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 block">
                      NFC-e #{currentNfce.numero} Autorizada com Sucesso!
                    </span>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300">
                      Série {currentNfce.serie || 1} • Prot: {currentNfce.protocolo || '135260001839201'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  {currentNfce.ambiente === 'producao' ? 'Produção' : 'Homologação'}
                </span>
              </div>

              {/* Chave de Acesso */}
              {currentNfce.chave_acesso && (
                <div className="p-3 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400 block">
                    Chave de Acesso SEFAZ (44 dígitos):
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-stone-900 dark:text-white break-all leading-relaxed">
                      {currentNfce.chave_acesso.replace(/(\d{4})/g, '$1 ').trim()}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyChave}
                      className="p-1.5 bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 rounded-lg text-stone-700 dark:text-white text-xs flex items-center gap-1 hover:bg-stone-100 transition shrink-0 cursor-pointer"
                      title="Copiar Chave"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey ? 'Copiada!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Prévia do Cupom DANFE NFC-e Térmico */}
              <div className="border border-stone-300 dark:border-slate-700 rounded-2xl bg-stone-50 dark:bg-slate-950 p-4 font-mono text-[11px] space-y-2.5 shadow-inner">
                {/* Cabeçalho do Cupom */}
                <div className="text-center pb-2 border-b border-dashed border-stone-300 dark:border-slate-700 space-y-0.5">
                  <h4 className="font-black text-xs text-stone-900 dark:text-white uppercase">
                    {fiscalConfig?.razao_social || currentLoja.marca || currentLoja.nome}
                  </h4>
                  <p className="text-[10px] text-stone-600 dark:text-slate-400">
                    CNPJ: {fiscalConfig?.cnpj || currentLoja.cnpj || '12.345.678/0001-90'} • IE: {fiscalConfig?.inscricao_estadual || '123.456.789.110'}
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400">
                    {fiscalConfig?.logradouro || currentLoja.endereco || 'Av. Principal, 1000'} - {fiscalConfig?.municipio || 'São Paulo'}/{fiscalConfig?.uf || 'SP'}
                  </p>
                  <div className="pt-1 font-bold text-stone-900 dark:text-white text-[10px]">
                    DANFE NFC-e — Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
                  </div>
                </div>

                {/* Tabela de Itens do Cupom */}
                <div className="space-y-1 py-1 divide-y divide-dashed divide-stone-200 dark:divide-slate-800">
                  <div className="flex justify-between font-bold text-[10px] text-stone-500 pb-0.5">
                    <span># CÓD | DESCRIÇÃO | QTD</span>
                    <span>TOTAL (R$)</span>
                  </div>
                  {activeItens.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-baseline pt-1 text-[11px]">
                      <span className="truncate pr-2">
                        {idx + 1} {it.nome} ({it.quantidade} UN)
                      </span>
                      <span className="font-black shrink-0 text-stone-900 dark:text-white">
                        {formatCurrency(it.preco_total)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totais do Cupom */}
                <div className="pt-2 border-t border-dashed border-stone-300 dark:border-slate-700 space-y-1">
                  <div className="flex justify-between text-xs font-black text-stone-900 dark:text-white">
                    <span>VALOR TOTAL R$:</span>
                    <span className="text-sm">{formatCurrency(target.total)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-600 dark:text-slate-400">
                    <span>FORMA DE PAGAMENTO:</span>
                    <span className="uppercase font-bold">
                      {('forma_pagamento' in target && target.forma_pagamento) || 'Dinheiro'}
                    </span>
                  </div>
                </div>

                {/* QR Code & Dados de Consulta */}
                <div className="pt-2 border-t border-dashed border-stone-300 dark:border-slate-700 text-center space-y-1.5">
                  <div className="w-20 h-20 mx-auto bg-white p-1 rounded-lg border border-stone-300 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-stone-900" />
                  </div>
                  <p className="text-[9px] text-stone-500">
                    Consulte pela Chave de Acesso em:
                    <br />
                    <span className="text-sky-700 font-bold">www.sefaz.sp.gov.br/nfce/consulta</span>
                  </p>
                  <p className="text-[10px] font-bold text-stone-800 dark:text-slate-300">
                    {currentNfce.cpf_consumidor
                      ? `CONSUMIDOR CPF: ${currentNfce.cpf_consumidor}`
                      : 'CONSUMIDOR NÃO IDENTIFICADO'}
                  </p>
                  <p className="text-[9px] text-stone-400">
                    NFC-e nº {currentNfce.numero} Série {currentNfce.serie || 1} • {formatDateTime(currentNfce.data_emissao || new Date().toISOString())}
                  </p>
                </div>
              </div>

              {/* Botões de Ação para Nota Emitida */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrintDanfe}
                  className="flex-1 py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Cupom Fiscal Térmico</span>
                </button>

                <button
                  type="button"
                  onClick={handleEmitir}
                  disabled={isEmitting}
                  className="px-4 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Reemitir a nota fiscal caso necessário"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEmitting ? 'animate-spin' : ''}`} />
                  <span>Reemitir</span>
                </button>
              </div>
            </div>
          ) : (
            /* ESTADO 2: NOTA FISCAL AINDA NÃO EMITIDA */
            <div className="space-y-4">
              {/* Resumo do Pedido a Emitir */}
              <div className="p-4 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-600 dark:text-slate-400">Valor Total do Cupom:</span>
                  <span className="text-base font-black font-mono text-stone-900 dark:text-white">
                    {formatCurrency(target.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-stone-600 dark:text-slate-400">
                  <span>Itens a tributar:</span>
                  <span className="font-bold">{activeItens.length} itens</span>
                </div>
                {isDelivery && (
                  <div className="flex justify-between items-center text-xs text-purple-700 dark:text-purple-300 font-semibold">
                    <span>Canal:</span>
                    <span>🛵 Entrega em Domicílio (Delivery)</span>
                  </div>
                )}
              </div>

              {/* Inserir CPF do Consumidor (Opcional) */}
              <div className="p-4 bg-sky-50/60 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-800/60 space-y-2">
                <label className="block text-xs font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                  <span>CPF do Consumidor na Nota (Opcional):</span>
                </label>
                <input
                  type="text"
                  value={cpfInput}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00 (Deixe em branco se o cliente não quiser CPF)"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:border-sky-600"
                />
                <span className="text-[11px] text-sky-900/80 dark:text-sky-300 block">
                  Se o cliente não solicitar CPF, a nota será emitida automaticamente para "Consumidor Final".
                </span>
              </div>

              {/* Botão de Disparo */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleEmitir}
                  disabled={isEmitting}
                  className="w-full py-3.5 bg-sky-700 hover:bg-sky-800 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <FileText className={`w-4 h-4 ${isEmitting ? 'animate-spin' : ''}`} />
                  <span>{isEmitting ? 'Transmitindo para a SEFAZ...' : 'Emitir Cupom Fiscal (NFC-e) Agora 🚀'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
