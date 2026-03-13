let map = L.map('map').setView([20.5937,78.9629],5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);

let marker;
let chart;

document.getElementById("predictionForm").addEventListener("submit", async function(e){

e.preventDefault();

const city = document.getElementById("city").value;
const time = document.getElementById("time").value;
const weather = document.getElementById("weather").value;
const road_type = document.getElementById("road").value;
const traffic_density = document.getElementById("traffic").value;


const res = await fetch("/api/predict",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
city,
time,
weather,
road_type,
traffic_density
})

});

const data = await res.json();

showRisk(data.risk);

updateMap(city,data.risk);

loadChart();

});


function showRisk(risk){

const box = document.getElementById("riskBox");

box.innerHTML = "Predicted Risk: " + risk;

if(risk==="High") box.style.background="red";
else if(risk==="Medium") box.style.background="orange";
else box.style.background="green";

}


async function updateMap(city,risk){

const geo = await fetch(`https://nominatim.openstreetmap.org/search?city=${city}&format=json`);

const data = await geo.json();

if(data.length===0) return;

const lat = data[0].lat;
const lon = data[0].lon;

map.setView([lat,lon],12);

if(marker) marker.remove();

let color="green";

if(risk==="High") color="red";
if(risk==="Medium") color="orange";

marker = L.circleMarker([lat,lon],{

color:color,
radius:10

}).addTo(map);

}


async function loadChart(){

const res = await fetch("/api/analytics");

const data = await res.json();

const ctx = document.getElementById("chart");

if(chart) chart.destroy();

chart = new Chart(ctx,{

type:"pie",

data:{

labels:["Low","Medium","High"],

datasets:[{

data:[data.low,data.medium,data.high]

}]

}

});

}