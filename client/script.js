document.addEventListener("DOMContentLoaded", function () {

  console.log("Script loaded");

  let map = L.map('map').setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  let marker;
  let chart;


  // MAP CLICK → PREDICTION

  map.on("click", async function (e) {

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    console.log("Clicked:", lat, lon);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
       body: JSON.stringify({  
      lat,
      lon,
     time: "Day"
   })
      });

      const data = await res.json();

      showRisk(data.risk);
      updateMap(lat, lon, data.risk);
      loadChart();

      if (data.risk === "High") {
        alert("High Risk Area");
      }

    } catch (err) {
      console.error("Map click error:", err);
    }
  });

 
  // FORM SUBMIT (CITY INPUT)

  const form = document.getElementById("predictionForm");

  if (form) {
    form.addEventListener("submit", async function (e) {

      e.preventDefault();

      const city = document.getElementById("city").value.trim();

      if (!city) {
        alert("Please enter a city");
        return;
      }

      try {
        // Convert city → lat/lon
        const geo = await fetch(`https://nominatim.openstreetmap.org/search?city=${city}&format=json`);
        const geoData = await geo.json();

        if (!geoData.length) {
          alert("City not found");
          return;
        }

        const lat = geoData[0].lat;
        const lon = geoData[0].lon;

        const res = await fetch("/api/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            city,
            lat,
            lon,
            time: "Day"
          })
        });

        const data = await res.json();

        showRisk(data.risk);
        map.setView([lat, lon], 12);
        updateMap(lat, lon, data.risk);
        loadChart();

        if (data.risk === "High") {
          alert("High Risk Area");
        }

      } catch (err) {
        console.error("City submit error:", err);
      }

    });
  }

  // SHOW RESULT

  function showRisk(risk) {
    const box = document.getElementById("riskBox");

    box.innerHTML = "Predicted Risk: " + risk;

    if (risk === "High") box.style.background = "red";
    else if (risk === "Medium") box.style.background = "orange";
    else box.style.background = "green";
  }


  // UPDATE MAP

  function updateMap(lat, lon, risk) {

    if (marker) marker.remove();

    let color = "green";

    if (risk === "High") color = "red";
    if (risk === "Medium") color = "orange";

    marker = L.circleMarker([lat, lon], {
      color: color,
      radius: 10
    }).addTo(map);
  }

  // LOAD CHART (FROM DB)

  async function loadChart() {

  try {
    const res = await fetch("/api/analytics");
    const data = await res.json();

    const ctx = document.getElementById("chart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Low", "Medium", "High"],
        datasets: [{
          data: [
            Number(data.percentages.low),
            Number(data.percentages.medium),
            Number(data.percentages.high)
          ]
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label;
                const percent = context.raw;
                const count = data.counts[label.toLowerCase()];
                return `${label}: ${percent}% (${count})`;
              }
            }
          }
        }
      }
    });

  } catch (err) {
    console.error("Chart error:", err);
  }
}

  // LOAD CHART ON PAGE LOAD
 
  loadChart();

});
