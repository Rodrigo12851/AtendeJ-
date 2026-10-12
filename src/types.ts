export interface TaxaBairro {
  id: string;
  bairro: string;
  valor: number;
}

export interface Loja {
  id: string;
  slug: string;
  nome: string;
  marca?: string;
  logo_url?: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  ativa: boolean;
  taxa_entrega: number;
  tempo_estimado_entrega?: string;
  horario_funcionamento?: string;
  fechado_manualmente?: boolean;
  admin_usuario_id?: string;
  taxas_bairro?: TaxaBairro[];
  plano?: 'basico' | 'pro' | 'enterprise';
  status_assinatura?: 'ativo' | 'trial' | 'suspenso';
  data_cadastro?: string;
  // Tokens exclusivos para acesso restrito
  token_admin?: string;
  token_garcom?: string;
  token_cozinha?: string;
  token_caixa?: string;
  // Configuração do PIX
  pix_chave?: string;
  pix_tipo_chave?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  pix_titular?: string;
  pix_cidade?: string;
  // Configuração Fiscal (NFC-e)
  fiscal_config?: LojaFiscalConfig;
}

export interface LojaFiscalConfig {
  habilitar_nfce: boolean;
  ambiente: 'homologacao' | 'producao';
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  inscricao_municipal?: string;
  regime_tributario: '1' | '2' | '3'; // 1: Simples Nacional, 2: Simples Nacional (excesso), 3: Regime Normal
  // Endereço fiscal
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  codigo_municipio_ibge: string;
  uf: string;
  // Parâmetros da NFC-e SEFAZ
  serie_nfce: number;
  proximo_numero_nfce: number;
  csc_token_id: string;
  csc_token_codigo: string;
  // Certificado Digital A1
  certificado_nome?: string;
  certificado_expiracao?: string;
  certificado_senha?: string;
  certificado_base64?: string;
  // Gateway de Emissão Fiscal
  api_gateway: 'focus_nfe' | 'nuvem_fiscal' | 'simulador';
  api_token?: string;
}

export interface NfceInfo {
  status: 'autorizada' | 'rejeitada' | 'pendente' | 'cancelada';
  numero?: number;
  serie?: number;
  chave_acesso?: string;
  protocolo?: string;
  data_emissao?: string;
  mensagem_sefaz?: string;
  danfe_url?: string;
  danfe_qrcode?: string;
  xml_url?: string;
  cpf_consumidor?: string;
  ambiente?: 'homologacao' | 'producao';
}

export interface LoginAttempt {
  id: string;
  usuario: string;
  loja_id?: string;
  loja_nome?: string;
  data_hora: string;
  sucesso: boolean;
  ip_origem?: string;
  cidade_regiao?: string;
  dispositivo?: string;
  navegador?: string;
  user_agent?: string;
  is_novo_ip?: boolean;
  is_novo_dispositivo?: boolean;
  alerta_risco?: 'normal' | 'suspeito' | 'alto_risco';
  motivo_falha?: string;
  detalhe_seguranca?: string;
  bloqueado?: boolean;
}

export type UserRole = 'super_admin' | 'admin' | 'garcom' | 'cozinha' | 'caixa';

export interface User {
  id: string;
  loja_id?: string;
  nome: string;
  usuario: string;
  senha?: string;
  senhaHash?: string;
  salt?: string;
  pin: string;
  perfil: UserRole;
  ativo: boolean;
  avatar?: string;
  telefone?: string;
}

export type SafeUser = Omit<User, 'senha' | 'senhaHash' | 'salt'>;

export type TableStatus = 'livre' | 'ocupada' | 'aguardando_fechamento' | 'reservada';

export interface Table {
  id: string;
  loja_id: string;
  numero: number;
  capacidade: number;
  status: TableStatus;
  localizacao: string;
  garcom_atual_id?: string;
  garcom_atual_nome?: string;
  comanda_atual_id?: string;
  comanda_atual_numero?: string;
  cliente_atual_nome?: string;
}

