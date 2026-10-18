// Mapa Leaflet do Brasil
const Map = {
    map: null,
    markers: {},
    photosByLocation: {},

    // Coordenadas das capitais brasileiras (latitude, longitude)
    locations: {
        "Acre": [-9.9754, -67.8249],
        "Alagoas": [-9.6498, -36.4625],
        "Amapá": [0.0349, -51.0694],
        "Amazonas": [-3.1190, -60.0217],
        "Bahia": [-12.9777, -38.5016],
        "Ceará": [-3.7319, -38.5267],
        "Distrito Federal": [-15.7975, -47.8919],
        "Espírito Santo": [-20.3155, -40.3128],
        "Goiás": [-16.6869, -49.2648],
        "Maranhão": [-2.5307, -44.3068],
        "Mato Grosso": [-15.6014, -56.0979],
        "Mato Grosso do Sul": [-20.4697, -54.6201],
        "Minas Gerais": [-19.9167, -43.9345],
        "Pará": [-1.4558, -48.4902],
        "Paraíba": [-7.1195, -34.8450],
        "Paraná": [-25.4284, -49.2733],
        "Pernambuco": [-8.0476, -34.8770],
        "Piauí": [-5.0892, -42.8016],
        "Rio de Janeiro": [-22.9068, -43.1729],
        "Rio Grande do Norte": [-5.7945, -35.2110],
        "Rio Grande do Sul": [-30.0346, -51.2177],
        "Rondônia": [-8.7608, -63.8999],
        "Roraima": [2.8238, -60.6753],
        "Santa Catarina": [-27.5954, -48.5480],
        "São Paulo": [-23.5505, -46.6333],
        "Sergipe": [-10.5741, -37.3858],
        "Tocantins": [-10.2491, -48.3243]
    },

    init(onLocationSelect) {
        this.map = L.map("map").setView([-14.235, -51.9253], 4);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18
        }).addTo(this.map);

        this.onLocationSelect = onLocationSelect;
    },

    addLocation(locationName, photoCount) {
        if (this.markers[locationName]) {
            this.map.removeLayer(this.markers[locationName]);
        }

        const coords = this.locations[locationName];
        if (!coords) return;

        const marker = L.circleMarker(coords, {
            radius: Math.max(8, Math.min(20, photoCount * 2)),
            fillColor: "#0078d4",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map);

        marker.bindPopup(`
            <strong>${locationName}</strong><br>
            ${photoCount} foto${photoCount !== 1 ? "s" : ""}
        `);

        marker.on("click", () => {
            this.onLocationSelect(locationName);
        });

        this.markers[locationName] = marker;
    },

    highlightLocation(locationName) {
        // Reset all markers
        Object.values(this.markers).forEach(m => {
            m.setStyle({ fillColor: "#0078d4", weight: 2 });
        });

        // Highlight selected
        if (this.markers[locationName]) {
            this.markers[locationName].setStyle({ fillColor: "#ff6b35", weight: 3 });
            this.map.setView(this.locations[locationName], 6);
        }
    },

    setPhotosByLocation(photosByLocation) {
        this.photosByLocation = photosByLocation;

        // Clear existing markers
        Object.values(this.markers).forEach(m => this.map.removeLayer(m));
        this.markers = {};

        // Add markers for each location with photos
        Object.entries(photosByLocation).forEach(([location, photos]) => {
            this.addLocation(location, photos.length);
        });
    }
};
