const mongoose = require("mongoose");

async function connectDB() {
  const dbUrl = process.env.ATLASDB_URL;
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB Atlas successfully");
  } catch (err) {
    console.error("DB connection error, attempting fallback to memory server:", err.message);
    try {
      await mongoose.disconnect();
      console.log("Loading mongodb-memory-server...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`Starting in-memory MongoDB at ${mongoUri}`);
      await mongoose.connect(mongoUri);
      console.log("Connected to in-memory MongoDB!");
    } catch (fallbackErr) {
      console.error("Failed to start in-memory MongoDB, attempting local MongoDB:", fallbackErr.message);
      try {
        await mongoose.disconnect();
        const localUri = "mongodb://127.0.0.1:27017/trishastik";
        await mongoose.connect(localUri);
        console.log("Connected to local MongoDB");
      } catch (localErr) {
        console.error("All DB connection attempts failed:", localErr.message);
        throw localErr;
      }
    }
  }
}

module.exports = connectDB;
