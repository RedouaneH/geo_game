/**
 * MapManager - Gestion de la carte Leaflet et des interactions géographiques
 * Responsable de l'initialisation, affichage et gestion des événements de la carte
 */
import { COUNTRY_NAME_MAPPING, getCountryFrenchName } from '../data/countryMapping.js';

class MapManager {
    constructor() {
        // Cartes principales
        this.map = null;
        this.reviewMap = null;
        
        // Layers GeoJSON
        this.countriesGeoJSON = null;
        this.geoJSONLoaded = false;
        this.bordersLayer = null;
        this.reviewBordersLayer = null;
        
        // Couches pour le mode localisation (pays colorés)
        this.clickedCountryLayer = null; // Pays cliqué (bleu foncé)
        this.correctCountryLayer = null; // Pays correct (vert)
        this.wrongCountryLayer = null; // Pays cliqué incorrect (rouge)
        
        // Couches pour la carte de révision
        this.reviewCorrectCountryLayer = null;
        this.reviewWrongCountryLayer = null;
        
        // Marqueurs
        this.markers = {
            click: null,
            target: null,
            line: null,
            pending: null // Marqueur pour le clic en attente (multi)
        };
        
        this.reviewMarkers = {
            click: null,
            target: null,
            line: null
        };
        
        // Configuration des bornes de continents
        this.continentBounds = {
            'Europe': [[35, -12], [72, 45]],
            'Asie': [[0, 40], [70, 150]],
            'Afrique': [[-35, -18], [37, 52]],
            'Amérique du Nord': [[5, -140], [75, -50]],
            'Amérique du Sud': [[-56, -82], [13, -34]],
            'Océanie': [[-47, 110], [5, 180]],
            'all': [[-60, -180], [80, 180]]
        };
        
        // Callback pour les clics de pays
        this.countryClickCallback = null;
    }

