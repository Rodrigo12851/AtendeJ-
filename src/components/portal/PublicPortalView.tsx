import React from 'react';
import { Pizza, Store, Clock, MapPin, ChevronRight, Shield, Lock, Bike, Sparkles } from 'lucide-react';
import { Loja } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PublicPortalViewProps {
  lojas: Loja[];
  onSelectLoja: (lojaSlug: string) => void;
  onOpenLogin: (tab: 'equipe' | 'dono') => void;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  lojas,
  onSelectLoja,
  onOpenLogin,
}) => {
  const ativas = lojas.filter((l) => l.ativa && l.status_assinatura !== 'suspenso');

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-900/20">
              <Pizza className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block leading-none">
                Plataforma Delivery
              </span>
              <span className="text-lg font-black tracking-tight text-stone-900 font-serif">
                AtendeJá
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLogin('equipe')}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Acesso dos Restaurantes</span>
            </button>

            <button
              onClick={() => onOpenLogin('dono')}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition cursor-pointer"
              title="Acesso Master da Plataforma (Dono do App)"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 border-b border-stone-200/60 bg-gradient-to-b from-white to-[#FAF7F2]">
        <div className="max-w-3xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Cardápio Digital & Delivery em Tempo Real</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 leading-tight">
            Peça agora seu prato favorito diretamente da loja
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto leading-relaxed">
            Escolha o restaurante parceiro desejado abaixo para abrir o cardápio oficial, personalizar seus pedidos e receber quentinho no seu endereço.
          </p>
        </div>
      </section>

      {/* Stores Directory Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-red-600" />
              <span>Restaurantes Disponíveis</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Selecione uma filial para navegar pelo cardápio digital
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-mono">
            {ativas.length} {ativas.length === 1 ? 'loja ativa' : 'lojas ativas'}
          </span>
        </div>

        {ativas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-8 space-y-3 shadow-xs">
            <Store className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">Nenhum restaurante com atendimento no momento</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              No momento, todas as lojas estão fora do horário de expediente ou em manutenção.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {ativas.map((loja) => (
              <div
                key={loja.id}
                onClick={() => onSelectLoja(loja.slug)}
                className="bg-white hover:bg-amber-50/20 border border-stone-200/90 hover:border-amber-400 rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden border border-stone-200">
                    {loja.logo_url ? (
                      <img
                        src={loja.logo_url}
                        alt={loja.marca || loja.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <Pizza className="w-8 h-8 text-white" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Aberto
                      </span>
                      {loja.plano && (
                        <span className="text-[10px] font-semibold text-stone-500 capitalize">
                          {loja.marca || 'Pizzaria'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-stone-900 group-hover:text-red-600 transition truncate">
                      {loja.nome}
                    </h3>

                    {loja.endereco && (
                      <p className="text-xs text-stone-500 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{loja.endereco}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-stone-700 font-medium">
                      <Bike className="w-3.5 h-3.5 text-amber-600" />
                      <span>{loja.taxa_entrega > 0 ? formatCurrency(loja.taxa_entrega) : 'Entrega Grátis'}</span>
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="flex items-center gap-1 text-stone-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{loja.tempo_estimado_entrega || '30 - 45 min'}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 group-hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-2xs"
                  >
                    <span>Cardápio</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/80 bg-white py-6 px-4 sm:px-6 text-center text-xs text-stone-500 space-y-2">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => onOpenLogin('equipe')}
            className="text-stone-600 hover:text-stone-900 font-medium transition cursor-pointer"
          >
            Acesso da Equipe (Garçom, Cozinha, Caixa)
          </button>
          <span className="text-stone-300">•</span>
          <button
            onClick={() => onOpenLogin('dono')}
            className="text-stone-600 hover:text-red-600 font-medium transition cursor-pointer flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            <span>Acesso Master da Plataforma</span>
          </button>
        </div>
        <p className="text-[11px] text-stone-400">
          AtendeJá © 2026 — Plataforma Segura com Proteção LGPD e Criptografia
        </p>
      </footer>
    </div>
  );
};
