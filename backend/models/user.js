const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ["customer", "farmer", "admin", "agent", "fertilizer_seller", "instrument_seller", "transporter"],
    default: "customer"
  },
  fullName: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    default: ""
  },
  profilePhoto: {
    type: String,
    default: ""
  },
  address: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },
  latitude: {
    type: Number,
    default: 27.56
  },
  longitude: {
    type: Number,
    default: 80.68
  },
  farmingInfo: {
    cropTypes: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 }
  },
  landDetails: {
    farmArea: { type: Number, default: 0 },
    soilType: { type: String, default: "" },
    location: { type: String, default: "" }
  },
  cart: [{
    type: mongoose.Schema.Types.ObjectId,
    default: [],
    ref: 'Listing'
  }],
  order: [{
    type: mongoose.Schema.Types.ObjectId,
    default: [],
    ref: 'Listing'
  }]
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);  
module.exports = User;