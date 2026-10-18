# 📸 Minha Galeria

Galeria de fotos pessoal que exibe fotos do OneDrive em um mapa interativo do Brasil.

## Stack

- **HTML/CSS/JavaScript** puro (sem framework)
- **Leaflet.js** — mapa interativo
- **MSAL.js** — autenticação Microsoft
- **Microsoft Graph API** — acesso ao OneDrive
- **GitHub Pages** — hospedagem gratuita

## Setup

### 1. Configurar Azure AD

1. Acesse [Azure Portal](https://portal.azure.com)
2. **App Registrations → New registration**
   - Name: `Minha Galeria`
   - Supported account types: `Personal Microsoft accounts only`
   - Redirect URI: `Single-page application (SPA)` → `https://SEU_USUARIO.github.io/SEU_REPO/`
3. Em **Authentication**:
   - Ative `Allow public client flows`
4. Em **API Permissions**:
   - Microsoft Graph → Delegated permissions → `Files.Read`, `User.Read`
5. Copie o **Application (client) ID**

### 2. Configurar o projeto

Edite `js/config.js`:

```javascript
const CONFIG = {
    clientId: "SEU_CLIENT_ID_AQUI",  // Cole o client ID aqui
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ["Files.Read", "User.Read"],
    photoFolder: ""  // Deixe vazio para raiz, ou especifique "Pictures"
};
```

### 3. Publicar no GitHub

1. Crie um repositório no GitHub
2. Envie os arquivos:
   ```bash
   git init
   git add .
   git commit -m "Minha Galeria"
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```
3. Vá em **Settings → Pages**
   - Source: `main`
   - Folder: `/ (root)`
4. Acesse: `https://SEU_USUARIO.github.io/SEU_REPO/`

### 4. Atualizar redirect URI

Após publicar, atualize o redirect URI no Azure Portal:
- **Authentication → Redirect URIs**
- Adicione: `https://SEU_USUARIO.github.io/SEU_REPO/`

## Organizando as fotos

Para que as fotos apareçam no mapa, organize-as em pastas no OneDrive por estado/cidade:

```
OneDrive/
├── Fotos/
│   ├── São Paulo/
│   │   ├── foto1.jpg
│   │   └── foto2.jpg
│   ├── Rio de Janeiro/
│   │   └── foto3.jpg
│   └── Bahia/
│       └── foto4.jpg
```

Pastas reconhecidas automaticamente:
- Siglas: `SP`, `RJ`, `MG`, `BA`, etc.
- Nomes completos: `São Paulo`, `Rio de Janeiro`, etc.

## Rodando localmente

Para testar localmente:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PowerShell
Start-Process "http://localhost:8000"
```

Acesse `http://localhost:8000`

## Estrutura

```
personal-gallery/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos
├── js/
│   ├── config.js       # Configuração (client ID)
│   ├── auth.js         # Autenticação MSAL
│   ├── graph.js        # Microsoft Graph API
│   ├── map.js          # Mapa Leaflet
│   └── app.js          # Lógica principal
├── .nojekyll           # Desabilita Jekyll no GitHub Pages
└── README.md
```

## Custo

| Item | Custo |
|------|-------|
| GitHub Pages | Gratuito |
| Azure AD | Gratuito (conta pessoal) |
| Microsoft Graph | Gratuito (uso pessoal) |
| Leaflet.js | Gratuito |
| MSAL.js | Gratuito |
| **Total** | **$0** |
