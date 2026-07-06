const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/user");
const Listing = require("../models/listing");
const Vehicle = require("../models/vehicle");

async function seedData() {
  await connectDB();

  console.log("Fetching users to assign listing ownership...");
  const krishna = await User.findOne({ username: "Shri Krishna" });
  const ram = await User.findOne({ username: "Ram" });
  const sewak = await User.findOne({ username: "Ramsewak" });
  const yadav = await User.findOne({ username: "Yadav" });
  const ashwani = await User.findOne({ username: "Ashwani" });
  const sanjay = await User.findOne({ username: "Sanjay" });
  const anuj = await User.findOne({ username: "Anuj" });
  const saurabh = await User.findOne({ username: "Saurabh" });

  if (!krishna || !ashwani || !sanjay) {
    console.error("Critical sellers not found in the database. Please check usernames.");
    await mongoose.disconnect();
    return;
  }

  console.log("Clearing any stray listings to prevent duplicates...");
  await Listing.deleteMany({});
  await Vehicle.deleteMany({});

  const listings = [
    // Farmer organic products (krishna)
    {
      title: "Fresh Organic Wheat",
      description: "High-grade organic Sharbati wheat, harvested fresh, rich in nutrition.",
      price: 28,
      category: "organic_product",
      priceUnit: "kg",
      location: "Sitapur Rural, UP",
      latitude: 27.56,
      longitude: 80.68,
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400",
      owner: krishna._id
    },
    {
      title: "Premium Basmati Rice",
      description: "Aromatic long grain organic Basmati rice, aged perfectly.",
      price: 75,
      category: "organic_product",
      priceUnit: "kg",
      location: "Sitapur Rural, UP",
      latitude: 27.56,
      longitude: 80.68,
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400",
      owner: krishna._id
    },
    // Farmer organic products (ram)
    {
      title: "Organic Red Potatoes",
      description: "Freshly harvested red potatoes, zero pesticides used.",
      price: 18,
      category: "organic_product",
      priceUnit: "kg",
      location: "Khairabad, UP",
      latitude: 27.53,
      longitude: 80.75,
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400",
      owner: ram ? ram._id : krishna._id
    },
    // Farmer organic products (sewak)
    {
      title: "Pure Mustard Oil Honey",
      description: "Natural raw honey extracted from mustard farm fields.",
      price: 320,
      category: "organic_product",
      priceUnit: "kg",
      location: "Laharpur, UP",
      latitude: 27.71,
      longitude: 80.90,
      image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&q=80&w=400",
      owner: sewak ? sewak._id : krishna._id
    },
    // Fertilizer Seller (ashwani)
    {
      title: "Bio-NPK Organic Fertilizer",
      description: "Balanced nitrogen, phosphorus, and potassium mix for healthy crop growth.",
      price: 450,
      category: "medicine_fertilizer",
      priceUnit: "piece",
      location: "Sitapur Chowk, UP",
      latitude: 27.57,
      longitude: 80.66,
      image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=400",
      owner: ashwani._id
    },
    {
      title: "Premium Neem Cake Powder",
      description: "Natural pest repellent and nitrogen enrichment organic manure.",
      price: 190,
      category: "medicine_fertilizer",
      priceUnit: "piece",
      location: "Sitapur Chowk, UP",
      latitude: 27.57,
      longitude: 80.66,
      image: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400",
      owner: ashwani._id
    },
    // Instrument Seller (sanjay)
    {
      title: "Mahindra Tractor 4WD",
      description: "High power heavy-duty tractor, available for daily rental service.",
      price: 600,
      category: "instrument_rent",
      priceUnit: "hour",
      location: "Sitapur Industrial Area",
      latitude: 27.58,
      longitude: 80.70,
      image: "https://images.unsplash.com/photo-1594136976553-6a9b42217c0a?auto=format&fit=crop&q=80&w=400",
      owner: sanjay._id
    },
    {
      title: "Handheld Crop Cutter & Weeder",
      description: "Portable fuel-efficient cutter for fast harvesting.",
      price: 2500,
      category: "instrument_sale",
      priceUnit: "piece",
      location: "Sitapur Industrial Area",
      latitude: 27.58,
      longitude: 80.70,
      image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=400",
      owner: sanjay._id
    }
  ];

  await Listing.insertMany(listings);
  console.log(`Successfully seeded ${listings.length} listings!`);

  // Seed default vehicle configurations for transporters
  if (anuj) {
    const vAnuj = new Vehicle({
      transporter: anuj._id,
      vehicleType: "pickup",
      registrationNumber: "UP-32-AN-9999",
      capacityKg: 1500,
      isAvailable: true,
      pricePerKm: 20,
      minCharge: 80,
      loadingCharge: 150,
      driverDetails: {
        name: "Anuj Kumar",
        phone: anuj.phone || "9876543210",
        licenseNumber: "DL-32ANUJ12345"
      }
    });
    await vAnuj.save();
    console.log("Seeded vehicle for transporter Anuj.");
  }

  if (saurabh) {
    const vSaurabh = new Vehicle({
      transporter: saurabh._id,
      vehicleType: "three-wheeler",
      registrationNumber: "UP-32-SA-8888",
      capacityKg: 600,
      isAvailable: true,
      pricePerKm: 12,
      minCharge: 50,
      loadingCharge: 80,
      driverDetails: {
        name: "Saurabh Sharma",
        phone: saurabh.phone || "9876543211",
        licenseNumber: "DL-32SAURABH123"
      }
    });
    await vSaurabh.save();
    console.log("Seeded vehicle for transporter Saurabh.");
  }

  await mongoose.disconnect();
  console.log("Database restore complete!");
}

seedData().catch(async (err) => {
  console.error("Seeding failed:", err);
  await mongoose.disconnect();
});
