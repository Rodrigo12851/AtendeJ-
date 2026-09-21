import React, { useState } from 'react';
import { Pizza, Lock, Shield, KeyRound, User as UserIcon, Eye, EyeOff, Store, ChefHat, UtensilsCrossed, CircleDollarSign } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Loja } from '../types';

interface LoginScreenProps {
  mode: 'dono' | 'loja_admin' | 'loja_equipe';
  loja?: Loja;
  painelAlvo?: 'admin' | 'garcom' | 'cozinha' | 'caixa';
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  mode,
  loja,
  painelAlvo = 'admin',
  onLoginSuccess,
}) => {
  const { users, lojas, loginWithPin, login, recordLoginAttempt, isUserLockedOut, setCurrentUser } = useStore();

  // Credenciais de Usuário e Senha
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modo PIN alternativo para equipe
  const [usePinMode, setUsePinMode] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');

  // Título e Ícone do Painel
  const panelInfo = (() => {
    switch (painelAlvo) {
      case 'garcom':
        return {
          title: 'Painel do Garçom',
          desc: 'Atendimento de mesas e pedidos no salão',
          icon: <UtensilsCrossed className="w-4 h-4 text-red-500" />,
          badgeColor: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300',
        };
      case 'cozinha':
        return {
          title: 'Painel da Cozinha (KDS)',
          desc: 'Monitor de preparo e despacho de pizzas',
          icon: <ChefHat className="w-4 h-4 text-amber-500" />,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
        };
      case 'caixa':
        return {
          title: 'Painel do Caixa (PDV)',
          desc: 'Fechamento de contas, comandas e pagamentos',
          icon: <CircleDollarSign className="w-4 h-4 text-emerald-500" />,
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
        };
      default:
        return {
          title: 'Painel Administrativo',
          desc: 'Gestão da filial, cardápio e faturamento',
          icon: <Store className="w-4 h-4 text-purple-500" />,
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
        };
    }
  })();

  // -------------------------------------------------------------
  // LOGIN POR USUÁRIO E SENHA (COM REQUISITO MÍNIMO DE 6 DÍGITOS)
  // -------------------------------------------------------------
  const handleUserPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Preencha seu usuário e senha.');
      return;
    }

    // Regra de segurança: senha com no mínimo 6 caracteres
    if (cleanPass.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    // 1. Verificação de bloqueio contra força bruta
    const lockout = isUserLockedOut(cleanUser);
    if (lockout.locked) {
      setErrorMsg(`🔒 Acesso bloqueado por segurança! Aguarde ${lockout.remainingMinutes} min.`);
      recordLoginAttempt(cleanUser, false, 'Tentativa em conta bloqueada', loja?.id, loja?.nome);
      return;
    }

    setIsSubmitting(true);
    try {
      // Caso 1: Acesso Master do Dono do App
      if (mode === 'dono') {
        const targetUser = users.find(
          (u) => u.usuario.toLowerCase() === cleanUser && u.perfil === 'super_admin'
        );

        if (!targetUser) {
          setErrorMsg('Credenciais inválidas para o Acesso Master.');
          recordLoginAttempt(cleanUser, false, 'Usuário master inexistente');
          return;
        }

        const success = login(cleanUser, cleanPass);
        if (success) {
          recordLoginAttempt(cleanUser, true);
          onLoginSuccess?.();
        } else {
          setErrorMsg('Senha incorreta para o Acesso Master.');
          recordLoginAttempt(cleanUser, false, 'Senha master incorreta');
        }
        return;
      }

      // Caso 2: Acesso por Loja (Admin ou Equipe)
      if (!loja) {
        setErrorMsg('Loja não identificada. Verifique o link de acesso.');
        return;
      }

      // Verificação se a loja está suspensa
      if (!loja.ativa || loja.status_assinatura === 'suspenso') {
        setErrorMsg(`🚫 Estabelecimento Suspenso: A loja "${loja.nome}" está suspensa.`);
        recordLoginAttempt(cleanUser, false, 'Tentativa em loja suspensa', loja.id, loja.nome);
        return;
      }

      // Localiza o usuário pertencente a esta loja específica
      const matchedUser = users.find(
        (u) =>
          u.usuario.toLowerCase() === cleanUser &&
          u.ativo !== false &&
          (u.loja_id === loja.id || (!u.loja_id && loja.id === 'loja_centro'))
      );

      if (!matchedUser) {
        setErrorMsg('Usuário não encontrado ou não pertence a esta loja.');
        recordLoginAttempt(cleanUser, false, 'Usuário não encontrado na loja', loja.id, loja.nome);
        return;
      }

      // Validação de perfil/cargo
      if (mode === 'loja_admin' && matchedUser.perfil !== 'admin') {
        setErrorMsg('Apenas administradores podem acessar este painel.');
        recordLoginAttempt(cleanUser, false, 'Usuário sem permissão admin', loja.id, loja.nome);
        return;
      }

      if (mode === 'loja_equipe' && painelAlvo) {
        // Admin da filial pode acessar qualquer painel da sua equipe
        const isAllowedRole =
          matchedUser.perfil === 'admin' ||
          matchedUser.perfil === painelAlvo ||
          (painelAlvo === 'caixa' && matchedUser.perfil === 'garcom');

        if (!isAllowedRole) {
          setErrorMsg(`Usuário sem permissão para o painel de ${panelInfo.title}.`);
          recordLoginAttempt(cleanUser, false, `Permissão insuficiente para ${painelAlvo}`, loja.id, loja.nome);
          return;
        }
      }

      // Validação da senha
      if (matchedUser.senha !== cleanPass) {
        setErrorMsg('Senha incorreta.');
        recordLoginAttempt(cleanUser, false, 'Senha incorreta', loja.id, loja.nome);
        return;
      }

      // Sucesso!
      setCurrentUser(matchedUser);
      recordLoginAttempt(cleanUser, true, undefined, loja.id, loja.nome);
      onLoginSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // LOGIN VIA PIN RÁPIDO (OPCIONAL PARA EQUIPE NO SALÃO)
  // -------------------------------------------------------------
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
    if (!loja) return;

    if (!loja.ativa || loja.status_assinatura === 'suspenso') {
      setErrorMsg(`🚫 Estabelecimento Suspenso: A loja "${loja.nome}" está suspensa.`);
      recordLoginAttempt(`pin_${pin}`, false, 'Tentativa PIN em loja suspensa', loja.id, loja.nome);
      setEnteredPin('');
      return;
    }

    const matchedUser = users.find(
      (u) =>
        u.pin === pin &&
        u.perfil !== 'super_admin' &&
        (u.loja_id === loja.id || (!u.loja_id && loja.id === 'loja_centro'))
    );

    if (matchedUser) {
      const lockout = isUserLockedOut(matchedUser.usuario);
      if (lockout.locked) {
        setErrorMsg(`🔒 Acesso bloqueado por segurança! Aguarde ${lockout.remainingMinutes} min.`);
        recordLoginAttempt(matchedUser.usuario, false, 'Tentativa em conta bloqueada', loja.id, loja.nome);
        setEnteredPin('');
        return;
      }

      const success = loginWithPin(pin);
      if (success) {
        recordLoginAttempt(matchedUser.usuario, true, undefined, loja.id, loja.nome);
        onLoginSuccess?.();
        return;
      }
    }

    setErrorMsg('PIN incorreto para esta loja.');
    recordLoginAttempt(`pin_invalido_${pin}`, false, 'PIN incorreto no terminal', loja.id, loja.nome);
    setEnteredPin('');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Warm Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-5 relative z-10">
        {/* Brand & Store Header */}
        <div className="text-center space-y-2">
          {mode === 'dono' ? (
            <div className="inline-flex p-3 bg-gradient-to-tr from-amber-600 via-amber-500 to-red-600 rounded-2xl shadow-lg shadow-amber-950/20 text-white">
              <Shield className="w-8 h-8" />
            </div>
          ) : loja?.logo_url ? (
            <img
              src={loja.logo_url}
              alt={loja.nome}
              className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-md mx-auto"
            />
          ) : (
            <div className="inline-flex p-3 bg-gradient-to-tr from-red-700 via-red-600 to-amber-600 rounded-2xl shadow-lg shadow-red-950/20 text-white animate-bounce-short">
              <Pizza className="w-8 h-8" />
            </div>
          )}

          <div>
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-amber-800 dark:text-amber-400">
              {mode === 'dono' ? 'Plataforma AtendeJá' : (loja?.marca || loja?.nome || 'AtendeJá')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-stone-900 dark:text-white">
              {mode === 'dono'
                ? 'Acesso Master da Plataforma'
                : panelInfo.title}
            </h1>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            {mode === 'dono'
              ? 'Área restrita de governança e gestão multi-lojas'
              : `${panelInfo.desc} • ${loja?.nome || ''}`}
          </p>

          {mode !== 'dono' && (
            <div className="pt-1 flex justify-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${panelInfo.badgeColor}`}>
                {panelInfo.icon}
                <span>Acesso Seguro via Link Exclusivo</span>
              </span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FORMULÁRIO DE LOGIN COM USUÁRIO E SENHA (MÍNIMO 6 CARACTERES) */}
        {/* ========================================================================= */}
        {!usePinMode ? (
          <form
            onSubmit={handleUserPasswordLogin}
            className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 shadow-xl space-y-4"
          >
            <div className="text-center space-y-1 pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                Identificação de Usuário
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Insira seu login e senha cadastrados para liberar o terminal.
              </p>
            </div>

            {errorMsg && (
              <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900 animate-shake">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Usuário (Login)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder={mode === 'dono' ? 'admin.master' : 'ex: joao.garcom'}
                    autoComplete="username"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition"
                  />
                  <UserIcon className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Senha
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Mínimo 6 caracteres
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    minLength={6}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 active:bg-black text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Validando...' : 'Acessar Terminal'}</span>
            </button>

            {mode === 'loja_equipe' && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUsePinMode(true);
                    setErrorMsg('');
                  }}
                  className="text-xs font-semibold text-stone-500 hover:text-amber-600 transition cursor-pointer underline underline-offset-2"
                >
                  Ou entrar com PIN rápido de 4 dígitos
                </button>
              </div>
            )}
          </form>
        ) : (
          /* ========================================================================= */
          /* MODO SECUNDÁRIO: TERMINAL DA EQUIPE (PIN DE 4 DÍGITOS) */
          /* ========================================================================= */
          <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center justify-center gap-1.5">
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
                        : 'border-stone-300 bg-stone-100 dark:border-stone-700 dark:bg-stone-800'
                    }`}
                  />
                ))}
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900 animate-shake">
                  {errorMsg}
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
                  className="h-13 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-xl font-bold text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 shadow-2xs transition active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEnteredPin('')}
                className="h-13 rounded-2xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 text-xs font-bold text-stone-500 border border-stone-200 dark:border-stone-700 transition flex items-center justify-center cursor-pointer"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handlePinClick('0')}
                className="h-13 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-xl font-bold text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 shadow-2xs transition flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-13 rounded-2xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 text-sm font-bold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition flex items-center justify-center cursor-pointer"
              >
                ⌫
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setUsePinMode(false);
                  setErrorMsg('');
                }}
                className="text-xs font-semibold text-stone-500 hover:text-amber-600 transition cursor-pointer underline underline-offset-2"
              >
                Voltar para login com usuário e senha
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-[11px] text-stone-400 space-y-1">
          <p className="font-medium text-stone-500 dark:text-stone-400">
            AtendeJá • Plataforma com Proteção LGPD & Tokens Exclusivos
          </p>
        </div>
      </div>
    </div>
  );
};
