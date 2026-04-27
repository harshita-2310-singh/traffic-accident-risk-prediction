require("dotenv").config();
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const Prediction = require("../modal/prediction");

// WEATHER FUNCTION
async function getWeatherScore(lat, lon) {
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.cod !== 200) return 1;

    let score = 1;
    const condition = data.weather?.[0]?.main;

    if (condition === "Rain") score += 1;
    if (condition === "Thunderstorm") score += 2;
    if (condition === "Fog" || condition === "Mist") score += 2;

    if (data.main?.temp > 310) score += 1;
    if (data.main?.humidity > 85) score += 1;

    if (data.visibility && data.visibility < 4000) score += 1;

    return Math.min(score, 3);

  } catch (err) {
    console.log("Weather error:", err.message);
    return 1;
  }
}



// ROAD TYPE 

async function getRoadScore(lat, lon) {
  const query = `
    [out:json];
    way(around:50, ${lat}, ${lon})["highway"];
    out tags;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: {
        "User-Agent": "traffic-app"
      }
    });

    const data = await res.json();

    if (!data.elements.length) return 2;

    const roads = data.elements.slice(0, 5);

    let score = 0;

    roads.forEach(r => {
      const type = r.tags.highway;

      if (["motorway", "trunk"].includes(type)) score += 1;
      else if (["primary", "secondary"].includes(type)) score += 2;
      else score += 3;
    });

    return Math.round(score / roads.length);

  } catch (err) {
    console.log("Road API error:", err.message);
    return 2;
  }
}



// TRAFFIC 

function getTrafficScore(lat, lon, hour) {
  let base = 1;

  if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) base = 3;
  else if (hour >= 12 && hour <= 16) base = 2;

 
  const variation = Math.abs(Math.floor(lat * lon)) % 2;

  return Math.min(3, base + variation);
}


// MAIN ROUTE

router.post("/predict", async (req, res) => {

  const { city, lat, lon } = req.body;
  try {

    let finalLat = lat;
    let finalLon = lon;

  
    // CITY 

    if (!finalLat || !finalLon) {
      if (!city) return res.status(400).json({ error: "Location required" });

      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${city}&format=json`,
        { headers: { "User-Agent": "traffic-app" } }
      );

      const geoData = await geoRes.json();

      if (!geoData.length) {
        return res.status(400).json({ error: "City not found" });
      }

      finalLat = parseFloat(geoData[0].lat);
      finalLon = parseFloat(geoData[0].lon);
    }

   
    // TIME
    const hour = new Date().getHours();
    const time_score = (hour >= 18 || hour <= 6) ? 2 : 1;

    // WEATHER
  
    const weather_score = await getWeatherScore(finalLat, finalLon);

    // TRAFFIC          

    const traffic_score = getTrafficScore(finalLat, finalLon, hour);

    // ROAD
  
    const road_type_score = await getRoadScore(finalLat, finalLon);

    const road_score = Math.round((road_type_score + traffic_score) / 2);

    
    // ACCIDENT 
  
    let accident_score = 0;

    accident_score += (traffic_score - 1);
    accident_score += Math.floor(weather_score / 2);

  
    if (Math.random() > 0.7) accident_score += 1;

    accident_score = Math.min(2, accident_score);

    // DEBUG LOG (IMPORTANT)

    console.log("Final Scores:", {
      weather_score,
      time_score,
      traffic_score,
      road_score,
      accident_score
    });


    // ML CALL

    const mlRes = await fetch(process.env.ML_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        weather_score,
        time_score,
        accident_score,
        road_score
      })
    });

    if (!mlRes.ok) {
      throw new Error("ML API failed");
    }

    const mlData = await mlRes.json();

    if (!["Low", "Medium", "High"].includes(mlData.risk)) {
      throw new Error("Invalid ML response");
    }

    const risk = mlData.risk;

   
    // SAVE TO DB
 
   const newPrediction = new Prediction({
  source: city ? "city" : "map",   
  city: city || null,

  lat: finalLat,
  lon: finalLon,

  weather_score,
  time_score,
  road_score,
  accident_score,
  risk_level: risk
  });
    await newPrediction.save();

  
    // RESPONSE 
    
    res.json({
      risk,
      location: {
        lat: finalLat,
        lon: finalLon
      },
      scores: {
        weather_score,
        accident_score,
        road_score
      },
      explanation: `Risk is ${risk} due to ${weather_score > 1 ? "weather conditions, " : ""}${traffic_score > 2 ? "high traffic, " : ""}${road_score > 2 ? "complex road type" : "normal conditions"}`
    });

  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: "Prediction failed" });
  }
});


// ANALYTICS

router.get("/analytics", async (req, res) => {
  try {
    const low = await Prediction.countDocuments({ risk_level: "Low" });
    const medium = await Prediction.countDocuments({ risk_level: "Medium" });
    const high = await Prediction.countDocuments({ risk_level: "High" });

    const total = low + medium + high;

    const percentages = {
      low: total ? ((low / total) * 100).toFixed(1) : 0,
      medium: total ? ((medium / total) * 100).toFixed(1) : 0,
      high: total ? ((high / total) * 100).toFixed(1) : 0
    };

    res.json({
      counts: { low, medium, high },
      percentages
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Analytics error" });
  }
});

module.exports = router;
