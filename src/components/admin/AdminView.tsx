import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  UtensilsCrossed,
  Plus,
  AlertTriangle,
  Award,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Boxes,
  Camera,
  Upload,
  Image as ImageIcon,
  Settings,
  Store,
  MapPin,
  Share2,
  ExternalLink,
  Copy,
  Cloud,
  Database,
  KeyRound,
  ChefHat,
  CircleDollarSign,
  Flame,
  Tag,
  Timer,
  QrCode,
  FileText,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Package,
  Menu,
  ChevronLeft,
  Link2,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, Table, User, Category } from '../../types';
import { formatCurrency, formatDateTime, formatTime } from '../../utils/formatters';
import { compressImageFile } from '../../utils/imageCompressor';
import { hashPassword } from '../../utils/security';
import { isProductPromotionActive, formatPromotionRemaining } from '../../utils/promotionUtils';
import { formatPixKeyDisplay } from '../../utils/pix';
import { GraficosVendasPanel } from './GraficosVendasPanel';
import { FiscalSettingsTab } from './FiscalSettingsTab';

export const AdminView: React.FC = () => {
  const {
    lojas,
    products,
    categories,
    tables,
    users,
    currentUser,
    orders,
    comandas,
    addProduct,
    updateProduct,
    deleteProduct,
    addTable,
    deleteTable,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserLoginStatus,
    resetLoginLockout,
    currentLojaId,
    currentLoja,
    updateLoja,
    addTaxaBairro,
    deleteTaxaBairro,
    pizzaSizes,
    pizzaCrusts,
    pizzaDoughs,
    pizzaAddons,
    addPizzaSize,
    updatePizzaSize,
    deletePizzaSize,
    addPizzaCrust,
    updatePizzaCrust,
    deletePizzaCrust,
    addPizzaDough,
    updatePizzaDough,
    deletePizzaDough,
    addPizzaAddon,
    updatePizzaAddon,
    deletePizzaAddon,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'metricas' | 'graficos' | 'produtos' | 'opcoes' | 'mesas' | 'usuarios' | 'cancelamentos' | 'configuracoes' | 'fiscal'
  >('graficos');
  const [metricasSubView, setMetricasSubView] = useState<'graficos' | 'tabelas'>('graficos');
  const [periodFilter, setPeriodFilter] = useState<'hoje' | '7dias' | 'mes'>('hoje');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals for CRUD
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Customization Option Modals
  const [showOptionModal, setShowOptionModal] = useState<'size' | 'crust' | 'dough' | 'addon' | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState('');
  const [optSlices, setOptSlices] = useState('8');
  const [optMaxFlavors, setOptMaxFlavors] = useState('2');
  const [optMultiplier, setOptMultiplier] = useState('1.0');

  // New Product Form State (with photo/image and customization toggles)
  const [prodNome, setProdNome] = useState('');
  const [prodCategoria, setProdCategoria] = useState('pizzas');
  const [prodPreco, setProdPreco] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImagem, setProdImagem] = useState('');
  const [prodIsPizza, setProdIsPizza] = useState(false);
  const [prodDestaque, setProdDestaque] = useState(false);
  const [prodEmPromocao, setProdEmPromocao] = useState(false);
  const [prodPrecoPromocional, setProdPrecoPromocional] = useState('');
  const [prodImprimeCozinha, setProdImprimeCozinha] = useState(true);
  const [prodPermitirTamanhos, setProdPermitirTamanhos] = useState(true);
  const [prodPermitirBordas, setProdPermitirBordas] = useState(true);
  const [prodPermitirMassas, setProdPermitirMassas] = useState(true);
  const [prodPermitirAdicionais, setProdPermitirAdicionais] = useState(true);
  const [prodTamanhosSel, setProdTamanhosSel] = useState<string[]>([]);
  const [prodBordasSel, setProdBordasSel] = useState<string[]>([]);
  const [prodMassasSel, setProdMassasSel] = useState<string[]>([]);
  const [prodAdicionaisSel, setProdAdicionaisSel] = useState<string[]>([]);

  // Dados Fiscais do Produto (NFC-e / SEFAZ)
  const [prodNcm, setProdNcm] = useState('19059090');
  const [prodCest, setProdCest] = useState('');
  const [prodCodigoBarras, setProdCodigoBarras] = useState('SEM GTIN');
  const [prodCfop, setProdCfop] = useState('5101');
  const [prodCsosn, setProdCsosn] = useState<'102' | '500' | '900'>('102');
  const [prodOrigem, setProdOrigem] = useState<'0' | '1' | '2'>('0');

  // Controle de Estoque de Bebidas e Produtos
  const [prodControlarEstoque, setProdControlarEstoque] = useState(false);
  const [prodEstoque, setProdEstoque] = useState('');
  const [prodEstoqueMinimoAlerta, setProdEstoqueMinimoAlerta] = useState('5');

  // Produtos esgotados e com estoque baixo para alerta do admin
  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.controlar_estoque && (p.estoque === undefined || p.estoque <= 0));
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.controlar_estoque &&
        p.estoque !== undefined &&
        p.estoque > 0 &&
        p.estoque <= (p.estoque_minimo_alerta ?? 5)
    );
  }, [products]);

  // Quick Promo Modal State (Botão Rápido de Promoção direto na tabela)
  const [quickPromoProduct, setQuickPromoProduct] = useState<Product | null>(null);
  const [quickPromoPreco, setQuickPromoPreco] = useState('');
  const [quickPromoTipo, setQuickPromoTipo] = useState<'horas' | 'dias' | 'indeterminada'>('horas');
  const [quickPromoValor, setQuickPromoValor] = useState('4'); // 4 horas por padrão

  // New Table Form State
  const [tableNumero, setTableNumero] = useState(tables.length + 1);
  const [tableCapacidade, setTableCapacidade] = useState(4);
  const [tableLocalizacao, setTableLocalizacao] = useState('Salão Principal');

  // New User Form State
  const [userName, setUserName] = useState('');
  const [userLogin, setUserLogin] = useState('');
  const [userRole, setUserRole] = useState<'garcom' | 'cozinha' | 'caixa' | 'admin'>('garcom');
  const [userSenha, setUserSenha] = useState('');
  const [showAddUserPassword, setShowAddUserPassword] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserLogin, setEditUserLogin] = useState('');
  const [editUserRole, setEditUserRole] = useState<'garcom' | 'cozinha' | 'caixa' | 'admin'>('garcom');
  const [editUserSenha, setEditUserSenha] = useState('');
  const [editUserAtivo, setEditUserAtivo] = useState(true);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

  // Quick Password Reset Modal
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [quickNewPassword, setQuickNewPassword] = useState('');
  const [showQuickPassword, setShowQuickPassword] = useState(false);

  // Copiar link de acesso individual de cada colaborador
  const [copiedUserLinkId, setCopiedUserLinkId] = useState<string | null>(null);

  const getUserAccessUrl = (u: User) => {
    const userLoja = (u.loja_id ? lojas.find((l) => l.id === u.loja_id) : null) || currentLoja || lojas[0];
    const token =
      u.perfil === 'admin'
        ? userLoja?.token_admin
        : u.perfil === 'garcom'
        ? userLoja?.token_garcom
        : u.perfil === 'cozinha'
        ? userLoja?.token_cozinha
        : userLoja?.token_caixa;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?loja=${userLoja?.slug || 'loja-centro'}&painel=${u.perfil}&token=${token || ''}`;
  };

  const handleCopyUserAccessLink = (u: User) => {
    const url = getUserAccessUrl(u);
    navigator.clipboard.writeText(url);
    setCopiedUserLinkId(u.id);
    setTimeout(() => setCopiedUserLinkId(null), 2500);
  };

  const handleSendWhatsAppAccess = (u: User) => {
    const url = getUserAccessUrl(u);
    const userLoja = (u.loja_id ? lojas.find((l) => l.id === u.loja_id) : null) || currentLoja || lojas[0];
    const roleName =
      u.perfil === 'admin'
        ? 'Administrador'
        : u.perfil === 'garcom'
        ? 'Garçom'
        : u.perfil === 'cozinha'
        ? 'Cozinha (KDS)'
        : 'Caixa (PDV)';

    const text = `🍕 *Acesso ao Sistema — ${userLoja?.nome || 'Estabelecimento'}*\n\n` +
      `Olá, *${u.nome}*!\n` +
      `Segue o seu link de acesso exclusivo para o *Painel de ${roleName}*:\n\n` +
      `🔗 *Link do Painel:* ${url}\n` +
      `👤 *Usuário:* ${u.usuario}\n\n` +
      `_Salve este link nos seus favoritos para acessar seus turnos de trabalho._`;

    const cleanPhone = (u.telefone || '').replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
  };

  // Store-filtered users (avoids leaking staff between different stores)
  const storeUsers = useMemo(() => {
    const lojaId = currentLoja?.id || currentLojaId;
    return users
      .filter((u) => {
        if (u.perfil === 'super_admin') return false;
        if (u.loja_id) return u.loja_id === lojaId;
        return lojaId === 'loja_centro' || lojaId === 'todas';
      })
      .sort((a, b) => {
        // Coloca o usuário atual primeiro, depois administradores
        if (currentUser && a.id === currentUser.id) return -1;
        if (currentUser && b.id === currentUser.id) return 1;
        if (a.perfil === 'admin' && b.perfil !== 'admin') return -1;
        if (b.perfil === 'admin' && a.perfil !== 'admin') return 1;
        return a.nome.localeCompare(b.nome);
      });
  }, [users, currentLoja, currentLojaId, currentUser]);

  // Helper para extrair hora inicial e final de strings como "18:00 às 23:30"
  const parseStoreHours = (horarioStr?: string) => {
    const str = (horarioStr || '18:00 às 23:30').trim();
    const timeRegex = /(\d{1,2})(?:[:hH](\d{2})|h|H)?/g;
    const matches = [...str.matchAll(timeRegex)].filter((m) => m[0] && m[1]);
    let abert = '18:00';
    let fech = '23:30';
    if (matches.length >= 2) {
      const h1 = matches[0][1].padStart(2, '0');
      const m1 = (matches[0][2] || '00').padStart(2, '0');
      const h2 = matches[1][1].padStart(2, '0');
      const m2 = (matches[1][2] || '00').padStart(2, '0');
      abert = `${h1}:${m1}`;
      fech = `${h2}:${m2}`;
    }
    return { abert, fech };
  };

  // Store Settings Form State
  const [lojaMarca, setLojaMarca] = useState(currentLoja?.marca || currentLoja?.nome || '');
  const [lojaNome, setLojaNome] = useState(currentLoja?.nome || '');
  const [lojaLogoUrl, setLojaLogoUrl] = useState(currentLoja?.logo_url || '');
  const [lojaTaxa, setLojaTaxa] = useState(currentLoja?.taxa_entrega?.toString() || '7.00');
  const [lojaEndereco, setLojaEndereco] = useState(currentLoja?.endereco || '');
  const [lojaTelefone, setLojaTelefone] = useState(currentLoja?.telefone || '');
  const [lojaTempo, setLojaTempo] = useState(currentLoja?.tempo_estimado_entrega || '30 - 45 min');
  const initialHours = parseStoreHours(currentLoja?.horario_funcionamento);
  const [lojaHoraAbertura, setLojaHoraAbertura] = useState(initialHours.abert);
  const [lojaHoraFechamento, setLojaHoraFechamento] = useState(initialHours.fech);
  const [lojaHorario, setLojaHorario] = useState(currentLoja?.horario_funcionamento || '18:00 às 23:30');
  const [lojaFechadoManualmente, setLojaFechadoManualmente] = useState(currentLoja?.fechado_manualmente || false);
  const [lojaSaved, setLojaSaved] = useState(false);

  // Store Pix Settings State
  const [lojaPixChave, setLojaPixChave] = useState(currentLoja?.pix_chave || '');
  const [lojaPixTipo, setLojaPixTipo] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>(currentLoja?.pix_tipo_chave || 'cnpj');
  const [lojaPixTitular, setLojaPixTitular] = useState(currentLoja?.pix_titular || '');
  const [lojaPixCidade, setLojaPixCidade] = useState(currentLoja?.pix_cidade || 'São Paulo');

  // New Neighborhood Fee State
  const [newBairroNome, setNewBairroNome] = useState('');
  const [newBairroValor, setNewBairroValor] = useState('');
  const [adminLinkCopied, setAdminLinkCopied] = useState(false);
  const [copiedStaffRole, setCopiedStaffRole] = useState<string | null>(null);

  const getDeliveryUrl = () => {
    const slug = currentLoja?.slug || 'loja-centro';
    let url = `${window.location.origin}/?loja=${slug}`;
    if (lojaMarca) {
      url += `&marca=${encodeURIComponent(lojaMarca)}`;
    }
    if (lojaNome) {
      url += `&nome=${encodeURIComponent(lojaNome)}`;
    }
    if (lojaLogoUrl && !lojaLogoUrl.startsWith('data:')) {
      url += `&logo=${encodeURIComponent(lojaLogoUrl)}`;
    }
    return url;
  };

  const handleCopyLinkFromAdmin = () => {
    const url = getDeliveryUrl();
    navigator.clipboard.writeText(url);
    setAdminLinkCopied(true);
    setTimeout(() => setAdminLinkCopied(false), 2500);
  };

  const handleAddBairroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoja || !newBairroNome.trim()) return;
    const val = parseFloat(newBairroValor.replace(',', '.')) || 0;
    addTaxaBairro(currentLoja.id, newBairroNome.trim(), val);
    setNewBairroNome('');
    setNewBairroValor('');
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressImageFile(file, 400, 400, 0.85);
      setLojaLogoUrl(compressedUrl);
    } catch {
      alert('Erro ao carregar e comprimir a imagem da logo.');
    }
  };

  useEffect(() => {
    if (currentLoja) {
      setLojaMarca(currentLoja.marca || currentLoja.nome || '');
      setLojaNome(currentLoja.nome || '');
      setLojaLogoUrl(currentLoja.logo_url || '');
      setLojaTaxa(currentLoja.taxa_entrega !== undefined ? currentLoja.taxa_entrega.toString() : '7.00');
      setLojaEndereco(currentLoja.endereco || '');
      setLojaTelefone(currentLoja.telefone || '');
      setLojaTempo(currentLoja.tempo_estimado_entrega || '30 - 45 min');
      const parsed = parseStoreHours(currentLoja.horario_funcionamento);
      setLojaHoraAbertura(parsed.abert);
      setLojaHoraFechamento(parsed.fech);
      setLojaHorario(currentLoja.horario_funcionamento || `${parsed.abert} às ${parsed.fech}`);
      setLojaFechadoManualmente(currentLoja.fechado_manualmente || false);
      setLojaPixChave(currentLoja.pix_chave || '');
      setLojaPixTipo(currentLoja.pix_tipo_chave || 'cnpj');
      setLojaPixTitular(currentLoja.pix_titular || '');
      setLojaPixCidade(currentLoja.pix_cidade || 'São Paulo');
    }
  }, [currentLoja?.id, currentLoja?.horario_funcionamento, currentLoja?.fechado_manualmente, currentLoja?.pix_chave]);

  const handleSaveLoja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoja) return;
    const taxaNum = parseFloat(lojaTaxa.replace(',', '.')) || 0;
    const finalHorario = `${lojaHoraAbertura} às ${lojaHoraFechamento}`;
    updateLoja({
      ...currentLoja,
      marca: lojaMarca.trim() || currentLoja.nome,
      nome: lojaNome.trim() || currentLoja.nome,
      logo_url: lojaLogoUrl.trim() || undefined,
      taxa_entrega: taxaNum,
      endereco: lojaEndereco.trim(),
      telefone: lojaTelefone.trim(),
      tempo_estimado_entrega: lojaTempo.trim(),
      horario_funcionamento: finalHorario,
      fechado_manualmente: lojaFechadoManualmente,
      pix_chave: lojaPixChave.trim() || undefined,
      pix_tipo_chave: lojaPixTipo,
      pix_titular: lojaPixTitular.trim() || undefined,
      pix_cidade: lojaPixCidade.trim() || undefined,
    });
    setLojaHorario(finalHorario);
    setLojaSaved(true);
    setTimeout(() => setLojaSaved(false), 3000);
  };

  // 1. Financial Metrics Calculations (PRD Section 25)
  const totalSales = useMemo(() => {
    return comandas
      .filter((c) => c.status === 'fechada')
      .reduce((acc, c) => acc + c.total, 0);
  }, [comandas]);

  const totalComandasCount = comandas.length;
  const closedComandasCount = comandas.filter((c) => c.status === 'fechada').length;
  const ticketMedio = closedComandasCount > 0 ? totalSales / closedComandasCount : 0;
  const activeOrdersCount = orders.length;

  // 2. Best-selling Products Ranking (PRD Section 26)
  const productRanking = useMemo(() => {
    const counts: Record<string, { nome: string; count: number; totalVal: number }> = {};

    orders.forEach((order) => {
      order.itens.forEach((item) => {
        if (item.status !== 'cancelado') {
          if (!counts[item.nome]) {
            counts[item.nome] = { nome: item.nome, count: 0, totalVal: 0 };
          }
          counts[item.nome].count += item.quantidade;
          counts[item.nome].totalVal += item.preco_total;
        }
      });
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [orders]);

  // 3. Waiter Sales Ranking (PRD Section 26)
  const waiterRanking = useMemo(() => {
    const ranking: Record<string, { nome: string; total: number; count: number }> = {};

    comandas.forEach((cmd) => {
      if (!ranking[cmd.garcom_nome]) {
        ranking[cmd.garcom_nome] = { nome: cmd.garcom_nome, total: 0, count: 0 };
      }
      ranking[cmd.garcom_nome].total += cmd.total;
      ranking[cmd.garcom_nome].count += 1;
    });

    return Object.values(ranking).sort((a, b) => b.total - a.total);
  }, [comandas]);

  // 4. Audit of Cancellations (PRD Section 17 & 26)
  const cancellationAuditList = useMemo(() => {
    const list: Array<{
      orderId: number;
      mesaNumero: number;
      itemNome: string;
      quantidade: number;
      valor: number;
      motivo: string;
      data: string;
      usuarioNome: string;
    }> = [];

    orders.forEach((order) => {
      order.itens.forEach((item) => {
        if (item.status === 'cancelado' && item.cancelamento) {
          list.push({
            orderId: order.id,
            mesaNumero: order.mesa_numero,
            itemNome: item.nome,
            quantidade: item.quantidade,
            valor: item.preco_total,
            motivo: item.cancelamento.motivo,
            data: item.cancelamento.data,
            usuarioNome: item.cancelamento.usuario_nome,
          });
        }
      });
    });

    return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [orders]);

  // Handle Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(prodPreco.replace(',', '.'));
    if (!prodNome || isNaN(priceNum)) return;

    const defaultImg = 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600';
    const finalImage = prodImagem.trim() || defaultImg;

    const promoPriceNum = prodPrecoPromocional.trim() ? parseFloat(prodPrecoPromocional.replace(',', '.')) : undefined;
    const estoqueNum = prodControlarEstoque && prodEstoque.trim() !== '' ? parseInt(prodEstoque, 10) : undefined;
    const estoqueMinNum = prodControlarEstoque && prodEstoqueMinimoAlerta.trim() !== '' ? parseInt(prodEstoqueMinimoAlerta, 10) : 5;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        nome: prodNome,
        categoria_id: prodCategoria,
        preco: priceNum,
        descricao: prodDesc,
        imagem: finalImage,
        isPizza: prodIsPizza,
        destaque: prodDestaque,
        em_promocao: prodEmPromocao,
        preco_promocional: prodEmPromocao && !isNaN(promoPriceNum as number) ? promoPriceNum : undefined,
        imprime_cozinha: prodImprimeCozinha,
        permitirTamanhos: prodPermitirTamanhos,
        permitirBordas: prodPermitirBordas,
        permitirMassas: prodPermitirMassas,
        permitirAdicionais: prodPermitirAdicionais,
        tamanhos_disponiveis: prodTamanhosSel,
        bordas_disponiveis: prodBordasSel,
        massas_disponiveis: prodMassasSel,
        adicionais_disponiveis: prodAdicionaisSel,
        // Controle de Estoque
        controlar_estoque: prodControlarEstoque,
        estoque: prodControlarEstoque ? (isNaN(estoqueNum as number) ? 0 : estoqueNum) : undefined,
        estoque_minimo_alerta: prodControlarEstoque ? (isNaN(estoqueMinNum as number) ? 5 : estoqueMinNum) : undefined,
        // Fiscal / NFC-e
        ncm: prodNcm.trim() || '19059090',
        cest: prodCest.trim() || undefined,
        codigo_barras: prodCodigoBarras.trim() || 'SEM GTIN',
        cfop: prodCfop.trim() || '5101',
        csosn: prodCsosn,
        origem: prodOrigem,
        unidade_comercial: 'UN',
      });
      setEditingProduct(null);
    } else {
      addProduct({
        codigo_interno: `P${Math.floor(100 + Math.random() * 900)}`,
        nome: prodNome,
        categoria_id: prodCategoria,
        preco: priceNum,
        descricao: prodDesc,
        imagem: finalImage,
        ativo: true,
        destaque: prodDestaque,
        em_promocao: prodEmPromocao,
        preco_promocional: prodEmPromocao && !isNaN(promoPriceNum as number) ? promoPriceNum : undefined,
        imprime_cozinha: prodImprimeCozinha,
        isPizza: prodIsPizza,
        permitirTamanhos: prodPermitirTamanhos,
        permitirBordas: prodPermitirBordas,
        permitirMassas: prodPermitirMassas,
        permitirAdicionais: prodPermitirAdicionais,
        tamanhos_disponiveis: prodTamanhosSel,
        bordas_disponiveis: prodBordasSel,
        massas_disponiveis: prodMassasSel,
        adicionais_disponiveis: prodAdicionaisSel,
        // Controle de Estoque
        controlar_estoque: prodControlarEstoque,
        estoque: prodControlarEstoque ? (isNaN(estoqueNum as number) ? 0 : estoqueNum) : undefined,
        estoque_minimo_alerta: prodControlarEstoque ? (isNaN(estoqueMinNum as number) ? 5 : estoqueMinNum) : undefined,
        // Fiscal / NFC-e
        ncm: prodNcm.trim() || '19059090',
        cest: prodCest.trim() || undefined,
        codigo_barras: prodCodigoBarras.trim() || 'SEM GTIN',
        cfop: prodCfop.trim() || '5101',
        csosn: prodCsosn,
        origem: prodOrigem,
        unidade_comercial: 'UN',
      });
    }

    setProdNome('');
    setProdPreco('');
    setProdDesc('');
    setProdImagem('');
    setProdDestaque(false);
    setProdEmPromocao(false);
    setProdPrecoPromocional('');
    setProdControlarEstoque(false);
    setProdEstoque('');
    setProdEstoqueMinimoAlerta('5');
    setProdNcm('19059090');
    setProdCest('');
    setProdCodigoBarras('SEM GTIN');
    setProdCfop('5101');
    setProdCsosn('102');
    setProdOrigem('0');
    setShowAddProductModal(false);
  };

  // Quick Promo Actions
  const handleOpenQuickPromo = (prod: Product) => {
    setQuickPromoProduct(prod);
    setQuickPromoPreco(prod.preco_promocional ? prod.preco_promocional.toString() : '');
    setQuickPromoTipo(prod.promocao_tipo || 'horas');
    setQuickPromoValor(prod.promocao_duracao_valor ? prod.promocao_duracao_valor.toString() : '4');
  };

  const handleSaveQuickPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPromoProduct) return;

    const promoPrice = parseFloat(quickPromoPreco.replace(',', '.'));
    if (isNaN(promoPrice) || promoPrice <= 0) {
      alert('Informe um valor promocional válido com desconto.');
      return;
    }

    if (promoPrice >= quickPromoProduct.preco) {
      if (!window.confirm('Atenção: O preço promocional informado é igual ou maior que o preço normal. Deseja continuar?')) {
        return;
      }
    }

    const agora = new Date();
    const duracaoNum = parseInt(quickPromoValor, 10) || 1;
    let fimIso: string | undefined = undefined;

    if (quickPromoTipo === 'horas') {
      const fim = new Date(agora.getTime() + duracaoNum * 60 * 60 * 1000);
      fimIso = fim.toISOString();
    } else if (quickPromoTipo === 'dias') {
      const fim = new Date(agora.getTime() + duracaoNum * 24 * 60 * 60 * 1000);
      fimIso = fim.toISOString();
    }

    updateProduct({
      ...quickPromoProduct,
      em_promocao: true,
      preco_promocional: promoPrice,
      promocao_tipo: quickPromoTipo,
      promocao_duracao_valor: duracaoNum,
      promocao_inicio: agora.toISOString(),
      promocao_fim: fimIso,
    });

    setQuickPromoProduct(null);
  };

  const handleRemoveQuickPromo = (prod: Product) => {
    if (window.confirm(`Deseja desativar a promoção de "${prod.nome}"?`)) {
      updateProduct({
        ...prod,
        em_promocao: false,
        preco_promocional: undefined,
        promocao_fim: undefined,
        promocao_inicio: undefined,
      });
      if (quickPromoProduct?.id === prod.id) {
        setQuickPromoProduct(null);
      }
    }
  };

  // Handle Save Customization Option (Size, Crust, Dough, Addon)
  const handleSaveOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optName.trim() || !showOptionModal) return;

    const priceVal = parseFloat(optPrice.replace(',', '.')) || 0;

    if (showOptionModal === 'size') {
      const sizeObj = {
        nome: optName.trim(),
        fatias: parseInt(optSlices, 10) || 8,
        maxSabores: parseInt(optMaxFlavors, 10) || 2,
        multiplicador: parseFloat(optMultiplier) || 1.0,
      };
      if (editingOptionId) {
        updatePizzaSize({ id: editingOptionId, ...sizeObj });
      } else {
        addPizzaSize(sizeObj);
      }
    } else if (showOptionModal === 'crust') {
      const crustObj = { nome: optName.trim(), preco: priceVal };
      if (editingOptionId) {
        updatePizzaCrust({ id: editingOptionId, ...crustObj });
      } else {
        addPizzaCrust(crustObj);
      }
    } else if (showOptionModal === 'dough') {
      const doughObj = { nome: optName.trim() };
      if (editingOptionId) {
        updatePizzaDough({ id: editingOptionId, ...doughObj });
      } else {
        addPizzaDough(doughObj);
      }
    } else if (showOptionModal === 'addon') {
      const addonObj = { nome: optName.trim(), preco: priceVal };
      if (editingOptionId) {
        updatePizzaAddon({ id: editingOptionId, ...addonObj });
      } else {
        addPizzaAddon(addonObj);
      }
    }

    setShowOptionModal(null);
    setEditingOptionId(null);
    setOptName('');
    setOptPrice('');
  };

  // Handle Save Table
  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    addTable(Number(tableNumero), Number(tableCapacidade), tableLocalizacao);
    setTableNumero((prev) => prev + 1);
    setShowAddTableModal(false);
  };

  // Handle Save User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNome = userName.trim();
    const cleanLogin = (userLogin.trim() || cleanNome.toLowerCase().replace(/\s+/g, '.')).toLowerCase();
    const cleanSenha = userSenha.trim();

    if (!cleanNome) {
      alert('Preencha o nome do colaborador.');
      return;
    }
    if (!cleanLogin) {
      alert('Preencha o login do colaborador.');
      return;
    }
    if (cleanSenha.length < 6) {
      alert('A senha do colaborador deve conter no mínimo 6 caracteres.');
      return;
    }

    const targetLojaId = currentLoja?.id || (currentLojaId === 'todas' ? 'loja_centro' : currentLojaId);

    // Verifica se já existe esse login na mesma loja
    const loginJaExiste = users.some(
      (u) => u.usuario.toLowerCase() === cleanLogin && (u.loja_id === targetLojaId || !u.loja_id)
    );
    if (loginJaExiste) {
      alert(`O login "${cleanLogin}" já está sendo usado por outro colaborador. Escolha outro login.`);
      return;
    }

    const { hash, salt } = await hashPassword(cleanSenha);
    addUser({
      nome: cleanNome,
      usuario: cleanLogin,
      senha: '',
      senhaHash: hash,
      salt,
      pin: '',
      perfil: userRole,
      ativo: true,
      loja_id: targetLojaId,
    });

    alert(`Colaborador cadastrado com sucesso!\n\nNome: ${cleanNome}\nLogin: ${cleanLogin}\nFunção: ${userRole}\nSenha definida com criptografia segura!`);
    setUserName('');
    setUserLogin('');
    setUserSenha('');
    setShowAddUserModal(false);
  };

  // Abrir modal de edição de usuário
  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserName(u.nome);
    setEditUserLogin(u.usuario);
    setEditUserRole((u.perfil === 'super_admin' ? 'admin' : u.perfil) as any);
    setEditUserSenha('');
    setEditUserAtivo(u.ativo !== false);
    setShowEditUserPassword(false);
  };

  // Salvar edição de usuário
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const cleanNome = editUserName.trim();
    const cleanLogin = editUserLogin.trim().toLowerCase();
    const cleanSenha = editUserSenha.trim();

    if (!cleanNome) {
      alert('Preencha o nome do colaborador.');
      return;
    }
    if (!cleanLogin) {
      alert('Preencha o login do colaborador.');
      return;
    }

    // Verifica se alterou o login e já existe em outro usuário da mesma loja
    if (cleanLogin !== editingUser.usuario.toLowerCase()) {
      const loginJaExiste = users.some(
        (u) => u.id !== editingUser.id && u.usuario.toLowerCase() === cleanLogin
      );
      if (loginJaExiste) {
        alert(`O login "${cleanLogin}" já está sendo usado por outro colaborador.`);
        return;
      }
    }

    let updatedUser: User = {
      ...editingUser,
      nome: cleanNome,
      usuario: cleanLogin,
      perfil: editUserRole,
      ativo: editUserAtivo,
      senha: '', // Nunca armazena senha em texto puro
    };

    // Se forneceu nova senha, atualiza o hash SHA-256 + salt criptografado
    if (cleanSenha) {
      if (cleanSenha.length < 6) {
        alert('A nova senha deve conter no mínimo 6 caracteres.');
        return;
      }
      const { hash, salt } = await hashPassword(cleanSenha);
      updatedUser = {
        ...updatedUser,
        senha: '',
        senhaHash: hash,
        salt,
      };
    }

    updateUser(updatedUser);
    alert(`Dados de "${cleanNome}" atualizados com sucesso!`);
    setEditingUser(null);
  };

  // Salvar troca rápida de senha
  const handleSaveQuickPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    const cleanPass = quickNewPassword.trim();
    if (cleanPass.length < 6) {
      alert('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }
    const { hash, salt } = await hashPassword(cleanPass);
    updateUser({
      ...passwordModalUser,
      senha: '', // Nunca armazena senha em texto puro
      senhaHash: hash,
      salt,
    });
    alert(`Nova senha de ${passwordModalUser.nome} cadastrada com criptografia segura!`);
    setPasswordModalUser(null);
    setQuickNewPassword('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] max-h-[calc(100vh-53px)] overflow-hidden bg-[#FAF7F2] dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Top Header */}
      <header className="shrink-0 z-30 bg-stone-900 text-white border-b border-stone-800 shadow-md">
        <div className="w-full px-4 sm:px-6 py-2 flex items-center justify-between gap-3 bg-stone-900">
          {/* Left: Menu Toggle + Title & Store Info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Botão Hambúrguer (3 traços) para abrir / fechar menu lateral no desktop */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 hover:text-white border border-stone-700/80 transition cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
              title={isSidebarOpen ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
              aria-label="Alternar menu lateral"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight truncate">
                Painel do Administrador & Gestão
              </h1>
              <p className="text-[11px] text-stone-400 font-medium truncate">
                📍 {currentLojaId === 'todas' ? 'Visão Consolidada (Todas as Lojas)' : `Filial: ${currentLoja?.nome}`} • BI • Cardápio • Mesas • Equipe
              </p>
            </div>
          </div>

          {/* Center (Desktop): Vendas do Dia, Mesas Ocupadas, Ticket Médio */}
          <div className="hidden xl:flex items-center gap-6 px-4 py-1 rounded-xl bg-stone-950/70 border border-stone-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Vendas do Dia:</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white">{formatCurrency(totalSales)}</span>
            </div>
            <div className="w-px h-4 bg-stone-800" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Mesas Ocupadas:</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white">{tables.filter(t => t.status === 'ocupada').length} / {tables.length}</span>
            </div>
            <div className="w-px h-4 bg-stone-800" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Ticket Médio:</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white">{formatCurrency(ticketMedio)}</span>
            </div>
          </div>

          {/* Right: Sistema Online Badge & Mode Indicator */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sistema Online Badge */}
            <span className="hidden sm:flex px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-full items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistema Online</span>
            </span>

            {/* Test / Developer Mode Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Modo Teste / Desenvolvedor</span>
            </div>
          </div>
        </div>

        {/* Mobile Tab Selector (Visible on small screens) */}
        <div className="md:hidden px-4 pb-2.5 w-full bg-stone-900">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-stone-950 border-2 border-stone-700 text-white text-xs font-bold rounded-xl focus:outline-hidden focus:border-red-500 cursor-pointer shadow-xs"
          >
            <option value="graficos">📊 Gráficos de Vendas (BI)</option>
            <option value="metricas">📈 Métricas & Vendas Tabulares</option>
            <option value="produtos">🍕 Cardápio ({products.length} produtos)</option>
            <option value="opcoes">📦 Opções & Bordas</option>
            <option value="mesas">🪑 Mesas ({tables.length} mesas)</option>
            <option value="usuarios">👥 Equipe ({storeUsers.length} membros)</option>
            <option value="cancelamentos">📋 Auditoria ({cancellationAuditList.length} registros)</option>
            <option value="configuracoes">⚙️ Configurações & Taxas da Loja</option>
            <option value="fiscal">🏛️ Fiscal & Emissão NFC-e</option>
          </select>
        </div>
      </header>

      {/* Main Layout Container: Left Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden relative w-full bg-[#FAF7F2] dark:bg-stone-950">
        {/* Left Vertical Sidebar (Desktop / Tablet - FIXA à esquerda com rolagem interna própria) */}
        <aside
          className={`hidden md:flex flex-col shrink-0 bg-stone-900 border-r border-stone-800 text-white h-full overflow-y-auto z-20 shadow-xl scrollbar-none transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-64 lg:w-72 opacity-100' : 'w-0 overflow-hidden border-r-0 pointer-events-none opacity-0 p-0'
          }`}
        >
          <div className="p-3 border-b border-stone-800/80 shrink-0 bg-stone-900 sticky top-0 z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Botão de 3 traços no cabeçalho da barra lateral exatamente no local demarcado em vermelho */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer flex items-center justify-center shrink-0"
                title="Fechar / ocultar menu lateral"
                aria-label="Fechar menu lateral"
              >
                <Menu className="w-4 h-4" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-1 select-none">
                Módulos Administrativos
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg text-stone-500 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title="Recolher menu lateral"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-3 space-y-1.5 flex-1">
            <button
              onClick={() => setActiveTab('graficos')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'graficos'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="truncate">Gráficos (BI)</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('metricas')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'metricas'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span className="truncate">Métricas de Vendas</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('produtos')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'produtos'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <UtensilsCrossed className="w-4 h-4 shrink-0" />
                <span className="truncate">Cardápio</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'produtos' ? 'bg-red-900/80 text-white' : 'bg-stone-800 text-stone-400'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('opcoes')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'opcoes'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Boxes className="w-4 h-4 shrink-0" />
                <span className="truncate">Opções & Bordas</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('mesas')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'mesas'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Layers className="w-4 h-4 shrink-0" />
                <span className="truncate">Mesas</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'mesas' ? 'bg-red-900/80 text-white' : 'bg-stone-800 text-stone-400'
              }`}>
                {tables.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('usuarios')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'usuarios'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">Equipe & Acessos</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'usuarios' ? 'bg-red-900/80 text-white' : 'bg-stone-800 text-stone-400'
              }`}>
                {storeUsers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cancelamentos')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'cancelamentos'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="truncate">Auditoria</span>
              </div>
              {cancellationAuditList.length > 0 && (
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] rounded-full border border-amber-400/40 font-mono font-bold">
                  {cancellationAuditList.length}
                </span>
              )}
            </button>

            <div className="pt-2 pb-1">
              <hr className="border-stone-800" />
            </div>

            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'configuracoes'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Settings className="w-4 h-4 shrink-0" />
                <span className="truncate">Configurações & Taxas</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('fiscal')}
              className={`w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold text-left ${
                activeTab === 'fiscal'
                  ? 'bg-red-700 text-white shadow-xs font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">Fiscal & NFC-e</span>
              </div>
            </button>
          </nav>
        </aside>

        {/* Main Content Area (Apenas essa área branca rola verticalmente - topo e menu lateral ficam 100% fixos) */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-5 min-w-0">
          {/* ================= TAB 0: GRAFICOS DE VENDAS (BI) ================= */}
          {activeTab === 'graficos' && (
          <GraficosVendasPanel
            orders={orders}
            comandas={comandas}
            products={products}
            categories={categories}
            initialPeriod="7dias"
          />
        )}

        {/* ================= TAB 1: METRICAS ================= */}
        {activeTab === 'metricas' && (
          <div className="space-y-5">
            {/* View Mode Toggle / Sub-view Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shadow-2xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">
                    Modo de Exibição: {metricasSubView === 'graficos' ? 'Gráficos de Vendas (Recharts)' : 'Tabelas & Indicadores Numéricos'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Alterne entre a visão gráfica de tendências e o resumo tabular
                  </p>
                </div>
              </div>

              <div className="flex items-center border border-stone-200 bg-stone-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMetricasSubView('graficos')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-1.5 ${
                    metricasSubView === 'graficos'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-700 dark:text-slate-300 hover:text-stone-950'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Gráficos BI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetricasSubView('tabelas')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-1.5 ${
                    metricasSubView === 'tabelas'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-700 dark:text-slate-300 hover:text-stone-950'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tabelas & KPIs</span>
                </button>
              </div>
            </div>

            {metricasSubView === 'graficos' ? (
              <GraficosVendasPanel
                orders={orders}
                comandas={comandas}
                products={products}
                categories={categories}
                initialPeriod="7dias"
              />
            ) : (
              <div className="space-y-5">
                {/* Period Selector (PRD Section 26) */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Filtro por Período:
                  </span>
                  <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setPeriodFilter('hoje')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        periodFilter === 'hoje' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                      }`}
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setPeriodFilter('7dias')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        periodFilter === '7dias' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                      }`}
                    >
                      Últimos 7 dias
                    </button>
                    <button
                      onClick={() => setPeriodFilter('mes')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        periodFilter === 'mes' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900 dark:text-slate-100'
                      }`}
                    >
                      Este Mês
                    </button>
                  </div>
                </div>

                {/* Top Stat Cards (PRD Section 25) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                      <span>Faturamento Total</span>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-mono mt-2">
                      {formatCurrency(totalSales)}
                    </div>
                    <span className="text-xs text-emerald-700 font-medium mt-1 block">
                      {closedComandasCount} comandas finalizadas
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                      <span>Ticket Médio</span>
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-mono mt-2">
                      {formatCurrency(ticketMedio)}
                    </div>
                    <span className="text-xs text-stone-400 font-medium mt-1 block">
                      Por comanda fechada
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                      <span>Total de Pedidos</span>
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-mono mt-2">{activeOrdersCount}</div>
                    <span className="text-xs text-blue-700 font-medium mt-1 block">
                      Enviados para a cozinha
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                      <span>Tempo Médio Cozinha</span>
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-mono mt-2">14 min</div>
                    <span className="text-xs text-emerald-700 font-medium mt-1 block">
                      ✓ Dentro da meta (&lt; 20 min)
                    </span>
                  </div>
                </div>

                {/* 2-Column Section: Ranking de Produtos & Ranking de Garçons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Best-selling Products (PRD Section 26) */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase text-stone-800 dark:text-slate-200 tracking-wider">
                        🏆 Produtos Mais Vendidos
                      </h3>
                      <span className="text-xs text-stone-400 font-medium">Qtd / Total</span>
                    </div>

                    <div className="space-y-2">
                      {productRanking.slice(0, 7).map((prod, idx) => (
                        <div
                          key={prod.nome}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                idx === 0
                                  ? 'bg-amber-400 text-stone-950 shadow-2xs'
                                  : idx === 1
                                  ? 'bg-stone-300 text-stone-800 dark:text-slate-200'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {idx + 1}º
                            </span>
                            <div>
                              <span className="font-semibold text-stone-900 dark:text-slate-100 block">{prod.nome}</span>
                              <span className="text-xs text-stone-500 font-mono">
                                {formatCurrency(prod.totalVal)} faturados
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-stone-800 dark:text-slate-200 bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-mono">
                            {prod.count} un
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Waiter Ranking (PRD Section 26) */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase text-stone-800 dark:text-slate-200 tracking-wider">
                        👔 Vendas por Garçom
                      </h3>
                      <span className="text-xs text-stone-400 font-medium">Faturamento</span>
                    </div>

                    <div className="space-y-2">
                      {waiterRanking.map((w, idx) => (
                        <div
                          key={w.nome}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center font-bold text-[11px] text-stone-700 dark:text-slate-300">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-semibold text-stone-900 dark:text-slate-100 block">{w.nome}</span>
                              <span className="text-xs text-stone-500">
                                {w.count} mesas atendidas
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-emerald-700 font-mono">
                            {formatCurrency(w.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PRODUTOS & CARDAPIO ================= */}
        {activeTab === 'produtos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">
                  Catálogo & Cardápio Digital
                </h2>
                <p className="text-xs text-stone-500">
                  Gerencie produtos, fotos, preços, receitas e direcionamento de impressão.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdNome('');
                  setProdPreco('');
                  setProdDesc('');
                  setProdImagem('');
                  setProdIsPizza(true);
                  setProdDestaque(false);
                  setProdEmPromocao(false);
                  setProdPrecoPromocional('');
                  setProdImprimeCozinha(true);
                  setProdPermitirTamanhos(true);
                  setProdPermitirBordas(true);
                  setProdPermitirMassas(true);
                  setProdPermitirAdicionais(true);
                  setProdTamanhosSel(pizzaSizes.map((s) => s.id));
                  setProdBordasSel(pizzaCrusts.map((c) => c.id));
                  setProdMassasSel(pizzaDoughs.map((d) => d.id));
                  setProdAdicionaisSel(pizzaAddons.map((a) => a.id));
                  setProdNcm('1905.90.90');
                  setProdCest('');
                  setProdCodigoBarras('');
                  setProdCfop('5102');
                  setProdCsosn('102');
                  setProdOrigem('0');
                  setProdControlarEstoque(false);
                  setProdEstoque('');
                  setProdEstoqueMinimoAlerta('5');
                  setShowAddProductModal(true);
                }}
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Produto</span>
              </button>
            </div>

            {/* Alertas de Estoque de Bebidas e Produtos */}
            {outOfStockProducts.length > 0 && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-red-900 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 font-bold">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span>
                    {outOfStockProducts.length === 1
                      ? `Atenção: 1 item com estoque zerado (${outOfStockProducts[0].nome})!`
                      : `Atenção: ${outOfStockProducts.length} itens com estoque zerado no momento!`}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-red-700 bg-red-100/80 px-2.5 py-1 rounded-lg">
                  Consta como ESGOTADO para os clientes
                </span>
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 font-bold">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <span>
                    {lowStockProducts.length === 1
                      ? `Estoque Baixo: ${lowStockProducts[0].nome} (${lowStockProducts[0].estoque} un restantes)!`
                      : `Estoque Baixo: ${lowStockProducts.length} produtos/bebidas atingiram o limite de alerta!`}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-800">
                  Programe a reposição
                </span>
              </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Código</th>
                      <th className="p-3.5">Foto</th>
                      <th className="p-3.5">Produto</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5">Preço</th>
                      <th className="p-3.5">Promoção</th>
                      <th className="p-3.5">Estoque</th>
                      <th className="p-3.5">Impressão</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/80 transition">
                        <td className="p-3.5 font-mono text-stone-600 font-bold">
                          {p.codigo_interno}
                        </td>
                        <td className="p-3.5">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                            {p.imagem ? (
                              <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">🍕</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-stone-900 dark:text-slate-100 block">{p.nome}</span>
                            {p.destaque && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800" title="Destaque nos Mais Pedidos e Banner">
                                🔥 Destaque
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-500 line-clamp-1">
                            {p.descricao}
                          </span>
                        </td>
                        <td className="p-3.5 capitalize font-medium text-stone-600">
                          {p.categoria_id}
                        </td>
                        <td className="p-3.5 font-bold text-stone-900 dark:text-slate-100 font-mono">
                          {p.em_promocao && p.preco_promocional ? (
                            <div>
                              <span className="text-emerald-700 block">{formatCurrency(p.preco_promocional)}</span>
                              <span className="text-[10px] text-stone-400 line-through font-normal">{formatCurrency(p.preco)}</span>
                            </div>
                          ) : (
                            formatCurrency(p.preco)
                          )}
                        </td>
                        <td className="p-3.5">
                          {isProductPromotionActive(p) && p.preco_promocional ? (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleOpenQuickPromo(p)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-xs flex items-center gap-1 cursor-pointer transition"
                                title="Editar ou desativar promoção rápida"
                              >
                                <Flame className="w-3 h-3 animate-pulse text-amber-200" />
                                <span>{formatCurrency(p.preco_promocional)}</span>
                              </button>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-stone-500 font-mono block">
                                  {formatPromotionRemaining(p) || 'Ativa'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuickPromo(p)}
                                  className="text-[9px] text-red-500 hover:underline font-bold"
                                  title="Encerrar promoção agora"
                                >
                                  (encerrar)
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenQuickPromo(p)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-100 hover:bg-amber-500 hover:text-white text-stone-600 transition flex items-center gap-1 cursor-pointer border border-stone-200 hover:border-amber-500 group"
                              title="Criar promoção rápida com desconto e tempo"
                            >
                              <Tag className="w-3 h-3 text-stone-400 group-hover:text-white" />
                              <span>+ Promoção</span>
                            </button>
                          )}
                        </td>
                        <td className="p-3.5">
                          {p.controlar_estoque ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 shadow-2xs ${
                                    (p.estoque ?? 0) <= 0
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : (p.estoque ?? 0) <= (p.estoque_minimo_alerta ?? 5)
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  <Package className="w-3 h-3" />
                                  <span>
                                    {(p.estoque ?? 0) <= 0
                                      ? 'Esgotado (0 un)'
                                      : (p.estoque ?? 0) <= (p.estoque_minimo_alerta ?? 5)
                                      ? `Baixo (${p.estoque} un)`
                                      : `${p.estoque} un`}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = p.estoque ?? 0;
                                    const updated = Math.max(0, current - 1);
                                    updateProduct({ ...p, estoque: updated });
                                  }}
                                  title="Diminuir 1 un do estoque"
                                  className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 active:scale-90 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer border border-stone-200"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = p.estoque ?? 0;
                                    const updated = current + 1;
                                    updateProduct({ ...p, estoque: updated });
                                  }}
                                  title="Adicionar 1 un ao estoque"
                                  className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 active:scale-90 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer border border-stone-200"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 font-medium">Ilimitado</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                              p.imprime_cozinha
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {p.imprime_cozinha ? 'Cozinha / KDS' : 'Balanção / Direto'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus = p.ativo === false;
                              updateProduct({ ...p, ativo: nextStatus });
                            }}
                            title={p.ativo !== false ? 'Clique para suspender/pausar este produto no cardápio' : 'Clique para reativar este produto no cardápio'}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                              p.ativo !== false
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-stone-200 hover:bg-stone-300 text-stone-700 border border-stone-400'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${p.ativo !== false ? 'bg-emerald-600 animate-pulse' : 'bg-stone-500'}`} />
                            <span>{p.ativo !== false ? 'Ativo' : 'Pausado'}</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProdNome(p.nome);
                              setProdCategoria(p.categoria_id);
                              setProdPreco(p.preco.toString());
                              setProdDesc(p.descricao);
                              setProdImagem(p.imagem || '');
                              setProdIsPizza(!!p.isPizza);
                              setProdDestaque(!!p.destaque);
                              setProdEmPromocao(!!p.em_promocao);
                              setProdPrecoPromocional(p.preco_promocional ? p.preco_promocional.toString() : '');
                              setProdImprimeCozinha(p.imprime_cozinha);
                              setProdPermitirTamanhos(p.permitirTamanhos !== false);
                              setProdPermitirBordas(p.permitirBordas !== false);
                              setProdPermitirMassas(p.permitirMassas !== false);
                              setProdPermitirAdicionais(p.permitirAdicionais !== false);
                              setProdTamanhosSel(p.tamanhos_disponiveis || pizzaSizes.map((s) => s.id));
                              setProdBordasSel(p.bordas_disponiveis || pizzaCrusts.map((c) => c.id));
                              setProdMassasSel(p.massas_disponiveis || pizzaDoughs.map((d) => d.id));
                              setProdAdicionaisSel(p.adicionais_disponiveis || pizzaAddons.map((a) => a.id));
                              setProdControlarEstoque(!!p.controlar_estoque);
                              setProdEstoque(p.estoque !== undefined ? p.estoque.toString() : '');
                              setProdEstoqueMinimoAlerta(p.estoque_minimo_alerta !== undefined ? p.estoque_minimo_alerta.toString() : '5');
                              setProdNcm(p.ncm || '');
                              setProdCest(p.cest || '');
                              setProdCodigoBarras(p.codigo_barras || '');
                              setProdCfop(p.cfop || '5102');
                              setProdCsosn(p.csosn || '102');
                              setProdOrigem(p.origem || '0');
                              setShowAddProductModal(true);
                            }}
                            title="Editar Produto"
                            className="p-1.5 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja excluir o produto "${p.nome}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Excluir Produto"
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MESAS & SALÃO ================= */}
        {activeTab === 'mesas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">Mesas do Salão</h2>
                <p className="text-xs text-stone-500">
                  Gerencie a numeração, capacidade e disposição dos ambientes.
                </p>
              </div>
              <button
                onClick={() => setShowAddTableModal(true)}
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar Mesa</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-stone-900 dark:text-slate-100">
                      Mesa {t.numero.toString().padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-500 font-semibold">{t.capacidade} lug</span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir a Mesa ${t.numero}?`)) {
                            deleteTable(t.id);
                          }
                        }}
                        title="Excluir Mesa"
                        className="p-1 text-stone-400 hover:text-red-600 rounded-md transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="text-xs text-stone-500 block">{t.localizacao}</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.status === 'livre'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : t.status === 'ocupada'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3.5: OPÇÕES & BORDAS ================= */}
        {activeTab === 'opcoes' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">
                Opções de Personalização & Bordas
              </h2>
              <p className="text-xs text-stone-500">
                Cadastre ou edite tamanhos, bordas recheadas, massas e adicionais opcionais disponíveis na sua pizzaria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Tamanhos */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-red-600" />
                    <span>Tamanhos Registrados</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOptionId(null);
                      setOptName('');
                      setOptSlices('8');
                      setOptMaxFlavors('2');
                      setOptMultiplier('1.0');
                      setShowOptionModal('size');
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tamanho</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {pizzaSizes.map((sz) => (
                    <div
                      key={sz.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-slate-100 block">{sz.nome}</span>
                        <span className="text-[11px] text-stone-500">
                          {sz.fatias} fatias • Até {sz.maxSabores} sabores • Mult: {sz.multiplicador}x
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingOptionId(sz.id);
                            setOptName(sz.nome);
                            setOptSlices(sz.fatias.toString());
                            setOptMaxFlavors(sz.maxSabores.toString());
                            setOptMultiplier(sz.multiplicador.toString());
                            setShowOptionModal('size');
                          }}
                          className="p-1 text-stone-500 hover:text-red-700 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePizzaSize(sz.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Bordas Recheadas */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-amber-600" />
                    <span>Bordas Recheadas</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOptionId(null);
                      setOptName('');
                      setOptPrice('');
                      setShowOptionModal('crust');
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Borda</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {pizzaCrusts.map((crust) => (
                    <div
                      key={crust.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-slate-100 block">{crust.nome}</span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          {crust.preco === 0 ? 'Sem custo extra' : `+ ${formatCurrency(crust.preco)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingOptionId(crust.id);
                            setOptName(crust.nome);
                            setOptPrice(crust.preco.toString());
                            setShowOptionModal('crust');
                          }}
                          className="p-1 text-stone-500 hover:text-amber-700 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePizzaCrust(crust.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Tipos de Massa */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-emerald-600" />
                    <span>Tipos de Massa</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOptionId(null);
                      setOptName('');
                      setShowOptionModal('dough');
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Massa</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {pizzaDoughs.map((dough) => (
                    <div
                      key={dough.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-stone-900 dark:text-slate-100">{dough.nome}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingOptionId(dough.id);
                            setOptName(dough.nome);
                            setShowOptionModal('dough');
                          }}
                          className="p-1 text-stone-500 hover:text-emerald-700 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePizzaDough(dough.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Adicionais Opcionais */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span>Adicionais Opcionais</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOptionId(null);
                      setOptName('');
                      setOptPrice('');
                      setShowOptionModal('addon');
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicional</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {pizzaAddons.map((addon) => (
                    <div
                      key={addon.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 dark:text-slate-100 block">{addon.nome}</span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          + {formatCurrency(addon.preco)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingOptionId(addon.id);
                            setOptName(addon.nome);
                            setOptPrice(addon.preco.toString());
                            setShowOptionModal('addon');
                          }}
                          className="p-1 text-stone-500 hover:text-blue-700 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePizzaAddon(addon.id)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: USUARIOS & EQUIPE ================= */}
        {activeTab === 'usuarios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">Equipe & Acessos</h2>
                <p className="text-xs text-stone-500">
                  Cadastre garçons, operadores de caixa e cozinheiros com controle de PIN.
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Colaborador</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {storeUsers.length === 0 ? (
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-10 text-center border border-stone-200 dark:border-stone-800 shadow-xs col-span-full">
                  <Users className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-stone-700 dark:text-slate-200">
                    Nenhum colaborador cadastrado ainda nesta loja
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                    Os colaboradores de outras lojas não aparecem aqui. Clique no botão <strong>"+ Novo Colaborador"</strong> acima para cadastrar os garçons, cozinheiros e caixas exclusivos desta loja.
                  </p>
                </div>
              ) : (
                storeUsers.map((u) => {
                  const userStatus = getUserLoginStatus(u.usuario);
                  const isLocked = userStatus.locked;
                  const isCurrentUser = currentUser?.id === u.id;

                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between gap-3 transition ${
                        isLocked
                          ? 'bg-red-50/70 border-red-300 dark:bg-red-950/30 dark:border-red-800'
                          : u.ativo
                          ? 'bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800'
                          : 'bg-stone-100/70 border-stone-300 opacity-75 dark:bg-stone-900/50 dark:border-stone-800'
                      }`}
                    >
                      {/* Top Row: User Info & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                              u.perfil === 'admin' || u.perfil === 'super_admin'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : u.perfil === 'garcom'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : u.perfil === 'cozinha'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            {u.perfil === 'admin' || u.perfil === 'super_admin' ? (
                              <Store className="w-4 h-4" />
                            ) : u.perfil === 'garcom' ? (
                              <UtensilsCrossed className="w-4 h-4" />
                            ) : u.perfil === 'cozinha' ? (
                              <ChefHat className="w-4 h-4" />
                            ) : (
                              <CircleDollarSign className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-stone-900 dark:text-slate-100 truncate">
                                {u.nome}
                              </h4>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                  Você
                                </span>
                              )}
                            </div>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.perfil === 'admin' || u.perfil === 'super_admin'
                                  ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                                  : u.perfil === 'garcom'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                  : u.perfil === 'cozinha'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {u.perfil === 'admin'
                                ? 'Administrador'
                                : u.perfil === 'garcom'
                                ? 'Garçom'
                                : u.perfil === 'cozinha'
                                ? 'Cozinha / Pizzaiolo'
                                : 'Operador de Caixa'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          title={u.ativo ? 'Clique para desativar acesso' : 'Clique para ativar acesso'}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer shrink-0 ${
                            u.ativo
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-amber-100 hover:text-amber-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-stone-200 text-stone-600 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                        >
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </div>

                      {/* Middle: Login, Senha & Link de Acesso Exclusivo */}
                      <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700/60 text-xs font-mono space-y-2">
                        <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                          <span className="font-sans text-[11px] text-stone-500">Login:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-stone-900 dark:text-white bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                              {u.usuario}
                            </strong>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(u.usuario);
                                alert(`Login "${u.usuario}" copiado para a área de transferência!`);
                              }}
                              title="Copiar Login"
                              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                          <span className="font-sans text-[11px] text-stone-500">Senha:</span>
                          <div className="flex items-center gap-1.5" title="Senha protegida por criptografia SHA-256 + Salt">
                            <span className="text-stone-400 font-sans tracking-widest text-xs">••••••••</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Criptografada</span>
                            </span>
                          </div>
                        </div>

                        {/* Link de Acesso Exclusivo do Responsável */}
                        <div className="pt-2 border-t border-stone-200/80 dark:border-stone-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-[11px] font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1">
                              <Link2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>Link de Acesso:</span>
                            </span>
                            <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                              Token Seguro
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyUserAccessLink(u)}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                                copiedUserLinkId === u.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600'
                              }`}
                              title="Copiar link de acesso exclusivo deste responsável"
                            >
                              {copiedUserLinkId === u.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Link Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar Link de Acesso</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppAccess(u)}
                              className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                              title="Enviar link e credenciais diretamente no WhatsApp do responsável"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="text-[11px]">WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lockout & Security Feedback */}
                      {isLocked ? (
                        <div className="p-2.5 bg-red-100/90 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 dark:text-red-200">
                            <Lock className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Bloqueado por 5 falhas consecutivas</span>
                          </div>
                          <p className="text-[11px] text-red-700 dark:text-red-300">
                            Bloqueio automático restando {userStatus.remainingMinutes} min.
                          </p>
                          <button
                            onClick={() => {
                              resetLoginLockout(u.usuario);
                              alert(`Conta de ${u.nome} (${u.usuario}) desbloqueada com sucesso! O colaborador já pode fazer login.`);
                            }}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Desbloquear Acesso Agora</span>
                          </button>
                        </div>
                      ) : userStatus.failedAttempts > 0 ? (
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px]">
                          <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            <span>{userStatus.failedAttempts} de 5 falhas recentes</span>
                          </span>
                          <button
                            onClick={() => {
                              resetLoginLockout(u.usuario);
                              alert(`Tentativas falhas de ${u.nome} zeradas com sucesso!`);
                            }}
                            className="text-stone-600 dark:text-stone-300 hover:text-stone-900 underline font-bold cursor-pointer"
                          >
                            Zerar falhas
                          </button>
                        </div>
                      ) : null}

                      {/* Bottom Actions Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                        <span className="text-[11px] text-stone-400 font-medium">Ações:</span>
                        <div className="flex items-center gap-1">
                          {/* Editar Colaborador Completo (Nome, Login, Cargo, Senha) */}
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            title="Editar Dados, Cargo ou Senha"
                            className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                            <span>Editar</span>
                          </button>

                          {/* Trocar Senha Rápido */}
                          <button
                            onClick={() => {
                              setPasswordModalUser(u);
                              setQuickNewPassword('');
                              setShowQuickPassword(false);
                            }}
                            title="Alterar Senha do Colaborador"
                            className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Excluir Colaborador (não permite excluir o usuário logado no momento) */}
                          {!isCurrentUser && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Tem certeza que deseja excluir o colaborador "${u.nome}"? Ele perderá todo o acesso ao sistema.`
                                  )
                                ) {
                                  deleteUser(u.id);
                                }
                              }}
                              title="Excluir Colaborador / Revogar Acesso"
                              className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: AUDITORIA DE CANCELAMENTOS ================= */}
        {activeTab === 'cancelamentos' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase">
                Auditoria de Itens Cancelados
              </h2>
              <p className="text-xs text-stone-500">
                Conforme exigência do PRD (Item 17), todos os cancelamentos de itens da cozinha são registrados com justificativa e operador.
              </p>
            </div>

            {cancellationAuditList.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-stone-400 border border-stone-200">
                Nenhum cancelamento registrado no histórico do sistema.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3.5">Data / Hora</th>
                        <th className="p-3.5">Pedido / Mesa</th>
                        <th className="p-3.5">Item Cancelado</th>
                        <th className="p-3.5">Valor Estornado</th>
                        <th className="p-3.5">Motivo / Justificativa</th>
                        <th className="p-3.5">Operador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {cancellationAuditList.map((c, i) => (
                        <tr key={i} className="hover:bg-stone-50 transition">
                          <td className="p-3.5 text-stone-600">{formatDateTime(c.data)}</td>
                          <td className="p-3.5 font-bold text-stone-900 dark:text-slate-100">
                            Pedido #{c.orderId} (Mesa {c.mesaNumero})
                          </td>
                          <td className="p-3.5 font-medium text-stone-800 dark:text-slate-200">
                            {c.quantidade}x {c.itemNome}
                          </td>
                          <td className="p-3.5 font-bold text-red-600 font-mono">
                            {formatCurrency(c.valor)}
                          </td>
                          <td className="p-3.5">
                            <span className="bg-red-50 text-red-900 px-2 py-0.5 rounded-lg font-semibold text-xs border border-red-200">
                              {c.motivo}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold text-stone-700 dark:text-slate-300">{c.usuarioNome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: CONFIGURAÇÕES DA LOJA / TAXA DE ENTREGA ================= */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6 w-full">
            {/* Header da Aba */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase flex items-center gap-2">
                <Store className="w-4 h-4 text-red-700" />
                <span>Configurações da Loja & Identidade Visual</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                Defina os dados da sua filial, marca, logotipo, endereço, telefone, horários e as taxas de entrega por bairro.
              </p>
            </div>

            {/* Layout Principal em 2 Colunas no Desktop para Ocupar Toda a Tela */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* COLUNA ESQUERDA (6 cols): Formulário de Dados da Loja, Identidade Visual e Horários */}
              <div className="lg:col-span-6 space-y-6">
                <form onSubmit={handleSaveLoja} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-5">
                  {lojaSaved && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Configurações da loja salvas com sucesso!</span>
                    </div>
                  )}

                  {/* Seção Identidade Visual & Nome */}
                  <div className="p-4 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-stone-200 dark:border-slate-700/60 space-y-4">
                    <h3 className="text-xs font-bold text-stone-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                      <Camera className="w-4 h-4 text-red-600" />
                      <span>Identidade Visual & Logotipo</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Visualizador da Logo */}
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shadow-xs">
                          {lojaLogoUrl ? (
                            <img
                              src={lojaLogoUrl}
                              alt="Logo da Loja"
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-stone-400 dark:text-slate-500">
                              <ImageIcon className="w-7 h-7" />
                              <span className="text-[9px] font-semibold mt-1">Sem Logo</span>
                            </div>
                          )}
                        </div>
                        {lojaLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setLojaLogoUrl('')}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition cursor-pointer"
                            title="Remover logotipo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Upload e URL */}
                      <div className="flex-1 w-full space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                            Carregar Imagem do Computador/Celular:
                          </label>
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer transition shadow-xs">
                            <Upload className="w-4 h-4 text-red-600" />
                            <span>Selecionar Imagem da Logo...</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500 block mt-1">
                            PNG, JPG ou SVG. A imagem é otimizada automaticamente.
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                            Ou Link Direto da Imagem (URL):
                          </label>
                          <input
                            type="url"
                            value={lojaLogoUrl}
                            onChange={(e) => setLojaLogoUrl(e.target.value)}
                            placeholder="https://exemplo.com/minha-logo.png"
                            className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Nome da Marca / Estabelecimento:
                        </label>
                        <input
                          type="text"
                          required
                          value={lojaMarca}
                          onChange={(e) => setLojaMarca(e.target.value)}
                          placeholder="Ex: Pizzaria Bella, Hamburgueria Grill..."
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 transition"
                        />
                        <span className="text-[10px] text-stone-400 dark:text-slate-500 block mt-1">
                          Este nome aparece no cabeçalho superior do sistema, delivery e impressões.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Nome da Filial / Unidade:
                        </label>
                        <input
                          type="text"
                          required
                          value={lojaNome}
                          onChange={(e) => setLojaNome(e.target.value)}
                          placeholder="Ex: Unidade Centro, Matriz..."
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 transition"
                        />
                        <span className="text-[10px] text-stone-400 dark:text-slate-500 block mt-1">
                          Identificação específica desta filial.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Taxa de Entrega Padrão (R$):</label>
                      <input
                        type="text"
                        required
                        value={lojaTaxa}
                        onChange={(e) => setLojaTaxa(e.target.value)}
                        placeholder="7,00"
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Tempo Estimado de Entrega:</label>
                      <input
                        type="text"
                        value={lojaTempo}
                        onChange={(e) => setLojaTempo(e.target.value)}
                        placeholder="30 - 45 min"
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Endereço da Loja (Para Retirada):</label>
                    <input
                      type="text"
                      required
                      value={lojaEndereco}
                      onChange={(e) => setLojaEndereco(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000 - Centro, São Paulo - SP"
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Telefone / WhatsApp:</label>
                      <input
                        type="text"
                        value={lojaTelefone}
                        onChange={(e) => setLojaTelefone(e.target.value)}
                        placeholder="(11) 99999-8888"
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Horário de Funcionamento (Abertura e Fechamento):
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">
                            ⏰ Início (Abre):
                          </span>
                          <input
                            type="time"
                            required
                            value={lojaHoraAbertura}
                            onChange={(e) => {
                              setLojaHoraAbertura(e.target.value);
                              setLojaHorario(`${e.target.value} às ${lojaHoraFechamento}`);
                            }}
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">
                            🌙 Fim (Fecha):
                          </span>
                          <input
                            type="time"
                            required
                            value={lojaHoraFechamento}
                            onChange={(e) => {
                              setLojaHoraFechamento(e.target.value);
                              setLojaHorario(`${lojaHoraAbertura} às ${e.target.value}`);
                            }}
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 transition"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 bg-stone-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                        <span>Intervalo ativo:</span>
                        <strong className="font-mono text-stone-900 dark:text-slate-100 font-bold">{lojaHoraAbertura} às {lojaHoraFechamento}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Controle Manual de Abertura / Fechamento */}
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                        Status de Atendimento (Controle Manual)
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        Se você precisar pausar os pedidos antes do horário de fechamento, ative esta opção.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLojaFechadoManualmente(!lojaFechadoManualmente)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                        lojaFechadoManualmente
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                      }`}
                    >
                      {lojaFechadoManualmente ? '🔴 Fechada Manualmente' : '🟢 Aberta para Pedidos'}
                    </button>
                  </div>

                  {/* Seção de Configuração do PIX */}
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        <span>Chave PIX da Loja (Recebimento no Delivery)</span>
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-850 text-emerald-900 dark:text-emerald-200">
                        Pagamento Instantâneo
                      </span>
                    </div>

                    <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400 leading-relaxed">
                      Cadastre a chave PIX da sua filial. Quando os clientes escolherem PIX no cardápio de delivery, o sistema exibirá automaticamente a chave formatada, o código oficial Copia e Cola e o QR Code, além de solicitar o envio do comprovante no WhatsApp da loja.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Tipo de Chave PIX:
                        </label>
                        <select
                          value={lojaPixTipo}
                          onChange={(e) => setLojaPixTipo(e.target.value as any)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-600 transition"
                        >
                          <option value="cnpj">CNPJ</option>
                          <option value="cpf">CPF</option>
                          <option value="telefone">Telefone / Celular</option>
                          <option value="email">E-mail</option>
                          <option value="aleatoria">Chave Aleatória (EVP)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Chave PIX da Loja:
                        </label>
                        <input
                          type="text"
                          value={lojaPixChave}
                          onChange={(e) => setLojaPixChave(e.target.value)}
                          placeholder={
                            lojaPixTipo === 'cnpj'
                              ? 'Ex: 12.345.678/0001-90'
                              : lojaPixTipo === 'cpf'
                              ? 'Ex: 123.456.789-00'
                              : lojaPixTipo === 'telefone'
                              ? 'Ex: (11) 99999-8888'
                              : lojaPixTipo === 'email'
                              ? 'Ex: financeiro@sualoja.com.br'
                              : 'Ex: 123e4567-e89b-12d3-a456-426614174000'
                          }
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Nome do Titular / Beneficiário:
                        </label>
                        <input
                          type="text"
                          value={lojaPixTitular}
                          onChange={(e) => setLojaPixTitular(e.target.value)}
                          placeholder="Ex: Pizzaria Bella Itália Ltda"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Cidade do Titular da Conta:
                        </label>
                        <input
                          type="text"
                          value={lojaPixCidade}
                          onChange={(e) => setLojaPixCidade(e.target.value)}
                          placeholder="Ex: São Paulo"
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>

                    {lojaPixChave && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/80 dark:border-emerald-850 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="text-[10px] text-stone-500 uppercase font-bold block">
                            Prévia da Chave para os Clientes no Delivery:
                          </span>
                          <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 truncate block">
                            {formatPixKeyDisplay(lojaPixChave, lojaPixTipo)}
                          </span>
                          {lojaPixTitular && (
                            <span className="text-[10px] text-stone-500 block truncate">
                              Titular: {lojaPixTitular} • {lojaPixCidade || 'Brasil'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-bold shrink-0">
                          ✅ PIX Ativo
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-stone-100 dark:border-slate-800">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salvar Configurações</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* COLUNA DIREITA (6 cols): Links de Acesso, Tokens da Equipe e Bairros */}
              <div className="lg:col-span-6 space-y-6">
                {/* Link do Cardápio Digital / Delivery */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-amber-500" />
                        <span>Link do Cardápio Online (Delivery)</span>
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                        Envie este link para seus clientes no WhatsApp e redes sociais para eles pedirem direto com sua marca e logo.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLinkFromAdmin}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          adminLinkCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-700 hover:bg-red-800 text-white'
                        }`}
                      >
                        {adminLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{adminLinkCopied ? 'Link Copiado!' : 'Copiar Link WhatsApp'}</span>
                      </button>
                      <a
                        href={getDeliveryUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        title="Abrir cardápio em nova aba"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Cardápio</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-2.5 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs font-mono text-stone-700 dark:text-slate-300 break-all select-all">
                    <span>{getDeliveryUrl()}</span>
                  </div>
                </div>

                {/* Links Exclusivos da Equipe */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-purple-600" />
                      <span>Links Exclusivos de Acesso da Equipe (com Tokens)</span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      Repasse estes links restritos aos seus funcionários autorizados. Sem o token exato na URL, o sistema bloqueia o acesso à tela de login.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        role: 'Garçom',
                        painel: 'garcom',
                        token: currentLoja?.token_garcom,
                        icon: <UtensilsCrossed className="w-4 h-4 text-red-600" />,
                        desc: 'Abertura de comandas e salão',
                      },
                      {
                        role: 'Cozinha (KDS)',
                        painel: 'cozinha',
                        token: currentLoja?.token_cozinha,
                        icon: <ChefHat className="w-4 h-4 text-amber-600" />,
                        desc: 'Preparo e despacho de pedidos',
                      },
                      {
                        role: 'Caixa (PDV)',
                        painel: 'caixa',
                        token: currentLoja?.token_caixa,
                        icon: <CircleDollarSign className="w-4 h-4 text-emerald-600" />,
                        desc: 'Contas, comandas e pagamentos',
                      },
                    ].map((item) => {
                      const fullUrl = `${window.location.origin}/?loja=${currentLoja?.slug}&painel=${item.painel}&token=${item.token}`;
                      return (
                        <div key={item.painel} className="p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-800/50 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {item.icon}
                              <span className="text-xs font-bold text-stone-900 dark:text-white">{item.role}</span>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(fullUrl);
                              setCopiedStaffRole(item.painel);
                              setTimeout(() => setCopiedStaffRole(null), 2500);
                            }}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2 ${
                              copiedStaffRole === item.painel
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-700'
                            }`}
                          >
                            {copiedStaffRole === item.painel ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedStaffRole === item.painel ? 'Link Copiado!' : `Copiar Link ${item.role.split(' ')[0]}`}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Taxas por Bairro / Região */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 uppercase flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-700" />
                      <span>Taxas de Entrega por Bairro / Região</span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      Cadastre os bairros atendidos e o valor do percurso para que o cliente selecione no cardápio online.
                    </p>
                  </div>

                  {/* Formulário para Adicionar Novo Bairro */}
                  <form onSubmit={handleAddBairroSubmit} className="flex flex-col sm:flex-row items-end gap-3 p-3.5 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-stone-200 dark:border-slate-700">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">Nome do Bairro / Região:</label>
                      <input
                        type="text"
                        required
                        value={newBairroNome}
                        onChange={(e) => setNewBairroNome(e.target.value)}
                        placeholder="Ex: Jardim América, Centro, Vila Nova..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-600 font-semibold"
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">Valor do Frete (R$):</label>
                      <input
                        type="text"
                        required
                        value={newBairroValor}
                        onChange={(e) => setNewBairroValor(e.target.value)}
                        placeholder="Ex: 8,50"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-red-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Cadastrar Bairro</span>
                    </button>
                  </form>

                  {/* Lista de Bairros Cadastrados */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-stone-700 dark:text-slate-300 uppercase tracking-wider">
                      Bairros Cadastrados ({currentLoja?.taxas_bairro?.length || 0}):
                    </h4>
                    {(!currentLoja?.taxas_bairro || currentLoja.taxas_bairro.length === 0) ? (
                      <p className="text-xs text-stone-400 dark:text-slate-500 italic p-3 bg-stone-50 dark:bg-slate-800/40 rounded-xl text-center">
                        Nenhum bairro individual cadastrado. Será cobrada a taxa de entrega padrão ({formatCurrency(currentLoja?.taxa_entrega || 0)}).
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                        {currentLoja.taxas_bairro.map((tb) => (
                          <div key={tb.id} className="p-3 bg-stone-50 dark:bg-slate-800/70 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-stone-900 dark:text-slate-100 block">{tb.bairro}</span>
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                                Frete: {formatCurrency(tb.valor)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Excluir a taxa do bairro "${tb.bairro}"?`)) {
                                  deleteTaxaBairro(currentLoja.id, tb.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                              title="Excluir Bairro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 8: FISCAL & NFC-E ================= */}
        {activeTab === 'fiscal' && currentLoja && (
          <FiscalSettingsTab
            currentLoja={currentLoja}
            updateLoja={updateLoja}
          />
        )}
      </main>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">
              {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Nome do Produto:</label>
                <input
                  type="text"
                  required
                  value={prodNome}
                  onChange={(e) => setProdNome(e.target.value)}
                  placeholder="Ex: Pizza Quatro Estações"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Categoria:</label>
                  <select
                    value={prodCategoria}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setProdCategoria(newCat);
                      if (newCat === 'bebidas') {
                        setProdControlarEstoque(true);
                        if (!prodEstoque) setProdEstoque('24');
                        setProdNcm('2202.10.00');
                        setProdImprimeCozinha(false);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Preço Base (R$):</label>
                  <input
                    type="text"
                    required
                    value={prodPreco}
                    onChange={(e) => setProdPreco(e.target.value)}
                    placeholder="Ex: 58,00"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Descrição / Ingredientes:</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Ex: Molho caseiro, mussarela especial, orégano..."
                  className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>

              {/* Foto / Imagem do Produto (Necessário para o Cardápio do Cliente) */}
              <div className="space-y-2 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-red-600" />
                  <span>Foto do Produto (Cardápio do Cliente):</span>
                </label>

                <div className="flex items-center gap-3">
                  {/* Prévia da Foto */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0 relative flex items-center justify-center">
                    {prodImagem ? (
                      <img src={prodImagem} alt="Prévia" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] text-stone-400 font-bold text-center p-1 leading-tight">
                        <span>Sem Foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* Input de URL */}
                    <input
                      type="text"
                      value={prodImagem}
                      onChange={(e) => setProdImagem(e.target.value)}
                      placeholder="URL da imagem (http://... ou https://...)"
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-red-500 font-mono"
                    />

                    {/* Botão de Upload Local do Computador/Celular */}
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 dark:text-slate-200 rounded-md text-[11px] font-bold cursor-pointer transition flex items-center gap-1">
                        <Upload className="w-3 h-3 text-stone-700 dark:text-slate-300" />
                        <span>Carregar do Aparelho / Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedUrl = await compressImageFile(file, 800, 800, 0.78);
                                setProdImagem(compressedUrl);
                              } catch (err) {
                                console.error('Erro ao compactar imagem:', err);
                              }
                            }
                          }}
                        />
                      </label>

                      {prodImagem && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            Compactada!
                          </span>
                          <button
                            type="button"
                            onClick={() => setProdImagem('')}
                            className="text-[11px] text-red-600 hover:underline font-bold cursor-pointer"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-stone-100 max-h-60 overflow-y-auto pr-1">
                <span className="block text-xs font-bold text-stone-800 dark:text-slate-200 uppercase tracking-wider">
                  Opções de Personalização Específicas do Produto:
                </span>
                
                {/* 1. Tamanhos */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodPermitirTamanhos}
                        onChange={(e) => setProdPermitirTamanhos(e.target.checked)}
                        className="accent-red-700"
                      />
                      <span>Permitir Seleção de Tamanhos</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">({prodTamanhosSel.length} selecionados)</span>
                  </label>

                  {prodPermitirTamanhos && (
                    <div className="pl-5 pt-1 grid grid-cols-2 gap-1 border-t border-stone-200/60 mt-1">
                      {pizzaSizes.map((sz) => {
                        const isChecked = prodTamanhosSel.includes(sz.id);
                        return (
                          <label key={sz.id} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setProdTamanhosSel((prev) =>
                                  prev.includes(sz.id) ? prev.filter((id) => id !== sz.id) : [...prev, sz.id]
                                );
                              }}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>{sz.nome.split(' ')[0]} ({sz.fatias}f)</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Bordas Recheadas */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodPermitirBordas}
                        onChange={(e) => setProdPermitirBordas(e.target.checked)}
                        className="accent-red-700"
                      />
                      <span>Permitir Bordas Recheadas</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">({prodBordasSel.length} selecionadas)</span>
                  </label>

                  {prodPermitirBordas && (
                    <div className="pl-5 pt-1 grid grid-cols-2 gap-1 border-t border-stone-200/60 mt-1">
                      {pizzaCrusts.map((crust) => {
                        const isChecked = prodBordasSel.includes(crust.id);
                        return (
                          <label key={crust.id} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setProdBordasSel((prev) =>
                                  prev.includes(crust.id) ? prev.filter((id) => id !== crust.id) : [...prev, crust.id]
                                );
                              }}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>{crust.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Tipos de Massa */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodPermitirMassas}
                        onChange={(e) => setProdPermitirMassas(e.target.checked)}
                        className="accent-red-700"
                      />
                      <span>Permitir Tipos de Massa</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">({prodMassasSel.length} selecionadas)</span>
                  </label>

                  {prodPermitirMassas && (
                    <div className="pl-5 pt-1 grid grid-cols-2 gap-1 border-t border-stone-200/60 mt-1">
                      {pizzaDoughs.map((dough) => {
                        const isChecked = prodMassasSel.includes(dough.id);
                        return (
                          <label key={dough.id} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setProdMassasSel((prev) =>
                                  prev.includes(dough.id) ? prev.filter((id) => id !== dough.id) : [...prev, dough.id]
                                );
                              }}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>{dough.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Adicionais Opcionais */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodPermitirAdicionais}
                        onChange={(e) => setProdPermitirAdicionais(e.target.checked)}
                        className="accent-red-700"
                      />
                      <span>Permitir Adicionais Opcionais</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">({prodAdicionaisSel.length} selecionados)</span>
                  </label>

                  {prodPermitirAdicionais && (
                    <div className="pl-5 pt-1 grid grid-cols-2 gap-1 border-t border-stone-200/60 mt-1">
                      {pizzaAddons.map((addon) => {
                        const isChecked = prodAdicionaisSel.includes(addon.id);
                        return (
                          <label key={addon.id} className="flex items-center gap-1.5 text-[11px] text-stone-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setProdAdicionaisSel((prev) =>
                                  prev.includes(addon.id) ? prev.filter((id) => id !== addon.id) : [...prev, addon.id]
                                );
                              }}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>{addon.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

                <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={prodIsPizza}
                    onChange={(e) => setProdIsPizza(e.target.checked)}
                    className="accent-red-700"
                  />
                  <span>Permitir Seleção de Sabores / Meio a Meio (Pizza)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodImprimeCozinha}
                    onChange={(e) => setProdImprimeCozinha(e.target.checked)}
                    className="accent-red-700"
                  />
                  <span>Enviar para tela e impressora da cozinha (KDS)</span>
                </label>

                {/* 📦 Controle de Estoque (Bebidas e Itens com Contagem) */}
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodControlarEstoque}
                        onChange={(e) => setProdControlarEstoque(e.target.checked)}
                        className="accent-amber-600 w-4 h-4 rounded"
                      />
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        Controlar Estoque deste Produto (Ex: Bebidas)
                      </span>
                    </label>
                    {prodCategoria === 'bebidas' && !prodControlarEstoque && (
                      <button
                        type="button"
                        onClick={() => {
                          setProdControlarEstoque(true);
                          if (!prodEstoque) setProdEstoque('24');
                        }}
                        className="text-[10px] text-amber-700 font-bold hover:underline"
                      >
                        Recomendado para bebidas
                      </button>
                    )}
                  </div>

                  {prodControlarEstoque && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Quantidade Atual em Estoque: *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={prodEstoque}
                          onChange={(e) => setProdEstoque(e.target.value)}
                          placeholder="Ex: 24"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                        />
                        <p className="text-[10px] text-stone-500 mt-1">
                          Ao zerar (0 un), constará como ESGOTADO para os clientes.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                          Estoque Mínimo para Alerta:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={prodEstoqueMinimoAlerta}
                          onChange={(e) => setProdEstoqueMinimoAlerta(e.target.value)}
                          placeholder="Ex: 5"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                        />
                        <p className="text-[10px] text-stone-500 mt-1">
                          Emite alerta para o admin quando atingir este limite.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🏛️ Dados Fiscais (NFC-e / SEFAZ) */}
                <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/20 rounded-xl border border-sky-200 dark:border-sky-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      Dados Fiscais (NFC-e / Tributação)
                    </span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 px-2 py-0.5 rounded-full font-semibold">
                      Obrigatório para Emissão
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        NCM (8 dígitos): *
                      </label>
                      <input
                        type="text"
                        value={prodNcm}
                        onChange={(e) => setProdNcm(e.target.value)}
                        placeholder="Ex: 1905.90.90"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                      />
                      {/* Atalhos rápidos de NCM comum */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setProdNcm('1905.90.90')}
                          className="text-[9px] px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded text-sky-700 dark:text-sky-300 hover:bg-sky-50 cursor-pointer"
                        >
                          🍕 Pizza (1905.90.90)
                        </button>
                        <button
                          type="button"
                          onClick={() => setProdNcm('2106.90.90')}
                          className="text-[9px] px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded text-sky-700 dark:text-sky-300 hover:bg-sky-50 cursor-pointer"
                        >
                          🍔 Lanches (2106.90.90)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setProdNcm('2202.10.00'); setProdCest('03.010.00'); setProdCfop('5405'); setProdCsosn('500'); }}
                          className="text-[9px] px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded text-sky-700 dark:text-sky-300 hover:bg-sky-50 cursor-pointer"
                        >
                          🥤 Refri (2202.10.00)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        CEST (Substituição Tributária):
                      </label>
                      <input
                        type="text"
                        value={prodCest}
                        onChange={(e) => setProdCest(e.target.value)}
                        placeholder="Ex: 03.010.00 (opcional)"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-mono text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                      />
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 mt-1 block">
                        Exigido para bebidas e itens com ICMS-ST
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Código de Barras / GTIN (EAN):
                      </label>
                      <input
                        type="text"
                        value={prodCodigoBarras}
                        onChange={(e) => setProdCodigoBarras(e.target.value)}
                        placeholder="Ex: 7891234567890 ou 'SEM GTIN'"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-mono text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        CFOP:
                      </label>
                      <select
                        value={prodCfop}
                        onChange={(e) => setProdCfop(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 cursor-pointer"
                      >
                        <option value="5102">5102 - Venda mercadoria adquirida (Padrão)</option>
                        <option value="5101">5101 - Venda produção do estabelecimento</option>
                        <option value="5405">5405 - Venda mercadoria com ICMS-ST (Bebidas)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        CSOSN / CST ICMS:
                      </label>
                      <select
                        value={prodCsosn}
                        onChange={(e) => setProdCsosn(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 cursor-pointer"
                      >
                        <option value="102">102 - Tributada pelo Simples s/ permissão crédito</option>
                        <option value="500">500 - ICMS cobrado anteriormente por ST</option>
                        <option value="101">101 - Tributada pelo Simples c/ permissão crédito</option>
                        <option value="900">900 - Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Origem da Mercadoria:
                      </label>
                      <select
                        value={prodOrigem}
                        onChange={(e) => setProdOrigem(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 cursor-pointer"
                      >
                        <option value="0">0 - Nacional</option>
                        <option value="1">1 - Estrangeira (Importação direta)</option>
                        <option value="2">2 - Estrangeira (Adquirida no mercado interno)</option>
                      </select>
                    </div>
                  </div>
                </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">Cadastrar Nova Mesa</h3>
            <form onSubmit={handleSaveTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Número da Mesa:</label>
                <input
                  type="number"
                  required
                  value={tableNumero}
                  onChange={(e) => setTableNumero(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Capacidade (Lugares):</label>
                <input
                  type="number"
                  required
                  value={tableCapacidade}
                  onChange={(e) => setTableCapacidade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Localização no Salão:</label>
                <input
                  type="text"
                  required
                  value={tableLocalizacao}
                  onChange={(e) => setTableLocalizacao(e.target.value)}
                  placeholder="Ex: Varanda, Salão Principal, Mezanino"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">Cadastrar Colaborador</h3>
                  <p className="text-[11px] text-stone-500">Crie o acesso para garçom, cozinha, caixa ou admin.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUserName(val);
                    if (!userLogin || userLogin === userName.trim().toLowerCase().replace(/\s+/g, '.')) {
                      setUserLogin(val.trim().toLowerCase().replace(/\s+/g, '.'));
                    }
                  }}
                  placeholder="Ex: Lucas Silva"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Login / Usuário de Acesso:
                  </label>
                  <span className="text-[10px] text-stone-400">Usado para entrar no sistema</span>
                </div>
                <input
                  type="text"
                  required
                  value={userLogin}
                  onChange={(e) => setUserLogin(e.target.value.toLowerCase().replace(/\s+/g, '.'))}
                  placeholder="Ex: lucas.silva ou lucas"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Função / Cargo:
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold capitalize text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition cursor-pointer"
                >
                  <option value="garcom">Garçom (Salão e Mesas)</option>
                  <option value="cozinha">Cozinha / Pizzaiolo (KDS)</option>
                  <option value="caixa">Operador de Caixa (PDV e Fechamento)</option>
                  <option value="admin">Administrador / Gerente</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Senha de Acesso:
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Mín. 6 caracteres</span>
                </div>
                <div className="relative">
                  <input
                    type={showAddUserPassword ? 'text' : 'password'}
                    minLength={6}
                    required
                    value={userSenha}
                    onChange={(e) => setUserSenha(e.target.value)}
                    placeholder="Digite a senha (mínimo 6 caracteres)"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddUserPassword(!showAddUserPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showAddUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Informative Preview Card */}
              <div className="p-3 bg-stone-100 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] text-stone-600 dark:text-stone-300 space-y-1 font-mono">
                <div className="font-sans font-bold text-stone-700 dark:text-stone-200">Resumo de Acesso:</div>
                <div>Login: <strong>{userLogin || '...'}</strong></div>
                <div>Função: <strong>{userRole}</strong></div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Cadastrar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal (Editar Colaborador Completo) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    Editar Colaborador
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Altere nome, login, função e senha de acesso.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Login / Usuário de Acesso:
                </label>
                <input
                  type="text"
                  required
                  value={editUserLogin}
                  onChange={(e) => setEditUserLogin(e.target.value.toLowerCase().replace(/\s+/g, '.'))}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Função / Cargo:
                </label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold capitalize text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition cursor-pointer"
                >
                  <option value="garcom">Garçom (Salão e Mesas)</option>
                  <option value="cozinha">Cozinha / Pizzaiolo (KDS)</option>
                  <option value="caixa">Operador de Caixa (PDV e Fechamento)</option>
                  <option value="admin">Administrador / Gerente</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Nova Senha (Opcional):
                  </label>
                  <span className="text-[10px] text-stone-400">Deixe em branco para manter a atual</span>
                </div>
                <div className="relative">
                  <input
                    type={showEditUserPassword ? 'text' : 'password'}
                    minLength={6}
                    value={editUserSenha}
                    onChange={(e) => setEditUserSenha(e.target.value)}
                    placeholder="Deixe em branco ou digite nova senha (mín. 6 chars)"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                    title={showEditUserPassword ? 'Ocultar Senha' : 'Ver Nova Senha Digitada'}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showEditUserPassword ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Por segurança (padrão bancário), as senhas são gravadas com criptografia irreversível (hash SHA-256 + Salt). Se o colaborador esquecer, digite uma nova senha aqui para ele.</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Status da Conta:
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="radio"
                      name="editUserStatus"
                      checked={editUserAtivo}
                      onChange={() => setEditUserAtivo(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Ativo (Acesso Liberado)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="radio"
                      name="editUserStatus"
                      checked={!editUserAtivo}
                      onChange={() => setEditUserAtivo(false)}
                      className="text-stone-600 focus:ring-stone-500"
                    />
                    <span className="font-semibold text-stone-500">Inativo (Acesso Bloqueado)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Password Change Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">Alterar Senha</h3>
                  <p className="text-[11px] text-stone-500">{passwordModalUser.nome}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPassword} className="space-y-3.5">
              <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 text-xs">
                <div className="text-stone-500 text-[11px]">Colaborador:</div>
                <div className="font-bold text-stone-900 dark:text-white">{passwordModalUser.nome}</div>
                <div className="font-mono text-stone-600 dark:text-stone-300 text-[11px] mt-0.5">
                  Login: <strong>{passwordModalUser.usuario}</strong>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Nova Senha:
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Mín. 6 chars</span>
                </div>
                <div className="relative">
                  <input
                    type={showQuickPassword ? 'text' : 'password'}
                    minLength={6}
                    required
                    value={quickNewPassword}
                    onChange={(e) => setQuickNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickPassword(!showQuickPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showQuickPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Atualizar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Option Modal (Tamanhos, Bordas, Massas, Adicionais) */}
      {showOptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">
              {editingOptionId ? 'Editar Opção' : 'Cadastrar Nova Opção'}{' '}
              {showOptionModal === 'size' && '(Tamanho)'}
              {showOptionModal === 'crust' && '(Borda Recheada)'}
              {showOptionModal === 'dough' && '(Tipo de Massa)'}
              {showOptionModal === 'addon' && '(Adicional Opcional)'}
            </h3>

            <form onSubmit={handleSaveOption} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Nome da Opção:</label>
                <input
                  type="text"
                  required
                  value={optName}
                  onChange={(e) => setOptName(e.target.value)}
                  placeholder={
                    showOptionModal === 'size'
                      ? 'Ex: Gigante (12 fatias)'
                      : showOptionModal === 'crust'
                      ? 'Ex: Borda Nutella'
                      : showOptionModal === 'dough'
                      ? 'Ex: Massa Integral'
                      : 'Ex: Bacon Extra'
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                />
              </div>

              {/* Extra fields for Size */}
              {showOptionModal === 'size' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Nº de Fatias:</label>
                      <input
                        type="number"
                        required
                        value={optSlices}
                        onChange={(e) => setOptSlices(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Máx Sabores:</label>
                      <input
                        type="number"
                        required
                        value={optMaxFlavors}
                        onChange={(e) => setOptMaxFlavors(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Multiplicador de Preço (ex: 1.0 = 100%, 1.3 = +30%):
                    </label>
                    <input
                      type="text"
                      required
                      value={optMultiplier}
                      onChange={(e) => setOptMultiplier(e.target.value)}
                      placeholder="1.2"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 dark:text-slate-100 font-bold font-mono"
                    />
                  </div>
                </>
              )}

              {/* Price field for Crust & Addon */}
              {(showOptionModal === 'crust' || showOptionModal === 'addon') && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Preço Adicional (R$):</label>
                  <input
                    type="text"
                    required
                    value={optPrice}
                    onChange={(e) => setOptPrice(e.target.value)}
                    placeholder="Ex: 8,50"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 dark:text-slate-100 font-mono focus:outline-hidden focus:border-stone-400 focus:bg-white transition"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowOptionModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Opção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE PROMOÇÃO RÁPIDA ================= */}
      {quickPromoProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xl shrink-0 border border-amber-500/30">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    Promoção Rápida
                  </span>
                  <h3 className="text-base font-black text-stone-900 leading-tight mt-0.5">
                    {quickPromoProduct.nome}
                  </h3>
                  <span className="text-xs text-stone-400">
                    Preço normal: <strong className="text-stone-700 font-mono">{formatCurrency(quickPromoProduct.preco)}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPromoProduct(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPromo} className="space-y-4">
              {/* Campo: Preço com Desconto */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  💰 Preço com Desconto Promocional (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-xs">
                    R$
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={quickPromoPreco}
                    onChange={(e) => setQuickPromoPreco(e.target.value)}
                    placeholder="Ex: 39,90"
                    className="w-full pl-9 pr-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-base font-black font-mono text-stone-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
                {quickPromoPreco && !isNaN(parseFloat(quickPromoPreco.replace(',', '.'))) && (
                  <div className="mt-1.5 flex items-center justify-between text-xs px-1">
                    <span className="text-stone-500">
                      Economia do cliente:{' '}
                      <strong className="text-emerald-700 font-mono">
                        {formatCurrency(Math.max(0, quickPromoProduct.preco - parseFloat(quickPromoPreco.replace(',', '.'))))}
                      </strong>
                    </span>
                    {parseFloat(quickPromoPreco.replace(',', '.')) < quickPromoProduct.preco && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">
                        {Math.round((1 - parseFloat(quickPromoPreco.replace(',', '.')) / quickPromoProduct.preco) * 100)}% OFF
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Seletor de Duração: Horas vs Dias vs Indeterminada */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-800">
                  ⏱️ Tempo de Duração da Promoção:
                </label>

                {/* Botões de Tipo */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setQuickPromoTipo('horas'); if (quickPromoTipo !== 'horas') setQuickPromoValor('4'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      quickPromoTipo === 'horas'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Por Horas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setQuickPromoTipo('dias'); if (quickPromoTipo !== 'dias') setQuickPromoValor('1'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      quickPromoTipo === 'dias'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Por Dias</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickPromoTipo('indeterminada')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      quickPromoTipo === 'indeterminada'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <span>Até pausar</span>
                  </button>
                </div>

                {/* Input de Quantidade conforme o tipo */}
                {quickPromoTipo === 'horas' && (
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-900">Quantas horas dura?</span>
                      <span className="font-mono font-bold text-amber-900">{quickPromoValor} horas</span>
                    </div>
                    {/* Atalhos rápidos de horas */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 4, 6, 8, 12].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setQuickPromoValor(h.toString())}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                            quickPromoValor === h.toString()
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white text-stone-700 hover:bg-amber-100 border border-stone-200'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quickPromoTipo === 'dias' && (
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-900">Quantos dias dura?</span>
                      <span className="font-mono font-bold text-amber-900">{quickPromoValor} {quickPromoValor === '1' ? 'dia' : 'dias'}</span>
                    </div>
                    {/* Atalhos rápidos de dias */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5, 7].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setQuickPromoValor(d.toString())}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                            quickPromoValor === d.toString()
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white text-stone-700 hover:bg-amber-100 border border-stone-200'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quickPromoTipo === 'indeterminada' && (
                  <p className="text-[11px] text-stone-500 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    A promoção ficará ativa por tempo indeterminado até você clicar no botão de encerrar na tabela.
                  </p>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex items-center gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setQuickPromoProduct(null)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-4 h-4 fill-stone-950 text-stone-950" />
                  <span>Ativar Promoção</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
