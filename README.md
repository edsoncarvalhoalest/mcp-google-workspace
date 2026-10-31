# MCP Google Workspace

## Fork com Google Chat

Este repositório é um fork do pacote npm [`mcp-google-workspace@0.1.5`](https://www.npmjs.com/package/mcp-google-workspace) (licença ISC, créditos aos autores originais). O código original foi importado sem alterações no branch `main`; as mudanças deste fork estão descritas abaixo. A documentação original, em vietnamita, foi mantida a partir da seção [Documentação original](#documentação-original-vietnamita).

### O que mudou em relação à 0.1.5

- **Ferramentas do Google Chat**: 11 ferramentas novas para espaços, mensagens, membros, reações e mensagens diretas (tabela abaixo).
- **Escopos do Chat** adicionados ao login OAuth: `chat.spaces`, `chat.messages`, `chat.memberships` e `chat.messages.reactions`.
- **Correções de autenticação**:
  - tokens salvos sob a chave `google-email:<email>` voltam a ser encontrados quando o servidor reinicia (antes o login era pedido de novo a cada reinício);
  - se o token salvo não tem algum escopo que a ferramenta chamada precisa (por exemplo, um token antigo sem os escopos do Chat ao usar uma ferramenta do Chat), o servidor pede um novo consentimento em vez de usar o token incompleto. A verificação é feita por ferramenta: se os escopos do Chat forem recusados ou bloqueados pelo administrador do Workspace, Drive, Sheets, Gmail e Calendar continuam funcionando. No Chat, cada ferramenta exige só o escopo do método que usa (tabela abaixo): recusar `chat.messages.reactions`, por exemplo, bloqueia apenas `add_chat_reaction`;
  - se `TOKEN_STORE_DEFAULT_USER_KEY` (ou `MCP_USER_KEY`) estiver definida e essa conta não tiver token salvo, o servidor pede login em vez de usar outra conta guardada. Sem essas variáveis, o token salvo (por exemplo `google-email:<email>`) é encontrado normalmente;
  - salvar, limpar o token ou usar `MCP_FORCE_CONSENT` afeta apenas a conta em uso; outras contas guardadas no mesmo armazenamento de tokens são preservadas;
  - o login não trava mais a chamada da ferramenta esperando um navegador: depois de `MCP_AUTH_WAIT_MS` a ferramenta retorna um erro com a URL de login, e o servidor continua escutando o retorno do Google em segundo plano;
  - ferramentas novas `google_auth_status`, `start_google_auth` e `complete_google_auth` para ver o estado do login e concluí-lo colando a URL de retorno.
- **Fuso horário configurável** para o Calendar com `MCP_DISPLAY_TIME_ZONE` e `MCP_TIME_ZONE` (o padrão original era `Asia/Ho_Chi_Minh`).
- **Instalável direto do GitHub** com `npx -y github:edsoncarvalhoalest/mcp-google-workspace` (sem etapa de build; o `dist/` já vem no repositório).

### Pré-requisitos no Google Cloud

1. Crie (ou use) um projeto no [Google Cloud Console](https://console.cloud.google.com/).
2. Ative as APIs usadas: **Google Chat API**, Google Drive API, Google Sheets API, Google Docs API, Gmail API e Google Calendar API.
3. **Configure o app do Chat**: em *APIs e serviços > Google Chat API > Configuração*, preencha nome, avatar e descrição do app. A Chat API exige essa configuração mesmo quando usada apenas com autenticação de usuário.
4. Na **tela de consentimento OAuth**, adicione os escopos abaixo. Para contas Google Workspace, o tipo de usuário *Interno* evita a etapa de verificação do app.
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://mail.google.com/`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/documents.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/chat.spaces`
   - `https://www.googleapis.com/auth/chat.messages`
   - `https://www.googleapis.com/auth/chat.memberships`
   - `https://www.googleapis.com/auth/chat.messages.reactions`
5. Crie uma credencial **ID do cliente OAuth**. Com o tipo *App para computador* (Desktop) qualquer porta em `localhost` é aceita. Com o tipo *Aplicativo da Web*, cadastre o URI de redirecionamento `http://localhost:3000/oauth2callback` (e, se quiser, `http://localhost:3001/oauth2callback` e `http://localhost:3002/oauth2callback`, usados quando a porta 3000 está ocupada).
6. Se a sua organização restringe apps de terceiros, o administrador do Workspace precisa liberar o ID do cliente.

### Configuração no Kiro

Adicione ao arquivo de configuração MCP do Kiro (`.kiro/settings/mcp.json` no workspace ou `~/.kiro/settings/mcp.json` para o usuário). O Kiro inicia o servidor via STDIO:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "github:edsoncarvalhoalest/mcp-google-workspace"],
      "env": {
        "GOOGLE_CLIENT_ID": "<seu-client-id>.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "<seu-client-secret>",
        "MCP_DISPLAY_TIME_ZONE": "America/Sao_Paulo",
        "MCP_TIME_ZONE": "America/Sao_Paulo"
      }
    }
  }
}
```

Substitua os valores entre `< >` pelas credenciais do seu projeto. Nunca faça commit do client secret.

Para fixar uma versão, use um branch, tag ou commit: `github:edsoncarvalhoalest/mcp-google-workspace#<tag-ou-commit>`. Para forçar o `npx` a baixar a versão mais recente do repositório, limpe o cache com `npx clear-npx-cache` ou apague a pasta `~/.npm/_npx`.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Sim | ID do cliente OAuth do Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | Sim | Secret do cliente OAuth. |
| `MCP_CONFIG_DIR` | Não | Pasta do armazenamento de tokens. Padrão: `~/.mcp-google-workspace`. |
| `TOKEN_STORE_DEFAULT_USER_KEY` | Não | Chave do usuário no armazenamento de tokens, por exemplo `google-email:<seu-email>`, para fixar qual conta salva será usada. Alternativa: `MCP_USER_KEY`. Com a chave definida, o servidor nunca usa o token de outra conta: se essa chave não estiver salva, pede login. Sem a variável, a chave padrão vem de `USER` (ou `default`) e o servidor usa o token já salvo, mesmo que esteja sob `google-email:<email>`. |
| `MCP_FORCE_CONSENT` | Não | Com `true`, apaga o token salvo da conta em uso (chave fixada/ativa) ao iniciar o servidor e força um novo login. Use uma vez e remova depois, senão o login será pedido a cada reinício. |
| `MCP_NO_BROWSER` | Não | Com `1`/`true`, não tenta abrir o navegador; a URL de login vem apenas na resposta da ferramenta (e no stderr). |
| `MCP_AUTH_WAIT_MS` | Não | Quanto tempo (ms) a chamada da ferramenta espera o login terminar antes de retornar a URL de login. Padrão: `20000`. |
| `OAUTH_LOCAL_PORT` | Não | Porta local do retorno OAuth (gera `http://localhost:<porta>/oauth2callback`). Padrão: `3000`, com fallback para `3001` e `3002`. |
| `GOOGLE_REDIRECT_URI` | Não | URI de redirecionamento completo; tem prioridade sobre `OAUTH_LOCAL_PORT`. Precisa ser `localhost` ou `127.0.0.1`. |
| `MCP_DISPLAY_TIME_ZONE` | Não | Fuso usado para exibir horários do Calendar. Padrão: `MCP_TIME_ZONE` ou `Asia/Ho_Chi_Minh`. |
| `MCP_TIME_ZONE` | Não | Fuso padrão ao criar/consultar eventos quando a ferramenta não recebe `timeZone`. Padrão: `MCP_DISPLAY_TIME_ZONE` ou `UTC`. |

