# Traffic Accident Risk Prediction System

## Features
- Predicts risk (Low / Medium / High)
- Uses real-time weather API
- Road type detection using OpenStreetMap
- ML model for prediction
- MongoDB storage
- Analytics chart

---

## Setup

### 1. Backend
cd server  
npm install  
node server.js  

---

### 2. ML Model
cd ml  
python predict.py  

---

### 3. Frontend
Open index.html in browser  

---

##  Environment Variables

Create a `.env` file inside `server`:

MONGO_URI=your_mongo_url  
OPENWEATHER_API_KEY=your_api_key  
ML_API_URL=http://127.0.0.1:5001/predict  

---

## Team Collaboration
- Clone repo  
- Run `npm install`  
- Add `.env` file manually  

---

## Tech Stack
- Node.js + Express  
- MongoDB  
- Flask (ML API)  
- OpenStreetMap  
- OpenWeather API  
