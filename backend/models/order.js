const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  transporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Transit Requested', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  vehicleType: {
    type: String,
    enum: ['motorcycle', 'auto', 'pickup', 'tractor', 'truck'],
    default: 'motorcycle'
  },
  shippingAddress: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  currentLocation: {
    name: { type: String, default: "Seller Warehouse" },
    latitude: { type: Number, default: 27.56 },
    longitude: { type: Number, default: 80.68 }
  },
  review: {
    rating: { type: Number, default: 0 },
    comment: { type: String, default: "" },
    createdAt: { type: Date }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
