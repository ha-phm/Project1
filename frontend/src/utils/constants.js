// Tọa độ mặc định - Trung tâm Hai Bà Trưng, Hà Nội
export const DEFAULT_CENTER = [21.0122, 105.8522];
export const DEFAULT_ZOOM = 14;

// API URLs
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Map attribution
export const MAP_ATTRIBUTION = '© OpenStreetMap contributors';

// Route colors
export const ROUTE_COLOR = '#3b82f6';
export const START_MARKER_COLOR = '#22c55e';
export const END_MARKER_COLOR = '#ef4444';

// Marker icons HTML
export const createMarkerIcon = (label, color) => `
  <div style="
    background: ${color};
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  ">
    <div style="
      transform: rotate(45deg);
      margin-top: 6px;
      text-align: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    ">
      ${label}
    </div>
  </div>
`;