const express = require("express");
const router = express.Router();

const Prediction = require("../modal/prediction");


// Prediction API
router.post("/predict", async (req,res)=>{

const {city,time,weather,road_type,traffic_density} = req.body;

let risk="Low";

if(weather==="Rainy" && traffic_density==="High"){
risk="High";
}
else if(traffic_density==="Medium"){
risk="Medium";
}

const newPrediction = new Prediction({
city,
time,
weather,
road_type,
traffic_density,
risk_level:risk
});

await newPrediction.save();

res.json({risk});

});


// Analytics API
router.get("/analytics", async (req,res)=>{

const low = await Prediction.countDocuments({risk_level:"Low"});
const medium = await Prediction.countDocuments({risk_level:"Medium"});
const high = await Prediction.countDocuments({risk_level:"High"});

res.json({low,medium,high});

});

module.exports = router;