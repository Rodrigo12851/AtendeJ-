import React, { useState } from 'react';
import { Pizza, Lock, UserCheck, Shield, ChefHat, Banknote, User, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { users, loginWithPin, setCurrentUser, recordLoginAttempt, isUserLockedOut } = useStore();
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const handlePinClick = (num: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + num;
      setEnteredPin(next);
      setErrorMsg('');
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (pin: string) => {
    const matchedUser = users.find((u) => u.pin === pin);

    if (matchedUser) {
      const lockout = isUserLockedOut(matchedUser.usuario);
      if (lockout.locked) {
        setIsLocked(true);
        setErrorMsg(`🔒 Usuário bloqueado por segurança! Aguarde ${lockout.remainingMinutes} min ou solicite ao Dono do App.`);
        recordLoginAttempt(matchedUser.usuario, false, 'Tentativa em conta bloqueada', matchedUser.loja_id);
        setEnteredPin('');
        return;
      }

      const success = loginWithPin(pin);
      if (success) {
        recordLoginAttempt(matchedUser.usuario, true, undefined, matchedUser.loja_id);
        onLoginSuccess?.();
        return;
      }
    }

    // PIN incorreto
    setErrorMsg('PIN incorreto. Tentativa registrada na auditoria de segurança.');
    recordLoginAttempt(`pin_invalido_${pin}`, false, 'PIN incorreto informado na tela');
    setEnteredPin('');
  };

  const handleQuickLogin = (u: typeof users[0]) => {
    const lockout = isUserLockedOut(u.usuario);
    if (lockout.locked) {
      setIsLocked(true);
      setErrorMsg(`🔒 Usuário ${u.nome} bloqueado por excesso de tentativas! Aguarde ${lockout.remainingMinutes} min.`);
      recordLoginAttempt(u.usuario, false, 'Tentativa de clique em conta bloqueada', u.loja_id);
      return;
    }
    recordLoginAttempt(u.usuario, true, undefined, u.loja_id);
    setCurrentUser(u);
    onLoginSuccess?.();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Warm Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-gradient-to-tr from-red-700 via-red-600 to-amber-600 rounded-2xl shadow-lg shadow-red-950/20 text-white animate-bounce-short">
            <Pizza className="w-9 h-9" />
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-800">
              Forno a Lenha & Trattoria
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 dark:text-slate-100">
              Pizzaria Itália
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-medium">
            Sistema Digital de Atendimento, Comandas & KDS
          </p>
        </div>

        {/* PIN Entry Box */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Acesso com PIN (4 dígitos)
            </span>

            {/* PIN Dots */}
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    idx < enteredPin.length
                      ? 'bg-red-600 border-red-500 scale-110 shadow-sm shadow-red-600/30'
                      : 'border-stone-300 bg-stone-100'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 animate-shake">{errorMsg}</p>
            )}
          </div>

          {/* Touch Number Pad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinClick(num)}
                className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-xl font-bold text-stone-900 dark:text-slate-100 border border-stone-200 shadow-2xs transition active:scale-95 flex items-center justify-center cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setEnteredPin('')}
              className="h-14 rounded-2xl bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-500 border border-stone-200 transition flex items-center justify-center cursor-pointer"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handlePinClick('0')}
              className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-xl font-bold text-stone-900 dark:text-slate-100 border border-stone-200 shadow-2xs transition flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-2xl bg-stone-50 hover:bg-stone-100 text-sm font-bold text-stone-600 border border-stone-200 transition flex items-center justify-center cursor-pointer"
            >
              ⌫
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                Ou selecione seu operador
              </span>
            </div>
          </div>

          {/* Quick User Selection Chips */}
          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => {
              const roleIcons: Record<string, React.ReactNode> = {
                super_admin: <Shield className="w-3.5 h-3.5 text-amber-500" />,
                admin: <Shield className="w-3.5 h-3.5 text-red-600" />,
                garcom: <User className="w-3.5 h-3.5 text-blue-600" />,
                cozinha: <ChefHat className="w-3.5 h-3.5 text-amber-700" />,
                caixa: <Banknote className="w-3.5 h-3.5 text-emerald-600" />,
              };

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="p-2.5 rounded-2xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/90 hover:border-amber-300 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      {roleIcons[u.perfil]}
                      <span className="text-xs font-bold text-stone-800 dark:text-slate-200 group-hover:text-stone-950 truncate block">
                        {u.nome}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 capitalize block font-medium">
                      {u.perfil} • PIN {u.pin}
                    </span>
                  </div>
                  <UserCheck className="w-4 h-4 text-stone-400 group-hover:text-red-600 shrink-0 ml-1 transition" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-stone-500 space-y-1">
          <p className="font-medium">Operação Offline-first • Sincronização em tempo real entre abas</p>
          <p className="text-stone-400">PWA compatível com celulares, tablets e PCs</p>
        </div>
      </div>
    </div>
  );
};
