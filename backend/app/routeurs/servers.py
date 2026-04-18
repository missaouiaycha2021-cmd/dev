# backend/app/routers/servers.py

from fastapi import APIRouter, HTTPException
import json
from ..database import predictions_collection
from ..model import predict_anomaly
from datetime import datetime

router = APIRouter(
    prefix="/api",
    tags=["servers"]          # Pour mieux organiser la doc Swagger
)

@router.post("/detect-anomalies")
async def detect_anomalies():
    """Lire le fichier JSON, faire la prédiction avec le modèle IA et sauvegarder dans MongoDB"""
    try:
        with open("data/servers_data.json", "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        # Prédiction avec ton modèle
        predictions = predict_anomaly(raw_data)

        # Sauvegarde dans MongoDB
        if predictions:
            # Ajouter un timestamp si ton modèle ne l'a pas fait
            for p in predictions:
                if "timestamp" not in p:
                    p["timestamp"] = datetime.utcnow()

            await predictions_collection.insert_many(predictions)

        return {
            "status": "success",
            "message": "Détection d'anomalies terminée",
            "nombre_serveurs_analysés": len(predictions),
            "predictions": predictions
        }

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Le fichier servers_data.json est introuvable dans le dossier data/")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur : {str(e)}")


@router.get("/servers")
async def get_all_predictions():
    """Récupérer toutes les prédictions stockées dans MongoDB"""
    try:
        cursor = predictions_collection.find().sort("timestamp", -1)
        results = await cursor.to_list(length=200)

        # Convertir ObjectId en string (obligatoire pour React)
        for doc in results:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))