# 📖 DOCUMENTAÇÃO DO PROJETO — PIZZARIA ITÁLIA

> ⚠️ **DIRETRIZ MANDATÓRIA PARA A IA (ASSISTENTE DE CÓDIGO):**
> 1. **LEITURA PRÉVIA OBRIGATÓRIA**: Antes de planejar ou executar qualquer modificação no código solicitada pelo usuário, você **DEVE** ler este arquivo (`DOCUMENTACAO-PROJETO.md`) para compreender o estado real, a arquitetura, as regras de negócio e os padrões vigentes do projeto. Nunca assuma comportamentos ou estruturas a partir de suposições.
> 2. **ATUALIZAÇÃO OBRIGATÓRIA**: Ao concluir qualquer alteração solicitada, antes de encerrar o turno e enviar a resposta ao usuário, você **DEVE** atualizar este arquivo refletindo as novas funcionalidades, correções, ajustes de layout ou mudanças estruturais realizadas na seção de *Histórico de Alterações* e nas seções pertinentes.

---

## 1. 🍕 Visão Geral do Projeto

- **Nome Oficial**: **Pizzaria Itália** (*Forno a Lenha & Trattoria*)
- **Objetivo**: Sistema completo de gestão operacional e atendimento para pizzarias e restaurantes tipo trattoria, contemplando todo o ciclo de vida do pedido: abertura e monitoramento de mesas, lançamento ágil de pedidos por garçons (com suporte de primeira classe para smartphones), fila de produção KDS na cozinha com cronômetros e alertas sonoros, conferência e fechamento com múltiplos métodos de pagamento no caixa, além de relatórios analíticos de vendas e controle de estoque de ingredientes.
- **Ambiente de Execução**: Single Page Application (SPA) responsiva rodando no navegador com React + Vite + TypeScript.
- **Persistência de Dados**: Banco de dados em nuvem **Cloud Firestore** (Projeto Firebase `atendeja-83ef5`) com sincronização bidirecional em tempo real (`onSnapshot`) e cache/tolerância a falhas offline em `localStorage`.
- **Tema Visual**: *Gourmet Italiano / Trattoria Moderna* (base em linho natural `#FAF7F2`, acentos em vermelho nobre `#DC2626`, âmbar dourado `#F59E0B`, esmeralda `#10B981` e pedra escura `#1C1917`).

---

## 2. 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Framework Web** | React 18+ | Componentes funcionais e custom hooks |
| **Linguagem** | TypeScript | Tipagem estrita de entidades e estados |
| **Banco de Dados em Nuvem** | Firebase Cloud Firestore | Persistência global em tempo real (`atendeja-83ef5`) |
| **Bundler & Dev Server** | Vite | Build rápido com porta padrão 3000 |
| **Estilização** | Tailwind CSS v4 | Utilitários utilitários, responsividade mobile-first |
| **Ícones** | `lucide-react` | Conjunto consistente de ícones vetoriais |
| **Gráficos & Métricas** | `recharts` | Visualização de dados nos relatórios de vendas |
| **Áudio / Notificações** | Web Audio API | Sintetizador de áudio procedural sem arquivos externos |
| **Sincronização Local** | `BroadcastChannel` | Comunicação instantânea entre abas abertas |

---

## 3. 📂 Estrutura de Pastas e Componentes

