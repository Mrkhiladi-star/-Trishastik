const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: String,
  description: String,
  video: String,
 
  });
   
const Education = mongoose.model("Education", listingSchema);
module.exports = Education;
  
 