# MCP Google Workspace

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
