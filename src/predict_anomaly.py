"""
Script IA - Version propre pour Backend FastAPI
Retourne toujours du JSON
"""

import json
import sys
from datetime import datetime

def predict_anomaly(cpu: float, ram: float, disk: float, net_in: float, net_out: float):
    reasons = []
    
    if ram > 0.93:
        reasons.append("Saturation RAM imminente")
    if cpu > 0.78:
        reasons.append("Surcharge CPU prévue")
    if disk > 0.85:
        reasons.append("Utilisation disque élevée")

    if len(reasons) >= 2:
        status = "ANOMALIE"
        risk_level = "Critique"
        predicted_in = "dans les 30 minutes"
        action = "MIGRER IMMÉDIATEMENT la VM + scaler RAM"
    elif len(reasons) == 1:
        status = "ANOMALIE"
        risk_level = "Élevé"
        predicted_in = "dans 1 à 2 heures"
        action = "Migrer les workloads ou scaler les instances"
    else:
        status = "NORMAL"
        risk_level = "Faible"
        predicted_in = "Aucun risque visible"
        action = "Surveillance normale"

    return {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": status,
        "risk_level": risk_level,
        "predicted_in": predicted_in,
        "recommended_action": action,
        "reasons": reasons,
        "current_ram": round(ram, 2),
        "current_cpu": round(cpu, 2),
        "current_disk": round(disk, 2),
        "current_net_in": round(net_in, 2),
        "current_net_out": round(net_out, 2)
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            cpu = float(sys.argv[1])
            ram = float(sys.argv[2])
            disk = float(sys.argv[3])
            net_in = float(sys.argv[4])
            net_out = float(sys.argv[5])

            result = predict_anomaly(cpu, ram, disk, net_in, net_out)
            print(json.dumps(result, ensure_ascii=False))
        except Exception as e:
            error = {"status": "ERROR", "message": str(e)}
            print(json.dumps(error))
    else:
        # Mode test (quand on lance sans arguments)
        print(json.dumps({
            "message": "Backend IA prêt - Utilisez POST /predict avec cpu, ram, disk, net_in, net_out"
        }, ensure_ascii=False))
