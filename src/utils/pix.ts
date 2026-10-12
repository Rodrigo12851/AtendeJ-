/**
 * Utilitário de Geração de PIX Padrão Banco Central do Brasil (BR Code / EMVCo)
 * Permite gerar o código "Pix Copia e Cola" oficial e URL de QR Code para qualquer chave.
 */

// Cálculo oficial do CRC-16 (Polinômio 0x1021, Init 0xFFFF)
function crc16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Formata campo no padrão TLV (Tag-Length-Value) do EMVCo
function formatTlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// Normaliza strings (remove acentos e caracteres especiais para nomes de cidades/titulares)
function normalizeString(str: string, maxLength: number): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .slice(0, maxLength);
}

export interface GeneratePixParams {
  chave: string;
  tipoChave?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  nomeTitular?: string;
  cidadeTitular?: string;
  valor?: number;
  txId?: string;
}

/**
 * Normaliza a chave Pix conforme seu tipo:
 * - Telefone: adiciona prefixo internacional +55 caso não tenha
 * - CPF / CNPJ: remove pontuações
 * - E-mail / Aleatória: trim
 */
export function sanitizePixKey(chave: string, tipo?: string): string {
  if (!chave) return '';
  const trimmed = chave.trim();

  if (tipo === 'telefone') {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) {
      return `+${digits}`;
    }
    return `+55${digits}`;
  }

  if (tipo === 'cpf' || tipo === 'cnpj') {
    return trimmed.replace(/\D/g, '');
  }

  return trimmed;
}

/**
 * Gera a string oficial do Pix Copia e Cola (BR Code)
 */
export function generatePixPayload({
  chave,
  tipoChave,
  nomeTitular = 'RECEBEDOR',
  cidadeTitular = 'SAO PAULO',
  valor,
  txId = '***',
}: GeneratePixParams): string {
  if (!chave) return '';

  const cleanKey = sanitizePixKey(chave, tipoChave);
  const cleanName = normalizeString(nomeTitular || 'ESTABELECIMENTO', 25).toUpperCase() || 'RECEBEDOR';
  const cleanCity = normalizeString(cidadeTitular || 'CIDADE', 15).toUpperCase() || 'SAO PAULO';
  const cleanTxId = normalizeString(txId || '***', 25) || '***';

  // 00: Payload Format Indicator (01)
  let payload = formatTlv('00', '01');

  // 26: Merchant Account Information (GUI + Chave)
  const gui = formatTlv('00', 'br.gov.bcb.pix');
  const keyField = formatTlv('01', cleanKey);
  payload += formatTlv('26', `${gui}${keyField}`);

  // 52: Merchant Category Code (0000)
  payload += formatTlv('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatTlv('53', '986');

  // 54: Transaction Amount (opcional, formatado com 2 casas)
  if (valor !== undefined && valor > 0) {
    const valorStr = valor.toFixed(2);
    payload += formatTlv('54', valorStr);
  }

  // 58: Country Code (BR)
  payload += formatTlv('58', 'BR');

  // 59: Merchant Name
  payload += formatTlv('59', cleanName);

  // 60: Merchant City
  payload += formatTlv('60', cleanCity);

  // 62: Additional Data Field Template (TxID)
  const txIdField = formatTlv('05', cleanTxId);
  payload += formatTlv('62', txIdField);

  // 63: CRC16 (Tag + Comprimento '04')
  const payloadToCrc = `${payload}6304`;
  const checksum = crc16(payloadToCrc);

  return `${payloadToCrc}${checksum}`;
}

/**
 * Retorna URL da imagem do QR Code a partir do payload ou texto
 */
export function getPixQrCodeUrl(payloadOrKey: string, size = 260): string {
  if (!payloadOrKey) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(payloadOrKey)}`;
}

/**
 * Formata chave para exibição visual amigável
 */
export function formatPixKeyDisplay(chave: string, tipo?: string): string {
  if (!chave) return '';
  const clean = chave.trim();

  if (tipo === 'cpf') {
    const d = clean.replace(/\D/g, '');
    if (d.length === 11) {
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    }
  }

  if (tipo === 'cnpj') {
    const d = clean.replace(/\D/g, '');
    if (d.length === 14) {
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    }
  }

  if (tipo === 'telefone') {
    const d = clean.replace(/\D/g, '');
    if (d.length === 11) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    if (d.length === 10) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    }
  }

  return clean;
}
