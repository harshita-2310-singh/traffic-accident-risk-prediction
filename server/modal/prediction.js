const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({

city:String,
time:String,
weather:String,
road_type:String,
traffic_density:String,
risk_level:String,
created_at:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Prediction",PredictionSchema);