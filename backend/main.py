from fastapi import FastAPI
from pydantic import BaseModel
import subprocess
import json
from typing import Dict, Any

app = FastAPI(
    title="Datacenter IA Backend",
    description="Backend pour le système de maintenance prédictive",
    version="1.0"
)

class Metrics(BaseModel):
    cpu: float
    ram: float
    disk: float
    net_in: float
    net_out: float

@app.get("/")
def home():
    return {
        "message": "Backend IA - Maintenance Prédictive Datacenters",
        "status": "online",
        "version": "1.0",
        "endpoints": {
            "predict": "POST /predict"
        }
    }

@app.post("/predict")
async def predict(metrics: Metrics) -> Dict[str, Any]:
    """
    Endpoint principal pour faire une prédiction IA
    """
    try:
        # Appel du script IA
        result = subprocess.run([
            "python", "../src/predict_anomaly.py",
            str(metrics.cpu),
            str(metrics.ram),
            str(metrics.disk),
            str(metrics.net_in),
            str(metrics.net_out)
        ], capture_output=True, text=True, timeout=10)

        output = result.stdout.strip()

        # Parser le JSON retourné par le script
        try:
            prediction = json.loads(output)
            return prediction
        except json.JSONDecodeError:
            return {
                "status": "ERROR",
                "message": "Le script IA n'a pas retourné un JSON valide",
                "raw_output": output[:500]  # limiter la taille
            }

    except subprocess.TimeoutExpired:
        return {"status": "ERROR", "message": "Le script IA a pris trop de temps"}
    except Exception as e:
        return {
            "status": "ERROR",
            "message": f"Erreur interne : {str(e)}"
        }

# Pour lancer avec uvicorn : uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
