from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from model import predict_anomaly, predict_batch

app = Flask(__name__)
CORS(app)

# ====================== MONGO DB ======================
client = MongoClient("mongodb://localhost:27017/")
db = client["anomaly_db"]

servers_collection = db["servers"]
alerts_collection = db["alerts"]

# ====================== HOME ======================
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "✅ API Anomaly Detection en ligne",
        "version": "1.0",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

# ====================== TEST DB ======================
@app.route('/test-db', methods=['GET'])
def test_db():
    servers_collection.insert_one({
        "test": "ok",
        "time": datetime.now()
    })
    return jsonify({"message": "MongoDB fonctionne !"})

# ====================== SERVERS ======================
@app.route('/api/servers', methods=['GET'])
def get_servers():

    servers = [
        {"server_name": "Serveur-1", "cpu_usage": 85, "ram_usage": 90, "disk_usage": 70, "network_in": 400, "network_out": 300},
        {"server_name": "Serveur-2", "cpu_usage": 20, "ram_usage": 30, "disk_usage": 15, "network_in": 100, "network_out": 80},
        {"server_name": "Serveur-3", "cpu_usage": 95, "ram_usage": 98, "disk_usage": 90, "network_in": 900, "network_out": 850}
    ]

    results = []

    for srv in servers:

        pred = predict_anomaly({
            "CPU_Usage": srv["cpu_usage"],
            "Memory_Usage": srv["ram_usage"],
            "Disk_IO": srv["disk_usage"],
            "Network_IO": srv["network_in"]
        })

        record = {
            **srv,
            "prediction": "anomalie" if "ANOMALIE" in pred["status"] else "normal",
            "status": pred["status"],
            "score": pred["anomaly_score"],
            "timestamp": datetime.now().isoformat()
        }

        # 🔥 éviter doublons (clé serveur + timestamp logique)
        existing = servers_collection.find_one({
            "server_name": srv["server_name"],
            "cpu_usage": srv["cpu_usage"],
            "ram_usage": srv["ram_usage"]
        })

        if not existing:
            servers_collection.insert_one(record)

        results.append(record)

    return jsonify(results)

# ====================== ALERTS ======================
@app.route('/api/alerts', methods=['GET'])
def get_alerts():

    servers = [
        {"server_name": "EC2-1", "CPU_Usage": 95, "Memory_Usage": 98, "Disk_IO": 90, "Network_IO": 85},
        {"server_name": "EC2-2", "CPU_Usage": 45, "Memory_Usage": 60, "Disk_IO": 30, "Network_IO": 400},
        {"server_name": "EC2-3", "CPU_Usage": 78, "Memory_Usage": 82, "Disk_IO": 75, "Network_IO": 60},
        {"server_name": "RDS-DB", "CPU_Usage": 20, "Memory_Usage": 30, "Disk_IO": 15, "Network_IO": 10},
    ]

    alerts = []

    for srv in servers:

        pred = predict_anomaly(srv)

        if "CRITIQUE" in pred["status"]:
            level = "critical"
            message = "Anomalie critique détectée"
        elif "ANOMALIE" in pred["status"]:
            level = "warning"
            message = "Anomalie détectée"
        else:
            level = "info"
            message = "Système normal"

        alert = {
            "server": srv["server_name"],
            "message": message,
            "level": level,
            "status": pred["status"],
            "score": pred["anomaly_score"],
            "time": pred["timestamp"]
        }

        # 🔥 éviter doublons alerts
        existing = alerts_collection.find_one({
            "server": alert["server"],
            "score": alert["score"]
        })

        if not existing:
            alerts_collection.insert_one(alert)

        alerts.append(alert)

    # tri priorité
    alerts.sort(key=lambda x: (
        0 if x["level"] == "critical" else
        1 if x["level"] == "warning" else 2
    ))

    return jsonify(alerts)

# ====================== PREDICT ======================
@app.route('/predict', methods=['POST'])
def predict():

    data = request.get_json()

    if not data:
        return jsonify({"error": "Aucune donnée"}), 400

    result = predict_anomaly(data)
    return jsonify(result)

# ====================== BATCH ======================
@app.route('/predict/batch', methods=['POST'])
def predict_batch_route():

    data = request.get_json()

    if not isinstance(data, list):
        return jsonify({"error": "Liste requise"}), 400

    results = predict_batch(data)

    return jsonify({
        "total": len(results),
        "results": results
    })

# ====================== STATS ======================
@app.route('/stats', methods=['GET'])
def stats():
    return jsonify({
        "features": ["CPU", "RAM", "DISK", "NETWORK"],
        "model": "Isolation Forest",
        "status": "active"
    })

# ====================== RUN ======================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)