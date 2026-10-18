// Configuração do Azure AD - PREENCHA COM SEUS DADOS
const CONFIG = {
    // Copie do Azure Portal > App Registrations > Overview
    clientId: "686888f4-5c82-499a-8cc4-3b2d2c792363",

    // Não mude este valor
    redirectUri: window.location.origin + window.location.pathname,

    // Escopos necessários
    scopes: ["Files.Read", "User.Read"],

    // Pasta do OneDrive para buscar fotos (ex: "Pictures", "Camera Roll", ou deixe vazio para raiz)
    photoFolder: ""
};
