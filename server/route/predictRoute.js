const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const Prediction = require("../modal/prediction");


// =========================
// WEATHER FUNCTION
// =========================
async function getWeatherScore(lat, lon) {
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.cod !== 200) return 1;

    let score = 1;
    const condition = data.weather?.[0]?.main;

    if (condition === "Rain") score = 2;
    if (condition === "Fog" || condition === "Mist") score = 3;

    if (data.visibility && data.visibility < 5000) score += 1;

    return Math.min(score, 3);

  } catch (err) {
    console.log("Weather error:", err.message);
    return 1;
  }
}


// =========================
// ROAD TYPE (OpenStreetMap)
// =========================
async function getRoadScore(lat, lon) {
  const query = `
    [out:json];
    way(around:50, ${lat}, ${lon})["highway"];
    out tags;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    });

    const data = await res.json();

    if (!data.elements.length) return 2;

    const type = data.elements[0].tags.highway;

    if (["motorway", "trunk"].includes(type)) return 1;
    if (["primary", "secondary", "residential"].includes(type)) return 2;

    return 3;

  } catch (err) {
    console.log("Road API error:", err.message);
    return 2;
  }
}


// =========================
// TRAFFIC (TIME BASED IMPROVED)
// =========================
function getTrafficScore(hour) {
  if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) return 3;
  if (hour >= 12 && hour <= 16) return 2;
  return 1;
}


// =========================
// MAIN ROUTE
// =========================
router.post("/predict", async (req, res) => {

  const { city, lat, lon } = req.body;

  try {

    let finalLat = lat;
    let finalLon = lon;

    // CITY → LAT/LON
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

    // WEATHER
    const weather_score = await getWeatherScore(finalLat, finalLon);

    // TIME
    const hour = new Date().getHours();
    const time_score = (hour >= 18 || hour <= 6) ? 2 : 1;

    // TRAFFIC
    const traffic_score = getTrafficScore(hour);

    // ROAD
    const road_type_score = await getRoadScore(finalLat, finalLon);

    // COMBINE ROAD + TRAFFIC (for old model)
    const road_score = Math.round((road_type_score + traffic_score) / 2);

    // ACCIDENT SCORE
    let accident_score = 0;

    if (traffic_score === 3) accident_score += 2;
    else if (traffic_score === 2) accident_score += 1;

    if (weather_score >= 2) accident_score += 1;

    if (hour >= 8 && hour <= 11) accident_score += 1;
    if (hour >= 17 && hour <= 21) accident_score += 1;

    // Normalize (0–2)
    if (accident_score >= 4) accident_score = 2;
    else if (accident_score >= 2) accident_score = 1;
    else accident_score = 0;

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

    const mlData = await mlRes.json();
    const risk = mlData.risk || "Unknown";

    // SAVE
    const newPrediction = new Prediction({
      city: city || "map-click",
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
      weather_score,
      accident_score
    });

  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: "Prediction failed" });
  }
});


// =========================
// ANALYTICS
// =========================
router.get("/analytics", async (req, res) => {
  try {
    const low = await Prediction.countDocuments({ risk_level: "Low" });
    const medium = await Prediction.countDocuments({ risk_level: "Medium" });
    const high = await Prediction.countDocuments({ risk_level: "High" });

    res.json({ low, medium, high });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Analytics error" });
  }
});

module.exports = router;