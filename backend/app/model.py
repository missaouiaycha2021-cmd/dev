# backend/app/model.py

import joblib
import pandas as pd
from datetime import datetime
from typing import Dict, List

# =========================================================
# LOAD MODEL + SCALER
# =========================================================
try:
    model = joblib.load("models/anomaly_model.joblib")
    scaler = joblib.load("models/scaler.joblib")

    print("✅ Modèle et scaler chargés avec succès")

except Exception as e:

    model = None
    scaler = None

    print(f"⚠️ Erreur chargement modèle : {e}")

# =========================================================
# FEATURES
# =========================================================
FEATURES = [
    'CPU_Usage',
    'Memory_Usage',
    'Disk_IO',
    'Network_IO',
    'hour_of_day',
    'day_of_week'
]

# =========================================================
# SINGLE PREDICTION
# =========================================================
def predict_anomaly(server: Dict) -> Dict:
    """
    Analyse un serveur et retourne :
    NORMAL / ATTENTION / ANOMALIE / CRITIQUE
    """

    # =====================================================
    # MODEL NOT LOADED
    # =====================================================
    if model is None or scaler is None:

        return {
            "status": "ERROR",
            "message": "Modèle non chargé"
        }

    try:

        # =================================================
        # TIMESTAMP
        # =================================================
        timestamp = pd.to_datetime(
            server.get("timestamp", datetime.now())
        )

        hour_of_day = timestamp.hour
        day_of_week = timestamp.dayofweek

        # =================================================
        # FEATURES DATAFRAME
        # =================================================
        X = pd.DataFrame([[
            server.get("CPU_Usage", 0),
            server.get("Memory_Usage", 0),
            server.get("Disk_IO", 0),
            server.get("Network_IO", 0),
            hour_of_day,
            day_of_week
        ]], columns=FEATURES)

        # =================================================
        # CLEAN VALUES
        # =================================================
        X["CPU_Usage"] = X["CPU_Usage"].clip(0, 100)

        X["Memory_Usage"] = X["Memory_Usage"].clip(0, 100)

        X["Disk_IO"] = X["Disk_IO"].clip(lower=0)

        X["Network_IO"] = X["Network_IO"].clip(lower=0)

        # =================================================
        # SCALING
        # =================================================
        X_scaled = scaler.transform(X[FEATURES])

        # =================================================
        # MODEL PREDICTION
        # =================================================
        prediction = model.predict(X_scaled)[0]

        score = model.decision_function(X_scaled)[0]

        score_value = round(float(score), 4)

        # =================================================
        # SMART STATUS LOGIC
        # =================================================
        if score_value < -0.15:

            status = "🔴 ANOMALIE CRITIQUE"

            action = "Intervention immédiate requise"

            prediction_label = "anomalie"

        elif score_value < -0.03:

            status = "🟠 ANOMALIE"

            action = "Vérifier le serveur"

            prediction_label = "anomalie"

        elif score_value < 0.02:

            status = "🟡 ATTENTION"

            action = "Surveiller de près"

            prediction_label = "normal"

        else:

            status = "🟢 NORMAL"

            action = "Surveillance normale"

            prediction_label = "normal"

        # =================================================
        # RETURN RESULT
        # =================================================
        return {

            "timestamp": timestamp.strftime(
                "%Y-%m-%d %H:%M:%S"
            ),

            "status": status,

            "prediction": prediction_label,

            "prediction_raw": int(prediction),

            "anomaly_score": score_value,

            "recommended_action": action,

            "current_CPU": round(
                float(server.get("CPU_Usage", 0)), 2
            ),

            "current_Memory": round(
                float(server.get("Memory_Usage", 0)), 2
            ),

            "current_Disk": round(
                float(server.get("Disk_IO", 0)), 2
            ),

            "current_Network": round(
                float(server.get("Network_IO", 0)), 2
            ),

            "hour_of_day": hour_of_day,

            "day_of_week": day_of_week
        }

    except Exception as e:

        return {
            "status": "ERROR",
            "message": str(e)
        }

# =========================================================
# BATCH PREDICTION
# =========================================================
def predict_batch(data_list: List[Dict]) -> List[Dict]:
    """
    Analyse plusieurs serveurs
    """

    results = []

    for server in data_list:

        result = predict_anomaly(server)

        result["server_name"] = server.get(
            "server_name",
            "Serveur inconnu"
        )

        results.append(result)

    return results