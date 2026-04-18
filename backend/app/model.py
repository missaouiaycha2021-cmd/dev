# backend/app/model.py
import joblib
import pandas as pd
from datetime import datetime
from typing import Dict, List

# ====================== CHARGEMENT ======================
# Chargé une seule fois au démarrage du serveur
try:
    model  = joblib.load("models/anomaly_model.joblib")
    scaler = joblib.load("models/scaler.joblib")
    print("✅ Modèle et Scaler chargés avec succès")
except:
    model  = None
    scaler = None
    print("⚠️ Modèle non trouvé. Lancez d'abord train_model.py")

# ====================== FEATURES ======================
# Doit être identique à train_model.py
FEATURES = ['CPU_Usage', 'Memory_Usage', 'Disk_IO', 'Network_IO', 'hour_of_day', 'day_of_week']

# ====================== PRÉDICTION ======================
def predict_anomaly(server: Dict) -> Dict:
    """
    Reçoit les métriques d'un serveur
    Retourne le statut : NORMAL / ATTENTION / ANOMALIE
    """

    if model is None or scaler is None:
        return {"status": "ERROR", "message": "Modèle non chargé"}

    # Récupérer timestamp → extraire heure et jour
    timestamp = pd.to_datetime(server.get("timestamp", datetime.now()))
    hour_of_day = timestamp.hour
    day_of_week = timestamp.dayofweek

    # Préparer les données
    X = pd.DataFrame([[
        server.get("CPU_Usage",    0),
        server.get("Memory_Usage", 0),
        server.get("Disk_IO",      0),
        server.get("Network_IO",   0),
        hour_of_day,
        day_of_week
    ]], columns=FEATURES)

    # Normaliser
    X_scaled = scaler.transform(X)

    # Prédire
    prediction = model.predict(X_scaled)[0]        # 1 = normal, -1 = anomalie
    score      = model.decision_function(X_scaled)[0]  # plus bas = plus anormal

    # ====================== RÉSULTAT ======================
    if prediction == -1:
        if score < -0.1:
            status = "🔴 ANOMALIE CRITIQUE"
            action = "Intervention immédiate requise"
        else:
            status = "🟠 ANOMALIE"
            action = "Vérifier le serveur"
    else:
        if score > 0.1:
            status = "✅ NORMAL"
            action = "Surveillance normale"
        else:
            status = "🟡 ATTENTION"
            action = "Surveiller de près"

    return {
        "timestamp"          : timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "status"             : status,
        "anomaly_score"      : round(float(score), 4),
        "recommended_action" : action,
        "current_CPU"        : server.get("CPU_Usage",    0),
        "current_Memory"     : server.get("Memory_Usage", 0),
        "current_Disk"       : server.get("Disk_IO",      0),
        "current_Network"    : server.get("Network_IO",   0),
        "hour_of_day"        : hour_of_day,
        "day_of_week"        : day_of_week
    }


def predict_batch(data_list: List[Dict]) -> List[Dict]:
    """
    Reçoit une liste de serveurs
    Retourne les résultats pour chacun
    """
    results = []
    for server in data_list:
        result = predict_anomaly(server)
        result["server_name"] = server.get("server_name", "Serveur inconnu")
        results.append(result)
    return results