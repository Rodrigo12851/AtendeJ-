# AtendeJá - Sistema de Gestão para Pizzarias & Delivery Multi-Lojas

Sistema completo e responsivo para pizzarias, restaurantes e delivery multi-lojas, desenvolvido com React, TypeScript, Tailwind CSS e Firebase (Firestore & Authentication).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/)

### Passo a Passo

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Configurar as Variáveis de Ambiente:**
   Copie o arquivo de exemplo `.env.example` para `.env` na raiz do projeto:

   **Linux / macOS:**
   ```bash
   cp .env.example .env
   ```

   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```

   **Windows (CMD):**
   ```cmd
   copy .env.example .env
   ```

3. **Preencher as credenciais do Firebase no `.env`:**
   Abra o arquivo `.env` gerado e insira as chaves do seu projeto Firebase obtidas no [Firebase Console](https://console.firebase.google.com/):
   ```env
   VITE_FIREBASE_API_KEY="SUA_API_KEY_AQUI"
   VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="seu-projeto-id"
   VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="seu-sender-id"
   VITE_FIREBASE_APP_ID="seu-app-id"
   VITE_FIREBASE_MEASUREMENT_ID="seu-measurement-id"
   ```

4. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Gerar build de produção:**
   ```bash
   npm run build
   ```

---

## 🔒 Segurança e Regras do Firestore

- O projeto utiliza hashing SHA-256 com salt (`crypto.subtle`) para credenciais de acesso, sem senhas mestras ou backdoors.
- Nenhuma senha ou credencial sensível é armazenada em texto puro na sessão local do navegador (`localStorage`).
- As regras de segurança do Firestore encontram-se em `firestore.rules` com política padrão fechada (*Default Deny*) e isolamento multi-loja.
- Para implantar as regras no Firebase:
  ```bash
  firebase deploy --only firestore:rules
  ```