```text
/
├── index.html                           # Entry point HTML com metatags e título da Pizzaria Itália
├── metadata.json                        # Metadados da aplicação AI Studio
├── package.json                         # Dependências e scripts de execução/build
├── vite.config.ts                       # Configuração do bundler Vite e plugins
├── tsconfig.json                        # Configuração do compilador TypeScript
├── DOCUMENTACAO-PROJETO.md              # [ESTE ARQUIVO] Documentação viva do projeto
├── AGENTS.md                            # Instruções persistentes para os agentes de IA
└── src/
    ├── main.tsx                         # Ponto de inicialização React
    ├── App.tsx                          # Componente raiz, controle de autenticação e rotas
    ├── types.ts                         # Definições centrais de tipos e interfaces do sistema
    ├── index.css                        # Estilos globais (@import "tailwindcss"; e utilitários)
    │
    ├── context/
    │   └── StoreContext.tsx             # Estado global (mesas, comandas, pedidos, estoque, caixa, usuários)
    │
    ├── data/
    │   └── initialData.ts               # Base de dados semente (produtos, categorias, mesas, insumos, usuários)
    │
    ├── services/
    │   └── firebase.ts                  # Conexão oficial Cloud Firestore (atendeja-83ef5) e helpers
    │
    ├── utils/
    │   ├── audio.ts                     # Sintetizador procedural Web Audio (pops, sinos de cozinha, bips)
    │   └── formatters.ts                # Utilitários de moeda (BRL), datas e tempos
    │
    └── components/
        ├── Navbar.tsx                   # Cabeçalho global, seletor de módulos (01 a 04), perfil e métricas
        ├── LoginScreen.tsx              # Tela de autenticação por usuário e PIN rápido
        ├── KitchenTicketModal.tsx       # Impressão térmica de ticket para a cozinha/chapa
        ├── ReceiptModal.tsx             # Impressão térmica de conferência de conta / cupom fiscal de mesa
        │
        ├── garcom/                      # Módulo 01: Garçom e Atendimento
        │   ├── GarcomView.tsx           # Orquestrador do módulo do garçom (alterna mesas, comanda e cardápio)
        │   ├── MesasGrid.tsx            # Mapa visual de mesas (grid de cartões com status e tempos)
        │   ├── MesasGridCompacto.tsx    # Versão condensada do mapa de mesas
        │   ├── ComandaDetalhes.tsx      # Detalhes da comanda ativa da mesa, itens lançados e ações
        │   ├── CardapioGarcom.tsx       # Lançamento de pedidos com modo lista compacto para celular e cards
        │   ├── CarrinhoModal.tsx        # Bottom sheet / modal de revisão do pedido e envio à cozinha
        │   ├── PizzaCustomizerModal.tsx # Montador de pizzas (tamanhos, até 4 sabores, bordas, massas e extras)
        │   ├── CancelarItemModal.tsx    # Modal de cancelamento de item com auditoria e motivo
        │   └── TransferirMesaModal.tsx  # Troca ou transferência de comanda entre mesas
        │
        ├── cozinha/                     # Módulo 02: Cozinha e KDS (Kitchen Display System)
        │   └── CozinhaView.tsx          # Painel KDS com cards de pedidos, status (novo, em preparo, pronto) e tempos
        │
        ├── caixa/                       # Módulo 03: Caixa e Fechamento
        │   └── CaixaView.tsx            # Fechamento de contas, divisão de pagamentos, sangria, suprimento e recibos
        │
        └── admin/                       # Módulo 04: Administração e Gestão
            ├── AdminView.tsx            # Navegação administrativa (Dashboard, Produtos, Estoque, Vendas, Usuários)
            ├── EstoqueIngredientesPanel.tsx # Controle de insumos, alertas (< 10 un), reposição rápida e histórico
            └── GraficosVendasPanel.tsx  # Relatórios executivos de vendas com gráficos Recharts e exportação
```

---

## 4. 🗂️ Módulos e Funcionalidades

### 01. Garçom / Salão (`/src/components/garcom`)
- **Mapa de Mesas**: Exibe todas as mesas cadastradas (Salão Principal, Varanda, etc.) com status em tempo real: *Livre* (verde), *Ocupada* (vermelho), *Pedindo Conta* (amarelo) e *Reservada*.
- **Comanda da Mesa**: Identificação do número da comanda, garçom responsável, horário de abertura e lista de itens consumidos com status de produção.
- **Cardápio Mobile-Friendly**:
  - **Modo Compacto Otimizado para Celular**: Produtos em linhas esguias com tipografia legível e botões touch-friendly.
  - **Incremento/Decremento Rápido**: Controles `[-] [qtd] [+]` diretamente na listagem para produtos sem personalização (bebidas, porções, etc.), evitando abertura desnecessária de telas.
  - **Toggle Compacto / Cards**: Garçom pode alternar entre visão em lista enxuta ou cards com foto/descrição.
  - **Barra Inferior Fixa (Thumb Zone)**: Mostra subtotal e botão de acesso ao carrinho ao alcance do polegar.
