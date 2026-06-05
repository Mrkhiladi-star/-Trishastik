const mongoose = require("mongoose");
require("dotenv").config();

const dbUrl = process.env.ATLASDB_URL;
const User = require("./models/user.js");

async function run() {
  try {
    console.log("Connecting to db:", dbUrl);
    await mongoose.connect(dbUrl);
    console.log("Connected! Fetching users...");
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