    /**
     * Initialise la carte principale
     * @param {string} containerId - ID du conteneur HTML de la carte
     * @returns {Promise<void>}
     */
    async initMap(containerId = 'map') {
        this.map = L.map(containerId, {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 10,
            worldCopyJump: false,
            maxBounds: null
        });

        // Utiliser un fond de carte minimaliste
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
            className: 'map-tiles-simplified'
        }).addTo(this.map);

        // Gérer les clics sur la carte
        this.map.on('click', (e) => this.handleMapClick(e));
        
        // Charger le GeoJSON des frontières
        await this.loadCountriesGeoJSON();
    }

    /**
     * Initialise la carte de révision
     * @param {string} containerId - ID du conteneur HTML
     */
    initReviewMap(containerId = 'review-map') {
        const container = document.getElementById(containerId);
        if (!container || this.reviewMap) return;
        
        this.reviewMap = L.map(containerId, {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 10,
            worldCopyJump: true,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
            className: 'map-tiles-simplified'
        }).addTo(this.reviewMap);
        
        // Ajouter les frontières si le GeoJSON est chargé
        if (this.geoJSONLoaded && this.countriesGeoJSON) {
            this.addBordersToReviewMap();
        }
    }

    /**
     * Charge le fichier GeoJSON des frontières des pays
     * @returns {Promise<void>}
     */
    async loadCountriesGeoJSON() {
        try {
            const response = await fetch('/countries-geo.json');
            if (!response.ok) {
                throw new Error('Impossible de charger les frontières des pays');
            }
            this.countriesGeoJSON = await response.json();
            this.geoJSONLoaded = true;
            console.log('✅ GeoJSON des frontières chargé avec succès');
            
            // Ajouter la couche de frontières à la carte principale
            if (this.map) {
                this.addBordersToMap();
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement du GeoJSON:', error);
            this.geoJSONLoaded = false;
        }
    }

    /**
     * Ajoute les frontières des pays à la carte principale
     */
    addBordersToMap() {
        if (!this.map || !this.countriesGeoJSON || this.bordersLayer) return;
        
        this.bordersLayer = L.geoJSON(this.countriesGeoJSON, {
            style: {
                color: '#94a3b8',
                weight: 1.5,
                opacity: 0.9,
                fillColor: '#1e293b',
                fillOpacity: 0.3
            },
            interactive: true,
            onEachFeature: (feature, layer) => {
                // Effet hover
                layer.on('mouseover', (e) => {
                    layer.setStyle({
                        fillOpacity: 0.5,
                        weight: 2
                    });
                });
                
                layer.on('mouseout', (e) => {
                    if (!this.clickedCountryLayer || !this.clickedCountryLayer.hasLayer(layer)) {
                        layer.setStyle({
                            fillOpacity: 0.3,
                            weight: 1.5
                        });
                    }
                });
                
                layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    this.handleCountryClick(feature, e.latlng);
                });
            }
        }).addTo(this.map);
        
        console.log('✅ Frontières des pays ajoutées à la carte');
    }

    /**
     * Ajoute les frontières à la carte de révision
     */
    addBordersToReviewMap() {
        if (!this.reviewMap || !this.countriesGeoJSON || this.reviewBordersLayer) return;
        
        this.reviewBordersLayer = L.geoJSON(this.countriesGeoJSON, {
            style: {
                color: '#94a3b8',
                weight: 1.5,
                opacity: 0.9,
                fillColor: '#1e293b',
                fillOpacity: 0.3
            },
            interactive: false
        }).addTo(this.reviewMap);
        
        console.log('✅ Frontières ajoutées à la carte de révision');
    }

    /**
     * Gère le clic sur un pays (mode localisation)
     * @param {Object} feature - Feature GeoJSON du pays cliqué
     * @param {L.LatLng} latlng - Coordonnées du clic
     */
    handleCountryClick(feature, latlng) {
        if (this.countryClickCallback) {
            const clickedCountryEnglish = feature.properties.name;
            this.countryClickCallback(clickedCountryEnglish, latlng, feature);
        }
    }

    /**
     * Gère le clic sur la carte (fallback pour mode non-localisation)
     * @param {L.MouseEvent} e - Événement Leaflet
     */
    handleMapClick(e) {
        // Ce callback peut être défini par GameEngine
        if (this.mapClickCallback) {
            this.mapClickCallback(e.latlng);
        }
    }

    /**
     * Définit le callback pour les clics sur les pays
     * @param {Function} callback - Fonction appelée lors du clic (clickedCountry, latlng, feature)
     */
    onCountryClick(callback) {
        this.countryClickCallback = callback;
    }

    /**
     * Définit le callback pour les clics sur la carte
     * @param {Function} callback - Fonction appelée lors du clic (latlng)
     */
    onMapClick(callback) {
        this.mapClickCallback = callback;
    }

    /**
     * Ajuste la vue de la carte selon le continent sélectionné
     * @param {string} continent - Nom du continent ou 'all'
     */
    setContinentView(continent = 'all') {
        if (!this.map) return;
        
        const boundsConfig = this.continentBounds[continent] || this.continentBounds['all'];
        const bounds = L.latLngBounds(boundsConfig);
        
        const mapContainer = document.getElementById('map');
        const padding = mapContainer ? [
            Math.max(20, mapContainer.clientHeight * 0.05),
            Math.max(20, mapContainer.clientWidth * 0.05)
        ] : [20, 20];
        
        this.map.fitBounds(bounds, { 
            padding: padding,
            maxZoom: continent === 'all' ? 2.5 : 6,
            animate: false
        });
    }

    /**
     * Surligne le pays cliqué en bleu
     * @param {Object} feature - Feature GeoJSON du pays
     */
    highlightClickedCountry(feature) {
        this.clearClickedCountryLayer();
        
        if (!feature) return;
        
        this.clickedCountryLayer = L.geoJSON(feature, {
            style: {
                color: '#1e40af',
                weight: 2,
                opacity: 1,
                fillColor: '#1e3a8a',
                fillOpacity: 0.6
            },
            interactive: false
        }).addTo(this.map);
    }

    /**
     * Affiche le résultat en mode localisation (pays vert/rouge)
     * @param {Object} correctFeature - Feature GeoJSON du pays correct
     * @param {Object} clickedFeature - Feature GeoJSON du pays cliqué (si différent)
     * @param {boolean} isCorrect - True si la réponse est correcte
     */
    showLocationResult(correctFeature, clickedFeature, isCorrect) {
        this.clearClickedCountryLayer();
        
        // Afficher le pays correct en vert
        if (correctFeature) {
            this.correctCountryLayer = L.geoJSON(correctFeature, {
                style: {
                    color: '#16a34a',
                    weight: 3,
                    opacity: 1,
                    fillColor: '#22c55e',
                    fillOpacity: 0.6
                },
                interactive: false
            }).addTo(this.map);
        }
        
        // Si mauvaise réponse, afficher le pays cliqué en rouge
        if (!isCorrect && clickedFeature) {
            this.wrongCountryLayer = L.geoJSON(clickedFeature, {
                style: {
                    color: '#dc2626',
                    weight: 3,
                    opacity: 1,
                    fillColor: '#ef4444',
                    fillOpacity: 0.6
                },
                interactive: false
            }).addTo(this.map);
        }
        
        // Ajuster la vue
        if (correctFeature) {
            let bounds = L.geoJSON(correctFeature).getBounds();
            
            if (!isCorrect && clickedFeature) {
                const clickedBounds = L.geoJSON(clickedFeature).getBounds();
                bounds.extend(clickedBounds);
            }
            
            this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
        }
    }

    /**
     * Ajoute un marqueur sur la carte
     * @param {L.LatLng} latlng - Coordonnées du marqueur
     * @param {string} type - Type de marqueur ('click', 'target', 'pending')
     * @param {string} markerClass - Classe CSS du marqueur
     */
    addMarker(latlng, type = 'click', markerClass = 'click-marker') {
        const marker = L.marker(latlng, {
            icon: L.divIcon({
                className: markerClass,
                iconSize: type === 'target' ? [24, 24] : [20, 20],
                iconAnchor: type === 'target' ? [12, 12] : [10, 10]
            })
        }).addTo(this.map);
        
        this.markers[type] = marker;
        return marker;
    }

    /**
     * Ajoute un marqueur circulaire (pour le mode multi)
     * @param {L.LatLng} latlng - Coordonnées
     */
    addPendingMarker(latlng) {
        if (this.markers.pending) {
            this.map.removeLayer(this.markers.pending);
        }
        
        this.markers.pending = L.circleMarker(latlng, {
            radius: 10,
            fillColor: '#f59e0b',
            fillOpacity: 1,
            color: '#ffffff',
            weight: 3,
            className: 'pending-marker-circle'
        }).addTo(this.map);
    }

    /**
     * Ajoute une ligne entre deux points
     * @param {L.LatLng} from - Point de départ
     * @param {L.LatLng} to - Point d'arrivée
     */
    addLine(from, to) {
        this.markers.line = L.polyline([from, to], {
            color: '#f59e0b',
            weight: 3,
            dashArray: '10, 5',
            opacity: 0.8
        }).addTo(this.map);
    }

    /**
     * Ajuste la vue pour afficher deux points
     * @param {L.LatLng} point1 - Premier point
     * @param {L.LatLng} point2 - Second point
     */
    fitBounds(point1, point2) {
        const bounds = L.latLngBounds([point1, point2]);
        this.map.fitBounds(bounds, { padding: [80, 80], maxZoom: 4 });
    }

    /**
     * Centre la carte sur un point
     * @param {L.LatLng} latlng - Coordonnées
     * @param {number} zoom - Niveau de zoom
     */
    centerOn(latlng, zoom = 3) {
        this.map.setView(latlng, zoom);
    }

    /**
     * Efface tous les marqueurs de la carte principale
     */
    clearMarkers() {
        Object.keys(this.markers).forEach(key => {
            if (this.markers[key] && this.map) {
                this.map.removeLayer(this.markers[key]);
                this.markers[key] = null;
            }
        });
        
        this.clearCountryLayers();
    }

    /**
     * Efface les couches de pays colorés
     */
    clearCountryLayers() {
        if (!this.map) return;
        
        this.clearClickedCountryLayer();
        
        if (this.correctCountryLayer) {
            this.map.removeLayer(this.correctCountryLayer);
            this.correctCountryLayer = null;
        }
        
        if (this.wrongCountryLayer) {
            this.map.removeLayer(this.wrongCountryLayer);
            this.wrongCountryLayer = null;
        }
    }

    /**
     * Efface la couche du pays cliqué (bleu)
     */
    clearClickedCountryLayer() {
        if (this.clickedCountryLayer && this.map) {
            this.map.removeLayer(this.clickedCountryLayer);
            this.clickedCountryLayer = null;
        }
    }

    /**
     * Met à jour la carte de révision avec les résultats
     * @param {Object} country - Pays correct
     * @param {Object} result - Résultat du joueur
     * @param {string} gameMode - Mode de jeu ('location' ou autres)
     */
    updateReviewMap(country, result, gameMode) {
        if (!this.reviewMap) {
            this.initReviewMap();
            setTimeout(() => this.updateReviewMap(country, result, gameMode), 200);
            return;
        }
        
        this.clearReviewMarkers();
        this.clearReviewCountryLayers();
        
        if (gameMode === 'location' && this.geoJSONLoaded) {
            this.updateReviewMapLocation(country, result);
        } else {
            this.updateReviewMapClassic(country, result);
        }
        
        setTimeout(() => {
            this.reviewMap.invalidateSize();
        }, 100);
    }

    /**
     * Met à jour la carte de révision en mode localisation (pays colorés)
     * @param {Object} country - Pays correct
     * @param {Object} result - Résultat du joueur
     */
    updateReviewMapLocation(country, result) {
        const correctFeature = this.findCountryFeature(country.name);
        let clickedFeature = null;
        
        if (correctFeature) {
            this.reviewCorrectCountryLayer = L.geoJSON(correctFeature, {
                style: {
                    color: '#16a34a',
                    weight: 3,
                    opacity: 1,
                    fillColor: '#22c55e',
                    fillOpacity: 0.6
                },
                interactive: false
            }).addTo(this.reviewMap);
        }
        
        if (result.clickedCountry && !result.isCorrect) {
            clickedFeature = this.countriesGeoJSON.features.find(
                f => f.properties.name === result.clickedCountry
            );
            if (clickedFeature) {
                this.reviewWrongCountryLayer = L.geoJSON(clickedFeature, {
                    style: {
                        color: '#dc2626',
                        weight: 3,
                        opacity: 1,
                        fillColor: '#ef4444',
                        fillOpacity: 0.6
                    },
                    interactive: false
                }).addTo(this.reviewMap);
            }
        }
        
        if (correctFeature) {
            let bounds = L.geoJSON(correctFeature).getBounds();
            
            if (clickedFeature && !result.isCorrect) {
                const clickedBounds = L.geoJSON(clickedFeature).getBounds();
                bounds.extend(clickedBounds);
            }
            
            this.reviewMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
        }
    }

    /**
     * Met à jour la carte de révision en mode classique (marqueurs)
     * @param {Object} country - Pays correct
     * @param {Object} result - Résultat du joueur
     */
    updateReviewMapClassic(country, result) {
        const targetLatLng = L.latLng(country.lat, country.lng);
        
        this.reviewMarkers.target = L.marker(targetLatLng, {
            icon: L.divIcon({
                className: 'target-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(this.reviewMap);
        
        if (result.clickLat !== null && result.clickLng !== null) {
            const clickLatLng = L.latLng(result.clickLat, result.clickLng);
            
            this.reviewMarkers.click = L.marker(clickLatLng, {
                icon: L.divIcon({
                    className: 'click-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(this.reviewMap);
            
            this.reviewMarkers.line = L.polyline([clickLatLng, targetLatLng], {
                color: '#f59e0b',
                weight: 3,
                dashArray: '10, 5',
                opacity: 0.8
            }).addTo(this.reviewMap);
            
            const bounds = L.latLngBounds([clickLatLng, targetLatLng]);
            this.reviewMap.fitBounds(bounds, { padding: [80, 80], maxZoom: 4 });
        } else {
            this.reviewMap.setView(targetLatLng, 3);
        }
    }

    /**
     * Efface les marqueurs de la carte de révision
     */
    clearReviewMarkers() {
        if (!this.reviewMap) return;
        
        Object.keys(this.reviewMarkers).forEach(key => {
            if (this.reviewMarkers[key]) {
                this.reviewMap.removeLayer(this.reviewMarkers[key]);
                this.reviewMarkers[key] = null;
            }
        });
        
        this.clearReviewCountryLayers();
    }

    /**
     * Efface les couches de pays de la carte de révision
     */
    clearReviewCountryLayers() {
        if (!this.reviewMap) return;
        
        if (this.reviewCorrectCountryLayer) {
            this.reviewMap.removeLayer(this.reviewCorrectCountryLayer);
            this.reviewCorrectCountryLayer = null;
        }
        
        if (this.reviewWrongCountryLayer) {
            this.reviewMap.removeLayer(this.reviewWrongCountryLayer);
            this.reviewWrongCountryLayer = null;
        }
    }

    /**
     * Trouve la feature GeoJSON d'un pays par son nom français
     * @param {string} frenchName - Nom français du pays
     * @returns {Object|null} Feature GeoJSON ou null si non trouvé
     */
    findCountryFeature(frenchName) {
        if (!this.countriesGeoJSON || !this.geoJSONLoaded) {
            return null;
        }

        const englishName = COUNTRY_NAME_MAPPING[frenchName];
        if (!englishName) {
            console.warn(`Mapping non trouvé pour: ${frenchName}`);
            return null;
        }

        const feature = this.countriesGeoJSON.features.find(
            f => f.properties.name === englishName
        );

        if (!feature) {
            console.warn(`Feature GeoJSON non trouvée pour: ${englishName}`);
        }

        return feature;
    }

    /**
     * Calcule la distance entre un point et un pays
     * @param {L.LatLng} latlng - Point à vérifier
     * @param {Object} country - Pays cible
     * @returns {number} Distance en km (0 si dans le pays)
     */
    calculateDistanceToCountry(latlng, country) {
        if (this.geoJSONLoaded && this.countriesGeoJSON) {
            const feature = this.findCountryFeature(country.name);
            
            if (feature) {
                if (this.isPointInCountry(latlng.lat, latlng.lng, feature)) {
                    return 0;
                }
                
                const distanceToBorder = this.distanceToCountryBorder(latlng.lat, latlng.lng, feature);
                if (distanceToBorder !== null) {
                    return distanceToBorder;
                }
            }
        }
        
        // Fallback: distance au centre
        const targetLatLng = L.latLng(country.lat, country.lng);
        return latlng.distanceTo(targetLatLng) / 1000;
    }

    /**
     * Vérifie si un point est dans un pays
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} feature - Feature GeoJSON
     * @returns {boolean} True si le point est dans le pays
     */
    isPointInCountry(lat, lng, feature) {
        if (!feature || !feature.geometry) return false;

        try {
            const point = turf.point([lng, lat]);
            return turf.booleanPointInPolygon(point, feature);
        } catch (error) {
            console.error('Erreur point-in-polygon:', error);
            return false;
        }
    }

    /**
     * Calcule la distance à la frontière la plus proche
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} feature - Feature GeoJSON
     * @returns {number|null} Distance en km ou null si erreur
     */
    distanceToCountryBorder(lat, lng, feature) {
        if (!feature || !feature.geometry) return null;

        try {
            const point = turf.point([lng, lat]);
            
            let lines;
            if (feature.geometry.type === 'Polygon') {
                lines = turf.polygonToLine(feature);
            } else if (feature.geometry.type === 'MultiPolygon') {
                lines = turf.polygonToLine(feature);
            } else {
                return null;
            }

            const nearestPoint = turf.nearestPointOnLine(lines, point);
            const distance = turf.distance(point, nearestPoint, { units: 'kilometers' });
            
            return distance;
        } catch (error) {
            console.error('Erreur calcul distance frontière:', error);
            return null;
        }
    }

    /**
     * Force la mise à jour de la taille de la carte
     */
    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }

    /**
     * Force la mise à jour de la taille de la carte de révision
     */
    invalidateReviewSize() {
        if (this.reviewMap) {
            this.reviewMap.invalidateSize();
        }
    }
}

export default MapManager;
