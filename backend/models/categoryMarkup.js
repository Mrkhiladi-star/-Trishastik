const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categoryMarkupSchema = new Schema({
  category: {
    type: String,
    enum: ["organic_product", "medicine_fertilizer", "instrument_sale", "instrument_rent"],
    required: true,
    unique: true
  },
  markupPercentage: {
    type: Number,
    default: 5 // 5 represents 5%
  }
});

const CategoryMarkup = mongoose.model("CategoryMarkup", categoryMarkupSchema);
module.exports = CategoryMarkup;
