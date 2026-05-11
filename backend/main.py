from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
from app.model import predict_anomaly, predict_batch
import boto3

# =========================================================
# FLASK APP
# =========================================================
app = Flask(__name__)
CORS(app)

# =========================================================
# MONGODB
# =========================================================
client = MongoClient("mongodb://10.0.3.99:27017/")
db = client["anomaly_db"]
servers_collection = db["servers"]
alerts_collection  = db["alerts"]

# =========================================================
# INSTANCES
# =========================================================
INSTANCES = [
    {"id": "i-07b5a2846931db56e", "name": "dashboard-az1"},
    {"id": "i-0efbcd8820b2fd4c3", "name": "backend-az1"},
    {"id": "i-0ed77ae255ac037f0", "name": "database"},
    {"id": "i-06f384db618a3408c", "name": "monitoring"},
]

# =========================================================
# CLOUDWATCH CLIENT
# =========================================================
def get_cloudwatch():
    return boto3.client(
        "cloudwatch",
        region_name="us-west-2"
    )

# =========================================================
# GET METRIC FUNCTION
# =========================================================
def get_metric(cloudwatch, metric_name, instance_id):
    response = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName=metric_name,
        Dimensions=[
            {
                'Name': 'InstanceId',
                'Value': instance_id
            }
        ],
        StartTime=datetime.utcnow() - timedelta(minutes=30),
        EndTime=datetime.utcnow(),
        Period=300,
        Statistics=['Average']
    )
    points = sorted(
        response['Datapoints'],
        key=lambda x: x['Timestamp']
    )
    return round(points[-1]['Average'], 2) if points else 0

# =========================================================
# HOME ROUTE
# =========================================================
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message"  : "✅ API Anomaly Detection en ligne",
        "version"  : "2.0",
        "status"   : "running",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

