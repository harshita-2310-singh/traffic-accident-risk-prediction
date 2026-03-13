const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/trafficDB");

const predictRoutes = require("./route/predictRoute");

app.use("/api", predictRoutes);

/* Serve frontend */
app.use(express.static(path.join(__dirname,"../client")));
app.get("/", (req,res)=>{
res.sendFile(path.join(__dirname,"../client/index.html"));
});

app.listen(5000,()=>{
console.log("Server running on port 5000");
});