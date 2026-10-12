import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bug,
  X,
  Trash2,
  FileCode,
  MapPin,
  Layers,
} from 'lucide-react';
import {
  parseErrorStack,
  formatComponentStack,
  generateErrorReportText,
  ParsedErrorLocation,
} from '../utils/errorParser';

interface Props {
  children: ReactNode;
}

interface AsyncErrorItem {
  id: string;
  message: string;
  errorName: string;
  location: ParsedErrorLocation | null;
  fullStack?: string;
  timestamp: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showFullStack: boolean;
  // Erros assíncronos (fora da renderização do React)
  asyncErrors: AsyncErrorItem[];
  selectedAsyncError: AsyncErrorItem | null;
  showAsyncModal: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showFullStack: false,
      asyncErrors: [],
      selectedAsyncError: null,
      showAsyncModal: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public componentDidMount() {
    // 1. Captura erros globais JavaScript (fora do render do React)
    window.addEventListener('error', this.handleGlobalError);
    // 2. Captura Promises rejeitadas sem catch (async/await)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleGlobalError = (event: ErrorEvent) => {
    // Evita loop se o erro for do próprio handler
    const message = event.message || 'Erro desconhecido';
    const errorObj = event.error;
    const stack = errorObj?.stack || `${event.filename}:${event.lineno}:${event.colno}`;
    const location = parseErrorStack(stack) || {
      fileName: event.filename ? event.filename.split(/[\/\\]/).pop() || event.filename : 'desconhecido',
      filePath: event.filename || '',
      lineNumber: event.lineno,
      columnNumber: event.colno,
      rawLine: `${event.filename}:${event.lineno}`,
    };

    const newError: AsyncErrorItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      message,
      errorName: errorObj?.name || 'Error',
      location,
      fullStack: stack,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
    };

    console.warn('[Monitor Global] Erro detectado no sistema:', newError);

    this.setState((prev) => ({
      asyncErrors: [newError, ...prev.asyncErrors.slice(0, 4)],
    }));
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : reason?.message || 'Promessa rejeitada (Promise rejection)';
    const stack = reason?.stack || '';
    const location = parseErrorStack(stack);