# =========================================================
# SERVERS ROUTE
# =========================================================
@app.route('/api/servers', methods=['GET'])
def get_servers():
    try:
        cloudwatch = get_cloudwatch()
        results    = []
        now        = datetime.now()

        for instance in INSTANCES:

            # =============================================
            # GET METRICS
            # =============================================
            cpu_value   = get_metric(cloudwatch, 'CPUUtilization', instance["id"])
            network_in  = get_metric(cloudwatch, 'NetworkIn',      instance["id"]) / 1024 / 1024
            network_out = get_metric(cloudwatch, 'NetworkOut',     instance["id"]) / 1024 / 1024
            disk_read   = get_metric(cloudwatch, 'EBSReadBytes',   instance["id"]) / 1024 / 1024
            disk_write  = get_metric(cloudwatch, 'EBSWriteBytes',  instance["id"]) / 1024 / 1024

            # =============================================
            # DEBUG TERMINAL
            # =============================================
            print(f"\n======= {instance['name']} =======")
            print(f"CPU         : {cpu_value}%")
            print(f"Network In  : {network_in:.4f} MB")
            print(f"Network Out : {network_out:.4f} MB")
            print(f"Disk Read   : {disk_read:.4f} MB")
            print(f"Disk Write  : {disk_write:.4f} MB")
            print("=====================================\n")

            # =============================================
            # Disk_IO  = disk_read + disk_write (MB)
            # Network_IO = network_in + network_out (MB)
            # =============================================
            disk_io    = round(min(disk_read  + disk_write,  69), 4)
            network_io = round(min(network_in + network_out, 42), 4)

            # =============================================
            # DATA FOR AI MODEL
            # =============================================
            model_data = {
                "CPU_Usage":    round(cpu_value, 2),
                "Memory_Usage": 50,
                "Disk_IO":      disk_io,
                "Network_IO":   network_io,
                "hour_of_day":  now.hour,
                "day_of_week":  now.weekday()
            }

            print("DATA SENT TO MODEL:")
            print(model_data)

            # =============================================
            # AI PREDICTION
            # =============================================
            pred = predict_anomaly(model_data)

            # =============================================
            # MODEL ERROR
            # =============================================
            if pred.get("status") == "ERROR":
                results.append({
                    "server_name": instance["name"],
                    "instance_id": instance["id"],
                    "cpu_usage":   cpu_value,
                    "ram_usage":   50,
                    "network_in":  round(network_in,  4),
                    "network_out": round(network_out, 4),
                    "disk_read":   round(disk_read,   4),
                    "disk_write":  round(disk_write,  4),
                    "disk_io":     disk_io,
                    "network_io":  network_io,
                    "prediction":  "unknown",
                    "status":      "⚠️ Model Error",
                    "score":       0,
                    "timestamp":   datetime.now().isoformat()
                })
                continue

            # =============================================
            # FINAL RECORD
            # =============================================
            record = {
                "server_name": instance["name"],
                "instance_id": instance["id"],
                "cpu_usage":   round(cpu_value, 2),
                "ram_usage":   50,
                "network_in":  round(network_in,  4),
                "network_out": round(network_out, 4),
                "disk_read":   round(disk_read,   4),
                "disk_write":  round(disk_write,  4),
                "disk_io":     disk_io,
                "network_io":  network_io,
                "prediction":  "anomalie" if "ANOMALIE" in pred["status"] else "normal",
                "status":      pred["status"],
                "score":       float(pred["anomaly_score"]),
                "timestamp":   datetime.now().isoformat()
            }

            # =============================================
            # SAVE TO MONGODB
            # =============================================
            servers_collection.insert_one(record)

            # =============================================
            # SAVE ALERT - SANS DOUBLONS
            # =============================================
            if "ANOMALIE" in pred["status"]:

                five_min_ago = (datetime.now() - timedelta(minutes=5)).isoformat()

                existing = alerts_collection.find_one({
                    "server": instance["name"],
                    "status": pred["status"],
                    "time":   {"$gte": five_min_ago}
                })

                if not existing:
                    level = "critical" if "CRITIQUE" in pred["status"] else "warning"
                    alert = {
                        "server":  instance["name"],
                        "message": f"CPU: {cpu_value}% | Net: {round(network_io, 2)} MB | Disk: {round(disk_io, 2)} MB",
                        "level":   level,
                        "status":  pred["status"],
                        "score":   float(pred["anomaly_score"]),
                        "time":    datetime.now().isoformat()
                    }
                    alerts_collection.insert_one(alert)

            record.pop("_id", None)
            results.append(record)

        return jsonify(results)

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"status": "ERROR", "message": str(e)}), 500

# =========================================================
# ALERTS ROUTE
# =========================================================
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    alerts = list(
        alerts_collection
        .find({}, {"_id": 0})
        .sort("time", -1)
        .limit(50)
    )
    return jsonify(alerts)

# =========================================================
# CLEAR ALERTS
# =========================================================
@app.route('/api/alerts/clear', methods=['DELETE'])
def clear_alerts():
    alerts_collection.delete_many({})
    return jsonify({"message": "✅ Alertes supprimées"})

# =========================================================
# SINGLE PREDICTION
# =========================================================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Aucune donnée"}), 400
        result = predict_anomaly(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 500

# =========================================================
# BATCH PREDICTION
# =========================================================
@app.route('/predict/batch', methods=['POST'])
def predict_batch_route():
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({"error": "Liste requise"}), 400
        results = predict_batch(data)
        return jsonify({"total": len(results), "results": results})
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 500

# =========================================================
# STATS ROUTE
# =========================================================
@app.route('/stats', methods=['GET'])
def stats():
    return jsonify({
        "features":       ["CPU_Usage", "Memory_Usage", "Disk_IO", "Network_IO", "hour_of_day", "day_of_week"],
        "model":          "Isolation Forest",
        "status":         "active",
        "database":       "MongoDB",
        "cloud_provider": "AWS",
        "instances":      [i["name"] for i in INSTANCES],
        "timestamp":      datetime.now().isoformat()
    })

# =========================================================
# RUN APP
# =========================================================
if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )