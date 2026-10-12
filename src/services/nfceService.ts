import { Order, Comanda, Loja, NfceInfo } from '../types';

/**
 * Mapeia as formas de pagamento do sistema para os códigos oficiais da SEFAZ para NFC-e (tPag)
 * 01: Dinheiro | 02: Cheque | 03: Cartão de Crédito | 04: Cartão de Débito | 15: Boleto | 17: PIX | 99: Outros
 */
export function mapPaymentMethodToSefaz(method?: string): string {
  switch (method?.toLowerCase()) {
    case 'dinheiro':
      return '01';
    case 'credito':
      return '03';
    case 'debito':
      return '04';
    case 'pix':
      return '17';
    case 'vale':
      return '10'; // Vale Alimentação / Refeição
    default:
      return '99';
  }
}

export function getPaymentMethodName(sefazCode: string): string {
  switch (sefazCode) {
    case '01': return 'Dinheiro';
    case '03': return 'Cartão de Crédito';
    case '04': return 'Cartão de Débito';
    case '17': return 'PIX';
    case '10': return 'Vale Refeição/Alimentação';
    default: return 'Outros';
  }
}

/**
 * Gera uma chave de acesso simulada da SEFAZ de 44 dígitos no padrão nacional:
 * [UF 2d][AAMM 4d][CNPJ 14d][Mod 2d (65)][Série 3d][Número 9d][TipoEmis 1d][Código 8d][DV 1d]
 */
function generateMockChaveAcesso(cnpj: string, serie: number, numero: number): string {
  const uf = '35'; // SP padrão
  const now = new Date();
  const aamm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const cleanCnpj = (cnpj || '12345678000199').replace(/\D/g, '').padStart(14, '0');
  const mod = '65'; // 65: NFC-e
  const seriePad = String(serie || 1).padStart(3, '0');
  const numPad = String(numero).padStart(9, '0');
  const tpEmis = '1'; // Normal
  const codRand = String(Math.floor(10000000 + Math.random() * 90000000));
  const pre = `${uf}${aamm}${cleanCnpj}${mod}${seriePad}${numPad}${tpEmis}${codRand}`;
  
  // Cálculo simplificado de dígito verificador
  let soma = 0;
  let peso = 2;
  for (let i = pre.length - 1; i >= 0; i--) {
    soma += parseInt(pre[i], 10) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const dv = 11 - (soma % 11) >= 10 ? 0 : 11 - (soma % 11);
  return `${pre}${dv}`;
}

export interface NfceItemPayload {
  numero_item: number;
  codigo_produto: string;
  descricao: string;
  codigo_ncm: string;
  cfop: string;
  unidade_comercial: string;
  quantidade_comercial: number;
  valor_unitario_comercial: string;
  valor_total_bruto: string;
  codigo_ean_comercial: string;
  icms_origem: string;
  icms_situacao_tributaria: string;
}

export interface NfcePayload {
  natureza_operacao: string;
  data_emissao: string;
  tipo_documento: number;
  presenca_comprador: number;
  consumidor_final: number;
  cnpj_emitente: string;
  cliente?: {
    cpf?: string;
    nome?: string;
  };
  itens: NfceItemPayload[];
  formas_pagamento: Array<{
    forma_pagamento: string;
    valor_pagamento: string;
  }>;
}

/**
 * Constrói o payload padronizado da NFC-e a partir de um pedido ou comanda
 */
export function buildNfcePayload(
  pedidoOuComanda: Order | Comanda,
  loja: Loja,
  cpfConsumidor?: string
): NfcePayload {
  const fiscalConfig = loja.fiscal_config;
  const rawItens = 'itens' in pedidoOuComanda ? pedidoOuComanda.itens : [];
  const activeItens = rawItens.filter((it) => it.status === 'ativo');

  const itensPayload: NfceItemPayload[] = activeItens.map((it, idx) => {
    const totalItem = it.preco_total;
    const qtd = it.quantidade || 1;
    const precoUnit = it.preco_unitario || totalItem / qtd;

    return {
      numero_item: idx + 1,
      codigo_produto: String(it.produto_id || idx + 1),
      descricao: it.nome,
      codigo_ncm: (it as any).ncm?.replace(/\D/g, '') || '19059090', // Default: Pizzas / Pães
      cfop: (it as any).cfop || '5101',
      unidade_comercial: 'UN',
      quantidade_comercial: qtd,
      valor_unitario_comercial: precoUnit.toFixed(2),
      valor_total_bruto: totalItem.toFixed(2),
      codigo_ean_comercial: (it as any).codigo_barras || 'SEM GTIN',
      icms_origem: (it as any).origem || '0',
      icms_situacao_tributaria: (it as any).csosn || '102', // 102: Simples Nacional sem crédito
    };
  });

  const total = pedidoOuComanda.total;
  let formaPagtoStr = '01'; // Default: Dinheiro

  if ('forma_pagamento' in pedidoOuComanda && (pedidoOuComanda as Order).forma_pagamento) {
    formaPagtoStr = mapPaymentMethodToSefaz((pedidoOuComanda as Order).forma_pagamento);
  } else if ('pagamentos' in pedidoOuComanda && (pedidoOuComanda as Comanda).pagamentos?.length) {
    const primary = (pedidoOuComanda as Comanda).pagamentos[0];
    formaPagtoStr = mapPaymentMethodToSefaz(primary.forma_pagamento);
  }

  const isDelivery = 'origem' in pedidoOuComanda && (pedidoOuComanda as Order).origem === 'delivery';

  return {
    natureza_operacao: 'VENDA AO CONSUMIDOR',
    data_emissao: new Date().toISOString(),
    tipo_documento: 1, // Saída
    presenca_comprador: isDelivery ? 4 : 1, // 1: Presencial | 4: Entrega em domicílio
    consumidor_final: 1,
    cnpj_emitente: (fiscalConfig?.cnpj || loja.cnpj || '00000000000000').replace(/\D/g, ''),
    cliente: cpfConsumidor
      ? {
          cpf: cpfConsumidor.replace(/\D/g, ''),
          nome: ('cliente_nome' in pedidoOuComanda && (pedidoOuComanda as Order).cliente_nome) || 'CONSUMIDOR',
        }
      : undefined,
    itens: itensPayload,
    formas_pagamento: [
      {
        forma_pagamento: formaPagtoStr,
        valor_pagamento: total.toFixed(2),
      },
    ],
  };
}

/**
 * Dispara a emissão de NFC-e.
 * Suporta emissão real via API (Focus NFe / Nuvem Fiscal) ou simulação em homologação com geração de DANFE.
 */
export async function emitirNfce(
  pedidoOuComanda: Order | Comanda,
  loja: Loja,
  cpfConsumidor?: string
): Promise<NfceInfo> {
  const fiscalConfig = loja.fiscal_config;
  const isSimulador = !fiscalConfig?.api_token || fiscalConfig.api_gateway === 'simulador';

  const numeroNota = (fiscalConfig?.proximo_numero_nfce || 101);
  const serie = fiscalConfig?.serie_nfce || 1;

  // MODO 1: SIMULADOR / AMBIENTE DE HOMOLOGAÇÃO LOCAL (Ideal para testes imediatos sem custo de API)
  if (isSimulador) {
    // Simula delay de 1.2s de comunicação com SEFAZ
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const chaveAcesso = generateMockChaveAcesso(fiscalConfig?.cnpj || loja.cnpj || '', serie, numeroNota);
    const protocolo = `135${String(Date.now()).slice(-9)}`;
    const qrCodeUrl = `https://www.sefaz.sp.gov.br/nfce/qrcode?p=${chaveAcesso}|2|1|1|${fiscalConfig?.csc_token_codigo || 'TESTE'}`;

    return {
      status: 'autorizada',
      numero: numeroNota,
      serie,
      chave_acesso: chaveAcesso,
      protocolo,
      data_emissao: new Date().toISOString(),
      mensagem_sefaz: 'Autorizado o uso da NFC-e (Homologação / Simulado)',
      danfe_url: qrCodeUrl,
      danfe_qrcode: qrCodeUrl,
      cpf_consumidor: cpfConsumidor || undefined,
      ambiente: fiscalConfig?.ambiente || 'homologacao',
    };
  }

  // MODO 2: INTEGRAÇÃO REAL COM FOCUS NFE OU NUVEM FISCAL
  const payload = buildNfcePayload(pedidoOuComanda, loja, cpfConsumidor);
  const ref = `PED-${pedidoOuComanda.id || (pedidoOuComanda as Comanda).numero}-${Date.now()}`;

  const isProd = fiscalConfig.ambiente === 'producao';
  const baseUrl = isProd
    ? 'https://api.focusnfe.com.br/v2'
    : 'https://homologacao.focusnfe.com.br/v2';

  try {
    const res = await fetch(`${baseUrl}/nfce?ref=${ref}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(fiscalConfig.api_token + ':')}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && (data.status === 'autorizado' || data.status === 'autorizada')) {
      return {
        status: 'autorizada',
        numero: data.numero,
        serie: data.serie,
        chave_acesso: data.chave_nfe,
        protocolo: data.protocolo,
        data_emissao: new Date().toISOString(),
        mensagem_sefaz: 'Autorizado o uso da NFC-e pela SEFAZ',
        danfe_url: data.caminho_danfe,
        xml_url: data.caminho_xml_nota_fiscal,
        cpf_consumidor: cpfConsumidor || undefined,
        ambiente: fiscalConfig.ambiente,
      };
    } else {
      return {
        status: 'rejeitada',
        mensagem_sefaz: data.mensagem_sefaz || data.erros?.[0]?.mensagem || 'Rejeição na validação da SEFAZ',
        ambiente: fiscalConfig.ambiente,
      };
    }
  } catch (err: any) {
    return {
      status: 'rejeitada',
      mensagem_sefaz: `Erro de conexão com o Gateway Fiscal: ${err?.message || 'Falha de rede'}`,
      ambiente: fiscalConfig.ambiente,
    };
  }
}
