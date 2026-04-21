const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  city: {
    type: String,
    default: "map-click"
  },

  lat: {
    type: Number,
    required: true
  },

  lon: {
    type: Number,
    required: true
  },

  weather_score: {
    type: Number,
    required: true
  },

  time_score: {
    type: Number,
    required: true
  },

  road_score: {
    type: Number,
    required: true
  },

  accident_score: {
    type: Number,
    required: true
  },

  risk_level: {
    type: String,
    enum: ["Low", "Medium", "High"],
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Prediction", predictionSchema);