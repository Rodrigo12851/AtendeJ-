import { Order, OrderStatus } from '../types';

/**
 * Ordem de prioridade estrita de status dos pedidos:
 * 1º - 'novo': Pedidos novos SEMPRE constam na frente dos já confirmados e dos entregues.
 * 2º - 'em_preparo': Já confirmados e em preparação.
 * 3º - 'pronto': Prontos para entrega/retirada.
 * 4º - 'a_caminho': Com motoboy em rota.
 * 5º - 'entregue': Entregues/concluídos.
 * 6º - 'cancelado': Cancelados.
 */
export const ORDER_STATUS_PRIORITY: Record<OrderStatus, number> = {
  novo: 1,
  em_preparo: 2,
  pronto: 3,
  a_caminho: 4,
  entregue: 5,
  cancelado: 6,
};

/**
 * Função comparadora de ordenação de pedidos.
 * Garante que pedidos novos constem na frente dos já confirmados e dos entregues.
 * Dentro do mesmo status, o mais recente (criado_em decrescente) aparece no topo.
 */
export const sortOrdersNovosFirst = (a: Order, b: Order): number => {
  const prioA = ORDER_STATUS_PRIORITY[a.status] ?? 99;
  const prioB = ORDER_STATUS_PRIORITY[b.status] ?? 99;

  if (prioA !== prioB) {
    return prioA - prioB;
  }

  // Mesmo status: o mais recente fica no topo
  const timeA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
  const timeB = b.criado_em ? new Date(b.criado_em).getTime() : 0;

  if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
    return timeB - timeA;
  }

  // Fallback por ID decrescente
  return (b.id || 0) - (a.id || 0);
};

/**
 * Retorna uma cópia ordenada da lista de pedidos com novos na frente.
 */
export const sortOrdersList = (orders: Order[]): Order[] => {
  return [...orders].sort(sortOrdersNovosFirst);
};

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Verifica se um pedido foi criado há mais de 24 horas.
 */
export const isOrderOlderThan24h = (order: Order, now = Date.now()): boolean => {
  if (!order.criado_em) return false;
  const time = new Date(order.criado_em).getTime();
  if (isNaN(time)) return false;
  return now - time > TWENTY_FOUR_HOURS_MS;
};

export interface OrderDateTimeCaixaInfo {
  text: string;
  isOlderThan24h: boolean;
  isPreviousDay: boolean;
}

/**
 * Formata a data e hora do pedido especificamente para o Caixa:
 * - Se criado hoje e com menos de 24 horas: exibe apenas o horário (ex: "16:55").
 * - Se for de ontem ou tiver mais de 24 horas: exibe a data completa junto com o horário
 *   (ex: "Ontem (10/10) às 14:15" ou "09/10/2026 às 13:41").
 */
export const formatOrderDateTimeCaixa = (
  criadoEm?: string,
  nowMs = Date.now()
): OrderDateTimeCaixaInfo => {
  if (!criadoEm) return { text: '--:--', isOlderThan24h: false, isPreviousDay: false };
  const d = new Date(criadoEm);
  if (isNaN(d.getTime())) return { text: '--:--', isOlderThan24h: false, isPreviousDay: false };

  const now = new Date(nowMs);
  const diffMs = nowMs - d.getTime();
  const isOlder = diffMs > TWENTY_FOUR_HOURS_MS;

  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (isSameDay && !isOlder) {
    return { text: timeStr, isOlderThan24h: false, isPreviousDay: false };
  }

  // Verifica se o pedido é de ontem
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const dayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (isYesterday) {
    return {
      text: `Ontem (${dayStr}) às ${timeStr}`,
      isOlderThan24h: true,
      isPreviousDay: true,
    };
  }

  return {
    text: `${dayStr} às ${timeStr}`,
    isOlderThan24h: true,
    isPreviousDay: true,
  };
};

/**
 * Filtra e organiza os pedidos de um canal/categoria no Caixa:
 * 1. Regra das 24 Horas: Apenas pedidos criados nas últimas 24 horas permanecem por padrão.
 * 2. Exceção do Último Pedido: Se a categoria/canal não tiver nenhum pedido nas últimas 24h,
 *    o último pedido realizado naquela categoria é mantido para não zerar o histórico.
 * 3. Pedidos pendentes/em aberto de dias anteriores também são preservados até serem finalizados.
 * 4. Posicionamento: Pedidos com mais de 24 horas (como o último pedido retido)
 *    ficam posicionados PARA BAIXO na categoria (no final da lista).
 */
export const filterAndSortCaixaChannelOrders = (channelOrders: Order[], nowMs = Date.now()): Order[] => {
  if (!channelOrders || channelOrders.length === 0) return [];

  // Pedidos com até 24 horas
  const recentOrders = channelOrders.filter((o) => !isOrderOlderThan24h(o, nowMs));

  // Pedidos com mais de 24 horas
  const olderOrders = channelOrders.filter((o) => isOrderOlderThan24h(o, nowMs));

  let retainedOlderOrders: Order[] = [];

  if (recentOrders.length === 0) {
    // Se não há pedidos recentes, mantém o último pedido realizado nesta categoria
    if (olderOrders.length > 0) {
      const sortedByRecency = [...olderOrders].sort((a, b) => {
        const tA = new Date(a.criado_em).getTime();
        const tB = new Date(b.criado_em).getTime();
        return tB - tA;
      });
      retainedOlderOrders = [sortedByRecency[0]];
    }
  } else {
    // Se há pedidos recentes, mantém pedidos antigos apenas se ainda estiverem em aberto (não entregues/cancelados)
    const pendingOlder = olderOrders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado');
    retainedOlderOrders = pendingOlder;
  }

  // Ordena os pedidos recentes: prioridade de status (Novos na frente)
  const sortedRecent = [...recentOrders].sort(sortOrdersNovosFirst);

  // Pedidos com mais de 24h (como o último pedido retido) ficam PARA BAIXO na lista
  const sortedOlder = [...retainedOlderOrders].sort((a, b) => {
    const tA = new Date(a.criado_em).getTime();
    const tB = new Date(b.criado_em).getTime();
    return tB - tA;
  });

  return [...sortedRecent, ...sortedOlder];
};

