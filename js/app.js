// Lógica principal da aplicação
const App = {
    photos: [],
    photosByLocation: {},
    currentLocation: null,

    async init() {
        Auth.init();

        // Verificar se já está logado
        if (Auth.isLoggedIn()) {
            await this.onLoginSuccess();
        }

        // Event listeners
        document.getElementById("btn-login").addEventListener("click", () => this.login());
        document.getElementById("btn-logout").addEventListener("click", () => this.logout());
        document.getElementById("lightbox-close").addEventListener("click", () => this.closeLightbox());
        document.getElementById("lightbox").addEventListener("click", (e) => {
            if (e.target.id === "lightbox") this.closeLightbox();
        });
    },

    async login() {
        try {
            await Auth.login();
            await this.onLoginSuccess();
        } catch (error) {
            console.error("Falha no login:", error);
            alert("Erro ao fazer login. Tente novamente.");
        }
    },

    async onLoginSuccess() {
        // Evitar execução dupla
        if (this._loading) return;
        this._loading = true;

        // Esconder login, mostrar main
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("main-screen").classList.remove("hidden");

        // Mostrar loading
        this.showLoading(true);

        try {
            // Buscar dados do usuário
            const user = await Graph.getUser();
            document.getElementById("user-info").textContent = user.displayName || user.userPrincipalName;

            // Inicializar mapa (apenas uma vez)
            if (!BrasilMap.map) {
                BrasilMap.init((location) => this.onLocationSelect(location));
            }

            // Buscar fotos
            await this.loadPhotos();

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar fotos. Verifique suas permissões no Azure AD.");
        } finally {
            this.showLoading(false);
            this._loading = false;
        }
    },

    async loadPhotos() {
        // Buscar todas as fotos do OneDrive
        this.photos = await Graph.getPhotos();

        // Agrupar por pasta/album
        this.photosByLocation = this.groupPhotosByFolder();

        // Configurar mapa
        BrasilMap.setPhotosByLocation(this.photosByLocation);

        // Atualizar título
        document.getElementById("gallery-title").textContent = "Selecione uma localização no mapa";
        document.getElementById("photo-count").textContent = `${this.photos.length} fotos`;
    },

    groupPhotosByFolder() {
        const groups = {};

        this.photos.forEach(photo => {
            const folderName = this.extractLocationFromPath(photo._folderPath);

            if (!groups[folderName]) {
                groups[folderName] = [];
            }
            groups[folderName].push(photo);
        });

        console.log("Fotos agrupadas:", Object.fromEntries(
            Object.entries(groups).map(([k, v]) => [k, v.length])
        ));

        return groups;
    },

    extractLocationFromPath(folderPath) {
        if (!folderPath) return "Geral";

        // Usar o último segmento da pasta (ex: "Fotos/SP" → "SP")
        const parts = folderPath.split("/").filter(p => p);
        const lastPart = parts[parts.length - 1];
        if (!lastPart) return "Geral";

        // Mapear nomes de pastas para estados
        const locationMap = {
            "sp": "São Paulo", "sao paulo": "São Paulo", "são paulo": "São Paulo",
            "rj": "Rio de Janeiro", "rio de janeiro": "Rio de Janeiro",
            "mg": "Minas Gerais", "minas gerais": "Minas Gerais",
            "ba": "Bahia", "bahia": "Bahia",
            "rs": "Rio Grande do Sul", "rio grande do sul": "Rio Grande do Sul",
            "pr": "Paraná", "parana": "Paraná", "paraná": "Paraná",
            "ce": "Ceará", "ceara": "Ceará", "ceará": "Ceará",
            "pe": "Pernambuco", "pernambuco": "Pernambuco",
            "sc": "Santa Catarina", "santa catarina": "Santa Catarina",
            "go": "Goiás", "goias": "Goiás", "goiás": "Goiás",
            "ma": "Maranhão", "maranhao": "Maranhão", "maranhão": "Maranhão",
            "pa": "Pará", "para": "Pará", "pará": "Pará",
            "es": "Espírito Santo", "espirito santo": "Espírito Santo", "espírito santo": "Espírito Santo",
            "pi": "Piauí", "piaui": "Piauí", "piauí": "Piauí",
            "al": "Alagoas", "alagoas": "Alagoas",
            "se": "Sergipe", "sergipe": "Sergipe",
            "pb": "Paraíba", "paraiba": "Paraíba", "paraíba": "Paraíba",
            "rn": "Rio Grande do Norte", "rio grande do norte": "Rio Grande do Norte",
            "mt": "Mato Grosso", "mato grosso": "Mato Grosso",
            "ms": "Mato Grosso do Sul", "mato grosso do sul": "Mato Grosso do Sul",
            "df": "Distrito Federal", "distrito federal": "Distrito Federal", "brasilia": "Distrito Federal", "brasília": "Distrito Federal",
            "am": "Amazonas", "amazonas": "Amazonas",
            "ro": "Rondônia", "rondonia": "Rondônia", "rondônia": "Rondônia",
            "ac": "Acre", "acre": "Acre",
            "rr": "Roraima", "roraima": "Roraima",
            "ap": "Amapá", "amapa": "Amapá", "amapá": "Amapá",
            "to": "Tocantins", "tocantins": "Tocantins",
            "pictures": "Geral", "camera roll": "Geral", "screenshots": "Geral",
            "fotos": "Geral", "photos": "Geral", "imagens": "Geral"
        };

        const lower = lastPart.toLowerCase();

        // Verificar match exato ou parcial
        if (locationMap[lower]) return locationMap[lower];

        // Verificar se contém o nome de um estado
        for (const [key, value] of Object.entries(locationMap)) {
            if (lower.includes(key) && value !== "Geral") return value;
        }

        return lastPart;
    },

    onLocationSelect(locationName) {
        this.currentLocation = locationName;
        BrasilMap.highlightLocation(locationName);

        const photos = this.photosByLocation[locationName] || [];
        document.getElementById("gallery-title").textContent = locationName;
        document.getElementById("photo-count").textContent = `${photos.length} foto${photos.length !== 1 ? "s" : ""}`;

        this.renderGallery(photos);
    },

    async renderGallery(photos) {
        const grid = document.getElementById("gallery-grid");
        grid.innerHTML = "";

        // Buscar thumbnails em lotes de 20
        const batchSize = 20;
        for (let i = 0; i < photos.length; i += batchSize) {
            const batch = photos.slice(i, i + batchSize);
            const thumbnails = await Promise.all(
                batch.map(photo => Graph.getPhotoThumbnail(photo.id))
            );

            batch.forEach((photo, index) => {
                const thumbUrl = thumbnails[index];
                const item = document.createElement("div");
                item.className = "photo-item";

                const date = new Date(photo.lastModifiedDateTime).toLocaleDateString("pt-BR");

                item.innerHTML = `
                    ${thumbUrl ? `<img src="${thumbUrl}" alt="${photo.name}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#666;">📷</div>`}
                    <div class="photo-date">${date}</div>
                `;

                item.addEventListener("click", () => this.openLightbox(photo, thumbUrl));
                grid.appendChild(item);
            });
        }
    },

    async openLightbox(photo, thumbUrl) {
        const lightbox = document.getElementById("lightbox");
        const img = document.getElementById("lightbox-img");
        const info = document.getElementById("lightbox-info");

        lightbox.classList.remove("hidden");

        // Mostrar thumbnail primeiro
        if (thumbUrl) {
            img.src = thumbUrl;
        }

        // Carregar imagem completa
        try {
            const fullUrl = await Graph.getPhotoContentUrl(photo.id);
            if (fullUrl) {
                img.src = fullUrl;
            }
        } catch (error) {
            console.error("Erro ao carregar imagem:", error);
        }

        const date = new Date(photo.lastModifiedDateTime).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", year: "numeric"
        });
        info.textContent = `${photo.name} — ${date}`;
    },

    closeLightbox() {
        document.getElementById("lightbox").classList.add("hidden");
        document.getElementById("lightbox-img").src = "";
    },

    async logout() {
        Auth.logout();
        document.getElementById("main-screen").classList.add("hidden");
        document.getElementById("login-screen").classList.remove("hidden");
    },

    showLoading(show) {
        const loading = document.getElementById("loading");
        if (show) {
            loading.classList.remove("hidden");
        } else {
            loading.classList.add("hidden");
        }
    }
};

// Inicializar quando a página carregar
document.addEventListener("DOMContentLoaded", () => App.init());
