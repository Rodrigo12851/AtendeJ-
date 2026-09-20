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
  admin_usuario_id?: string;
  taxas_bairro?: TaxaBairro[];
  plano?: 'basico' | 'pro' | 'enterprise';
  status_assinatura?: 'ativo' | 'trial' | 'suspenso';
  data_cadastro?: string;
}

export interface LoginAttempt {
  id: string;
  usuario: string;
  loja_id?: string;
  loja_nome?: string;
  data_hora: string;
  sucesso: boolean;
  ip_origem?: string;
  motivo_falha?: string;
  bloqueado?: boolean;
}

export type UserRole = 'super_admin' | 'admin' | 'garcom' | 'cozinha' | 'caixa';

export interface User {
  id: string;
  loja_id?: string;
  nome: string;
  usuario: string;
  senha: string;
  pin: string;
  perfil: UserRole;
  ativo: boolean;
  avatar?: string;
  telefone?: string;
}

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

  // Delivery & Cliente (Anota AI Style)
  tipo_pedido?: 'mesa' | 'delivery' | 'retirada';
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_endereco?: string;
  forma_pagamento?: string;
  troco_para?: number;
  taxa_entrega?: number;
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
  tipo: 'pedido_pronto' | 'novo_pedido' | 'comanda_fechada' | 'alerta_atraso';
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