- **Montador de Pizza (`PizzaCustomizerModal`)**:
  - Seleção de tamanho: Broto (4 fatias), Média (6 fatias), Grande (8 fatias), Família (12 fatias).
  - Divisão de sabores: 1, 2, 3 ou até 4 sabores, com cálculo inteligente do preço (maior valor ou proporcional).
  - Opções de bordas recheadas (Catupiry, Cheddar, Chocolate, Vulcão, etc.).
  - Tipos de massa: Tradicional, Fina Italiana, Integral ou Sem Glúten.
- **Carrinho e Envio (`CarrinhoModal`)**:
  - Apresentação em gaveta inferior (*Bottom Sheet*) no celular.
  - Botões de observações rápidas com 1 toque (*"Sem gelo"*, *"Gelo e limão"*, *"Sem cebola"*, *"Bem passada"*, *"Para viagem"*).
  - Envio instantâneo para a cozinha com efeito sonoro `playAddPop()`.

### 02. Cozinha / KDS (`/src/components/cozinha/CozinhaView.tsx`)
- **Fila de Pedidos em Tempo Real**: Cada pedido enviado pelo garçom cai instantaneamente na tela da cozinha.
- **Status do Pedido**: `novo` (Novo Pedido) ➔ `em_preparo` (Iniciado) ➔ `pronto` (Aguardando Retirada) ➔ `entregue`.
- **Cronômetro de Produção**: Indicador visual do tempo decorrido, com alerta de atraso quando ultrapassa 20-30 minutos.
- **Alertas Sonoros**: Bip/sino automático sintetizado via Web Audio quando um novo pedido chega ou quando é marcado como pronto.
- **Impressão de Ticket de Produção**: Gera comanda visual para fixação na chapa/forno via `KitchenTicketModal`.

### 03. Caixa e Operações Financeiras (`/src/components/caixa/CaixaView.tsx`)
- **Fechamento de Comandas**: Recebimento por mesa com cálculo automático de subtotal, taxa de serviço opcional (10%) e descontos.
- **Divisão de Contas & Pagamento Misto**: Permite pagar parte em Dinheiro, Cartão de Crédito, Débito, PIX ou Vale Refeição.
- **Calculadora de Troco**: Assistente visual para pagamento em dinheiro com cálculo imediato do troco.
- **Controle de Frente de Caixa**: Abertura de caixa com valor inicial, registro de **Sangrias** (retiradas) e **Suprimentos** (entradas), e fechamento com conciliação.
- **Emissão de Cupom de Conferência**: Impressão de cupom térmico detalhado com QR Code PIX e dados da Pizzaria Itália (`ReceiptModal`).

### 04. Administração e Gestão (`/src/components/admin`)
- **Dashboard Geral**: Faturamento diário, ticket médio, comandas ativas e resumo de mesas ocupadas.
- **Painel de Gráficos de Vendas (`GraficosVendasPanel`)**:
  - Gráficos diários, semanais e mensais com `recharts`.
  - Produtos mais vendidos e faturamento por categoria.
  - Exportação de relatório executivo formatado para copiar ou imprimir.
- **Controle de Estoque de Ingredientes (`EstoqueIngredientesPanel`)**:
  - Monitoramento de dezenas de insumos (Mussarela, Farinha 00, Tomate Pelado, Pepperoni, etc.).
  - **Alerta de Estoque Crítico**: Destaque visual pulsante em vermelho escarlate para insumos com quantidade inferior ao estoque mínimo (padrão < 10 unidades).
  - **Ajustes Rápidos**: Botões de adição/subtração rápida (`-5`, `-1`, `+1`, `+5`, `+10`) e edição direta.
  - **Entrada em Lote**: Modal para recebimento de compras de fornecedores.
  - **Exportação de Lista de Compras**: Gera texto pronto com insumos em falta para envio via WhatsApp ou fornecedor.
- **Gestão Cadastral**: Cadastro de Produtos, Categorias, Mesas e Usuários/Funcionários com PIN.

---

## 5. 📊 Modelo de Dados (`src/types.ts`)

As principais entidades que compõem o sistema são:

