# 🏛️ Orientador de Votação — Federação PSDB/CID

Aplicativo web que gera *mensagens prontas para WhatsApp* sobre as votações do Plenário da Câmara dos Deputados, seguindo as regras da Federação PSDB/CID.

> *Você não é programador? Sem problema!* Este README foi escrito do zero, passo a passo, para você conseguir colocar o app no ar mesmo sem saber programar.

---

## 📋 Índice

1. [O que esse app faz](#1-o-que-esse-app-faz)
2. [Antes de começar — o que instalar](#2-antes-de-começar--o-que-instalar)
3. [Como rodar no seu computador (Windows)](#3-como-rodar-no-seu-computador-windows)
4. [Como rodar no seu computador (macOS)](#4-como-rodar-no-seu-computador-macos)
5. [Como usar o app](#5-como-usar-o-app)
6. [Como publicar grátis na internet (Vercel)](#6-como-publicar-grátis-na-internet-vercel)
7. [Como atualizar o app depois de publicado](#7-como-atualizar-o-app-depois-de-publicado)
8. [Estrutura de pastas](#8-estrutura-de-pastas)
9. [Erros comuns e correções](#9-erros-comuns-e-correções)
10. [Checklist final (Definition of Done)](#10-checklist-final-definition-of-done)

---

## 1. O que esse app faz

- 🔎 *Busca automaticamente* a pauta de votação do Plenário do dia (API oficial da Câmara).
- 📑 Mostra todas as proposições pautadas (ex.: PL, PEC, MPV).
- ✅ Você escolhe: A FAVOR ou CONTRA a matéria.
- 🗳️ Escolhe a fase: retirada de pauta, adiamento, mérito, destaque, etc.
- 📲 *Gera automaticamente* a mensagem formatada para WhatsApp.
- ✏️ Permite editar a mensagem antes de copiar.
- 📋 Botão de "copiar" coloca tudo na área de transferência.
- 📱 Funciona no celular e no computador.
- 🌐 Pode ser instalado como app no celular (PWA).

---

## 2. Antes de começar — o que instalar

Você precisa instalar *uma única coisa* na sua máquina: o *Node.js*.

### O que é Node.js?

É o "motor" que roda o aplicativo no seu computador. Pense nele como o Word: você precisa do Word instalado para abrir um arquivo `.docx`. Aqui é a mesma coisa.

### Como instalar o Node.js

1. Acesse: <https://nodejs.org/pt-br>
2. Clique no botão verde *"LTS"* (recomendado).
3. Baixe o instalador para o seu sistema:
   - *Windows*: arquivo `.msi`
   - *macOS*: arquivo `.pkg`
4. Execute o instalador. Vá clicando em *"Avançar/Next"* até o fim. Pode aceitar todas as opções padrão.
5. Quando terminar, *reinicie o computador* (importante!).

### Verificando se deu certo

Abra o *Prompt de Comando* (Windows) ou *Terminal* (macOS):

- *Windows*: tecle `Windows`, digite `cmd`, aperte Enter.
- *macOS*: tecle `Cmd+Espaço`, digite `terminal`, aperte Enter.

Cole este comando e tecle Enter:

```bash
node --version
```

Se aparecer algo como `v20.11.0`, *está pronto!* Se aparecer "comando não encontrado", reinicie o computador e tente de novo.

---

## 3. Como rodar no seu computador (Windows)

### Passo 1 — Baixar o projeto

1. Baixe o arquivo `.zip` do projeto (a pessoa que te enviou tem).
2. Descompacte em uma pasta fácil de achar, ex.: `C:\Users\SeuNome\Documents\orientador-votacao`.

### Passo 2 — Abrir o terminal na pasta certa

1. Abra o *Explorador de Arquivos*.
2. Navegue até a pasta `orientador-votacao` (onde está o `package.json`).
3. Clique na *barra de endereço* (em cima), apague o que estiver lá, digite `cmd` e tecle Enter.

   Vai abrir um Prompt de Comando *já dentro da pasta certa* — isso é importante!

### Passo 3 — Instalar as dependências (só na primeira vez)

Cole este comando e tecle Enter:

```bash
npm install
```

Vai demorar entre *1 e 5 minutos* (vai baixar várias coisas da internet). Pode aparecer "warning" — ignore. Só se preocupe se aparecer "ERR!" no final.

### Passo 4 — Rodar o app

```bash
npm run dev
```

Vai aparecer algo como:

```
   ▲ Next.js 14.2.5
   - Local:        http://localhost:3000
   - Ready in 2.3s
```

### Passo 5 — Abrir no navegador

Abra o Chrome (ou Edge) e acesse: <http://localhost:3000>

🎉 *Pronto!* O app está funcionando no seu computador.

### Para fechar o app

No terminal, tecle `Ctrl+C` e responda `S` se perguntar.

---

## 4. Como rodar no seu computador (macOS)

### Passo 1 — Baixar o projeto

1. Baixe o arquivo `.zip` e descompacte em `~/Documentos/orientador-votacao`.

### Passo 2 — Abrir o terminal na pasta certa

1. Abra o *Finder*.
2. Clique com o botão direito na pasta `orientador-votacao`.
3. Selecione *"Novo Terminal na Pasta"*.

   (Se essa opção não aparecer, ative em: Ajustes do Sistema → Teclado → Atalhos → Serviços → "Novo Terminal na Pasta".)

### Passo 3 — Instalar dependências

```bash
npm install
```

### Passo 4 — Rodar

```bash
npm run dev
```

### Passo 5 — Abrir no navegador

Acesse: <http://localhost:3000>

---

## 5. Como usar o app

1. *Espere a pauta carregar* — o app busca automaticamente as proposições pautadas para hoje.
2. *Toque na proposição* desejada (ela vai ficar marcada em azul).
3. *Escolha a posição da Federação*: A FAVOR ou CONTRA.
4. *Escolha a fase da votação*. O app já mostra ao lado de cada fase qual será a orientação (SIM/NÃO/análise técnica).
5. *(Opcional)* Adicione uma análise técnica/justificativa no campo de texto.
6. Toque em *"Gerar mensagem"*.
7. Confira no preview. Se quiser ajustar, toque em *"Editar texto"*.
8. Toque em *"Copiar para o WhatsApp"*.
9. Abra o WhatsApp e cole no grupo da Liderança.

### ⚠️ Importante

Sempre *confirme com a Liderança e a Assessoria Técnica* antes do envio oficial. O app é um *gerador*, não substitui a decisão humana.

---

## 6. Como publicar grátis na internet (Vercel)

A *Vercel* é a empresa que criou o Next.js e oferece hospedagem grátis. Em 5 minutos seu app estará no ar com um endereço tipo `https://orientador-psdb.vercel.app`.

### Passo 1 — Criar conta no GitHub

1. Acesse <https://github.com> e clique em "Sign up".
2. Crie sua conta com e-mail e senha.
3. Confirme o e-mail.

### Passo 2 — Instalar o GitHub Desktop (mais fácil)

1. Baixe em <https://desktop.github.com> (Windows ou Mac).
2. Instale e faça login com a conta GitHub.

### Passo 3 — Subir o projeto para o GitHub

1. No GitHub Desktop, clique em *"File → Add Local Repository"*.
2. Selecione a pasta `orientador-votacao`.
3. Ele vai dizer "this is not a Git repository" → clique em *"create a repository"*.
4. Marque *"Initialize this repository with..."* e clique em *"Create Repository"*.
5. No topo, clique em *"Publish repository"*.
6. Desmarque "Keep this code private" se quiser deixar público, ou deixe marcado se quiser privado (tanto faz).
7. Clique em *"Publish"*.

### Passo 4 — Conectar com a Vercel

1. Acesse <https://vercel.com>.
2. Clique em *"Sign Up"* → *"Continue with GitHub"*.
3. Autorize a Vercel a acessar seu GitHub.
4. No painel da Vercel, clique em *"Add New... → Project"*.
5. Localize o repositório `orientador-votacao` e clique em *"Import"*.
6. Não precisa alterar nada. Clique em *"Deploy"*.
7. Espere 2 minutos. Ao final, aparecerá um endereço tipo `https://orientador-votacao.vercel.app`.

🎉 *Pronto! O app está no ar* e qualquer pessoa pode acessar pelo celular ou computador.

### Passo 5 — (Opcional) Domínio personalizado

Se você tem um domínio (ex.: `orientador.psdb.org.br`), na Vercel vá em *Settings → Domains* e adicione.

---

## 7. Como atualizar o app depois de publicado

Quando precisar mudar alguma coisa (ex.: ajustar uma regra, mudar texto):

1. Edite o arquivo no seu computador (ex.: `lib/regras.ts`).
2. Abra o GitHub Desktop.
3. Vai aparecer a mudança detectada.
4. Escreva uma mensagem curta embaixo (ex.: "Ajuste regra de destaque").
5. Clique em *"Commit to main"*.
6. Clique em *"Push origin"* (em cima).
7. A Vercel *automaticamente* detecta a mudança e republica em 1 minuto.

---

## 8. Estrutura de pastas

```
orientador-votacao/
├── app/                    ← páginas e rotas
│   ├── api/                ← backend (rotas de API)
│   ├── page.tsx            ← tela principal
│   ├── layout.tsx          ← layout global
│   └── globals.css         ← estilos
├── components/             ← componentes React reutilizáveis
├── lib/                    ← lógica de negócio (regras, API, etc)
│   ├── camara.ts           ← cliente da API da Câmara
│   ├── regras.ts           ← REGRAS LEGISLATIVAS ← mexer aqui se mudar regra
│   ├── mensagem.ts         ← gerador de mensagem
│   └── clipboard.ts        ← copiar para WhatsApp
├── types/                  ← tipos TypeScript
├── public/                 ← imagens, ícones, PWA
├── package.json            ← lista de dependências
└── README.md               ← este arquivo
```

### ⚠️ Onde mexer se precisar:

| Tarefa | Arquivo |
|---|---|
| Mudar regras (SIM/NÃO por fase) | `lib/regras.ts` |
| Mudar formato da mensagem | `lib/mensagem.ts` |
| Mudar logo/cabeçalho | `components/Header.tsx` |
| Mudar cores | `tailwind.config.ts` |
| Mudar texto do rodapé | `app/page.tsx` |

---

## 9. Erros comuns e correções

### ❌ "npm não é reconhecido como comando..."
*Causa*: Node.js não está instalado ou não foi reiniciado o computador.
*Solução*: Reinstale Node.js de <https://nodejs.org/pt-br> e reinicie a máquina.

### ❌ "port 3000 already in use"
*Causa*: Já tem outro app rodando na porta 3000.
*Solução*: No terminal, tecle `Ctrl+C` para parar o anterior, ou rode `npm run dev -- -p 3001` para usar outra porta.

### ❌ "Falha ao carregar a pauta" no app
*Causa*: API da Câmara fora do ar OU sem internet.
*Solução*: Aguarde alguns minutos e clique em "Atualizar". Se persistir, use a aba "Buscar" para digitar a proposição manualmente.

### ❌ "Não foi possível copiar"
*Causa*: O navegador bloqueou clipboard (comum em HTTP, sem HTTPS).
*Solução*: O app já tem fallback — vai aparecer um campo de texto. Selecione tudo (Ctrl+A) e copie (Ctrl+C).

### ❌ Vercel mostra erro de build
*Causa*: Algum arquivo foi salvo errado.
*Solução*: Na Vercel, abra *Deployments → último deploy → View Logs*. Procure a linha que começa com "Error:". Geralmente diz o nome do arquivo problemático.

### ❌ "Cannot find module..."
*Causa*: Dependências não instaladas.
*Solução*: Rode `npm install` na pasta do projeto.

### ❌ App aparece quebrado depois de uma mudança
*Solução*: Desfaça a mudança no arquivo, salve, e ele recarrega automaticamente.

---

## 10. Checklist final (Definition of Done)

Antes de considerar o app pronto para uso oficial:

### ✅ Funcionalidade
- [ ] Pauta do dia carrega automaticamente
- [ ] Lista de proposições aparece com tipo, número e ementa
- [ ] Funciona escolher proposição
- [ ] Funciona escolher A FAVOR / CONTRA
- [ ] Funciona escolher fase
- [ ] Mensagem gera automaticamente após escolha
- [ ] Botão "Editar" funciona
- [ ] Botão "Copiar" coloca texto no WhatsApp
- [ ] Botão "Limpar tudo" funciona

### ✅ Regras legislativas
- [ ] A FAVOR + retirada de pauta = NÃO ✓
- [ ] A FAVOR + adiamento discussão = NÃO ✓
- [ ] A FAVOR + adiamento votação = NÃO ✓
- [ ] A FAVOR + mérito = SIM ✓
- [ ] A FAVOR + destaque de texto = SIM ✓
- [ ] A FAVOR + destaque de emenda = análise técnica ✓
- [ ] CONTRA + retirada de pauta = SIM ✓
- [ ] CONTRA + adiamento discussão = SIM ✓
- [ ] CONTRA + adiamento votação = SIM ✓
- [ ] CONTRA + mérito = NÃO ✓
- [ ] CONTRA + destaque de texto = análise técnica ✓
- [ ] CONTRA + destaque de emenda = análise técnica ✓

### ✅ Formatação WhatsApp
- [ ] "*VOTAÇÃO NOMINAL*" em negrito
- [ ] "*SIM*" ou "*NÃO*" em negrito
- [ ] Linha em branco entre os blocos
- [ ] Nada de bloco "colado"

### ✅ UX/UI
- [ ] Logo PSDB aparece no topo
- [ ] Funciona bem no celular (responsivo)
- [ ] Loading aparece enquanto carrega
- [ ] Erros aparecem amigáveis
- [ ] Estados vazios aparecem

### ✅ Deploy
- [ ] App roda local com `npm run dev`
- [ ] Build funciona com `npm run build`
- [ ] App está publicado na Vercel
- [ ] URL pública funciona em outro dispositivo
- [ ] PWA instalável no celular

---

## 📞 Em caso de dúvida

- Quem programou (com IA): este projeto foi gerado usando *Next.js + React + TypeScript + Tailwind*.
- *Documentação Next.js*: <https://nextjs.org/docs>
- *API da Câmara*: <https://dadosabertos.camara.leg.br/swagger/api.html>

---

*Versão*: 1.0.0  
*Licença*: Uso interno Federação PSDB/CID
