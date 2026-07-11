const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  name: String,
  description: String,
  Post: String,
  rating: { type: Number, default: 5 }
});

const Review = mongoose.model("Review", listingSchema);
module.exports = Review;