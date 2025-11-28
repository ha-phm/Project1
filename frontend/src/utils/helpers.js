/**
 * Chuyển đổi khoảng cách từ mét sang km
 * {number} meters - Khoảng cách tính bằng mét
 * {string} - Khoảng cách tính bằng km với 2 chữ số thập phân
 */
export const metersToKm = (meters) => {
  return (meters / 1000).toFixed(2);
};

/**
 * Chuyển đổi thời gian từ giây sang phút
 * {number} seconds - Thời gian tính bằng giây
 * {number} - Thời gian tính bằng phút (làm tròn)
 */
export const secondsToMinutes = (seconds) => {
  return Math.round(seconds / 60);
};

/**
 * Chuyển đổi tọa độ GeoJSON sang Leaflet LatLng
 * {Array} coordinates - Mảng tọa độ [[lng, lat], ...]
 * {Array} - Mảng tọa độ [[lat, lng], ...]
 */
export const geoJSONToLeaflet = (coordinates) => {
  return coordinates.map(coord => [coord[1], coord[0]]);
};

/**
 * Kiểm tra xem Leaflet đã được load chưa
 * Trả về {boolean}
 */
export const isLeafletLoaded = () => {
  return typeof window !== 'undefined' && window.L !== undefined;
};