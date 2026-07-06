// Haversine formula to compute distance in KM between two sets of coordinates
function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

// Maps requested Order vehicleType enums to transporter Vehicle vehicleType enums
const VEHICLE_MAPPING = {
  "two-wheeler": ["two-wheeler"],
  "three-wheeler": ["three-wheeler"],
  "pickup": ["pickup", "tata-ace"],
  "tata-ace": ["tata-ace", "pickup"],
  "mini-truck": ["mini-truck"],
  "large-truck": ["large-truck", "container", "refrigerated-truck"],
  "refrigerated-truck": ["refrigerated-truck", "large-truck"],
  "container": ["container", "large-truck"]
};

module.exports = {
  getDistanceKm,
  VEHICLE_MAPPING,
};