Fusos inválidos são ignorados e o padrão é usado.

### Ferramentas do Google Chat

Todas usam autenticação de usuário (agem como a conta logada). Os espaços são identificados por nomes de recurso como `spaces/AAAAxxxx` (o ID sozinho também é aceito) e as mensagens por `spaces/AAAAxxxx/messages/BBBB`.

Antes de chamar a API, o servidor confere se o token tem o escopo da coluna "Escopo exigido". Se faltar, retorna a URL de login só para essa ferramenta; as demais continuam funcionando.

| Ferramenta | Método da Chat API | Escopo exigido |
| --- | --- | --- |
| `list_chat_spaces` | `spaces.list` | `chat.spaces` |
| `get_chat_space` | `spaces.get` | `chat.spaces` |
| `find_chat_direct_message` | `spaces.findDirectMessage` | `chat.spaces` |
| `list_chat_messages` | `spaces.messages.list` | `chat.messages` |
| `get_chat_message` | `spaces.messages.get` | `chat.messages` |
| `send_chat_message` | `spaces.messages.create` | `chat.messages` |
| `send_chat_direct_message` | `spaces.findDirectMessage`, `spaces.setup` (cria a DM se não existir), `spaces.messages.create` | `chat.spaces`, `chat.messages` |
| `update_chat_message` | `spaces.messages.patch` (`updateMask=text`) | `chat.messages` |
| `delete_chat_message` | `spaces.messages.delete` | `chat.messages` |
| `list_chat_members` | `spaces.members.list` | `chat.memberships` |
| `add_chat_reaction` | `spaces.messages.reactions.create` | `chat.messages.reactions` |

