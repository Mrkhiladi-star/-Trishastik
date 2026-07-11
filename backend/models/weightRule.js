const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const weightRuleSchema = new Schema({
  minWeightKg: {
    type: Number,
    required: true
  },
  maxWeightKg: {
    type: Number,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['two-wheeler', 'three-wheeler', 'pickup', 'tata-ace', 'mini-truck', 'large-truck', 'refrigerated-truck', 'container'],
    required: true
  },
  displayName: {
    type: String,
    required: true
  }
});

const WeightRule = mongoose.model("WeightRule", weightRuleSchema);
module.exports = WeightRule;
