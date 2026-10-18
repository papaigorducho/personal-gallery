// Autenticação MSAL.js (Authorization Code Flow + PKCE)
const Auth = {
    msalInstance: null,
    tokenResponse: null,

    init() {
        const msalConfig = {
            auth: {
                clientId: CONFIG.clientId,
                redirectUri: CONFIG.redirectUri,
                authority: "https://login.microsoftonline.com/common"
            },
            cache: {
                cacheLocation: "localStorage",
                storeAuthStateInCookie: false
            }
        };

        this.msalInstance = new msal.PublicClientApplication(msalConfig);
    },

    async login() {
        try {
            const loginResponse = await this.msalInstance.loginPopup({
                scopes: CONFIG.scopes
            });
            this.tokenResponse = loginResponse;
            return loginResponse;
        } catch (error) {
            console.error("Erro no login:", error);
            throw error;
        }
    },

    async getAccessToken() {
        if (this.tokenResponse) {
            return this.tokenResponse.accessToken;
        }

        try {
            const silentResponse = await this.msalInstance.acquireTokenSilent({
                scopes: CONFIG.scopes,
                account: this.msalInstance.getAllAccounts()[0]
            });
            this.tokenResponse = silentResponse;
            return silentResponse.accessToken;
        } catch (error) {
            // Se silent falhar, faz popup
            const popupResponse = await this.msalInstance.acquireTokenPopup({
                scopes: CONFIG.scopes
            });
            this.tokenResponse = popupResponse;
            return popupResponse.accessToken;
        }
    },

    logout() {
        this.tokenResponse = null;
        this.msalInstance.logoutPopup();
    },

    getAccount() {
        return this.msalInstance.getAllAccounts()[0];
    },

    isLoggedIn() {
        return this.getAccount() !== undefined;
    }
};
