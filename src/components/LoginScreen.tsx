import React, { useState } from 'react';
import { Pizza, Lock, Shield, KeyRound, User, Eye, EyeOff, Store } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface LoginScreenProps {
  mode: 'equipe' | 'dono';
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  mode,
  onLoginSuccess,
}) => {
  const { users, lojas, loginWithPin, login, recordLoginAttempt, isUserLockedOut } = useStore();

  // Equipe PIN State
  const [enteredPin, setEnteredPin] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  // Master Dono do App State
  const [masterUser, setMasterUser] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [masterErrorMsg, setMasterErrorMsg] = useState('');
  const [isSubmittingMaster, setIsSubmittingMaster] = useState(false);

  // Keypad actions
  const handlePinClick = (num: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + num;
      setEnteredPin(next);
      setPinErrorMsg('');
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinErrorMsg('');
  };

  const verifyPin = (pin: string) => {
    // 1. O Dono da Plataforma nunca utiliza PIN de equipe
    const superAdminUser = users.find((u) => u.perfil === 'super_admin' && u.pin === pin);
    if (superAdminUser) {
      setPinErrorMsg('Acesso não autorizado para esta área.');
      setEnteredPin('');
      return;
    }

    const matchedUser = users.find((u) => u.pin === pin && u.perfil !== 'super_admin');

    if (matchedUser) {
      // 2. Verificação de suspensão do estabelecimento
      if (matchedUser.loja_id) {
        const userLoja = lojas.find((l) => l.id === matchedUser.loja_id);
        if (userLoja && (!userLoja.ativa || userLoja.status_assinatura === 'suspenso')) {
          setPinErrorMsg(`🚫 Estabelecimento Suspenso: A loja "${userLoja.nome}" está temporariamente suspensa pelo administrador da plataforma.`);
          recordLoginAttempt(matchedUser.usuario, false, 'Tentativa de login em loja suspensa', matchedUser.loja_id, userLoja.nome);
          setEnteredPin('');
          return;
        }
      }

      // 3. Verificação de bloqueio por excesso de tentativas incorretas
      const lockout = isUserLockedOut(matchedUser.usuario);
      if (lockout.locked) {
        setPinErrorMsg(`🔒 Acesso bloqueado por segurança! Aguarde ${lockout.remainingMinutes} min.`);
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
    setPinErrorMsg('PIN incorreto. Tentativa registrada no sistema de segurança.');
    recordLoginAttempt(`pin_invalido_${pin}`, false, 'PIN incorreto informado no terminal');
    setEnteredPin('');
  };

  // Master Login Submit
  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterErrorMsg('');

    const cleanUser = masterUser.trim().toLowerCase();
    if (!cleanUser || !masterPass) {
      setMasterErrorMsg('Preencha o usuário e a senha master.');
      return;
    }

    // Bloqueio contra força bruta
    const lockout = isUserLockedOut(cleanUser);
    if (lockout.locked) {
      setMasterErrorMsg(`🔒 Acesso bloqueado por segurança! Aguarde ${lockout.remainingMinutes} min.`);
      recordLoginAttempt(cleanUser, false, 'Tentativa em conta Master bloqueada');
      return;
    }

    setIsSubmittingMaster(true);
    try {
      const targetUser = users.find(
        (u) => u.usuario.toLowerCase() === cleanUser && u.perfil === 'super_admin'
      );

      if (!targetUser) {
        setMasterErrorMsg('Credenciais inválidas ou acesso não autorizado.');
        recordLoginAttempt(cleanUser, false, 'Tentativa inválida no Acesso Master');
        setIsSubmittingMaster(false);
        return;
      }

      const success = login(cleanUser, masterPass);
      if (success) {
        recordLoginAttempt(cleanUser, true);
        onLoginSuccess?.();
      } else {
        setMasterErrorMsg('Credenciais inválidas.');
        recordLoginAttempt(cleanUser, false, 'Senha incorreta no Acesso Master');
      }
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Warm Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-5 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-red-700 via-red-600 to-amber-600 rounded-2xl shadow-lg shadow-red-950/20 text-white animate-bounce-short">
            <Pizza className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-amber-800">
              AtendeJá
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-stone-900">
              {mode === 'dono' ? 'Acesso Master da Plataforma' : 'Terminal da Equipe'}
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-medium">
            {mode === 'dono'
              ? 'Área restrita de governança e gestão multi-lojas'
              : 'Atendimento, comanda digital, cozinha e caixa'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MODO 1: TERMINAL DA EQUIPE (PIN DE 4 DÍGITOS) */}
        {/* ========================================================================= */}
        {mode === 'equipe' && (
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Digite seu PIN de 4 dígitos
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

              {pinErrorMsg && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 animate-shake">
                  {pinErrorMsg}
                </p>
              )}
            </div>

            {/* Touch Number Pad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinClick(num)}
                  className="h-13 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-xl font-bold text-stone-900 border border-stone-200 shadow-2xs transition active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEnteredPin('')}
                className="h-13 rounded-2xl bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-500 border border-stone-200 transition flex items-center justify-center cursor-pointer"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handlePinClick('0')}
                className="h-13 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-xl font-bold text-stone-900 border border-stone-200 shadow-2xs transition flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-13 rounded-2xl bg-stone-50 hover:bg-stone-100 text-sm font-bold text-stone-600 border border-stone-200 transition flex items-center justify-center cursor-pointer"
              >
                ⌫
              </button>
            </div>

            <div className="pt-2 text-center text-[11px] text-stone-400">
              <p>O PIN é individual de cada colaborador do restaurante.</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODO 2: DONO DA PLATAFORMA (ACESSO MASTER) */}
        {/* ========================================================================= */}
        {mode === 'dono' && (
          <form
            onSubmit={handleMasterLogin}
            className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xl space-y-4"
          >
            <div className="text-center space-y-1 pb-2 border-b border-stone-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-stone-900">Autenticação de Segurança</h2>
              <p className="text-xs text-stone-500">
                Insira as credenciais de Dono da Plataforma para gerenciar o sistema.
              </p>
            </div>

            {masterErrorMsg && (
              <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 animate-shake">
                {masterErrorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Usuário Master
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={masterUser}
                    onChange={(e) => setMasterUser(e.target.value)}
                    placeholder="Usuário"
                    autoComplete="username"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Senha Master
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={masterPass}
                    onChange={(e) => setMasterPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingMaster}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 active:bg-black text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isSubmittingMaster ? 'Verificando...' : 'Acessar Gestão Master'}</span>
            </button>
          </form>
        )}

        <div className="text-center text-[11px] text-stone-400 space-y-1">
          <p className="font-medium text-stone-500">AtendeJá • Plataforma com Proteção LGPD</p>
        </div>
      </div>
    </div>
  );
};
