import L from 'leaflet';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  OSM_TILE_URL,
  MAP_ATTRIBUTION,
  createMarkerIcon,
  START_MARKER_COLOR,
  END_MARKER_COLOR,
  ROUTE_COLOR
} from '../utils/constants';

/**
 * Khởi tạo bản đồ Leaflet
 */
export const initializeMap = (container) => {
  // KHÔNG CẦN KIỂM TRA window.L nữa
  // const L = window.L; <-- XÓA DÒNG NÀY
  const map = L.map(container).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.tileLayer(OSM_TILE_URL, {
    attribution: MAP_ATTRIBUTION,
    maxZoom: 19
  }).addTo(map);

  return map;
};

/**
 * Tạo marker trên bản đồ
 */
export const createMarker = (position, label, color) => {
  if (!window.L) return null;

  const L = window.L;
  const icon = L.divIcon({
    html: createMarkerIcon(label, color),
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });

  return L.marker(position, { icon });
};

/**
 * Tạo marker điểm bắt đầu
 */
export const createStartMarker = (position) => {
  return createMarker(position, 'A', START_MARKER_COLOR);
};

/**
 * Tạo marker điểm kết thúc
 */
export const createEndMarker = (position) => {
  return createMarker(position, 'B', END_MARKER_COLOR);
};

/**
 * Vẽ route lên bản đồ
 */
export const drawRoute = (map, coordinates) => {
  if (!window.L || !map) return null;

  const L = window.L;
  return L.polyline(coordinates, {
    color: ROUTE_COLOR,
    weight: 5,
    opacity: 0.7
  }).addTo(map);
};

/**
 * Fit bản đồ để hiển thị toàn bộ route
 */
export const fitBounds = (map, startPoint, endPoint) => {
  if (!window.L || !map) return;

  const L = window.L;
  const bounds = L.latLngBounds([startPoint, endPoint]);
  map.fitBounds(bounds, { padding: [50, 50] });
};