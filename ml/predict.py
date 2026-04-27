from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load trained model
model = joblib.load("model/risk_model.pkl")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        # Create dataframe in same order as training
        features = pd.DataFrame([{
            "weather_score": data["weather_score"],
            "time_score": data["time_score"],
            "accident_score": data["accident_score"],
            "road_score": data["road_score"]
        }])

        # Predict
        prediction = model.predict(features)[0]

        return jsonify({
            "risk": prediction
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)