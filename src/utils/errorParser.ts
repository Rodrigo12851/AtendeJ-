/**
 * Utilitário para análise e extração de localização de erros (Arquivo, Linha e Coluna)
 */

export interface ParsedErrorLocation {
  fileName: string;
  filePath: string;
  lineNumber?: number;
  columnNumber?: number;
  rawLine: string;
}

export interface ErrorReport {
  timestamp: string;
  url: string;
  userAgent: string;
  errorMessage: string;
  errorName: string;
  location?: ParsedErrorLocation;
  componentStack?: string;
  fullStack?: string;
}

/**
 * Analisa o stack trace e encontra o primeiro arquivo relevante do projeto
 */
export function parseErrorStack(stack?: string): ParsedErrorLocation | null {
  if (!stack) return null;

  const lines = stack.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Ignora linhas internas do React, Vite e bundler
    if (
      trimmed.includes('node_modules') ||
      trimmed.includes('@vite') ||
      trimmed.includes('react-dom') ||
      trimmed.includes('chunk-') ||
      trimmed.includes('scheduler')
    ) {
      continue;
    }

    // Padrão 1: ... (path/file.tsx:linha:coluna) ou at path/file.tsx:linha:coluna
    // Exemplo: at CustomerDeliveryView (http://localhost:5173/src/components/delivery/CustomerDeliveryView.tsx:342:15)
    // Exemplo: at src/components/delivery/CustomerDeliveryView.tsx:342:15
    const match = trimmed.match(/(?:at\s+(?:.*?\s+\()?)?(?:https?:\/\/[^/]+)?(?:\/)?([^:()]+\.(?:tsx|ts|jsx|js))(?::(\d+))(?::(\d+))?/i);

    if (match) {
      const fullPath = match[1];
      const lineNum = match[2] ? parseInt(match[2], 10) : undefined;
      const colNum = match[3] ? parseInt(match[3], 10) : undefined;

      // Extrai apenas o nome do arquivo (ex: CustomerDeliveryView.tsx)
      const parts = fullPath.split(/[\/\\]/);
      const fileName = parts[parts.length - 1] || fullPath;

      return {
        fileName,
        filePath: fullPath,
        lineNumber: lineNum,
        columnNumber: colNum,
        rawLine: trimmed,
      };
    }
  }

  // Fallback: tenta capturar qualquer menção a linha e coluna se nada acima casou
  const fallbackMatch = stack.match(/([^:()\\\/]+\.(?:tsx|ts|jsx|js))(?::(\d+))(?::(\d+))?/i);
  if (fallbackMatch) {
    return {
      fileName: fallbackMatch[1],
      filePath: fallbackMatch[1],
      lineNumber: fallbackMatch[2] ? parseInt(fallbackMatch[2], 10) : undefined,
      columnNumber: fallbackMatch[3] ? parseInt(fallbackMatch[3], 10) : undefined,
      rawLine: fallbackMatch[0],
    };
  }

  return null;
}

/**
 * Limpa o Component Stack do React para exibir a hierarquia legível
 */
export function formatComponentStack(compStack?: string): string[] {
  if (!compStack) return [];
  return compStack
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('at ') || s.startsWith('in '))
    .map((s) => s.replace(/^(at|in)\s+/, ''))
    .slice(0, 6);
}

/**
 * Gera um relatório completo formatado em Markdown para fácil envio no chat/WhatsApp
 */
export function generateErrorReportText(report: ErrorReport): string {
  let md = `🚨 *RELATÓRIO DE ERRO DO SISTEMA*\n`;
  md += `📅 *Data/Hora:* ${report.timestamp}\n`;
  md += `🌐 *Página:* ${report.url}\n\n`;

  md += `💥 *ERRO:* ${report.errorName}: ${report.errorMessage}\n`;

  if (report.location) {
    md += `📍 *LOCALIZAÇÃO DO ERRO:*\n`;
    md += `• *Arquivo:* \`${report.location.fileName}\`\n`;
    if (report.location.lineNumber) {
      md += `• *Linha:* \`${report.location.lineNumber}\``;
      if (report.location.columnNumber) {
        md += ` (Coluna: \`${report.location.columnNumber}\`)`;
      }
      md += `\n`;
    }
    md += `• *Caminho:* \`${report.location.filePath}\`\n\n`;
  }

  if (report.componentStack) {
    md += `🧩 *HIERARQUIA DE COMPONENTES:*\n`;
    md += `${report.componentStack}\n\n`;
  }

  if (report.fullStack) {
    md += `📋 *STACK TRACE:*\n`;
    md += `\`\`\`\n${report.fullStack.slice(0, 800)}\n\`\`\`\n`;
  }

  md += `📱 *Dispositivo:* ${report.userAgent}`;

  return md;
}
