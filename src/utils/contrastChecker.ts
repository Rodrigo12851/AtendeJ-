/**
 * Algoritmo de Análise de Contraste e Acessibilidade (WCAG 2.1)
 * Implementação conforme PRD de IA Auto-Fix de Contraste & Dark Mode.
 */

// Converte string Hexadecimal (#fff ou #ffffff) para valores RGB [0..255]
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((char) => char + char).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Calcula a Luminância Relativa segundo a fórmula oficial WCAG 2.1
export function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calcula a Razão de Contraste (Contrast Ratio) entre duas cores Hex
export function getContrastRatio(color1Hex: string, color2Hex: string): number {
  const lum1 = getLuminance(hexToRgb(color1Hex));
  const lum2 = getLuminance(hexToRgb(color2Hex));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Verifica se atende os critérios da WCAG 2.1 AA (4.5:1 para texto normal, 3:1 para grande/negrito)
export function isWcagPass(fgHex: string, bgHex: string, isLargeOrBold = false): boolean {
  const ratio = getContrastRatio(fgHex, bgHex);
  const minRatio = isLargeOrBold ? 3.0 : 4.5;
  return ratio >= minRatio;
}

// Tabela de Mapeamento Automático de Cores (PRD Seção 4.2)
export const AUTOMATIC_CONTRAST_REPLACEMENTS: Record<string, string> = {
  // Cores escuras que falham no Dark Mode -> Substitutos de alto contraste
  'text-black': 'text-white',
  'text-[#000000]': 'text-white',
  'text-[#141414]': 'text-slate-100',
  'text-slate-900': 'text-slate-100',
  'text-gray-900': 'text-slate-100',
  'text-stone-900': 'text-slate-100',
  'text-slate-800': 'text-slate-300',
  'text-gray-800': 'text-slate-300',
  'text-stone-800': 'text-slate-300',
  'text-gray-700': 'text-slate-300',
  'text-stone-700': 'text-slate-300',
};

/**
 * Sugere a cor de texto com maior contraste em relação a um fundo escuro
 */
export function suggestHighContrastFix(bgHex: string): string {
  const whiteRatio = getContrastRatio('#FFFFFF', bgHex);
  const slate100Ratio = getContrastRatio('#F1F5F9', bgHex);
  const slate300Ratio = getContrastRatio('#CBD5E1', bgHex);

  if (whiteRatio >= 4.5) return '#FFFFFF';
  if (slate100Ratio >= 4.5) return '#F1F5F9';
  if (slate300Ratio >= 4.5) return '#CBD5E1';
  return '#FFFFFF';
}
