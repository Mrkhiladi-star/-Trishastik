const mongoose = require("mongoose");
require("dotenv").config();

const dbUrl = process.env.ATLASDB_URL;

async function run() {
  try {
    console.log("Connecting to db:", dbUrl);
    await mongoose.connect(dbUrl);
    console.log("Connected! Dropping index...");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const hasVehicles = collections.some(c => c.name === "vehicles");

    if (hasVehicles) {
      const collection = db.collection("vehicles");
      const indexes = await collection.indexes();
      console.log("Current indexes on vehicles collection:", indexes);

      const regNumberIndex = indexes.find(idx => idx.name === "registrationNumber_1" || (idx.key && idx.key.registrationNumber));
      if (regNumberIndex) {
        console.log("Found registrationNumber unique index. Dropping it...");
        await collection.dropIndex(regNumberIndex.name);
        console.log("Index dropped successfully!");
      } else {
        console.log("No registrationNumber unique index found.");
      }
    } else {
      console.log("Vehicles collection does not exist yet.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
