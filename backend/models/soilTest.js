const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const soilTestSchema = new Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  farmArea: {
    type: Number,
    required: true
  },
  cropPlanned: {
    type: String,
    required: true
  },
  soilType: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  stateDistrictVillage: {
    type: String,
    required: true
  },
  additionalNotes: {
    type: String,
    default: ""
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  gataNumber: {
    type: String,
    default: ""
  },
  labFacility: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Sample Collected', 'Testing', 'Report Ready', 'Completed'],
    default: 'Pending'
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  labReportUrl: {
    type: String,
    default: ""
  },
  reportContent: {
    type: String,
    default: ""
  },
  recommendedFertilizers: {
    type: String,
    default: ""
  },
  aiAnalysis: {
    npkAnalysis: { type: String, default: "" },
    deficiencyExplanation: { type: String, default: "" },
    fertilizerRecommendation: { type: String, default: "" },
    organicImprovement: { type: String, default: "" },
    waterManagement: { type: String, default: "" },
    bestCrops: { type: String, default: "" }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  requestedAt: {
    type: Date,
    default: Date.now
  }
});

const SoilTest = mongoose.model("SoilTest", soilTestSchema);
module.exports = SoilTest;
