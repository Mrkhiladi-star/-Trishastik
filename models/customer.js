const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  name: String,
  address: String,
  totalamount: Number,
  phone: Number,
  products: String,
  });
   
const Customer = mongoose.model("Customer", listingSchema);
module.exports = Customer;
  
 