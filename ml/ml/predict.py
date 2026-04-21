from flask import Flask, request, jsonify
import pickle
import pandas as pd

app = Flask(__name__)

model = pickle.load(open("model.pkl", "rb"))

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    weather = data['weather_score']
    time = data['time_score']
    accident = data['accident_score']
    road = data['road_score']

    input_data = pd.DataFrame([{
        'weather_score': weather,
        'time_score': time,
        'accident_score': accident,
        'road_score': road
    }])

    result = model.predict(input_data)[0]

    return jsonify({
        "risk": result
    })

if __name__ == "__main__":
    app.run(port=5001)