export interface Category {
  id: string;
  nome: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

export interface PizzaExtraOption {
  nome: string;
  preco: number;
}

export interface PizzaSizeOption {
  id: string;
  nome: string;
  fatias: number;
  maxSabores: number;
  multiplicador: number;
}

export interface PizzaCrustOption {
  id: string;
  nome: string;
  preco: number;
}

export interface PizzaDoughOption {
  id: string;
  nome: string;
}

export interface PizzaAddonOption {
  id: string;
  nome: string;
  preco: number;
}

export interface Product {
  id: string;
  loja_id?: string;
  categoria_id: string;
  codigo_interno?: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  ativo?: boolean;
  disponivel?: boolean;
  tempo_preparo_minutos?: number;
  isPizza?: boolean;
  destaque?: boolean;
  em_promocao?: boolean;
  preco_promocional?: number;
  promocao_tipo?: 'horas' | 'dias' | 'indeterminada';
  promocao_duracao_valor?: number;
  promocao_inicio?: string;
  promocao_fim?: string;
  imprime_cozinha?: boolean;
  sabores_disponiveis?: string[];
  permitirTamanhos?: boolean;
  permitirBordas?: boolean;
  permitirMassas?: boolean;
  permitirAdicionais?: boolean;
  tamanhos_disponiveis?: string[];
  bordas_disponiveis?: string[];
  massas_disponiveis?: string[];
  adicionais_disponiveis?: string[];
  // Fiscal / NFC-e
  ncm?: string;
  cest?: string;
  codigo_barras?: string; // EAN/GTIN ou "SEM GTIN"
  cfop?: string;
  origem?: '0' | '1' | '2';
  csosn?: '102' | '500' | '900';
  unidade_comercial?: string;
}

export interface OrderItem {
  id: string;
  pedido_id?: number;
  produto_id: string;
  nome: string;
  tamanho?: string;
  sabores?: string[];
  borda?: PizzaExtraOption;
  massa?: string;
  adicionais?: PizzaExtraOption[];
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  observacao?: string;
  status: 'ativo' | 'cancelado';
  cancelamento?: {
    motivo: string;
    usuario_nome: string;
    data: string;
  };
}

export type OrderStatus = 'novo' | 'em_preparo' | 'pronto' | 'a_caminho' | 'entregue' | 'cancelado';

export interface Order {
  id: number;
  loja_id?: string;
  comanda_id?: string;
  mesa_id?: string;
  mesa_numero?: number;
  garcom_id?: string;
  garcom_nome?: string;
  status: OrderStatus;
  observacao?: string;
  criado_em: string;
  tempo_preparo_inicio?: string;
  pronto_em?: string;
  a_caminho_em?: string;
  entregue_em?: string;
  itens: OrderItem[];

  motoboy_token?: string;
  motoboy_nome?: string;
  // Delivery & Cliente (Anota AI Style)
  tipo_pedido?: 'mesa' | 'delivery' | 'retirada';
  origem?: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_endereco?: string;
  forma_pagamento?: string;
  troco_para?: number;
  taxa_entrega?: number;
  delivery_info?: {
    cliente_nome?: string;
    cliente_telefone?: string;
    cliente_endereco?: string;
    telefone?: string;
    endereco?: string;
    forma_pagamento?: string;
    troco_para?: number;
    taxa_entrega?: number;
    tipo?: string;
  };
  nfce_info?: NfceInfo;
}

export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'vale';

export interface Payment {
  id: string;
  comanda_id: string;
  forma_pagamento: PaymentMethod;
  valor: number;
  troco_para?: number;
  troco?: number;
  criado_em: string;
  usuario_id: string;
  usuario_nome: string;
  pagador_nome?: string;
  itens_pagos_ids?: string[];
}

export interface Comanda {
  id: string;
  loja_id?: string;
  numero: string;
  mesa_id: string;
  mesa_numero: number;
  garcom_id: string;
  garcom_nome: string;
  cliente_nome?: string;
  status: 'aberta' | 'fechada' | 'cancelada';
  abertura: string;
  fechamento?: string;
  subtotal: number;
  desconto: number;
  motivo_desconto?: string;
  taxa_servico: number; // e.g. 10%
  total: number;
  pedidos_ids: number[];
  pagamentos: Payment[];
  observacao?: string;
  nfce_info?: NfceInfo;
}

export interface CashEntry {
  id: string;
  tipo: 'suprimento' | 'sangria';
  motivo: string;
  valor: number;
  data: string;
  usuario_nome: string;
}

export interface CashRegister {
  id: string;
  loja_id?: string;
  status: 'aberto' | 'fechado';
  usuario_abertura_id: string;
  usuario_abertura_nome: string;
  data_abertura: string;
  valor_inicial: number;
  data_fechamento?: string;
  usuario_fechamento_nome?: string;
  valor_final?: number;
  entradas: CashEntry[];
  observacoes?: string;
}

export interface SystemNotification {
  id: string;
  loja_id?: string;
  tipo: 'pedido_pronto' | 'novo_pedido' | 'pedido_novo' | 'pedido_a_caminho' | 'comanda_fechada' | 'alerta_atraso';
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  mesa_numero?: number;
  pedido_id?: number;
}

export interface Ingredient {
  id: string;
  loja_id?: string;
  codigo: string;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string; // 'un' | 'kg' | 'g' | 'L' | 'pacotes' | 'latas' | 'bisnagas' | 'garrafas' | 'potes' | 'maços' | 'sacos'
  estoque_minimo: number; // padrão 10
  custo_unitario?: number;
  local_armazenamento?: string;
  ultima_atualizacao: string;
  atualizado_por?: string;
  observacao?: string;
}

export interface StockMovement {
  id: string;
  ingrediente_id: string;
  ingrediente_nome: string;
  tipo: 'ajuste_manual' | 'entrada' | 'saida' | 'reposicao';
  quantidade_anterior: number;
  quantidade_nova: number;
  delta: number;
  motivo?: string;
  data: string;
  usuario_nome: string;
}
