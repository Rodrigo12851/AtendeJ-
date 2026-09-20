import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  User,
  Table,
  Category,
  Product,
  Order,
  Comanda,
  CashRegister,
  SystemNotification,
  UserRole,
  OrderStatus,
  PaymentMethod,
  OrderItem,
  Ingredient,
  Loja,
  PizzaSizeOption,
  PizzaCrustOption,
  PizzaDoughOption,
  PizzaAddonOption,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TABLES,
  INITIAL_USERS,
  INITIAL_COMANDAS,
  INITIAL_ORDERS,
  INITIAL_CASH_REGISTER,
  INITIAL_INGREDIENTS,
  INITIAL_LOJAS,
  PIZZA_SIZES,
  PIZZA_CRUSTS,
  PIZZA_DOUGHS,
  PIZZA_ADDONS,
} from '../data/initialData';
import { playKitchenBell, playReadyDing, playCashChime } from '../utils/audio';
import { generateComandaNumber } from '../utils/formatters';
import {
  db,
  FIRESTORE_COLLECTIONS,
  saveLojaToFirestore,
  saveTableToFirestore,
  saveComandaToFirestore,
  saveOrderToFirestore,
  seedInitialFirestoreIfEmpty,
} from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface StoreContextType {
  lojas: Loja[];
  currentLojaId: string;
  currentLoja: Loja | undefined;
  setCurrentLojaId: (lojaId: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  tables: Table[];
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  orders: Order[];
  comandas: Comanda[];
  allTables: Table[];
  allProducts: Product[];
  allIngredients: Ingredient[];
  allOrders: Order[];
  allComandas: Comanda[];
  cashRegister: CashRegister;
  notifications: SystemNotification[];
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  isDarkMode: boolean;
  setDarkMode: (val: boolean) => void;
  
  // Customization Options
  pizzaSizes: PizzaSizeOption[];
  pizzaCrusts: PizzaCrustOption[];
  pizzaDoughs: PizzaDoughOption[];
  pizzaAddons: PizzaAddonOption[];
  addPizzaSize: (size: Omit<PizzaSizeOption, 'id'>) => void;
  updatePizzaSize: (size: PizzaSizeOption) => void;
  deletePizzaSize: (id: string) => void;
  addPizzaCrust: (crust: Omit<PizzaCrustOption, 'id'>) => void;
  updatePizzaCrust: (crust: PizzaCrustOption) => void;
  deletePizzaCrust: (id: string) => void;
  addPizzaDough: (dough: Omit<PizzaDoughOption, 'id'>) => void;
  updatePizzaDough: (dough: PizzaDoughOption) => void;
  deletePizzaDough: (id: string) => void;
  addPizzaAddon: (addon: Omit<PizzaAddonOption, 'id'>) => void;
  updatePizzaAddon: (addon: PizzaAddonOption) => void;
  deletePizzaAddon: (id: string) => void;

  login: (usuario: string, senha: string) => boolean;
  loginWithPin: (pin: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setCurrentUserById: (userId: string) => void;
  openComanda: (mesaId: string, garcomId: string, garcomNome: string, clienteNome?: string) => Comanda;
  addOrderToComanda: (comandaId: string, itens: OrderItem[], observacao?: string) => Order;
  updateOrderStatus: (orderId: number, status: OrderStatus) => void;
  cancelOrderItem: (comandaId: string, orderId: number, itemId: string, motivo: string) => void;
  transferTable: (fromMesaId: string, toMesaId: string) => boolean;
  requestBill: (comandaId: string) => void;
  applyDiscount: (comandaId: string, valor: number, motivo: string) => void;
  registerPayment: (
    comandaId: string,
    forma_pagamento: PaymentMethod,
    valor: number,
    troco_para?: number,
    pagador_nome?: string,
    itens_pagos_ids?: string[]
  ) => void;
  closeComanda: (comandaId: string) => void;
  openCashRegister: (valorInicial: number) => void;
  closeCashRegister: (valorFinal: number, observacoes?: string) => void;
  addCashEntry: (tipo: 'suprimento' | 'sangria', motivo: string, valor: number) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateIngredientStock: (id: string, novaQuantidade: number, motivo?: string) => void;
  adjustIngredientStock: (id: string, delta: number, motivo?: string) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'ultima_atualizacao'>) => void;
  updateIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  batchRestockIngredients: (items: { id: string; delta: number }[]) => void;
  addTable: (numero: number, capacidade: number, localizacao: string) => void;
  updateTable: (table: Table) => void;
  deleteTable: (id: string) => void;
  updateLoja: (loja: Loja) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  addTaxaBairro: (lojaId: string, bairro: string, valor: number) => void;
  deleteTaxaBairro: (lojaId: string, taxaId: string) => void;
  createStoreWithAdmin: (
    lojaData: { nome: string; slug: string; endereco?: string; telefone?: string; taxa_entrega?: number },
    adminData: { nome: string; usuario: string; senha?: string; pin: string }
  ) => void;
  createDeliveryOrder: (
    lojaId: string,
    clienteInfo: { nome: string; telefone: string; endereco: string; formaPagamento: string; trocoPara?: number; tipoPedido?: 'delivery' | 'retirada' },
    itens: OrderItem[],
    observacao?: string
  ) => Order;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  resetDatabase: () => void;
  resetToSeedData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  LOJAS: 'pizzaria_lojas_v1',
  CURRENT_LOJA: 'pizzaria_curr_loja_v1',
  USERS: 'pizzaria_users_v1',
  CURRENT_USER: 'pizzaria_curr_user_v1',
  TABLES: 'pizzaria_tables_v1',
  CATEGORIES: 'pizzaria_categories_v1',
  PRODUCTS: 'pizzaria_products_v1',
  INGREDIENTS: 'pizzaria_ingredients_v1',
  ORDERS: 'pizzaria_orders_v1',
  COMANDAS: 'pizzaria_comandas_v1',
  CASH: 'pizzaria_cash_v1',
  NOTIFICATIONS: 'pizzaria_notifs_v1',
  AUDIO: 'pizzaria_audio_v1',
  DARK_MODE: 'pizzaria_dark_mode_v1',
  SIZES: 'pizzaria_sizes_v1',
  CRUSTS: 'pizzaria_crusts_v1',
  DOUGHS: 'pizzaria_doughs_v1',
  ADDONS: 'pizzaria_addons_v1',
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lojas, setLojas] = useState<Loja[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOJAS);
      return saved ? JSON.parse(saved) : INITIAL_LOJAS;
    } catch {
      return INITIAL_LOJAS;
    }
  });

  const [currentLojaId, setCurrentLojaIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_LOJA);
      if (saved) return saved;
    } catch {}
    return INITIAL_LOJAS[0].id; // 'loja_centro'
  });

  const setCurrentLojaId = (id: string) => {
    setCurrentLojaIdState(id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_LOJA, id);
  };

  const currentLoja = useMemo(() => {
    return lojas.find((l) => l.id === currentLojaId) || lojas[0];
  }, [lojas, currentLojaId]);

  // Load initial state safely from localStorage
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_USERS[0]; // João Silva (Garçom)
  });

  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
    } catch {
      return INITIAL_INGREDIENTS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [comandas, setComandas] = useState<Comanda[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMANDAS);
      return saved ? JSON.parse(saved) : INITIAL_COMANDAS;
    } catch {
      return INITIAL_COMANDAS;
    }
  });

  const [cashRegister, setCashRegister] = useState<CashRegister>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASH);
      return saved ? JSON.parse(saved) : INITIAL_CASH_REGISTER;
    } catch {
      return INITIAL_CASH_REGISTER;
    }
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [
        {
          id: 'notif_init_1',
          tipo: 'novo_pedido',
          titulo: 'Sistema pronto',
          mensagem: 'Sistema de comandas inicializado com sucesso.',
          data: new Date().toISOString(),
          lida: false,
        },
      ];
    } catch {
      return [];
    }
  });

  const [audioEnabled, setAudioEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIO);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setAudioEnabled = (val: boolean) => {
    setAudioEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.AUDIO, JSON.stringify(val));
  };

  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const setDarkMode = (val: boolean) => {
    setIsDarkModeState(val);
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(val));
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Customization Options States
  const [pizzaSizes, setPizzaSizes] = useState<PizzaSizeOption[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIZES);
      return saved ? JSON.parse(saved) : PIZZA_SIZES;
    } catch {
      return PIZZA_SIZES;
    }
  });

  const [pizzaCrusts, setPizzaCrusts] = useState<PizzaCrustOption[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CRUSTS);
      return saved ? JSON.parse(saved) : PIZZA_CRUSTS;
    } catch {
      return PIZZA_CRUSTS;
    }
  });

  const [pizzaDoughs, setPizzaDoughs] = useState<PizzaDoughOption[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOUGHS);
      return saved ? JSON.parse(saved) : PIZZA_DOUGHS;
    } catch {
      return PIZZA_DOUGHS;
    }
  });

  const [pizzaAddons, setPizzaAddons] = useState<PizzaAddonOption[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADDONS);
      return saved ? JSON.parse(saved) : PIZZA_ADDONS;
    } catch {
      return PIZZA_ADDONS;
    }
  });

  // Sync state to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIZES, JSON.stringify(pizzaSizes));
  }, [pizzaSizes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CRUSTS, JSON.stringify(pizzaCrusts));
  }, [pizzaCrusts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOUGHS, JSON.stringify(pizzaDoughs));
  }, [pizzaDoughs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(pizzaAddons));
  }, [pizzaAddons]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(comandas));
  }, [comandas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(cashRegister));
  }, [cashRegister]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOJAS, JSON.stringify(lojas));
  }, [lojas]);

  // Listen to cross-tab storage changes for lojas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.LOJAS && e.newValue) {
        try {
          setLojas(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Real-time synchronization across browser tabs using BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('pizzaria_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'SYNC') {
            const data = event.data.payload;
            if (data.lojas) setLojas(data.lojas);
            if (data.tables) setTables(data.tables);
            if (data.orders) setOrders(data.orders);
            if (data.comandas) setComandas(data.comandas);
            if (data.cashRegister) setCashRegister(data.cashRegister);
            if (data.notifications) setNotifications(data.notifications);
            if (data.products) setProducts(data.products);
            if (data.ingredients) setIngredients(data.ingredients);
          } else if (event.data?.type === 'PLAY_SOUND') {
            if (audioEnabled) {
              if (event.data.sound === 'kitchen') playKitchenBell();
              if (event.data.sound === 'ready') playReadyDing();
              if (event.data.sound === 'cash') playCashChime();
            }
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    return () => {
      channel?.close();
    };
  }, [audioEnabled]);

  // Real-time Cloud Firestore synchronization (Firebase: atendeja-83ef5)
  useEffect(() => {
    // Seed initial collections in Firestore if cloud database is empty
    seedInitialFirestoreIfEmpty(INITIAL_LOJAS, INITIAL_TABLES, INITIAL_PRODUCTS, INITIAL_CATEGORIES);

    // 1. Escuta Lojas da nuvem em tempo real
    const unsubLojas = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.LOJAS),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLojas = snapshot.docs.map((d) => d.data() as Loja);
          setLojas(remoteLojas);
        }
      },
      (err) => console.warn('[Firestore Lojas Error]:', err.message)
    );

    // 2. Escuta Mesas da nuvem em tempo real
    const unsubTables = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.TABLES),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteTables = snapshot.docs
            .map((d) => d.data() as Table)
            .sort((a, b) => a.numero - b.numero);
          setTables(remoteTables);
        }
      },
      (err) => console.warn('[Firestore Mesas Error]:', err.message)
    );

    // 3. Escuta Comandas da nuvem em tempo real
    const unsubComandas = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.COMANDAS),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteComandas = snapshot.docs.map((d) => d.data() as Comanda);
          setComandas(remoteComandas);
        }
      },
      (err) => console.warn('[Firestore Comandas Error]:', err.message)
    );

    // 4. Escuta Pedidos da nuvem em tempo real
    const unsubOrders = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.ORDERS),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteOrders = snapshot.docs.map((d) => d.data() as Order);
          setOrders(remoteOrders);
        }
      },
      (err) => console.warn('[Firestore Pedidos Error]:', err.message)
    );

    return () => {
      unsubLojas();
      unsubTables();
      unsubComandas();
      unsubOrders();
    };
  }, []);

  const broadcastSync = (override?: Record<string, unknown>) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('pizzaria_channel');
        channel.postMessage({
          type: 'SYNC',
          payload: {
            tables,
            orders,
            comandas,
            cashRegister,
            notifications,
            products,
            ingredients,
            ...override,
          },
        });
        channel.close();
      }
    } catch {
      // ignore
    }
  };

  const broadcastSound = (sound: 'kitchen' | 'ready' | 'cash') => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('pizzaria_channel');
        channel.postMessage({ type: 'PLAY_SOUND', sound });
        channel.close();
      }
    } catch {
      // ignore
    }
  };

  // Auth operations
  const login = (usuario: string, senha: string): boolean => {
    const found = users.find((u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase() && u.senha === senha && u.ativo);
    if (found) {
      setCurrentUser(found);
      if (found.loja_id) {
        setCurrentLojaId(found.loja_id);
      }
      return true;
    }
    return false;
  };

  const loginWithPin = (pin: string): boolean => {
    const found = users.find((u) => u.pin === pin && u.ativo);
    if (found) {
      setCurrentUser(found);
      if (found.loja_id) {
        setCurrentLojaId(found.loja_id);
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    // defaults to first user or keep logged in for seamless demo
    const defaultUser = users.find((u) => u.perfil === 'garcom') || users[0];
    setCurrentUser(defaultUser);
  };

  const switchRole = (role: UserRole) => {
    const userForRole = users.find((u) => u.perfil === role && u.ativo) || {
      id: `quick_${role}`,
      nome: `Operador ${role.toUpperCase()}`,
      usuario: role,
      senha: '123',
      perfil: role,
      ativo: true,
      avatar: role === 'garcom' ? '👨‍🍳' : role === 'cozinha' ? '🍳' : role === 'caixa' ? '💰' : '👨‍💼',
    };
    setCurrentUser(userForRole);
    if (userForRole.loja_id) {
      setCurrentLojaId(userForRole.loja_id);
    }
  };

  const setCurrentUserById = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      if (found.loja_id) setCurrentLojaId(found.loja_id);
    }
  };

  // Comanda and Order actions
  const openComanda = useCallback((mesaId: string, garcomId: string, garcomNome: string, clienteNome?: string): Comanda => {
    const targetTable = tables.find((t) => t.id === mesaId);
    if (!targetTable) throw new Error('Mesa não encontrada');

    const comandaNum = generateComandaNumber(comandas.length);
    const activeLojaId = targetTable.loja_id || (currentLojaId === 'todas' ? 'loja_centro' : currentLojaId);
    const cleanClienteNome = clienteNome?.trim() || undefined;

    const newComanda: Comanda = {
      id: `cmd_${Date.now()}`,
      loja_id: activeLojaId,
      numero: comandaNum,
      mesa_id: mesaId,
      mesa_numero: targetTable.numero,
      garcom_id: garcomId,
      garcom_nome: garcomNome,
      cliente_nome: cleanClienteNome,
      status: 'aberta',
      abertura: new Date().toISOString(),
      subtotal: 0,
      desconto: 0,
      taxa_servico: 0,
      total: 0,
      pedidos_ids: [],
      pagamentos: [],
    };

    const updatedTables = tables.map((t) =>
      t.id === mesaId
        ? {
            ...t,
            status: 'ocupada' as const,
            garcom_atual_id: garcomId,
            garcom_atual_nome: garcomNome,
            comanda_atual_id: newComanda.id,
            comanda_atual_numero: newComanda.numero,
            cliente_atual_nome: cleanClienteNome,
          }
        : t
    );

    const updatedComandas = [newComanda, ...comandas];
    setTables(updatedTables);
    setComandas(updatedComandas);
    saveComandaToFirestore(newComanda);
    const targetTbl = updatedTables.find((t) => t.id === mesaId);
    if (targetTbl) saveTableToFirestore(targetTbl);
    broadcastSync({ tables: updatedTables, comandas: updatedComandas });
    return newComanda;
  }, [tables, comandas, currentLojaId]);

  const addOrderToComanda = (comandaId: string, itens: OrderItem[], observacao?: string): Order => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) throw new Error('Comanda não encontrada');

    const nextOrderId = orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 184;
    const nowIso = new Date().toISOString();
    const activeLojaId = comanda.loja_id || (currentLojaId === 'todas' ? 'loja_centro' : currentLojaId);

    const preparedItens: OrderItem[] = itens.map((item, idx) => ({
      ...item,
      id: `item_${nextOrderId}_${idx + 1}`,
      pedido_id: nextOrderId,
      status: 'ativo' as const,
    }));

    const newOrder: Order = {
      id: nextOrderId,
      loja_id: activeLojaId,
      comanda_id: comandaId,
      mesa_id: comanda.mesa_id,
      mesa_numero: comanda.mesa_numero,
      garcom_id: comanda.garcom_id,
      garcom_nome: comanda.garcom_nome,
      status: 'novo',
      observacao: observacao || '',
      criado_em: nowIso,
      itens: preparedItens,
    };

    const orderSubtotal = preparedItens.reduce((acc, curr) => acc + curr.preco_total, 0);
    const newSubtotal = comanda.subtotal + orderSubtotal;
    const newTotal = Math.max(0, newSubtotal - comanda.desconto + comanda.taxa_servico);

    const updatedComandas = comandas.map((c) =>
      c.id === comandaId
        ? {
            ...c,
            subtotal: newSubtotal,
            total: newTotal,
            pedidos_ids: [...c.pedidos_ids, nextOrderId],
          }
        : c
    );

    const updatedOrders = [newOrder, ...orders];

    const newNotif: SystemNotification = {
      id: `notif_${Date.now()}`,
      tipo: 'novo_pedido',
      titulo: `Novo Pedido #${nextOrderId}`,
      mensagem: `Mesa ${comanda.mesa_numero} enviou ${preparedItens.length} itens para a cozinha.`,
      data: nowIso,
      lida: false,
      mesa_numero: comanda.mesa_numero,
      pedido_id: nextOrderId,
    };

    const updatedNotifs = [newNotif, ...notifications];

    setOrders(updatedOrders);
    setComandas(updatedComandas);
    setNotifications(updatedNotifs);
    saveOrderToFirestore(newOrder);
    const updatedCmd = updatedComandas.find((c) => c.id === comandaId);
    if (updatedCmd) saveComandaToFirestore(updatedCmd);

    if (audioEnabled) {
      playKitchenBell();
    }
    broadcastSound('kitchen');
    broadcastSync({ orders: updatedOrders, comandas: updatedComandas, notifications: updatedNotifs });

    return newOrder;
  };

  const updateOrderStatus = (orderId: number, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const nowIso = new Date().toISOString();
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          tempo_preparo_inicio: newStatus === 'em_preparo' ? (o.tempo_preparo_inicio || nowIso) : o.tempo_preparo_inicio,
          pronto_em: newStatus === 'pronto' ? nowIso : o.pronto_em,
          a_caminho_em: newStatus === 'a_caminho' ? nowIso : o.a_caminho_em,
          entregue_em: newStatus === 'entregue' ? nowIso : o.entregue_em,
        };
      }
      return o;
    });

    let updatedNotifs = notifications;
    if (newStatus === 'pronto') {
      const notif: SystemNotification = {
        id: `notif_${Date.now()}`,
        tipo: 'pedido_pronto',
        titulo: `🔔 Pedido #${orderId} está pronto!`,
        mensagem: order.mesa_numero ? `Mesa ${order.mesa_numero} — Pedido pronto para entrega.` : `Delivery #${orderId} pronto para despacho.`,
        data: nowIso,
        lida: false,
        mesa_numero: order.mesa_numero,
        pedido_id: orderId,
      };
      updatedNotifs = [notif, ...notifications];
      if (audioEnabled) playReadyDing();
      broadcastSound('ready');
    } else if (newStatus === 'a_caminho') {
      const notif: SystemNotification = {
        id: `notif_${Date.now()}`,
        tipo: 'pedido_novo',
        titulo: `🛵 Pedido #${orderId} a caminho!`,
        mensagem: `${order.cliente_nome ? `Cliente: ${order.cliente_nome} — ` : ''}Saiu para entrega.`,
        data: nowIso,
        lida: false,
        pedido_id: orderId,
      };
      updatedNotifs = [notif, ...notifications];
      broadcastSound('kitchen');
    }

    setOrders(updatedOrders);
    setNotifications(updatedNotifs);
    const targetOrder = updatedOrders.find((o) => o.id === orderId);
    if (targetOrder) saveOrderToFirestore(targetOrder);
    broadcastSync({ orders: updatedOrders, notifications: updatedNotifs });
  };

  const cancelOrderItem = (comandaId: string, orderId: number, itemId: string, motivo: string) => {
    let itemPriceToDeduct = 0;
    const nowIso = new Date().toISOString();

    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        const updatedItens = order.itens.map((item) => {
          if (item.id === itemId && item.status === 'ativo') {
            itemPriceToDeduct = item.preco_total;
            return {
              ...item,
              status: 'cancelado' as const,
              cancelamento: {
                motivo,
                usuario_nome: currentUser.nome,
                data: nowIso,
              },
            };
          }
          return item;
        });

        // Check if all items in order are cancelled
        const allCancelled = updatedItens.every((it) => it.status === 'cancelado');
        return {
          ...order,
          itens: updatedItens,
          status: allCancelled ? ('cancelado' as const) : order.status,
        };
      }
      return order;
    });

    const updatedComandas = comandas.map((c) => {
      if (c.id === comandaId) {
        const newSubtotal = Math.max(0, c.subtotal - itemPriceToDeduct);
        const newTotal = Math.max(0, newSubtotal - c.desconto + c.taxa_servico);
        return {
          ...c,
          subtotal: newSubtotal,
          total: newTotal,
        };
      }
      return c;
    });

    setOrders(updatedOrders);
    setComandas(updatedComandas);
    const targetOrder = updatedOrders.find((o) => o.id === orderId);
    if (targetOrder) saveOrderToFirestore(targetOrder);
    const targetCmd = updatedComandas.find((c) => c.id === comandaId);
    if (targetCmd) saveComandaToFirestore(targetCmd);
    broadcastSync({ orders: updatedOrders, comandas: updatedComandas });
  };

  const transferTable = (fromMesaId: string, toMesaId: string): boolean => {
    const fromTable = tables.find((t) => t.id === fromMesaId);
    const toTable = tables.find((t) => t.id === toMesaId);
    if (!fromTable || !toTable) return false;
    if (toTable.status !== 'livre') return false;
    if (!fromTable.comanda_atual_id) return false;

    const comandaId = fromTable.comanda_atual_id;

    // Update comanda's mesa reference
    const updatedComandas = comandas.map((c) =>
      c.id === comandaId
        ? {
            ...c,
            mesa_id: toMesaId,
            mesa_numero: toTable.numero,
          }
        : c
    );

    // Update all associated orders' mesa reference
    const updatedOrders = orders.map((o) =>
      o.comanda_id === comandaId
        ? {
            ...o,
            mesa_id: toMesaId,
            mesa_numero: toTable.numero,
          }
        : o
    );

    // Update table statuses
    const updatedTables = tables.map((t) => {
      if (t.id === fromMesaId) {
        return {
          ...t,
          status: 'livre' as const,
          garcom_atual_id: undefined,
          garcom_atual_nome: undefined,
          comanda_atual_id: undefined,
          comanda_atual_numero: undefined,
        };
      }
      if (t.id === toMesaId) {
        return {
          ...t,
          status: fromTable.status,
          garcom_atual_id: fromTable.garcom_atual_id,
          garcom_atual_nome: fromTable.garcom_atual_nome,
          comanda_atual_id: fromTable.comanda_atual_id,
          comanda_atual_numero: fromTable.comanda_atual_numero,
        };
      }
      return t;
    });

    setTables(updatedTables);
    setComandas(updatedComandas);
    setOrders(updatedOrders);
    const transferredCmd = updatedComandas.find((c) => c.id === comandaId);
    if (transferredCmd) saveComandaToFirestore(transferredCmd);
    updatedTables.filter((t) => t.id === fromMesaId || t.id === toMesaId).forEach(saveTableToFirestore);
    broadcastSync({ tables: updatedTables, comandas: updatedComandas, orders: updatedOrders });
    return true;
  };

  const requestBill = (comandaId: string) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    const updatedTables = tables.map((t) =>
      t.id === comanda.mesa_id
        ? {
            ...t,
            status: 'aguardando_fechamento' as const,
          }
        : t
    );

    setTables(updatedTables);
    const targetTbl = updatedTables.find((t) => t.id === comanda.mesa_id);
    if (targetTbl) saveTableToFirestore(targetTbl);
    broadcastSync({ tables: updatedTables });
  };

  const applyDiscount = (comandaId: string, valor: number, motivo: string) => {
    const updatedComandas = comandas.map((c) => {
      if (c.id === comandaId) {
        const safeDiscount = Math.max(0, Math.min(valor, c.subtotal));
        const newTotal = Math.max(0, c.subtotal - safeDiscount + c.taxa_servico);
        return {
          ...c,
          desconto: safeDiscount,
          motivo_desconto:
            safeDiscount > 0
              ? `${motivo || 'Desconto Concedido'} (Autorizado por: ${currentUser.nome})`
              : undefined,
          total: newTotal,
        };
      }
      return c;
    });

    setComandas(updatedComandas);
    const targetCmd = updatedComandas.find((c) => c.id === comandaId);
    if (targetCmd) saveComandaToFirestore(targetCmd);
    broadcastSync({ comandas: updatedComandas });
  };

  const registerPayment = (
    comandaId: string,
    forma_pagamento: PaymentMethod,
    valor: number,
    troco_para?: number,
    pagador_nome?: string,
    itens_pagos_ids?: string[]
  ) => {
    const troco = troco_para && troco_para > valor ? troco_para - valor : 0;
    const payment = {
      id: `pay_${Date.now()}`,
      comanda_id: comandaId,
      forma_pagamento,
      valor,
      troco_para,
      troco,
      criado_em: new Date().toISOString(),
      usuario_id: currentUser.id,
      usuario_nome: currentUser.nome,
      pagador_nome,
      itens_pagos_ids,
    };

    const updatedComandas = comandas.map((c) =>
      c.id === comandaId
        ? {
            ...c,
            pagamentos: [...c.pagamentos, payment],
          }
        : c
    );

    setComandas(updatedComandas);
    const targetCmd = updatedComandas.find((c) => c.id === comandaId);
    if (targetCmd) saveComandaToFirestore(targetCmd);
    broadcastSync({ comandas: updatedComandas });
  };

  const closeComanda = (comandaId: string) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    const updatedComandas = comandas.map((c) =>
      c.id === comandaId
        ? {
            ...c,
            status: 'fechada' as const,
            fechamento: new Date().toISOString(),
          }
        : c
    );

    // Release table
    const updatedTables = tables.map((t) =>
      t.id === comanda.mesa_id
        ? {
            ...t,
            status: 'livre' as const,
            garcom_atual_id: undefined,
            garcom_atual_nome: undefined,
            comanda_atual_id: undefined,
            comanda_atual_numero: undefined,
          }
        : t
    );

    setComandas(updatedComandas);
    setTables(updatedTables);
    const closedCmd = updatedComandas.find((c) => c.id === comandaId);
    if (closedCmd) saveComandaToFirestore(closedCmd);
    const releasedTbl = updatedTables.find((t) => t.id === comanda.mesa_id);
    if (releasedTbl) saveTableToFirestore(releasedTbl);

    if (audioEnabled) {
      playCashChime();
    }
    broadcastSound('cash');
    broadcastSync({ comandas: updatedComandas, tables: updatedTables });
  };

  // Cash Register actions
  const openCashRegister = (valorInicial: number) => {
    const newRegister: CashRegister = {
      id: `caixa_${Date.now()}`,
      status: 'aberto',
      usuario_abertura_id: currentUser.id,
      usuario_abertura_nome: currentUser.nome,
      data_abertura: new Date().toISOString(),
      valor_inicial: valorInicial,
      entradas: [],
    };
    setCashRegister(newRegister);
    broadcastSync({ cashRegister: newRegister });
  };

  const closeCashRegister = (valorFinal: number, observacoes?: string) => {
    const updatedRegister: CashRegister = {
      ...cashRegister,
      status: 'fechado',
      data_fechamento: new Date().toISOString(),
      usuario_fechamento_nome: currentUser.nome,
      valor_final: valorFinal,
      observacoes,
    };
    setCashRegister(updatedRegister);
    broadcastSync({ cashRegister: updatedRegister });
  };

  const addCashEntry = (tipo: 'suprimento' | 'sangria', motivo: string, valor: number) => {
    const entry = {
      id: `entry_${Date.now()}`,
      tipo,
      motivo,
      valor,
      data: new Date().toISOString(),
      usuario_nome: currentUser.nome,
    };
    const updatedRegister: CashRegister = {
      ...cashRegister,
      entradas: [...cashRegister.entradas, entry],
    };
    setCashRegister(updatedRegister);
    broadcastSync({ cashRegister: updatedRegister });
  };

  // Products
  const addProduct = (prod: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...prod,
      id: `prod_${Date.now()}`,
      loja_id: prod.loja_id || (currentLojaId === 'todas' ? 'loja_centro' : currentLojaId),
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    broadcastSync({ products: updated });
  };

  const updateProduct = (prod: Product) => {
    const updated = products.map((p) => (p.id === prod.id ? prod : p));
    setProducts(updated);
    broadcastSync({ products: updated });
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    broadcastSync({ products: updated });
  };

  // Ingredients / Stock Management
  const updateIngredientStock = (id: string, novaQuantidade: number, motivo?: string) => {
    const safeQty = Math.max(0, Math.round((Number(novaQuantidade) || 0) * 100) / 100);
    const updated = ingredients.map((ing) => {
      if (ing.id === id) {
        return {
          ...ing,
          quantidade: safeQty,
          ultima_atualizacao: new Date().toISOString(),
          atualizado_por: currentUser.nome,
          observacao: motivo ? `${motivo} (em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})` : ing.observacao,
        };
      }
      return ing;
    });
    setIngredients(updated);
    broadcastSync({ ingredients: updated });
  };

  const adjustIngredientStock = (id: string, delta: number, motivo?: string) => {
    const updated = ingredients.map((ing) => {
      if (ing.id === id) {
        const novaQtd = Math.max(0, Math.round((ing.quantidade + delta) * 100) / 100);
        return {
          ...ing,
          quantidade: novaQtd,
          ultima_atualizacao: new Date().toISOString(),
          atualizado_por: currentUser.nome,
          observacao: motivo ? `${motivo} (em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})` : ing.observacao,
        };
      }
      return ing;
    });
    setIngredients(updated);
    broadcastSync({ ingredients: updated });
  };

  const addIngredient = (data: Omit<Ingredient, 'id' | 'ultima_atualizacao'>) => {
    const newIngredient: Ingredient = {
      ...data,
      id: `ing_${Date.now()}`,
      loja_id: data.loja_id || (currentLojaId === 'todas' ? 'loja_centro' : currentLojaId),
      quantidade: Math.max(0, Math.round((Number(data.quantidade) || 0) * 100) / 100),
      estoque_minimo: Number(data.estoque_minimo) || 10,
      ultima_atualizacao: new Date().toISOString(),
      atualizado_por: currentUser.nome,
    };
    const updated = [newIngredient, ...ingredients];
    setIngredients(updated);
    broadcastSync({ ingredients: updated });
  };

  const updateIngredient = (updatedIng: Ingredient) => {
    const updated = ingredients.map((ing) =>
      ing.id === updatedIng.id
        ? {
            ...updatedIng,
            quantidade: Math.max(0, Math.round((Number(updatedIng.quantidade) || 0) * 100) / 100),
            estoque_minimo: Number(updatedIng.estoque_minimo) || 10,
            ultima_atualizacao: new Date().toISOString(),
            atualizado_por: currentUser.nome,
          }
        : ing
    );
    setIngredients(updated);
    broadcastSync({ ingredients: updated });
  };

  const deleteIngredient = (id: string) => {
    const updated = ingredients.filter((ing) => ing.id !== id);
    setIngredients(updated);
    broadcastSync({ ingredients: updated });
  };

  const batchRestockIngredients = (items: { id: string; delta: number }[]) => {
    const mapDeltas = new Map(items.map((i) => [i.id, i.delta]));
    const updated = ingredients.map((ing) => {
      const delta = mapDeltas.get(ing.id);
      if (delta !== undefined) {
        return {
          ...ing,
          quantidade: Math.max(0, Math.round((ing.quantidade + delta) * 100) / 100),
          ultima_atualizacao: new Date().toISOString(),
          atualizado_por: currentUser.nome,
        };
      }
      return ing;
    });
    setIngredients(updated);
    broadcastSync({ ingredients: updated });
  };

  // Tables
  const addTable = (numero: number, capacidade: number, localizacao: string) => {
    const newTable: Table = {
      id: `mesa_${numero.toString().padStart(2, '0')}`,
      loja_id: currentLojaId === 'todas' ? 'loja_centro' : currentLojaId,
      numero,
      capacidade,
      status: 'livre',
      localizacao,
    };
    const updated = [...tables, newTable].sort((a, b) => a.numero - b.numero);
    setTables(updated);
    broadcastSync({ tables: updated });
  };

  const updateTable = (table: Table) => {
    const updated = tables.map((t) => (t.id === table.id ? table : t));
    setTables(updated);
    saveTableToFirestore(table);
    broadcastSync({ tables: updated });
  };

  const deleteTable = (id: string) => {
    const updated = tables.filter((t) => t.id !== id);
    setTables(updated);
    broadcastSync({ tables: updated });
  };

  const updateLoja = (updatedLoja: Loja) => {
    const updated = lojas.map((l) => (l.id === updatedLoja.id ? updatedLoja : l));
    setLojas(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.LOJAS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving lojas to localStorage:', e);
    }
    saveLojaToFirestore(updatedLoja);
    broadcastSync({ lojas: updated });
  };

  // Users
  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      loja_id: userData.loja_id || (currentLojaId === 'todas' ? undefined : currentLojaId),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    broadcastSync();
  };

  const updateUser = (updatedUser: User) => {
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const deleteUser = (id: string) => {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    broadcastSync({ users: updated });
  };

  const addTaxaBairro = (lojaId: string, bairro: string, valor: number) => {
    const targetLoja = lojas.find((l) => l.id === lojaId);
    if (!targetLoja) return;
    const currentTaxas = targetLoja.taxas_bairro || [];
    const newTaxa = {
      id: `tb_${Date.now()}`,
      bairro: bairro.trim(),
      valor: Math.max(0, valor),
    };
    const updatedLoja = {
      ...targetLoja,
      taxas_bairro: [...currentTaxas, newTaxa],
    };
    updateLoja(updatedLoja);
  };

  const deleteTaxaBairro = (lojaId: string, taxaId: string) => {
    const targetLoja = lojas.find((l) => l.id === lojaId);
    if (!targetLoja) return;
    const currentTaxas = targetLoja.taxas_bairro || [];
    const updatedLoja = {
      ...targetLoja,
      taxas_bairro: currentTaxas.filter((t) => t.id !== taxaId),
    };
    updateLoja(updatedLoja);
  };

  const createStoreWithAdmin = (
    lojaData: { nome: string; slug: string; endereco?: string; telefone?: string; taxa_entrega?: number },
    adminData: { nome: string; usuario: string; senha?: string; pin: string }
  ) => {
    const lojaId = `loja_${Date.now()}`;
    const adminId = `user_admin_${Date.now()}`;

    const newAdmin: User = {
      id: adminId,
      loja_id: lojaId,
      nome: adminData.nome,
      usuario: adminData.usuario,
      senha: adminData.senha || '123',
      pin: adminData.pin,
      perfil: 'admin',
      ativo: true,
      avatar: '👨‍💼',
    };

    const newLoja: Loja = {
      id: lojaId,
      slug: lojaData.slug.toLowerCase().replace(/\s+/g, '-'),
      nome: lojaData.nome,
      endereco: lojaData.endereco || 'Endereço da Filial',
      telefone: lojaData.telefone || '(11) 3333-0000',
      ativa: true,
      taxa_entrega: Number(lojaData.taxa_entrega) || 7.0,
      tempo_estimado_entrega: '30 - 45 min',
      horario_funcionamento: '18:00 às 23:30',
      admin_usuario_id: adminId,
    };

    const updatedLojas = [...lojas, newLoja];
    const updatedUsers = [...users, newAdmin];

    setLojas(updatedLojas);
    setUsers(updatedUsers);
    broadcastSync({ lojas: updatedLojas, users: updatedUsers });
  };

  const createDeliveryOrder = (
    lojaId: string,
    clienteInfo: { nome: string; telefone: string; endereco: string; formaPagamento: string; trocoPara?: number; tipoPedido?: 'delivery' | 'retirada' },
    itens: OrderItem[],
    observacao?: string
  ): Order => {
    const nextOrderId = orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 184;
    const nowIso = new Date().toISOString();
    const targetLoja = lojas.find((l) => l.id === lojaId) || lojas[0];
    const isRetirada = clienteInfo.tipoPedido === 'retirada';
    const finalTaxaEntrega = isRetirada ? 0 : (targetLoja.taxa_entrega || 0);

    const preparedItens: OrderItem[] = itens.map((item, idx) => ({
      ...item,
      id: `item_deliv_${nextOrderId}_${idx + 1}`,
      pedido_id: nextOrderId,
      status: 'ativo' as const,
    }));

    const newOrder: Order = {
      id: nextOrderId,
      loja_id: lojaId,
      status: 'novo',
      observacao: observacao || '',
      criado_em: nowIso,
      itens: preparedItens,
      tipo_pedido: isRetirada ? 'retirada' : 'delivery',
      cliente_nome: clienteInfo.nome,
      cliente_telefone: clienteInfo.telefone,
      cliente_endereco: isRetirada ? `Retirada no Balcão — ${targetLoja.nome}` : clienteInfo.endereco,
      forma_pagamento: clienteInfo.formaPagamento,
      troco_para: clienteInfo.trocoPara,
      taxa_entrega: finalTaxaEntrega,
    };

    const updatedOrders = [newOrder, ...orders];

    const newNotif: SystemNotification = {
      id: `notif_${Date.now()}`,
      loja_id: lojaId,
      tipo: 'novo_pedido',
      titulo: isRetirada ? `🛍️ Pedido Retirada Balcão #${nextOrderId}` : `🛵 Pedido Delivery #${nextOrderId}`,
      mensagem: `Cliente: ${clienteInfo.nome} (${clienteInfo.telefone}) — Total: R$ ${(
        preparedItens.reduce((a, c) => a + c.preco_total, 0) + finalTaxaEntrega
      ).toFixed(2)}`,
      data: nowIso,
      lida: false,
      pedido_id: nextOrderId,
    };

    const updatedNotifs = [newNotif, ...notifications];

    setOrders(updatedOrders);
    setNotifications(updatedNotifs);
    saveOrderToFirestore(newOrder);

    if (audioEnabled) {
      playKitchenBell();
    }
    broadcastSound('kitchen');
    broadcastSync({ orders: updatedOrders, notifications: updatedNotifs });

    return newOrder;
  };

  const toggleUserStatus = (id: string) => {
    const updated = users.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u));
    setUsers(updated);
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, lida: true } : n));
    setNotifications(updated);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Option CRUD Methods
  const addPizzaSize = (sizeData: Omit<PizzaSizeOption, 'id'>) => {
    const newSize: PizzaSizeOption = {
      ...sizeData,
      id: `sz_${Date.now()}`,
    };
    const updated = [...pizzaSizes, newSize];
    setPizzaSizes(updated);
    broadcastSync();
  };

  const updatePizzaSize = (size: PizzaSizeOption) => {
    const updated = pizzaSizes.map((s) => (s.id === size.id ? size : s));
    setPizzaSizes(updated);
    broadcastSync();
  };

  const deletePizzaSize = (id: string) => {
    const updated = pizzaSizes.filter((s) => s.id !== id);
    setPizzaSizes(updated);
    broadcastSync();
  };

  const addPizzaCrust = (crustData: Omit<PizzaCrustOption, 'id'>) => {
    const newCrust: PizzaCrustOption = {
      ...crustData,
      id: `crust_${Date.now()}`,
    };
    const updated = [...pizzaCrusts, newCrust];
    setPizzaCrusts(updated);
    broadcastSync();
  };

  const updatePizzaCrust = (crust: PizzaCrustOption) => {
    const updated = pizzaCrusts.map((c) => (c.id === crust.id ? crust : c));
    setPizzaCrusts(updated);
    broadcastSync();
  };

  const deletePizzaCrust = (id: string) => {
    const updated = pizzaCrusts.filter((c) => c.id !== id);
    setPizzaCrusts(updated);
    broadcastSync();
  };

  const addPizzaDough = (doughData: Omit<PizzaDoughOption, 'id'>) => {
    const newDough: PizzaDoughOption = {
      ...doughData,
      id: `dough_${Date.now()}`,
    };
    const updated = [...pizzaDoughs, newDough];
    setPizzaDoughs(updated);
    broadcastSync();
  };

  const updatePizzaDough = (dough: PizzaDoughOption) => {
    const updated = pizzaDoughs.map((d) => (d.id === dough.id ? dough : d));
    setPizzaDoughs(updated);
    broadcastSync();
  };

  const deletePizzaDough = (id: string) => {
    const updated = pizzaDoughs.filter((d) => d.id !== id);
    setPizzaDoughs(updated);
    broadcastSync();
  };

  const addPizzaAddon = (addonData: Omit<PizzaAddonOption, 'id'>) => {
    const newAddon: PizzaAddonOption = {
      ...addonData,
      id: `addon_${Date.now()}`,
    };
    const updated = [...pizzaAddons, newAddon];
    setPizzaAddons(updated);
    broadcastSync();
  };

  const updatePizzaAddon = (addon: PizzaAddonOption) => {
    const updated = pizzaAddons.map((a) => (a.id === addon.id ? addon : a));
    setPizzaAddons(updated);
    broadcastSync();
  };

  const deletePizzaAddon = (id: string) => {
    const updated = pizzaAddons.filter((a) => a.id !== id);
    setPizzaAddons(updated);
    broadcastSync();
  };

  const resetDatabase = () => {
    localStorage.clear();
    setLojas(INITIAL_LOJAS);
    setCurrentLojaIdState(INITIAL_LOJAS[0].id);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setTables(INITIAL_TABLES);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setIngredients(INITIAL_INGREDIENTS);
    setOrders(INITIAL_ORDERS);
    setComandas(INITIAL_COMANDAS);
    setCashRegister(INITIAL_CASH_REGISTER);
    setPizzaSizes(PIZZA_SIZES);
    setPizzaCrusts(PIZZA_CRUSTS);
    setPizzaDoughs(PIZZA_DOUGHS);
    setPizzaAddons(PIZZA_ADDONS);
    setNotifications([]);
  };

  const resetToSeedData = () => {
    resetDatabase();
  };

  // Filtered views based on active store (or all if 'todas')
  const filteredTables = useMemo(() => {
    if (currentLojaId === 'todas') return tables;
    return tables.filter((t) => !t.loja_id || t.loja_id === currentLojaId);
  }, [tables, currentLojaId]);

  const filteredProducts = useMemo(() => {
    if (currentLojaId === 'todas') return products;
    return products.filter((p) => !p.loja_id || p.loja_id === currentLojaId);
  }, [products, currentLojaId]);

  const filteredIngredients = useMemo(() => {
    if (currentLojaId === 'todas') return ingredients;
    return ingredients.filter((i) => !i.loja_id || i.loja_id === currentLojaId);
  }, [ingredients, currentLojaId]);

  const filteredOrders = useMemo(() => {
    if (currentLojaId === 'todas') return orders;
    return orders.filter((o) => !o.loja_id || o.loja_id === currentLojaId);
  }, [orders, currentLojaId]);

  const filteredComandas = useMemo(() => {
    if (currentLojaId === 'todas') return comandas;
    return comandas.filter((c) => !c.loja_id || c.loja_id === currentLojaId);
  }, [comandas, currentLojaId]);

  return (
    <StoreContext.Provider
      value={{
        lojas,
        currentLojaId,
        currentLoja,
        setCurrentLojaId,
        currentUser,
        setCurrentUser,
        users,
        tables: filteredTables,
        categories,
        products: filteredProducts,
        ingredients: filteredIngredients,
        orders: filteredOrders,
        comandas: filteredComandas,
        allTables: tables,
        allProducts: products,
        allIngredients: ingredients,
        allOrders: orders,
        allComandas: comandas,
        cashRegister,
        notifications,
        audioEnabled,
        setAudioEnabled,
        isDarkMode,
        setDarkMode,
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
        login,
        loginWithPin,
        logout,
        switchRole,
        setCurrentUserById,
        openComanda,
        addOrderToComanda,
        updateOrderStatus,
        cancelOrderItem,
        transferTable,
        requestBill,
        applyDiscount,
        registerPayment,
        closeComanda,
        openCashRegister,
        closeCashRegister,
        addCashEntry,
        addProduct,
        updateProduct,
        deleteProduct,
        updateIngredientStock,
        adjustIngredientStock,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        batchRestockIngredients,
        addTable,
        updateTable,
        deleteTable,
        updateLoja,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addTaxaBairro,
        deleteTaxaBairro,
        createStoreWithAdmin,
        createDeliveryOrder,
        markNotificationRead,
        clearNotifications,
        resetDatabase,
        resetToSeedData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
