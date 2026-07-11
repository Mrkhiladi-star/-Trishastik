const mongoose = require("mongoose");
require("dotenv").config();

const dbUrl = process.env.ATLASDB_URL;
const WeightRule = require("../models/weightRule");
const CategoryMarkup = require("../models/categoryMarkup");

async function run() {
  try {
    console.log("Connecting to Database:", dbUrl);
    await mongoose.connect(dbUrl);
    console.log("Connected successfully!");

    console.log("Deleting old weight rules...");
    const deletedRules = await WeightRule.deleteMany({});
    console.log(`Successfully deleted ${deletedRules.deletedCount} weight rules.`);

    console.log("Deleting old category markups...");
    const deletedMarkups = await CategoryMarkup.deleteMany({});
    console.log(`Successfully deleted ${deletedMarkups.deletedCount} category markups.`);

    console.log("Seeding new weight rules...");
    await WeightRule.insertMany([
      { minWeightKg: 0, maxWeightKg: 30, vehicleType: "two-wheeler", displayName: "Two Wheeler" },
      { minWeightKg: 30, maxWeightKg: 150, vehicleType: "three-wheeler", displayName: "Three Wheeler" },
      { minWeightKg: 150, maxWeightKg: 1000, vehicleType: "pickup", displayName: "Mini Pickup" },
      { minWeightKg: 1000, maxWeightKg: 3000, vehicleType: "mini-truck", displayName: "Small Truck" },
      { minWeightKg: 3000, maxWeightKg: 10000, vehicleType: "large-truck", displayName: "Large Truck" },
      { minWeightKg: 10000, maxWeightKg: 999999, vehicleType: "container", displayName: "Heavy Truck" }
    ]);
    console.log("New weight rules seeded!");

    console.log("Seeding new category markups...");
    await CategoryMarkup.insertMany([
      { category: "organic_product", markupPercentage: 1 },
      { category: "medicine_fertilizer", markupPercentage: 5 },
      { category: "instrument_sale", markupPercentage: 6 },
      { category: "instrument_rent", markupPercentage: 8 }
    ]);
    console.log("New category markups seeded!");

  } catch (err) {
    console.error("Database reseeding failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

run();
