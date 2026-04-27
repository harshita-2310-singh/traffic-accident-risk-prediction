import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Load processed data
df = pd.read_csv("data/processed_data.csv")

# Features and target
X = df[['weather_score', 'time_score', 'accident_score', 'road_score']]
y = df['risk_level']

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train
model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)

# Test
y_pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "model/risk_model0.pkl")

print("Model saved!")