const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/user");
const Vehicle = require("../models/vehicle");
const Order = require("../models/order");
const { getDistanceKm, VEHICLE_MAPPING } = require("../utils/distance");

async function debugMatch() {
  await connectDB();
  
  // Find a recent order to test
  const order = await Order.findOne({}).populate("seller").populate("buyer");
  if (!order) {
    console.log("No orders found in database to debug with!");
    await mongoose.disconnect();
    return;
  }
  
  console.log(`\nDebugging Match for Order ID: ${order._id}`);
  console.log(`Buyer: ${order.buyer?.username || "None"}`);
  console.log(`Seller: ${order.seller?.username || "None"}`);
  
  const sellerLat = order.seller?.latitude || 27.56;
  const sellerLon = order.seller?.longitude || 80.68;
  console.log(`Seller Coordinates: Lat = ${sellerLat}, Lon = ${sellerLon}`);
  
  const requestedVehicleType = "tata-ace"; // We test Tata Ace requested by seller
  const matchingTypes = VEHICLE_MAPPING[requestedVehicleType] || ["two-wheeler"];
  console.log(`Requested Vehicle Type: "${requestedVehicleType}"`);
  console.log(`Mapped Vehicle Types to Match: [${matchingTypes.join(", ")}]`);
  
  const transporters = await User.find({ role: "transporter" });
  console.log(`Found ${transporters.length} transporters in database.`);
  
  for (const trans of transporters) {
    const transLat = trans.latitude || 27.56;
    const transLon = trans.longitude || 80.68;
    const distToSeller = getDistanceKm(transLat, transLon, sellerLat, sellerLon);
    
    console.log(`\n- Transporter: ${trans.username}`);
    console.log(`  Coordinates: Lat = ${transLat}, Lon = ${transLon}`);
    console.log(`  Distance to Seller: ${distToSeller.toFixed(2)} KM`);
    
    const vehicles = await Vehicle.find({ transporter: trans._id });
    console.log(`  Has ${vehicles.length} vehicle profiles registered:`);
    for (const v of vehicles) {
      console.log(`    * Reg: ${v.registrationNumber}, Type: "${v.vehicleType}", Available: ${v.isAvailable}`);
    }
    
    let matchedVehicle = await Vehicle.findOne({
      transporter: trans._id,
      vehicleType: { $in: matchingTypes },
      isAvailable: true
    });
    
    console.log(`  Direct Match Query (available + type match): ${matchedVehicle ? "SUCCESS (" + matchedVehicle.vehicleType + ")" : "FAILED"}`);
    
    if (!matchedVehicle) {
      const anyVehicle = await Vehicle.findOne({ transporter: trans._id });
      if (!anyVehicle) {
        console.log("  Seeding Fallback: True (transporter has no vehicle at all)");
      } else {
        console.log(`  Seeding Fallback: False (transporter already has vehicle of type "${anyVehicle.vehicleType}")`);
        console.log(`  Check: isAvailable=${anyVehicle.isAvailable}, matchingTypes.includes("${anyVehicle.vehicleType}")=${matchingTypes.includes(anyVehicle.vehicleType)}`);
      }
    }
  }
  
  await mongoose.disconnect();
}

debugMatch().catch(console.error);
