const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: String,
  description: String,
  image: String,
  price: Number,
  category: {
    type: String,
    enum: ["organic_product", "medicine_fertilizer", "instrument_sale", "instrument_rent"],
    default: "organic_product"
  },
  location: { type: String, default: "" },
  latitude: { type: Number, default: 27.56 },
  longitude: { type: Number, default: 80.68 },
  priceUnit: {
    type: String,
    enum: ["kg", "quintal", "gram", "piece", "hour", "day"],
    default: "kg"
  },
  weightKg: {
    type: Number,
    default: 1.0
  },
  images: {
    type: [String],
    default: []
  },
  video: {
    type: String,
    default: ""
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});
   
const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;