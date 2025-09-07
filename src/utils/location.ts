/**
 * Tính khoảng cách giữa hai điểm tọa độ GPS bằng công thức Haversine.
 * @param lat1 Vĩ độ điểm 1
 * @param lon1 Kinh độ điểm 1
 * @param lat2 Vĩ độ điểm 2
 * @param lon2 Kinh độ điểm 2
 * @returns Khoảng cách tính bằng mét
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if ([lat1, lon1, lat2, lon2].some(val => typeof val !== 'number')) {
    throw new Error("Tọa độ phải là kiểu số (number).");
  }

  const R = 6371000; // Bán kính Trái Đất (mét)
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Khoảng cách theo mét
}