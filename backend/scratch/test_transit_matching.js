const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/user");
const Order = require("../models/order");
const Vehicle = require("../models/vehicle");
const Listing = require("../models/listing");
const { getDistanceKm } = require("../utils/distance");

// Import target controllers / methods directly to test them!
const orderController = require("../controllers/order.controller");


async function runTests() {
  console.log("=========================================");
  console.log("STARTING LOGISTICS MATCHING INTEGRATION TESTS");
  console.log("=========================================");

  // Connect to isolated test database namespace
  const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/test_trishastik";
  console.log("Connecting to isolated test database space on MongoDB Atlas...");
  await mongoose.connect(dbUrl, { dbName: "test_trishastik" });
  console.log("Connected to test database successfully!");

  // Clear existing test documents (starts clean, but keeping code structure safe)
  await User.deleteMany({});
  await Order.deleteMany({});
  await Vehicle.deleteMany({});
  await Listing.deleteMany({});

  console.log("\n[1] Testing Geodetic Distance Calculations...");
  // Lucknow: 26.8467, 80.9462
  // Kanpur: 26.4499, 80.3319
  const distanceLucknowKanpur = getDistanceKm(26.8467, 80.9462, 26.4499, 80.3319);
  console.log(`Lucknow to Kanpur distance: ${distanceLucknowKanpur.toFixed(2)} KM`);
  if (distanceLucknowKanpur > 70 && distanceLucknowKanpur < 95) {
    console.log("✅ Geodetic distance calculations match expectations!");
  } else {
    throw new Error("❌ Distance calculation error!");
  }

  console.log("\n[2] Seeding Buyer, Seller, Listings, and Transporters...");
  // Create Seller in Lucknow (26.8467, 80.9462)
  const seller = new User({
    username: "test_seller",
    email: "seller@test.com",
    role: "farmer",
    fullName: "Agri Seller",
    phone: "9123456780",
    latitude: 26.8467,
    longitude: 80.9462,
    address: { street: "Hazratganj", city: "Lucknow", state: "UP", pincode: "226001" }
  });
  await seller.save();

  // Create Buyer in Kanpur (26.4499, 80.3319)
  const buyer = new User({
    username: "test_buyer",
    email: "buyer@test.com",
    role: "customer",
    fullName: "Customer Kanpur",
    phone: "9123456781",
    latitude: 26.4499,
    longitude: 80.3319,
    address: { street: "Kalyanpur", city: "Kanpur", state: "UP", pincode: "208001" }
  });
  await buyer.save();

  // Create Listing
  const listing = new Listing({
    title: "Organic Fertilizer Batch",
    description: "Premium compost",
    price: 1500,
    owner: seller._id,
    latitude: 26.8467,
    longitude: 80.9462
  });
  await listing.save();

  // Create Transporter A (Cheapest, 10 KM away from Seller, in Lucknow suburbs: 26.85, 80.85)
  // Distance: ~10 KM
  const transporterA = new User({
    username: "transporter_a",
    email: "trans_a@test.com",
    role: "transporter",
    fullName: "Transporter A (Close & Cheap)",
    phone: "9123456782",
    latitude: 26.85,
    longitude: 80.85
  });
  await transporterA.save();

  const vehicleA = new Vehicle({
    transporter: transporterA._id,
    vehicleType: "three-wheeler",
    registrationNumber: "UP-32-AA-1111",
    capacityKg: 500,
    isAvailable: true,
    pricePerKm: 10,
    minCharge: 40,
    loadingCharge: 50
  });
  await vehicleA.save();

  // Create Transporter B (More Expensive, 20 KM away from Seller, in Lucknow suburbs: 26.70, 80.80)
  // Distance: ~20 KM
  const transporterB = new User({
    username: "transporter_b",
    email: "trans_b@test.com",
    role: "transporter",
    fullName: "Transporter B (Close & Expensive)",
    phone: "9123456783",
    latitude: 26.70,
    longitude: 80.80
  });
  await transporterB.save();

  const vehicleB = new Vehicle({
    transporter: transporterB._id,
    vehicleType: "three-wheeler",
    registrationNumber: "UP-32-BB-2222",
    capacityKg: 500,
    isAvailable: true,
    pricePerKm: 25,
    minCharge: 100,
    loadingCharge: 150
  });
  await vehicleB.save();

  // Create Transporter C (Cheaper but far away, 75 KM away from Seller, in Kanpur suburbs: 26.46, 80.40)
  // Distance: ~75 KM (Matches only in 100 KM search radius)
  const transporterC = new User({
    username: "transporter_c",
    email: "trans_c@test.com",
    role: "transporter",
    fullName: "Transporter C (Far & Cheap)",
    phone: "9123456784",
    latitude: 26.46,
    longitude: 80.40
  });
  await transporterC.save();

  const vehicleC = new Vehicle({
    transporter: transporterC._id,
    vehicleType: "three-wheeler",
    registrationNumber: "UP-78-CC-3333",
    capacityKg: 500,
    isAvailable: true,
    pricePerKm: 8,
    minCharge: 30,
    loadingCharge: 30
  });
  await vehicleC.save();

  console.log("✅ Seeded users and vehicles successfully.");

  console.log("\n[3] Creating Order and Requesting Transit (50 KM search)...");
  const order = new Order({
    buyer: buyer._id,
    seller: seller._id,
    product: listing._id,
    price: listing.price,
    quantity: 1,
    shippingAddress: "Kalyanpur, Kanpur",
    phone: "9123456781",
    status: "Accepted",
    vehicleType: "three-wheeler",
    currentLocation: {
      name: "Seller Warehouse",
      latitude: listing.latitude,
      longitude: listing.longitude
    }
  });
  await order.save();

  // Mock sellerRequestTransit call behavior
  let responseData = null;
  const mockReq = {
    params: { id: order._id },
    user: { _id: seller._id, role: "farmer" },
    body: { vehicleType: "three-wheeler" }
  };
  const mockRes = {
    json: (data) => { responseData = data; }
  };
  const mockNext = (err) => { throw err; };

  await orderController.sellerRequestTransit(mockReq, mockRes, mockNext);

  if (!responseData || !responseData.success) {
    throw new Error("❌ Transit request failed!");
  }

  let updatedOrder = await Order.findById(order._id);
  console.log(`Order Transit Candidates Found: ${updatedOrder.transitCandidates.length}`);
  console.log(`Assigned Transporter: ${updatedOrder.transporter}`);
  
  if (updatedOrder.transporter.toString() === transporterA._id.toString()) {
    console.log("✅ Correctly matched Cheapest Transporter within 50KM (Transporter A)!");
  } else {
    throw new Error(`❌ Match failure: expected Transporter A, got: ${updatedOrder.transporter}`);
  }

  console.log("\n[4] Testing Transporter Rejection progression...");
  const mockReqReject = {
    params: { id: order._id },
    user: { _id: transporterA._id, role: "transporter", username: "transporter_a" }
  };
  const mockResReject = {
    json: (data) => { responseData = data; }
  };
  
  await orderController.transporterRejectDelivery(mockReqReject, mockResReject, mockNext);
  
  updatedOrder = await Order.findById(order._id);
  console.log(`Reassigned Transporter after Reject: ${updatedOrder.transporter}`);
  
  if (updatedOrder.transporter.toString() === transporterB._id.toString()) {
    console.log("✅ Reassigned to next candidate (Transporter B) successfully!");
  } else {
    throw new Error(`❌ Reassignment failure: expected Transporter B, got: ${updatedOrder.transporter}`);
  }

  console.log("\n[5] Testing Expiration / Timeout progression and 100 KM radius expansion...");
  const mockReqRejectB = {
    params: { id: order._id },
    user: { _id: transporterB._id, role: "transporter", username: "transporter_b" }
  };
  
  await orderController.transporterRejectDelivery(mockReqRejectB, mockResReject, mockNext);

  updatedOrder = await Order.findById(order._id);
  console.log(`Assigned Transporter after expanding radius: ${updatedOrder.transporter}`);
  console.log(`Search Radius: ${updatedOrder.transitRadius} KM`);

  if (updatedOrder.transitRadius === 100 && updatedOrder.transporter.toString() === transporterC._id.toString()) {
    console.log("✅ Successfully expanded radius to 100KM and routed to Transporter C!");
  } else {
    throw new Error(`❌ Expansion/routing failure: expected Transporter C in 100KM, got: ${updatedOrder.transporter}`);
  }

  console.log("\n[6] Testing on-the-fly vehicle generation fallback...");
  const transporterD = new User({
    username: "transporter_d",
    email: "trans_d@test.com",
    role: "transporter",
    fullName: "Transporter D (No Vehicle Profile)",
    phone: "9123456785",
    latitude: 26.85,
    longitude: 80.85
  });
  await transporterD.save();

  const orderD = new Order({
    buyer: buyer._id,
    seller: seller._id,
    product: listing._id,
    price: listing.price,
    quantity: 1,
    shippingAddress: "Kalyanpur, Kanpur",
    phone: "9123456781",
    status: "Accepted",
    vehicleType: "two-wheeler",
    currentLocation: {
      name: "Seller Warehouse",
      latitude: listing.latitude,
      longitude: listing.longitude
    }
  });
  await orderD.save();

  const mockReqD = {
    params: { id: orderD._id },
    user: { _id: seller._id, role: "farmer" },
    body: { vehicleType: "two-wheeler" }
  };

  await orderController.sellerRequestTransit(mockReqD, mockRes, mockNext);

  const matchedOrderD = await Order.findById(orderD._id);
  console.log(`Order D assigned transporter: ${matchedOrderD.transporter}`);
  
  const generatedVehicle = await Vehicle.findOne({ transporter: transporterD._id });
  if (generatedVehicle) {
    console.log(`✅ On-the-fly vehicle generated: ${generatedVehicle.registrationNumber}, Type: ${generatedVehicle.vehicleType}`);
  } else {
    throw new Error("❌ Fallback vehicle generation failed!");
  }

  console.log("\n=========================================");
  console.log("ALL INTEGRATION TESTS PASSED SUCCESSFULLY!");
  console.log("=========================================");

  // Cleanup and close connection
  await mongoose.disconnect();
}

runTests().catch(async (err) => {
  console.error("\n❌ TEST FAILURE:", err);
  await mongoose.disconnect();
  process.exit(1);
});
