const mongoose = require("mongoose");
require("dotenv").config();

const dbUrl = process.env.ATLASDB_URL;
const User = require("./models/user.js");

async function run() {
  try {
    console.log("Connecting to db:", dbUrl);
    await mongoose.connect(dbUrl);
    console.log("Connected! Seeding default users...");

    // Delete existing admin if any to ensure credentials are updated
    await User.deleteOne({ username: "admin" });
    console.log("Deleted old admin if any");

    const adminUser = new User({
      username: "admin",
      email: "sramu1090@gmail.com",
      role: "admin",
      fullName: "Administrator"
    });
    await User.register(adminUser, "Mrkhiladi@123");
    console.log("Created admin user: admin/Mrkhiladi@123");

    // Check if agent exists
    const agentExists = await User.findOne({ username: "agent1" });
    if (!agentExists) {
      const agentUser = new User({
        username: "agent1",
        email: "agent1@trishastik.com",
        role: "agent",
        fullName: "Rohan Agent",
        phone: "9876543211"
      });
      await User.register(agentUser, "agent123");
      console.log("Created agent user: agent1 / agent123");
    } else {
      console.log("Agent user already exists");
    }

    // Check if farmer exists
    const farmerExists = await User.findOne({ username: "farmer1" });
    if (!farmerExists) {
      const farmerUser = new User({
        username: "farmer1",
        email: "farmer1@trishastik.com",
        role: "farmer",
        fullName: "Suresh Farmer",
        phone: "9876543212"
      });
      await User.register(farmerUser, "farmer123");
      console.log("Created farmer user: farmer1 / farmer123");
    } else {
      console.log("Farmer user already exists");
    }

  } catch (err) {
    console.error("Error seeding users:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
