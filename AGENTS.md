# INSTRUÇÕES OBRIGATÓRIAS DO PROJETO - PIZZARIA ITÁLIA

## Regra de Ouro: Documentação Viva do Projeto

O projeto possui um arquivo de documentação oficial na raiz: `DOCUMENTACAO-PROJETO.md`.

Ao receber qualquer solicitação do usuário para alterar ou adicionar funcionalidades:

1. **LEITURA PRÉVIA OBRIGATÓRIA**:
   - Antes de iniciar qualquer alteração no código, leia o arquivo `DOCUMENTACAO-PROJETO.md` usando a ferramenta `view_file`.
   - Utilize as informações dele para entender o estado real do projeto, as regras de negócio, a organização dos módulos (`garcom`, `cozinha`, `caixa`, `admin`), o modelo de dados (`src/types.ts`) e o padrão visual (Gourmet Italiano / Trattoria Moderna `#FAF7F2`).
   - Nunca faça suposições às cegas.

2. **ATUALIZAÇÃO OBRIGATÓRIA ANTES DE ENCERRAR O TURNO**:
   - Após implementar e validar o código com `compile_applet` / `lint_applet`, atualize `DOCUMENTACAO-PROJETO.md` para registrar com precisão o que foi feito na seção **Histórico de Alterações Recentes** e em quaisquer seções relevantes.
   - Só encerre seu turno após atualizar a documentação.