Os escopos completos têm o prefixo `https://www.googleapis.com/auth/`.

As ferramentas trazem anotações MCP para o cliente (por exemplo, o Kiro) decidir quando pedir confirmação: as de listagem e leitura são `readOnlyHint: true`; `update_chat_message` e `delete_chat_message` são `destructiveHint: true`; `send_chat_message`, `send_chat_direct_message` e `add_chat_reaction` escrevem, mas não destroem nada.

Exemplos de uso no chat do Kiro: "liste meus espaços do Google Chat", "mostre as 10 últimas mensagens do espaço X", "envie uma mensagem direta para fulano@empresa.com dizendo ...".

### Ferramentas de login

| Ferramenta | Descrição |
| --- | --- |
| `google_auth_status` | Mostra se há token salvo, a conta/chave usada, os escopos concedidos, os escopos faltando e a URL de login pendente. |
| `start_google_auth` | Gera (ou reutiliza) a URL de login e retorna na hora. Com `force: true`, descarta o login pendente e gera uma URL nova. |
| `complete_google_auth` | Conclui o login com a URL completa de retorno (`redirectUrl`) ou apenas o `code`. |

### Novo login (re-login) depois de atualizar

Os tokens salvos antes deste fork não incluem os escopos do Chat. Por isso, depois de atualizar:

1. A primeira chamada de uma ferramenta do Chat retorna um erro com a **URL de login** (`https://accounts.google.com/...`). Isso é esperado.
2. Abra a URL no navegador, escolha a conta Workspace e aprove todas as permissões.
3. O Google redireciona para `http://localhost:3000/oauth2callback?...`. Se o Kiro e o navegador estão na mesma máquina, o servidor recebe o retorno sozinho e salva o token; é só repetir a chamada.
4. Se o navegador mostrar uma página de erro de `localhost` (por exemplo, o servidor roda em outra máquina ou a porta não está acessível), copie a **URL completa** da barra de endereço e peça ao Kiro para chamar `complete_google_auth` com ela no campo `redirectUrl`.
5. Confira com `google_auth_status`: `missingScopes` deve estar vazio. Se continuar listando escopos do Chat, verifique se todas as caixas foram marcadas na tela de consentimento ou se o administrador do Workspace bloqueou a Chat API; as outras ferramentas funcionam mesmo assim.

Alternativas:

- Rode o servidor uma vez com `MCP_FORCE_CONSENT=true` para apagar o token antigo e pedir um login novo. Remova a variável depois.
- Ou apague manualmente o arquivo de tokens `~/.mcp-google-workspace/user-tokens.store.json` (ou `$MCP_CONFIG_DIR/user-tokens.store.json`) com o Kiro fechado.

Se uma chamada do Chat retornar `Request had insufficient authentication scopes`, o servidor tenta um novo login automaticamente e retorna a URL de login; confira se os escopos do Chat estão na tela de consentimento e repita os passos acima.

### Desenvolvimento

```bash
npm install
npm test
```

Os testes (`test/*.test.mjs`, executados com `node --test`) usam credenciais fictícias e um cliente do Chat simulado; nenhuma chamada real ao Google é feita. Não há etapa de build: o código está em `dist/` e é editado diretamente. Os scripts de build/publicação citados na documentação original foram removidos deste fork.

### Licença

ISC, como o pacote original `mcp-google-workspace`. Créditos aos autores originais.

---

## Documentação original (vietnamita)

