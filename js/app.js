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
        // Esconder login, mostrar main
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("main-screen").classList.remove("hidden");

        // Mostrar loading
        this.showLoading(true);

        try {
            // Buscar dados do usuário
            const user = await Graph.getUser();
            document.getElementById("user-info").textContent = user.displayName || user.userPrincipalName;

            // Inicializar mapa
            BrasilMap.init((location) => this.onLocationSelect(location));

            // Buscar fotos
            await this.loadPhotos();

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar fotos. Verifique suas permissões no Azure AD.");
        } finally {
            this.showLoading(false);
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
            // Usar o nome da pasta como localização
            const folderName = this.extractLocationFromPath(photo.parentReference?.path);

            if (!groups[folderName]) {
                groups[folderName] = [];
            }
            groups[folderName].push(photo);
        });

        return groups;
    },

    extractLocationFromPath(path) {
        if (!path) return "Geral";

        // Extrair nome da pasta do path (ex: /drives/b!xxx/root/Pictures/SP → SP)
        const parts = path.split("/").filter(p => p);
        if (parts.length <= 2) return "Geral";

        // Pegar o último segmento que não seja "root" ou o drive ID
        const lastPart = parts[parts.length - 1];

        // Mapear nomes comuns de pastas para estados
        const locationMap = {
            "sp": "São Paulo", "rj": "Rio de Janeiro", "mg": "Minas Gerais",
            "ba": "Bahia", "rs": "Rio Grande do Sul", "pr": "Paraná",
            "ce": "Ceará", "pe": "Pernambuco", "sc": "Santa Catarina",
            "go": "Goiás", "ma": "Maranhão", "pa": "Pará",
            "es": "Espírito Santo", "pi": "Piauí", "al": "Alagoas",
            "se": "Sergipe", "pb": "Paraíba", "rn": "Rio Grande do Norte",
            "mt": "Mato Grosso", "ms": "Mato Grosso do Sul", "df": "Distrito Federal",
            "am": "Amazonas", "ro": "Rondônia", "ac": "Acre",
            "rr": "Roraima", "ap": "Amapá", "to": "Tocantins",
            "pictures": "Geral", "camera roll": "Geral", "screenshots": "Geral"
        };

        const lower = lastPart.toLowerCase();
        return locationMap[lower] || lastPart;
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
