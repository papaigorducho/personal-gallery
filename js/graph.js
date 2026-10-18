// Chamadas à Microsoft Graph API
const Graph = {
    baseUrl: "https://graph.microsoft.com/v1.0",

    async getUser() {
        const token = await Auth.getAccessToken();
        const response = await fetch(`${this.baseUrl}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.json();
    },

    async getPhotos() {
        const token = await Auth.getAccessToken();
        let photos = [];
        let url = CONFIG.photoFolder
            ? `${this.baseUrl}/me/drive/root:/${CONFIG.photoFolder}:/children`
            : `${this.baseUrl}/me/drive/root/children`;

        // Buscar apenas arquivos de imagem
        url += "?select=id,name,webUrl,lastModifiedDateTime,size,file,folder,parentReference";

        while (url) {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                console.error("Erro ao buscar fotos:", response.status);
                break;
            }

            const data = await response.json();

            // Filtrar apenas imagens
            const imageItems = (data.value || []).filter(item => {
                if (item.folder) return false;
                if (!item.file) return false;
                const mime = item.file.mimeType || "";
                return mime.startsWith("image/");
            });

            photos = photos.concat(imageItems);
            url = data["@odata.nextLink"] || null;
        }

        return photos;
    },

    async getPhotosFromFolder(folderId) {
        const token = await Auth.getAccessToken();
        let photos = [];
        let url = `${this.baseUrl}/me/drive/items/${folderId}/children?select=id,name,webUrl,lastModifiedDateTime,size,file`;

        while (url) {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) break;

            const data = await response.json();

            const imageItems = (data.value || []).filter(item => {
                if (item.folder) return false;
                if (!item.file) return false;
                const mime = item.file.mimeType || "";
                return mime.startsWith("image/");
            });

            photos = photos.concat(imageItems);
            url = data["@odata.nextLink"] || null;
        }

        return photos;
    },

    async getPhotoThumbnail(photoId, size = "medium480x480") {
        const token = await Auth.getAccessToken();
        const response = await fetch(
            `${this.baseUrl}/me/drive/items/${photoId}/thumbnails?select=${size}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (data.value && data.value.length > 0) {
            return data.value[0][size]?.url || null;
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
    },

    async getFolders() {
        const token = await Auth.getAccessToken();
        let folders = [];
        let url = `${this.baseUrl}/me/drive/root/children?select=id,name,folder`;

        while (url) {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) break;

            const data = await response.json();
            const folderItems = (data.value || []).filter(item => item.folder);
            folders = folders.concat(folderItems);
            url = data["@odata.nextLink"] || null;
        }

        return folders;
    }
};
