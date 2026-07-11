const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
  transporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['two-wheeler', 'three-wheeler', 'pickup', 'tata-ace', 'mini-truck', 'large-truck', 'refrigerated-truck', 'container'],
    required: true
  },
  registrationNumber: {
    type: String,
    required: true
  },
  availableCount: {
    type: Number,
    default: 1
  },
  capacityKg: {
    type: Number,
    default: 500
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Custom multi-tier pricing structure
  pricePerKm: {
    type: Number,
    default: 15
  },
  minCharge: {
    type: Number,
    default: 50
  },
  loadingCharge: {
    type: Number,
    default: 100
  },
  waitingCharge: {
    type: Number,
    default: 50
  },
  nightSurcharge: {
    type: Number,
    default: 0
  },
  
  supportedServices: [{
    type: String,
    enum: ['standard', 'express', 'cold-chain'],
    default: ['standard']
  }],
  driverDetails: {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    licenseNumber: { type: String, default: "" }
  }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;
