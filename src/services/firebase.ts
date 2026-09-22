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
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Loja, Table, Comanda, Order, Product, Category, LoginAttempt } from '../types';

// Web app's Firebase configuration obtido de variáveis de ambiente (.env)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

if (!firebaseConfig.apiKey) {
  console.error('[Firebase] VITE_FIREBASE_API_KEY não definida. Copie .env.example para .env e preencha as variáveis.');
}

// Initialize Firebase App (evita duplicar instância em HMR/reloads)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Helpers para Firebase Auth (preparação para transição segura)
export const loginWithFirebaseAuth = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logoutWithFirebaseAuth = () => {
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

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
