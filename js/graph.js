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

        // Buscar recursivamente todas as pastas
        const foldersToVisit = [{ id: "root", path: "" }];

        while (foldersToVisit.length > 0) {
            const folder = foldersToVisit.shift();
            let url = folder.id === "root"
                ? `${this.baseUrl}/me/drive/root/children?select=id,name,lastModifiedDateTime,size,file,folder,parentReference`
                : `${this.baseUrl}/me/drive/items/${folder.id}/children?select=id,name,lastModifiedDateTime,size,file,folder,parentReference`;

            while (url) {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) {
                    console.error("Erro ao buscar fotos:", response.status);
                    break;
                }

                const data = await response.json();

                for (const item of (data.value || [])) {
                    if (item.folder) {
                        // É uma pasta → adicionar à fila
                        foldersToVisit.push({
                            id: item.id,
                            path: folder.path ? `${folder.path}/${item.name}` : item.name
                        });
                    } else if (item.file && (item.file.mimeType || "").startsWith("image/")) {
                        // É uma imagem → adicionar folderPath
                        item._folderPath = folder.path;
                        photos.push(item);
                    }
                }

                url = data["@odata.nextLink"] || null;
            }
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
            console.error("Erro ao buscar thumbnail:", e);
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
