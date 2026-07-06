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
    enum: ['Pending', 'Accepted', 'Transit Requested', 'In Transit', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  vehicleType: {
    type: String,
    enum: ['two-wheeler', 'three-wheeler', 'pickup', 'tata-ace', 'mini-truck', 'large-truck', 'refrigerated-truck', 'container'],
    default: 'two-wheeler'
  },
  shippingAddress: {
    type: String,
    required: true
  },
  shippingLatitude: {
    type: Number,
    default: 27.56
  },
  shippingLongitude: {
    type: Number,
    default: 80.68
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
  deliveryPrice: {
    type: Number,
    default: 0
  },
  transitRadius: {
    type: Number,
    default: 50
  },
  currentCandidateIndex: {
    type: Number,
    default: 0
  },
  requestExpiresAt: {
    type: Date
  },
  transitCandidates: [{
    transporter: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    price: Number,
    distanceToSeller: Number,
    distanceBuyerSeller: Number,
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Timeout'],
      default: 'Pending'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRental: {
    type: Boolean,
    default: false
  },
  rentalStartDate: {
    type: Date
  },
  rentalEndDate: {
    type: Date
  },
  rentalDurationDays: {
    type: Number
  },
  rentalReturnStatus: {
    type: String,
    enum: ['None', 'Return Pending', 'Returned', 'Overdue'],
    default: 'None'
  },
  rentalOverdueCharges: {
    type: Number,
    default: 0
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
