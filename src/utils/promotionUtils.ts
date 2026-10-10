import { Product } from '../types';

/**
 * Verifica se um produto está com uma promoção ativa e válida no momento atual.
 */
export function isProductPromotionActive(product: Product): boolean {
  if (!product.em_promocao) return false;
  if (!product.preco_promocional || product.preco_promocional <= 0) return false;

  // Se tiver data de expiração definida
  if (product.promocao_fim) {
    const fimTime = new Date(product.promocao_fim).getTime();
    const nowTime = Date.now();
    if (nowTime > fimTime) {
      return false; // Promoção expirou
    }
  }

  return true;
}

/**
 * Retorna o preço efetivo do produto (promocional se ativo, senão preço normal).
 */
export function getProductEffectivePrice(product: Product): number {
  if (isProductPromotionActive(product) && product.preco_promocional) {
    return product.preco_promocional;
  }
  return product.preco;
}

/**
 * Formata o tempo restante de uma promoção (ex: "Faltam 3h 45m" ou "Falta 1 dia").
 */
export function formatPromotionRemaining(product: Product): string | null {
  if (!isProductPromotionActive(product) || !product.promocao_fim) return null;

  const diffMs = new Date(product.promocao_fim).getTime() - Date.now();
  if (diffMs <= 0) return 'Expirada';

  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    const remHours = diffHours % 24;
    return `${diffDays}d ${remHours > 0 ? `${remHours}h` : ''} restantes`;
  }

  if (diffHours >= 1) {
    const remMin = diffMin % 60;
    return `${diffHours}h ${remMin > 0 ? `${remMin}m` : ''} restantes`;
  }

  return `${Math.max(1, diffMin)} min restantes`;
}