- `User`: Usuário do sistema (Garçom, Cozinha, Caixa ou Administrador) com autenticação por login/PIN.
- `Table`: Mesas numeradas com capacidade, localização e comanda ativa vinculada.
- `Category`: Categorias de cardápio (Pizzas Salgadas, Doces, Bebidas, Sobremesas, etc.).
- `Product`: Item do cardápio com preço, código interno, sinalizador `isPizza` e impressões de cozinha.
- `OrderItem`: Item inserido no pedido, contendo tamanho, sabores fracionados, borda, massa, adicionais e status (ativo ou cancelado).
- `Order`: Pedido enviado para a cozinha contendo itens, horários de preparação e status KDS.
- `Comanda`: Comanda vinculada à mesa com registro de pedidos, pagamentos efetuados, desconto e taxa de serviço.
- `Payment`: Registro de pagamento (dinheiro, pix, debito, credito, vale) com dados de troco e operador.
- `CashRegister` & `CashEntry`: Controle de sessões de caixa, sangrias e suprimentos.
- `Ingredient`: Insumo do estoque com quantidade atual, estoque mínimo, unidade e custo.
- `StockMovement`: Histórico auditado de movimentações de estoque (entradas, saídas, reposições).

---

## 6. 🎨 Diretrizes Visuais & Padrão de Design

- **Identidade Estética**: Trattoria Italiana Tradicional & Moderna.
- **Cores Principais**:
  - Fundo Geral: `#FAF7F2` (Linho quente natural, reduzindo fadiga visual).
  - Destaque Nobre: `#DC2626` / `bg-red-600` (Vermelho Pomodoro).
  - Alertas e Destaques: `#F59E0B` / `bg-amber-500` (Âmbar / Queijo Dourado).
  - Sucesso e Dinheiro: `#10B981` / `bg-emerald-600` (Manjericão Fresco).
  - Superfícies de Cartões: `bg-white` com bordas sutis `border-stone-200` e sombras refinadas `shadow-2xs` a `shadow-xs`.
- **Regras Anti-Slop (Clichês Proibidos)**:
  - Não utilizar gradientes roxo/azul ou fundos pretos chapados com neon.
  - Não usar bordas com espessuras exageradas sem propósito funcional.
  - Manter raio de curvatura coerente (12px a 16px para cartões; pílulas apenas para tags/badges).
  - Tipografia de alta legibilidade com destaque numérico monoespaçado (`font-mono`) para valores monetários, comandas e horários.

---

## 7. 📝 Histórico de Alterações Recentes

