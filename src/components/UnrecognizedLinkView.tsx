import React from 'react';
import { Pizza, Link2Off, AlertCircle } from 'lucide-react';

export const UnrecognizedLinkView: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white border border-stone-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-stone-900/5 text-center space-y-6 relative z-10">
        {/* Brand Identity */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-950/20 mx-auto">
            <Pizza className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 block">
              AtendeJá
            </span>
            <span className="text-xs text-stone-400 font-medium">
              Plataforma para Restaurantes & Delivery
            </span>
          </div>
        </div>

        {/* Unrecognized Link Notice */}
        <div className="space-y-3 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
            <Link2Off className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
              Endereço Incompleto
            </span>
            <h1 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
              Link de acesso não reconhecido
            </h1>
            <p className="text-stone-600 text-sm leading-relaxed max-w-sm mx-auto">
              O link utilizado não contém informações de loja ou de acesso. Verifique o endereço ou utilize o link oficial fornecido pelo seu estabelecimento.
            </p>
          </div>
        </div>

        {/* Security / Help note */}
        <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-400 space-y-1">
          <p className="font-medium text-stone-500">Acesso individualizado por estabelecimento</p>
          <p>Para suporte ou pedidos, consulte o link direto enviado pelo restaurante parceiro.</p>
        </div>
      </div>

      <footer className="mt-8 text-[11px] text-stone-400 text-center">
        AtendeJá © 2026 • Todos os direitos reservados
      </footer>
    </div>
  );
};
