/**
 * Tính khoảng cách giữa hai tọa độ địa lý theo công thức Haversine.
 * @param {number} lat1 Vĩ độ điểm 1 (độ)
 * @param {number} lon1 Kinh độ điểm 1 (độ)
 * @param {number} lat2 Vĩ độ điểm 2 (độ)
 * @param {number} lon2 Kinh độ điểm 2 (độ)
 * @returns {number} Khoảng cách giữa 2 điểm (đơn vị: km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái đất (km)
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Tính khoảng cách giữa hai node OSM.
 * @param {Object} nodeA Node đầu, có { lat, lon }
 * @param {Object} nodeB Node cuối, có { lat, lon }
 * @returns {number} Khoảng cách (km)
 */
function distanceBetweenNodes(nodeA, nodeB) {
  return haversineDistance(nodeA.lat, nodeA.lon, nodeB.lat, nodeB.lon);
}

/**
 * Tính trung điểm giữa hai tọa độ (dùng khi vẽ đường tạm, hiển thị label,...)
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {{lat: number, lon: number}}
 */
function midpoint(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const λ1 = toRad(lon1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const Bx = Math.cos(φ2) * Math.cos(Δλ);
  const By = Math.cos(φ2) * Math.sin(Δλ);

  const φ3 = Math.atan2(
    Math.sin(φ1) + Math.sin(φ2),
    Math.sqrt((Math.cos(φ1) + Bx) ** 2 + By ** 2)
  );
  const λ3 = λ1 + Math.atan2(By, Math.cos(φ1) + Bx);

  return { lat: toDeg(φ3), lon: toDeg(λ3) };
}

module.exports = {
  haversineDistance,
  distanceBetweenNodes,
  midpoint,
};
