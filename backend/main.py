from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from .database import predictions_collection
from .model import predict_anomaly
from .schemas import Prediction

app = FastAPI(title="PFA Détection Surcharge Serveurs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173/"],  # Ton React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/detect-anomalies")
async def detect_anomalies():
    # Charger les données du JSON (pour test local)
    with open("data/servers_data.json", "r") as f:
        raw_data = json.load(f)
    
    predictions = predict_anomaly(raw_data)
    
    # Sauvegarder dans MongoDB
    await predictions_collection.insert_many(predictions)
    
    return {"message": "Détection terminée", "predictions": predictions}

@app.get("/api/servers")
async def get_all_predictions():
    cursor = predictions_collection.find().sort("timestamp", -1)
    results = await cursor.to_list(length=100)
    # Convertir ObjectId en str si besoin
    for doc in results:
        doc["_id"] = str(doc["_id"])
    return results