import pandas as pd
import pickle

# Step 1: Load dataset
df = pd.read_csv("dataset/data.csv")

print("Dataset Loaded:")
print(df.head())

# Step 2: Select useful columns
df = df[['weather_score', 'time_score', 'accident_score', 'road_score', 'risk']]

# Step 3: Clean data
df = df.dropna()

# Step 4: Define features and target
X = df[['weather_score', 'time_score', 'accident_score', 'road_score']]
y = df['risk']

# Step 5: Split dataset
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Step 6: Train model
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

print("Model trained successfully!")

# Step 7: Check accuracy
from sklearn.metrics import accuracy_score

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("Model Accuracy:", accuracy)

# Step 8: Save model
pickle.dump(model, open("model.pkl", "wb"))

print("Model saved as model.pkl")