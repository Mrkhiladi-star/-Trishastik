const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  name: String,
  description: String,
  Post: String,
 
  });
   
const Review = mongoose.model("Review", listingSchema);
module.exports = Review;
  
 