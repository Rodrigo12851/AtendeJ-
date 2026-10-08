import { Loja } from '../types';

export interface StoreOpenStatus {
  isOpen: boolean;
  statusLabel: string;
  statusClass: string;
  badgeBg: string;
  reason?: string;
  horarioFormatado: string;
}

/**
 * Avalia com precisão se a loja está aberta ou fechada no momento exato
 * Baseado no horário de funcionamento configurado (ex: "18:00 às 23:30"),
 * no status da loja (ativa/suspensa) e no controle manual da gerência.
 */
export function getStoreOpenStatus(loja: Loja | undefined | null, customDate?: Date): StoreOpenStatus {
  if (!loja) {
    return {
      isOpen: false,
      statusLabel: 'Indisponível',
      statusClass: 'text-stone-400',
      badgeBg: 'bg-stone-500/20 text-stone-400',
      reason: 'Estabelecimento não encontrado.',
      horarioFormatado: 'Não informado',
    };
  }

  const horarioStr = (loja.horario_funcionamento || '18:00 às 23:30').trim();

  // 1. Se a loja estiver suspensa pelo Dono do App
  if (!loja.ativa || loja.status_assinatura === 'suspenso') {
    return {
      isOpen: false,
      statusLabel: 'Loja Suspensa',
      statusClass: 'text-red-500',
      badgeBg: 'bg-red-500/20 text-red-500',
      reason: 'Este estabelecimento está temporariamente indisponível no sistema.',
      horarioFormatado: horarioStr,
    };
  }

  // 2. Se a gerência fechou a loja manualmente
  if (loja.fechado_manualmente) {
    return {
      isOpen: false,
      statusLabel: 'Fechada Temporariamente',
      statusClass: 'text-red-500',
      badgeBg: 'bg-red-500/20 text-red-500',
      reason: 'A loja foi fechada temporariamente pela gerência para novos pedidos.',
      horarioFormatado: horarioStr,
    };
  }

  // 3. Validação matemática do Horário de Funcionamento
  // Extrai horários como "18:00" e "23:30"
  const timeRegex = /(\d{1,2}):(\d{2})/g;
  const matches = [...horarioStr.matchAll(timeRegex)];

  if (matches.length >= 2) {
    const startHour = parseInt(matches[0][1], 10);
    const startMin = parseInt(matches[0][2], 10);
    const endHour = parseInt(matches[1][1], 10);
    const endMin = parseInt(matches[1][2], 10);

    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    const now = customDate || new Date();
    const nowTotal = now.getHours() * 60 + now.getMinutes();

    let isWithinHours = false;

    if (endTotal > startTotal) {
      // Abre e fecha no mesmo dia (ex: 18:00 às 23:30)
      isWithinHours = nowTotal >= startTotal && nowTotal < endTotal;
    } else {
      // Passa da meia-noite (ex: 18:00 às 01:30 ou 18:00 às 00:00)
      isWithinHours = nowTotal >= startTotal || nowTotal < endTotal;
    }

    if (isWithinHours) {
      return {
        isOpen: true,
        statusLabel: 'Aberto Agora',
        statusClass: 'text-emerald-500 dark:text-emerald-400',
        badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        horarioFormatado: horarioStr,
      };
    } else {
      return {
        isOpen: false,
        statusLabel: 'Fechado no Momento',
        statusClass: 'text-red-500 dark:text-red-400',
        badgeBg: 'bg-red-500/15 text-red-600 dark:text-red-400',
        reason: `Estamos fechados no momento. Nosso horário de atendimento é de ${horarioStr}.`,
        horarioFormatado: horarioStr,
      };
    }
  }

  // Se o formato não puder ser lido, assume aberto caso ativa
  return {
    isOpen: true,
    statusLabel: 'Aberto',
    statusClass: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/15 text-emerald-600',
    horarioFormatado: horarioStr,
  };
}
