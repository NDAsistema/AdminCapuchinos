// components/AddressPicker.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// IMPORTAR LAS IMÁGENES DIRECTAMENTE
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configurar iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Coordenadas de Venezuela
const VENEZUELA_CENTER: LatLngExpression = [8.630485, -66.589752];
const CARACAS_CENTER: LatLngExpression = [10.4806, -66.9036];
const MARACAIBO_CENTER: LatLngExpression = [10.6427, -71.6125];
const VALENCIA_CENTER: LatLngExpression = [10.1801, -68.0036];

// Usar Caracas como centro por defecto
const DEFAULT_CENTER = CARACAS_CENTER;

interface AddressPickerProps {
    value: string;
    onChange: (address: string) => void;
    onCoordinatesChange?: (lat: number, lng: number) => void;
    required?: boolean;
    initialCoordinates?: {lat: number, lng: number} | null;
}

// Componente para capturar clics en el mapa
function ClickHandler({ 
    onMapClick, 
    position 
}: { 
    onMapClick: (lat: number, lng: number) => void;
    position: LatLngExpression | null;
}) {
    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onMapClick(lat, lng);
        },
    });

    // Centrar mapa cuando cambia la posición
    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return null;
}

export default function AddressPicker({ 
    value, 
    onChange,
    onCoordinatesChange,
    required = false,
    initialCoordinates = null
}: AddressPickerProps) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [position, setPosition] = useState<LatLngExpression | null>(
        initialCoordinates ? [initialCoordinates.lat, initialCoordinates.lng] : DEFAULT_CENTER
    );
    const [isSearching, setIsSearching] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(initialCoordinates);
    const [hasGeocoded, setHasGeocoded] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Efecto para inicializar con el valor
    useEffect(() => {
        if (value && value !== searchQuery) {
            setSearchQuery(value);
            
            // Si hay coordenadas iniciales, usarlas
            if (initialCoordinates) {
                setPosition([initialCoordinates.lat, initialCoordinates.lng]);
                setCoordinates(initialCoordinates);
                setHasGeocoded(true);
            } else {
                // Intentar extraer coordenadas del texto
                const coordMatch = value.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)\)$/);
                if (coordMatch) {
                    const lat = parseFloat(coordMatch[1]);
                    const lng = parseFloat(coordMatch[2]);
                    setPosition([lat, lng]);
                    setCoordinates({ lat, lng });
                    setHasGeocoded(true);
                } else if (value.trim().length > 3 && !hasGeocoded) {
                    // Si no tiene coordenadas, geocodificar automáticamente
                    setTimeout(() => {
                        geocodeAddress(value);
                    }, 1000);
                }
            }
        }
    }, [value, initialCoordinates]);

    // Geocodificar una dirección para obtener coordenadas
    const geocodeAddress = async (address: string) => {
        if (!address.trim() || address.trim().length < 3) return;
        
        // Remover coordenadas anteriores si existen
        const cleanAddress = address.replace(/\s*\(Lat:[\d.-]+,\s*Lng:[\d.-]+\)$/g, '').trim();
        if (!cleanAddress) return;
        
        setIsSearching(true);
        try {
            const response = await axios.get(
                'https://nominatim.openstreetmap.org/search',
                {
                    params: {
                        q: cleanAddress,
                        format: 'json',
                        limit: 1,
                        addressdetails: 1,
                        'accept-language': 'es',
                        countrycodes: 've'
                    },
                    headers: {
                        'User-Agent': 'AppFraternidadesVE/1.0'
                    }
                }
            );
            
            if (response.data && response.data.length > 0) {
                const lat = parseFloat(response.data[0].lat);
                const lng = parseFloat(response.data[0].lon);
                
                setPosition([lat, lng]);
                setCoordinates({ lat, lng });
                setHasGeocoded(true);
                
                // Actualizar el texto con coordenadas
                const addressWithCoords = `${response.data[0].display_name} (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)})`;
                setSearchQuery(addressWithCoords);
                onChange(addressWithCoords);
                
                if (onCoordinatesChange) {
                    onCoordinatesChange(lat, lng);
                }
            }
        } catch (error) {
            console.error('Error geocodificando dirección:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Buscar direcciones usando Nominatim (OpenStreetMap)
    const searchAddress = useCallback(async (query: string) => {
        if (!query.trim() || query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get(
                'https://nominatim.openstreetmap.org/search',
                {
                    params: {
                        q: query,
                        format: 'json',
                        limit: 5,
                        addressdetails: 1,
                        'accept-language': 'es',
                        countrycodes: 've'
                    },
                    headers: {
                        'User-Agent': 'AppFraternidadesVE/1.0'
                    }
                }
            );
            
            setSuggestions(response.data);
        } catch (error) {
            console.error('Error buscando dirección:', error);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Geocodificación inversa (coordenadas → dirección)
    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const response = await axios.get(
                'https://nominatim.openstreetmap.org/reverse',
                {
                    params: {
                        lat: lat,
                        lon: lng,
                        format: 'json',
                        zoom: 18,
                        addressdetails: 1,
                        'accept-language': 'es'
                    },
                    headers: {
                        'User-Agent': 'AppFraternidadesVE/1.0'
                    }
                }
            );
            
            if (response.data.display_name) {
                const addressWithCoords = `${response.data.display_name} (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)})`;
                onChange(addressWithCoords);
                setSearchQuery(addressWithCoords);
                setHasGeocoded(true);
            }
        } catch (error) {
            console.error('Error en geocodificación inversa:', error);
            // Si falla, usar coordenadas como dirección
            const fallbackAddress = `Ubicación seleccionada (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)})`;
            onChange(fallbackAddress);
            setSearchQuery(fallbackAddress);
        }
    }, [onChange]);

    // Efecto para búsqueda con debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            if (searchQuery !== value) {
                searchAddress(searchQuery);
            }
        }, 800);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, value, searchAddress]);

    // Manejar selección de sugerencia
    const handleSelectSuggestion = (suggestion: any) => {
        const address = suggestion.display_name;
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        
        const addressWithCoords = `${address} (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)})`;
        
        onChange(addressWithCoords);
        setSearchQuery(addressWithCoords);
        setSuggestions([]);
        setPosition([lat, lng]);
        setCoordinates({ lat, lng });
        setHasGeocoded(true);
        setIsSelecting(false);
        
        if (onCoordinatesChange) {
            onCoordinatesChange(lat, lng);
        }
    };

    // Manejar clic en el mapa
    const handleMapClick = (lat: number, lng: number) => {
        setPosition([lat, lng]);
        setCoordinates({ lat, lng });
        setHasGeocoded(true);
        reverseGeocode(lat, lng);
        setIsSelecting(true);
        
        if (onCoordinatesChange) {
            onCoordinatesChange(lat, lng);
        }
    };

    // Manejar cambio manual del input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchQuery(newValue);
        
        // Si el usuario borra, limpiar posición
        if (!newValue.trim()) {
            setPosition(null);
            setCoordinates(null);
            setHasGeocoded(false);
            setIsSelecting(false);
        }
    };

    // Manejar modo selección en mapa
    const handleSelectOnMapClick = () => {
        setIsSelecting(true);
        alert('Ahora haz clic en el mapa de Venezuela para seleccionar la ubicación exacta');
    };

    // Botón para centrar en ciudades principales de Venezuela
    const centerOnCity = (city: LatLngExpression, cityName: string) => {
        setPosition(city);
        setCoordinates({ lat: city[0], lng: city[1] });
        setIsSelecting(true);
    };

    return (
        <div className="space-y-4">
            {/* Campo de búsqueda con autocompletado */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección de la Fraternidad {required && '*'}
                </label>
                
                <div className="relative">
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleInputChange}
                            placeholder="Escribe la dirección en Venezuela (ej: Av Bolívar, Caracas)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => geocodeAddress(searchQuery)}
                            disabled={!searchQuery.trim() || searchQuery.trim().length < 3}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            title="Buscar esta dirección en el mapa"
                        >
                            🔍 Buscar
                        </button>
                        <button
                            type="button"
                            onClick={handleSelectOnMapClick}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
                        >
                            📍 Seleccionar
                        </button>
                    </div>
                    
                    {/* Indicador de búsqueda */}
                    {isSearching && (
                        <div className="absolute right-28 top-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {/* Lista de sugerencias */}
                    {suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-medium text-sm">
                                        {suggestion.display_name}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                        📍 {suggestion.lat}, {suggestion.lon}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Indicador de selección */}
                {isSelecting && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                            🖱️ <strong>Modo selección activado:</strong> Haz clic en el mapa de Venezuela para marcar la ubicación exacta
                        </p>
                    </div>
                )}

                {/* Indicador de coordenadas */}
                {coordinates && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md" hidden={true} >
                        <p className="text-sm text-blue-800">
                            📍 <strong>Coordenadas actuales:</strong> 
                            <span className="font-mono ml-2">
                                Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
                            </span>
                        </p>
                    </div>
                )}

                {/* Botones para ciudades principales de Venezuela */}
                <div className="flex flex-wrap gap-2 mt-3">
                    <button
                        type="button"
                        onClick={() => centerOnCity(CARACAS_CENTER, 'Caracas')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
                    >
                        🏙️ Caracas
                    </button>
                    <button
                        type="button"
                        onClick={() => centerOnCity(MARACAIBO_CENTER, 'Maracaibo')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
                    >
                        🌉 Maracaibo
                    </button>
                    <button
                        type="button"
                        onClick={() => centerOnCity(VALENCIA_CENTER, 'Valencia')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
                    >
                        🏭 Valencia
                    </button>
                    <button
                        type="button"
                        onClick={() => centerOnCity(VENEZUELA_CENTER, 'Centro Venezuela')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
                    >
                        🇻🇪 Venezuela
                    </button>
                </div>
            </div>

            {/* Mapa interactivo */}
            <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height: '400px' }}>
                <MapContainer 
                    center={position as LatLngExpression || DEFAULT_CENTER} 
                    zoom={position ? 15 : 8}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    minZoom={6}
                    maxBounds={[
                        [0.649, -73.354],
                        [12.198, -59.803]
                    ]}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Marcador si hay posición */}
                    {position && (
                        <Marker position={position} />
                    )}
                    
                    {/* Handler para clics en el mapa */}
                    <ClickHandler 
                        onMapClick={handleMapClick} 
                        position={position}
                    />
                </MapContainer>
            </div>
        </div>
    );
}