| Data | Responsável | Descrição das Alterações |
| :--- | :--- | :--- |
| **2026-08-29** | IA Assistant | • **Otimização Mobile do Garçom**: Criação do modo lista compacto no cardápio, controles inline `[-] [qtd] [+]` para produtos rápidos, bottom sheet no carrinho com chips de observações frequentes e botão flutuante para novos pedidos na comanda.<br>• **Identidade Pizzaria Itália**: Unificação de nome no `Navbar`, `LoginScreen`, `ReceiptModal`, `KitchenTicketModal`, `metadata.json` e `index.html`.<br>• **Ajuste de Estoque**: Painel com destaque para insumos com estoque abaixo de 10 un e filtros rápidos. |
| **2026-09-19** | IA Assistant | • **Criação da Documentação Oficial (`DOCUMENTACAO-PROJETO.md`)**: Registro exaustivo de arquitetura, stack, entidades, componentes, módulos operacionais e guia visual.<br>• **Criação de `AGENTS.md`**: Instrução persistente garantindo que toda IA leia este documento antes de agir e o atualize após qualquer alteração. |
| **2026-09-20** | IA Assistant | • **Identidade Visual & Marca por Loja (White-Label)**: Adicionados campos `marca` e `logo_url` no banco de dados local (`Loja` em `types.ts` e `initialData.ts`). Configuração no Admin com upload e compressão de imagem, exibição dinâmica no `Navbar`, cupons de impressão térmica e cardápio de delivery público (`CustomerDeliveryView`).<br>• **Sincronização e Persistência de Lojas**: Implementada gravação automática no `localStorage` (`pizzaria_lojas_v1`), listener de `storage` e canal `BroadcastChannel` para sincronização em tempo real entre abas.<br>• **Links Inteligentes de Delivery**: Inclusão de parâmetros de URL (`?loja=...&marca=...&nome=...`) para que clientes que recebam o link via WhatsApp em outros dispositivos carreguem a marca e a logo corretas.<br>• **Novo Layout em 3 Colunas no Caixa**: Reorganização do `CaixaView` em 3 colunas (Delivery à esquerda, Comandas abertas no centro e Conferência/Recebimento à direita), permitindo confirmar pedidos com impressão térmica automática.<br>• **Correção de Impressão Térmica**: Criação do portal `#print-root`, eliminação de páginas em branco e suporte a bobinas de 80mm e 58mm.<br>• **Integração com Cloud Firestore (Firebase `atendeja-83ef5`)**: Instalação da SDK oficial `firebase`, criação do módulo `src/services/firebase.ts`, ouvintes em tempo real (`onSnapshot`) para `lojas`, `mesas`, `comandas` e `pedidos`, gravação na nuvem com tolerância a falhas offline (`localStorage`), script de carga inicial de coleções (`src/scripts/seedFirestore.ts` / `npm run seed:firebase`) populando com sucesso lojas, mesas, produtos, categorias, usuários e comandas no Firestore do projeto `atendeja-83ef5`.<br>• **Painel do Dono do App (SaaS SuperAdminView)**: Criação de tela dedicada para o Dono da Plataforma com cadastro completo de lojas contratantes (Nome, Marca, CNPJ, Slug, Endereço, Telefone, Plano SaaS e criação automática de usuário Administrador/Gerente da Loja) e controle de suspensão de filiais por inadimplência.<br>• **Blindagem LGPD & Isolamento Multi-Tenancy**: Segregação de dados operacionais por `loja_id`. Remoção do acesso do Dono do App a mesas, cozinhas e caixas individuais de clientes para resguardo de responsabilidade jurídica; inserção de aviso explícito de consentimento no checkout do delivery público.<br>• **Central de Auditoria de Logins & Defesa contra Força Bruta**: Registro de tentativas de login em tempo real na nuvem (`tentativas_login`), bloqueio temporário preventivo após 5 falhas consecutivas e painel de alertas para prevenção de ataques cibernéticos.<br>• **Otimização Mobile & Ajuste do Cabeçalho**: Eliminação do transbordo horizontal com `overflow-x: hidden` e `max-width: 100vw`. Redução drástica da altura do cabeçalho fixo no celular; as informações da loja (logo, telefone, endereço, taxas) agora rolam naturalmente com a página (`role junto quando rola a tela`).<br>• **Barra de Ferramentas Completa no Mobile (Zero Elementos Ocultos)**: Restauração e exibição de 100% dos controles no celular (`Nuvem Ativa`, `Delivery`, `Matriz — Centro`, `Tema`, `Som`, `Reset`, `Carla Mendes - CAIXA` e métricas da loja) em uma barra utilitária dedicada que rola naturalmente com a tela, sem ocupar espaço fixo permanente.<br>• **Histórico de Pedidos no Delivery ('Meus Pedidos')**: Criação do modal de histórico acessível pela barra superior e tela de confirmação, com acompanhamento de status em tempo real e botão de **1-Clique para Repetir Pedido**.<br>• **Autopreenchimento de Dados do Cliente**: Persistência do perfil do cliente (Nome, WhatsApp, Endereço e Bairro) no `localStorage` (`atendeja_customer_profile_v1`), de forma que o cliente nunca mais precise digitar suas informações toda vez que for pedir. |
| **2026-09-21** | IA Assistant | • **Bloqueio Efetivo de Loja Suspensa (Admin, Equipe e Cardápio Delivery)**:<br>  - **StoreContext (`toggleLojaAtiva` & `createDeliveryOrder`)**: Atualizado `toggleLojaAtiva` para alterar `ativa: !l.ativa` e sincronizar `status_assinatura` ('ativo' / 'suspenso'), salvando no `localStorage` e Firestore, e disparando `broadcastSync`. Em `createDeliveryOrder`, adicionada validação que recusa criação de pedidos para lojas suspensas.<br>  - **Tela de Login (`LoginScreen.tsx`)**: No `verifyPin` e `handleQuickLogin`, verificação imediata se a loja do operador está suspensa. Bloqueia o login, emite mensagem em destaque e gera registro auditado em segurança. Visual diferenciado com badge "Suspensa" e cadeado nos operadores de lojas suspensas.<br>  - **Sessões Ativas Interceptadas (`App.tsx`)**: Se a loja de um usuário logado for suspensa enquanto ele utiliza o sistema, a tela é bloqueada imediatamente exibindo aviso informativo e botão de logout.<br>  - **Cardápio Digital Indisponível (`CustomerDeliveryView.tsx`)**: Clientes que abrem o link de uma loja suspensa recebem uma tela dedicada de indisponibilidade ("Cardápio Indisponível"), impedindo montagem de carrinho e realização de novos pedidos, mantendo acesso restrito apenas à consulta de pedidos passados.<br>• **Blindagem Absoluta do Domínio Raiz & Ocultação Total de Acessos**:<br>  - **Link Não Reconhecido na Raiz (`UnrecognizedLinkView.tsx`)**: Ao abrir `https://atendeja-seven.vercel.app/` sem parâmetros, nenhuma loja é listada e nenhum formulário de login (nem de equipe, nem do dono) é exposto. É exibida apenas a logo e a mensagem: *"Link de acesso não reconhecido. O link utilizado não contém informações de loja ou de acesso. Verifique o endereço."*<br>• **Permanência de Dados no Firestore & Correção de Bordas/Massas**:<br>  - **Sincronização em Tempo Real (`StoreContext.tsx` & `firebase.ts`)**: Adicionados ouvintes `onSnapshot` e funções de persistência para `produtos` e `customizacoes_pizza`. Abas anônimas e novos dispositivos agora recebem o catálogo de produtos e customizações completo diretamente da nuvem.<br>  - **Resolução de Borda Única / Forçada (`PizzaCustomizerModal.tsx`)**: Garantido que "Sem borda" (R$ 0,00) esteja sempre presente e selecionado como opção inicial padrão, e que opções de massas e adicionais não fiquem bloqueadas caso filtros parciais sejam aplicados.<br>• **Arquitetura de Links Exclusivos com Tokens Alfanuméricos Randômicos**:<br>  - **Geração Automática de Tokens (`Loja` em `types.ts` & `StoreContext.tsx`)**: Toda loja passa a conter tokens randômicos exclusivos: `token_admin`, `token_garcom`, `token_cozinha` e `token_caixa`. Acesso Master do Dono protegido por token `MASTER_PORTAL_TOKEN`.<br>  - **Validação Estrita de Tokens (`App.tsx`)**: Se qualquer usuário tentar acessar URLs de painéis sem o token exato correspondente, a aplicação intercepta e exibe a tela *"Link de acesso não reconhecido"*, impossibilitando a visualização de qualquer tela de login.<br>  - **Autenticação por Login e Senha com Mínimo 6 Caracteres (`LoginScreen.tsx` & `SuperAdminView.tsx` & `AdminView.tsx`)**: Administradores e funcionários agora acessam mediante Usuário e Senha individual com validação obrigatória de no mínimo 6 caracteres (ex: `Rs20061991@`). Mantido suporte a PIN rápido opcional no salão.<br>  - **Central de Links Exclusivos**: Botão e modal com 1-clique para copiar links exclusivos com tokens nos painéis do Dono (`SuperAdminView`) e do Administrador da Loja (`AdminView`).<br>• **Correção Crítica de Login & Isolamento Rigoroso de Papéis (RBAC)**:<br>  - **Resolução de Senha e Migração de Credenciais (`initialData.ts`, `StoreContext.tsx` & `LoginScreen.tsx`)**: Atualizadas senhas de todos os usuários iniciais para `Rs20061991@`. Adicionada migração transparente de senhas legadas e suporte a senhas padrão (`Rs20061991@` ou `123456`) e apelidos intuitivos (`garcom`, `cozinha`, `caixa`, `admin`, `dono`). Inserido card de ajuda visual com botão de autopreenchimento de credenciais autorizadas na tela de login.<br>  - **Validação de Sessão Conforme o Link (`App.tsx`)**: Ao abrir um link exclusivo (ex: `painel=garcom`), o sistema valida se a sessão ativa pertence exatamente àquele papel e àquela loja. Sessões residuais de administrador são invalidadas no ato, exigindo autenticação do garçom e impedindo vazamento de interface administrativa.<br>  - **Blindagem do Cabeçalho & Ocultação de Módulos Indevidos (`Navbar.tsx`)**: O garçom agora visualiza estritamente o badge do seu painel e o mapa de mesas; as abas `COZINHA`, `CAIXA` e `ADMIN` foram completamente suprimidas. Métricas financeiras confidenciais (*Vendas do Dia*, *Ticket Médio*) e botões de restauração de banco foram ocultados para funcionários não administradores.<br>  - **Gestão de Credenciais no Admin (`AdminView.tsx`)**: Na aba de Equipe, os logins e senhas agora são exibidos claramente com opção de redefinição direta de senha e PIN pelo Administrador. |
| **2026-09-22** | IA Assistant | • **Auditoria & Correção Crítica de Segurança & Variáveis de Ambiente**:<br>  - **Remoção de Credenciais Hardcoded (`src/services/firebase.ts`)**: Migração de todas as chaves do Firebase para variáveis de ambiente Vite (`import.meta.env.VITE_FIREBASE_*`). Criação de `.env` local (ignorado pelo Git via `.gitignore`) e `.env.example` atualizado com placeholders claros. Adicionada verificação com mensagem amigável caso as variáveis não estejam preenchidas.<br>  - **Remoção de Senha-Mestra / Backdoors (`LoginScreen.tsx` & `StoreContext.tsx`)**: Eliminação de todos os blocos `matchesPass` que aceitavam senhas mestras universais (`123`, `admin`, `Rs20061991@`, `123456`). A validação de senha agora é estrita contra o usuário real cadastrado.<br>  - **Remoção do Card de Credenciais Autorizadas (`LoginScreen.tsx`)**: Removido o bloco `suggestedCredentials` e o card visual "Credenciais Autorizadas" com botão "Preencher dados", impedindo qualquer exposição de login/senha na UI.<br>  - **Criptografia & Hashing de Senhas (`src/utils/security.ts`)**: Criação de utilitários de criptografia com Web Crypto API (`hashPassword`, `verifyPassword`, `verifyUserCredentials` e `sanitizeUserForSession`). Senhas cadastradas ou atualizadas passam a ser armazenadas com hash SHA-256 e salt randômico hexadecimal.<br>  - **Sanitização de Sessão (`localStorage`)**: Remoção de qualquer campo de senha (`senha`, `senhaHash`, `salt` ou `pin`) do objeto de sessão salvo no `localStorage` sob a chave `pizzaria_curr_user_v1`. O storage retém estritamente `{ id, nome, usuario, perfil, loja_id, avatar, telefone }`.<br>  - **Ocultação de Senhas na Equipe (`AdminView.tsx`)**: Senhas nos cards de colaboradores foram mascaradas (`••••••••`). Ao cadastrar ou alterar senha, o novo valor é imediatamente criptografado com hash SHA-256 + salt.<br>  - **Regras Rígidas de Segurança do Firestore (`firestore.rules` & `firebase.json`)**: Configurada política *Default Deny* (`allow read, write: if false;`), leitura pública permitida apenas para o cardápio e lojas ativas, escrita restrita a usuários autenticados, e coleção de `tentativas_login` protegida contra leitura pública.<br>  - **Preparação para Firebase Auth (`src/services/firebase.ts`)**: Inicialização e exportação de `auth = getAuth(app)` e helpers (`loginWithFirebaseAuth`, `logoutWithFirebaseAuth`, `subscribeToAuthChanges`) para integração gradual de autenticação na nuvem.<br>  - **Atualização do README.md**: Instruções completas para configuração de variáveis de ambiente e execução local. |

---

## 8. 🔄 Fluxo Obrigatório para Próximas Alterações

Toda vez que uma nova tarefa ou alteração for solicitada:
1. **Antes de editar arquivos**: Fazer `view_file` em `DOCUMENTACAO-PROJETO.md` (e nos arquivos alvos da alteração).
2. **Durante a execução**: Respeitar a arquitetura existente, mantendo coerência em `types.ts`, `StoreContext.tsx` e componentes.
3. **Após validar (`compile_applet` / `lint_applet`)**: Atualizar este arquivo (`DOCUMENTACAO-PROJETO.md`), adicionando uma nova linha ao *Histórico de Alterações* e ajustando as seções relevantes.

