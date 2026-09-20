import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import {
  INITIAL_LOJAS,
  INITIAL_TABLES,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_COMANDAS,
} from '../data/initialData';

const firebaseConfig = {
  apiKey: "AIzaSyCS5G9FMPwQtUVl1y02G2UH6jDpFAFHtSw",
  authDomain: "atendeja-83ef5.firebaseapp.com",
  projectId: "atendeja-83ef5",
  storageBucket: "atendeja-83ef5.firebasestorage.app",
  messagingSenderId: "797431584380",
  appId: "1:797431584380:web:795a72daf94b7731075bf9",
  measurementId: "G-G201CD6495"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runSeed() {
  console.log('Iniciando envio dos dados para o Firestore (atendeja-83ef5)...');

  // 1. Lojas
  console.log(`Enviando ${INITIAL_LOJAS.length} lojas...`);
  for (const loja of INITIAL_LOJAS) {
    await setDoc(doc(db, 'lojas', loja.id), JSON.parse(JSON.stringify(loja)));
  }

  // 2. Mesas
  console.log(`Enviando ${INITIAL_TABLES.length} mesas...`);
  for (const mesa of INITIAL_TABLES) {
    await setDoc(doc(db, 'mesas', mesa.id), JSON.parse(JSON.stringify(mesa)));
  }

  // 3. Categorias
  console.log(`Enviando ${INITIAL_CATEGORIES.length} categorias...`);
  for (const cat of INITIAL_CATEGORIES) {
    await setDoc(doc(db, 'categorias', cat.id), JSON.parse(JSON.stringify(cat)));
  }

  // 4. Produtos
  console.log(`Enviando ${INITIAL_PRODUCTS.length} produtos...`);
  for (const prod of INITIAL_PRODUCTS) {
    await setDoc(doc(db, 'produtos', prod.id), JSON.parse(JSON.stringify(prod)));
  }

  // 5. Usuários
  console.log(`Enviando ${INITIAL_USERS.length} usuários...`);
  for (const user of INITIAL_USERS) {
    await setDoc(doc(db, 'usuarios', user.id), JSON.parse(JSON.stringify(user)));
  }

  // 6. Comandas
  console.log(`Enviando ${INITIAL_COMANDAS.length} comandas...`);
  for (const comanda of INITIAL_COMANDAS) {
    await setDoc(doc(db, 'comandas', comanda.id), JSON.parse(JSON.stringify(comanda)));
  }

  console.log('✅ TODAS AS COLEÇÕES FORAM GRAVADAS COM SUCESSO NO FIRESTORE!');
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro no seed:', err);
    process.exit(1);
  });