    const newError: AsyncErrorItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      message,
      errorName: reason?.name || 'UnhandledPromiseRejection',
      location,
      fullStack: stack,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
    };

    console.warn('[Monitor Global] Promise rejeitada no sistema:', newError);

    this.setState((prev) => ({
      asyncErrors: [newError, ...prev.asyncErrors.slice(0, 4)],
    }));
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    if (window.confirm('Deseja limpar os dados temporários do navegador e recarregar a página?')) {
      try {
        // Limpa chaves temporárias mantendo dados vitais se necessário
        sessionStorage.clear();
        localStorage.clear();
      } catch (e) {
        console.error(e);
      }
      window.location.reload();
    }
  };

  private handleCopyReport = (err: Error | null, info: ErrorInfo | null, customItem?: AsyncErrorItem) => {
    const errorMsg = customItem ? customItem.message : err?.message || 'Erro desconhecido';
    const errorName = customItem ? customItem.errorName : err?.name || 'Error';
    const stack = customItem ? customItem.fullStack : err?.stack;
    const location = customItem ? customItem.location : parseErrorStack(stack);

    const reportText = generateErrorReportText({
      timestamp: new Date().toLocaleString('pt-BR'),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorMessage: errorMsg,
      errorName,
      location: location || undefined,
      componentStack: info?.componentStack,
      fullStack: stack,
    });

    navigator.clipboard.writeText(reportText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 3000);
  };

  public render() {
    const { hasError, error, errorInfo, copied, showFullStack, asyncErrors, showAsyncModal, selectedAsyncError } = this.state;

    // Se houve erro fatal de renderização no React
    if (hasError) {
      const location = parseErrorStack(error?.stack);
      const components = formatComponentStack(errorInfo?.componentStack || undefined);

      return (
        <div className="min-h-screen bg-[#FAF7F2] text-stone-900 p-4 sm:p-6 flex items-center justify-center font-sans">
          <div className="bg-white rounded-3xl border border-red-200/90 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-600 text-white tracking-wide">
                    Erro no Sistema
                  </span>
                  <span className="text-xs font-mono text-stone-500">
                    {new Date().toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 mt-1 tracking-tight">
                  Ops! Ocorreu uma falha nesta tela
                </h2>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  O sistema capturou o erro abaixo com o arquivo e a linha exatos que causaram o problema.
                </p>
              </div>
            </div>

            {/* CARD 1: LOCALIZAÇÃO EXATA DO ERRO (ARQUIVO & LINHA) */}
            <div className="bg-stone-950 text-white rounded-2xl p-4 sm:p-5 border border-stone-800 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-red-400">
                <span className="flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Localização Exata do Erro</span>
                </span>
                {location?.lineNumber && (
                  <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold">
                    Linha {location.lineNumber}
                  </span>
                )}
              </div>

              {location ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">
                      Arquivo Causador:
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-black text-amber-300 break-all block flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{location.fileName}</span>
                    </span>
                  </div>

                  <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">
                      Linha & Coluna:
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
                      {location.lineNumber ? `Linha: ${location.lineNumber}` : 'Linha: Não identificada'}
                      {location.columnNumber ? ` • Coluna: ${location.columnNumber}` : ''}
                    </span>
                  </div>

                  {location.filePath && (
                    <div className="sm:col-span-2 bg-stone-900/60 px-3 py-2 rounded-xl text-[11px] font-mono text-stone-400 break-all border border-stone-850">
                      <span className="text-stone-500">Caminho: </span>
                      {location.filePath}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">
                  Localização exata não identificada no rastreamento imediato. Verifique o Stack Trace completo abaixo.
                </p>
              )}
            </div>

            {/* CARD 2: MENSAGEM DO ERRO */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left space-y-1.5">
              <span className="text-[10px] text-red-700 uppercase font-black tracking-wide block">
                {error?.name || 'Erro de Execução'}:
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-red-900 break-words leading-relaxed">
                {error?.message || 'Nenhuma mensagem de erro informada.'}
              </p>
            </div>

            {/* CARD 3: HIERARQUIA DE COMPONENTES */}
            {components.length > 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-left space-y-1.5">
                <span className="text-[10px] text-stone-500 uppercase font-black flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-stone-600" />
                  <span>Componente Onde Quebrou (Árvore do React):</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  {components.map((c, i) => (
                    <React.Fragment key={i}>
                      <span className={`px-2 py-0.5 rounded-md font-bold ${i === 0 ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-white text-stone-700 border border-stone-200'}`}>
                        &lt;{c}&gt;
                      </span>
                      {i < components.length - 1 && <span className="text-stone-400">➔</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* GAVETA: STACK TRACE COMPLETO */}
            {error?.stack && (
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => this.setState({ showFullStack: !showFullStack })}
                  className="w-full px-4 py-2.5 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-700 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-stone-500" />
                    <span>Rastreamento Técnico Completo (Stack Trace)</span>
                  </span>
                  {showFullStack ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showFullStack && (
                  <pre className="p-3.5 bg-stone-900 text-stone-300 font-mono text-[11px] overflow-x-auto max-h-48 border-t border-stone-800 whitespace-pre-wrap leading-relaxed select-all">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* AÇÕES */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => this.handleCopyReport(error, errorInfo)}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Relatório Copiado! Cole no WhatsApp ou Chat' : 'Copiar Detalhes do Erro com Linha e Arquivo'}</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="py-3 px-4 bg-stone-900 hover:bg-stone-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Recarregar Página</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleClearCacheAndReset}
                  className="py-3 px-4 bg-white hover:bg-red-50 active:scale-98 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Limpar Cache & Recarregar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Se a aplicação está rodando normalmente, renderiza os filhos + Toast de Erros Assíncronos Globais
    return (
      <>
        {this.props.children}

        {/* TOAST FLUTUANTE DE ERROS ASSÍNCRONOS (Ideal para celular) */}
        {asyncErrors.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-9999 max-w-sm animate-in slide-in-from-bottom-5 duration-200">
            <div className="bg-stone-950 text-white rounded-2xl p-3.5 shadow-2xl border-2 border-red-500 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-red-400">
                      Erro Detectado ({asyncErrors.length})
                    </span>
                    {asyncErrors[0]?.location?.lineNumber && (
                      <span className="text-[10px] bg-red-950 text-red-300 font-mono px-1.5 py-0.2 rounded border border-red-800">
                        L.{asyncErrors[0].location.lineNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono font-bold text-stone-200 truncate max-w-[200px]">
                    {asyncErrors[0]?.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    this.setState({
                      selectedAsyncError: asyncErrors[0],
                      showAsyncModal: true,
                    })
                  }
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Ver Linha
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ asyncErrors: [] })}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg transition cursor-pointer"
                  title="Fechar alerta"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE DETALHES DO ERRO ASSÍNCRONO */}
        {showAsyncModal && selectedAsyncError && (
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white text-stone-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-100 text-red-600">
                    <Bug className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900">
                      Diagnóstico de Erro Assíncrono
                    </h3>
                    <span className="text-[10px] text-stone-500 font-mono">
                      Capturado às {selectedAsyncError.timestamp}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => this.setState({ showAsyncModal: false })}
                  className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Arquivo e Linha */}
              <div className="bg-stone-950 text-white p-4 rounded-2xl space-y-2 text-xs">
                <span className="text-[10px] font-black uppercase text-red-400 tracking-wide block">
                  📍 Localização do Erro:
                </span>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-amber-300 font-bold truncate">
                    {selectedAsyncError.location?.fileName || 'Arquivo não identificado'}
                  </span>
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[11px] font-bold">
                    {selectedAsyncError.location?.lineNumber ? `Linha ${selectedAsyncError.location.lineNumber}` : 'Linha ?'}
                  </span>
                </div>
                {selectedAsyncError.location?.filePath && (
                  <p className="text-[11px] font-mono text-stone-400 break-all">
                    {selectedAsyncError.location.filePath}
                  </p>
                )}
              </div>

              {/* Mensagem */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono text-red-900 font-bold break-words">
                {selectedAsyncError.message}
              </div>

              {/* Stack Trace */}
              {selectedAsyncError.fullStack && (
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className="p-2 bg-stone-50 text-[11px] font-bold text-stone-700 border-b border-stone-200">
                    Stack Trace:
                  </div>
                  <pre className="p-3 bg-stone-900 text-stone-300 font-mono text-[10px] overflow-x-auto max-h-40 whitespace-pre-wrap leading-relaxed select-all">
                    {selectedAsyncError.fullStack}
                  </pre>
                </div>
              )}

              {/* Ações */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => this.handleCopyReport(null, null, selectedAsyncError)}
                  className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Detalhes do Erro'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => this.setState({ showAsyncModal: false })}
                  className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
