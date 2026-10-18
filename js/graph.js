// Chamadas à Microsoft Graph API
const Graph = {
    baseUrl: "https://graph.microsoft.com/v1.0",

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async fetchWithRetry(url, token, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 429) {
                    // Rate limit - esperar e tentar de novo
                    const wait = parseInt(response.headers.get("Retry-After") || "5");
                    await this.delay(wait * 1000);
                    continue;
                }
                return response;
            } catch (e) {
                if (i === retries - 1) throw e;
                await this.delay(1000 * (i + 1));
            }
        }
    },

    async getUser() {
        const token = await Auth.getAccessToken();
        const response = await this.fetchWithRetry(`${this.baseUrl}/me`, token);
        return response.json();
    },

    async getPhotos() {
        const token = await Auth.getAccessToken();
        let photos = [];
        const seen = new Set();

        // Buscar por extensões de imagem (search não aceita query vazia)
        const queries = [".jpg", ".jpeg", ".png", ".gif", ".heic", ".webp", ".bmp"];

        for (const q of queries) {
            let url = `${this.baseUrl}/me/drive/root/search(q='${q}')`;
            let pageCount = 0;

            while (url && pageCount < 10) {
                pageCount++;
                try {
                    const response = await this.fetchWithRetry(url, token);
                    if (!response.ok) {
                        console.warn(`Erro na busca "${q}":`, response.status);
                        break;
                    }

                    const data = await response.json();

                    for (const item of (data.value || [])) {
                        if (item.file && (item.file.mimeType || "").startsWith("image/") && !seen.has(item.id)) {
                            seen.add(item.id);
                            photos.push(item);
                        }
                    }

                    url = data["@odata.nextLink"] || null;
                    if (url) await this.delay(300);
                } catch (e) {
                    console.warn(`Falha na busca "${q}":`, e);
                    break;
                }
            }

            await this.delay(300);
        }

        console.log(`Total de fotos encontradas: ${photos.length}`);
        return photos;
    },

    async getPhotoThumbnail(photoId, size = "medium480x480") {
        const token = await Auth.getAccessToken();
        try {
            const response = await fetch(
                `${this.baseUrl}/me/drive/items/${photoId}/thumbnails?select=${size}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!response.ok) return null;
            const data = await response.json();
            if (data.value && data.value.length > 0) {
                return data.value[0][size]?.url || null;
            }
        } catch (e) {
            // Silently fail
        }
        return null;
    },

    async getPhotoContentUrl(photoId) {
        const token = await Auth.getAccessToken();
        const response = await fetch(
            `${this.baseUrl}/me/drive/items/${photoId}/content`,
            {
                headers: { Authorization: `Bearer ${token}` },
                redirect: "follow"
            }
        );
        if (!response.ok) return null;
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }
};
