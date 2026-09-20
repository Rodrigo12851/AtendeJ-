// Utilities for currency, date and number formatting

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '--/--/----';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '--/--/----';
  }
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '--/--/---- --:--';
  try {
    const d = new Date(isoString);
    return `${formatDate(isoString)} às ${formatTime(isoString)}`;
  } catch {
    return '--/--/---- --:--';
  }
}

export function getElapsedMinutes(isoString?: string): number {
  if (!isoString) return 0;
  const start = new Date(isoString).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((now - start) / (1000 * 60));
  return Math.max(0, diffMinutes);
}

export function generateComandaNumber(existingCount: number): string {
  const nextNum = (existingCount + 480).toString().padStart(5, '0');
  return `#${nextNum}`;
}