MCP server cho Google Workspace (Drive, Sheets, Gmail, Calendar), chạy qua stdio để tích hợp trực tiếp với MCP client như Claude Desktop/Cursor.

## Luong MCP hien co (ASCII)

```text
[MCP Client: Claude/Cursor]
          |
          | stdio JSON-RPC
          v
[dist/cli.js MCP Server]
          |
          +--> [Auth Layer: personalAuth.ts]
          |          |
          |          +--> OAuth Browser flow (lan dau)
          |          +--> TokenStore provider (file/firestore/hybrid)
          |
          +--> [Tool Layer]
                     |
                     +--> Drive / Sheets / Gmail / Calendar APIs
                     |
                     +--> Ket qua tra ve cho MCP Client
```

## Cài và chạy bằng npx

```bash
npx -y mcp-google-workspace
```

Lệnh trên sẽ chạy server và chờ MCP client giao tiếp qua stdio.

## Cấu hình MCP client

Ví dụ cấu hình (`claude_desktop_config.json` hoặc config tương tự):

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "mcp-google-workspace"],
      "env": {
        "GOOGLE_CLIENT_ID": "<your-client-id>",
        "GOOGLE_CLIENT_SECRET": "<your-client-secret>",
        "GOOGLE_REDIRECT_URI": "http://localhost:3000/oauth2callback"
      }
    }
  }
}
```

## OAuth setup

Có 2 cách cấu hình OAuth:

1. Qua env:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (khuyến nghị `http://localhost:3000/oauth2callback`)

2. Qua file:
- Đặt `oauth2.json` tại `$MCP_CONFIG_DIR/oauth2.json`
- Nếu không set `MCP_CONFIG_DIR`, mặc định là `~/.mcp-google-workspace/oauth2.json`

Token user sẽ lưu tại:
- `$MCP_CONFIG_DIR/user-tokens.json`
- hoặc mặc định `~/.mcp-google-workspace/user-tokens.json`

Legacy local dev (`keys/oauth2.json`, `keys/user-tokens.json`) vẫn còn hỗ trợ để migrate.

Nếu dùng Firestore token store (`TOKEN_STORE_PROVIDER=firestore` hoặc `hybrid`), bắt buộc set thêm:
- `TOKEN_STORE_ENCRYPTION_KEY` (base64 32 bytes hoặc hex 64 ký tự; passphrase cũng hỗ trợ và sẽ được derive SHA-256)
- tùy chọn: `TOKEN_STORE_ENCRYPTION_KEY_VERSION`

User key mặc định trên token store sẽ được resolve theo Google account (ưu tiên email/sub) để tách record theo từng user.

## Local development

```bash
npm install
cp .env.example .env
npm run build
npm run tools:list
```

Smoke test MCP:

```bash
node scripts/mcp-smoke.mjs
```

## Publish lên npm (tự tay từng bước)

1. Đăng nhập npm:
```bash
npm login
```

2. Kiểm tra `name` trong `package.json` là tên chưa bị dùng.

3. Tăng version:
```bash
npm version patch
```

4. Build:
```bash
npm run build
```

5. Kiểm tra gói thực tế sẽ publish:
```bash
npm run pack:check
```

6. Publish public:
```bash
npm run release:public
```

7. Verify sau publish:
```bash
npm view mcp-google-workspace version
```

## Nếu bị lỗi 403 khi publish

Lỗi thường gặp:
- `403 Forbidden ... Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages.`

Checklist xử lý:

1. Đăng xuất session npm cũ:
```bash
npm logout
```

2. Tạo **granular token** có quyền publish và bật **Bypass 2FA** trên npm website, sau đó nạp lại token:
```bash
npm config set //registry.npmjs.org/:_authToken=<TOKEN_MOI>
```

3. Kiểm tra token đã được nhận:
```bash
npm whoami
```

4. Publish lại:
```bash
npm run release:public
```

5. Nếu tài khoản/package policy bắt buộc interactive 2FA, publish bằng OTP/security key theo prompt của npm CLI.

Lưu ý bảo mật:
- Không commit token vào repo.
- Nếu token đã lộ trong terminal/chat, revoke token cũ ngay và tạo token mới.

## Sau khi publish

MCP client có thể dùng ngay bằng:

```bash
npx -y mcp-google-workspace
```

Nếu đổi package name, hãy đổi luôn trong config MCP client.
