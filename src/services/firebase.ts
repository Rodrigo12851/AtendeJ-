import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Loja, Table, Comanda, Order, Product, Category, LoginAttempt } from '../types';

// Web app's Firebase configuration (Projeto: atendeja-83ef5)
export const firebaseConfig = {
  apiKey: "AIzaSyCS5G9FMPwQtUVl1y02G2UH6jDpFAFHtSw",
  authDomain: "atendeja-83ef5.firebaseapp.com",
  projectId: "atendeja-83ef5",
  storageBucket: "atendeja-83ef5.firebasestorage.app",
  messagingSenderId: "797431584380",
  appId: "1:797431584380:web:795a72daf94b7731075bf9",
  measurementId: "G-G201CD6495"
};

// Initialize Firebase App (evita duplicar instância em HMR/reloads)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Analytics inicializado com verificação de suporte no ambiente
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        getAnalytics(app);
      } catch (e) {
        console.warn('Firebase Analytics error:', e);
      }
    }
  });
}

// Nomes das Coleções no Cloud Firestore
export const FIRESTORE_COLLECTIONS = {
  LOJAS: 'lojas',
  TABLES: 'mesas',
  COMANDAS: 'comandas',
  ORDERS: 'pedidos',
  PRODUCTS: 'produtos',
  CATEGORIES: 'categorias',
  LOGIN_ATTEMPTS: 'tentativas_login',
} as const;

// ==========================================
// HELPERS DE GRAVAÇÃO (COM TRATAMENTO DE ERRO)
// ==========================================

export async function saveLojaToFirestore(loja: Loja): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.LOJAS, loja.id);
    // Remove undefined values para o Firestore aceitar
    const cleanData = JSON.parse(JSON.stringify(loja));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao salvar loja na nuvem:', error);
  }
}

export async function saveTableToFirestore(table: Table): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.TABLES, table.id);
    const cleanData = JSON.parse(JSON.stringify(table));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao salvar mesa na nuvem:', error);
  }
}

export async function saveComandaToFirestore(comanda: Comanda): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.COMANDAS, comanda.id);
    const cleanData = JSON.parse(JSON.stringify(comanda));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao salvar comanda na nuvem:', error);
  }
}

export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.ORDERS, String(order.id));
    const cleanData = JSON.parse(JSON.stringify(order));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao salvar pedido na nuvem:', error);
  }
}

export async function saveLoginAttemptToFirestore(attempt: LoginAttempt): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.LOGIN_ATTEMPTS, attempt.id);
    const cleanData = JSON.parse(JSON.stringify(attempt));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao salvar tentativa de login na nuvem:', error);
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, product.id);
    const cleanData = JSON.parse(JSON.stringify(product));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao salvar produto na nuvem:', error);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('[Firestore] Falha ao excluir produto da nuvem:', error);
  }
}

export async function saveCustomizationsToFirestore(customizations: {
  sizes?: any[];
  crusts?: any[];
  doughs?: any[];
  addons?: any[];
}): Promise<void> {
  try {
    const docRef = doc(db, 'configuracoes', 'customizacoes_pizza');
    const cleanData = JSON.parse(JSON.stringify(customizations));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao salvar customizações de pizza na nuvem:', error);
  }
}

// ==========================================
// SEED INICIAL (Sobe dados padrão se nuvem vazia)
// ==========================================
export async function seedInitialFirestoreIfEmpty(
  initialLojas: Loja[],
  initialTables: Table[],
  initialProducts: Product[],
  initialCategories: Category[]
): Promise<void> {
  try {
    const lojasSnap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.LOJAS));
    if (lojasSnap.empty) {
      console.log('[Firestore] Inicializando coleções na nuvem pela primeira vez...');
      const batch = writeBatch(db);

      for (const loja of initialLojas) {
        batch.set(doc(db, FIRESTORE_COLLECTIONS.LOJAS, loja.id), JSON.parse(JSON.stringify(loja)));
      }
      for (const table of initialTables) {
        batch.set(doc(db, FIRESTORE_COLLECTIONS.TABLES, table.id), JSON.parse(JSON.stringify(table)));
      }
      for (const prod of initialProducts) {
        batch.set(doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, prod.id), JSON.parse(JSON.stringify(prod)));
      }
      for (const cat of initialCategories) {
        batch.set(doc(db, FIRESTORE_COLLECTIONS.CATEGORIES, cat.id), JSON.parse(JSON.stringify(cat)));
      }

      await batch.commit();
      console.log('[Firestore] Dados iniciais enviados com sucesso para o atendeja-83ef5!');
    } else {
      // Se lojas já existem, verificar se produtos precisam ser sincronizados
      const prodSnap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.PRODUCTS));
      if (prodSnap.empty) {
        console.log('[Firestore] Sincronizando catálogo inicial de produtos na nuvem...');
        const batch = writeBatch(db);
        for (const prod of initialProducts) {
          batch.set(doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, prod.id), JSON.parse(JSON.stringify(prod)));
        }
        await batch.commit();
      }
    }
  } catch (error) {
    console.warn('[Firestore] Verificação/Seed inicial falhou (regras de segurança podem estar pendentes no console):', error);
  }
}
