import pandas as pd

# Load dataset
df = pd.read_csv("data/accidents_india.csv")


# WEATHER SCORE
def get_weather_score(row):
    score = 1

    if row['weather'] == 'rain':
        score = 2
    if row['weather'] in ['fog', 'mist']:
        score = 3

    if row['visibility'] == 'low':
        score += 1

    return min(score, 3)


# TIME SCORE
def get_time_score(row):
    hour = row['hour']
    if hour >= 18 or hour <= 6:
        return 2
    return 1


# TRAFFIC SCORE
def get_traffic_score(row):
    hour = row['hour']

    if 8 <= hour <= 11 or 17 <= hour <= 21:
        return 3
    elif 12 <= hour <= 16:
        return 2
    return 1


# ROAD TYPE SCORE
def get_road_type_score(row):
    if row['road_type'] == 'highway':
        return 1
    elif row['road_type'] == 'urban':
        return 2
    return 3


# ACCIDENT SCORE
def get_accident_score(row):
    score = 0

    if row['traffic_score'] == 3:
        score += 2
    elif row['traffic_score'] == 2:
        score += 1

    if row['weather_score'] >= 2:
        score += 1

    if 8 <= row['hour'] <= 11:
        score += 1
    if 17 <= row['hour'] <= 21:
        score += 1

    if score >= 4:
        return 2
    elif score >= 2:
        return 1
    return 0


# RISK LEVEL
def classify_risk(score):
    if score < 0.3:
        return "Low"
    elif score < 0.7:
        return "Medium"
    return "High"


# Apply preprocessing
df['weather_score'] = df.apply(get_weather_score, axis=1)
df['time_score'] = df.apply(get_time_score, axis=1)
df['traffic_score'] = df.apply(get_traffic_score, axis=1)
df['road_type_score'] = df.apply(get_road_type_score, axis=1)

df['road_score'] = ((df['traffic_score'] + df['road_type_score']) / 2).round()

df['accident_score'] = df.apply(get_accident_score, axis=1)

df['risk_level'] = df['risk_score'].apply(classify_risk)

# Final columns
df = df[['weather_score', 'time_score', 'accident_score', 'road_score', 'risk_level']]

# Save processed file
df.to_csv("data/processed_data.csv", index=False)

print("Preprocessing complete!")