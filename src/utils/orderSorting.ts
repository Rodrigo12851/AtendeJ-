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
