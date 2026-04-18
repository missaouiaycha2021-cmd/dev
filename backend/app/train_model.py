# backend/app/train_model.py
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

# ====================== CHARGEMENT DES DONNÉES ======================
print("🔄 Chargement du dataset...")

df = pd.read_csv('cloud_dataset.csv')

# ====================== NETTOYAGE ======================
print("🧹 Nettoyage des données...")

# Parser Timestamp
df['Timestamp'] = pd.to_datetime(df['Timestamp'])
df = df.sort_values('Timestamp').reset_index(drop=True)

# Supprimer colonnes inutiles
columns_to_drop = ['Workload_Type', 'User_ID', 'Anomaly_Label']
df = df.drop(columns=columns_to_drop, errors='ignore')

# Supprimer doublons et valeurs négatives
df = df.drop_duplicates().copy()
features_metriques = ['CPU_Usage', 'Memory_Usage', 'Disk_IO', 'Network_IO']
df = df[df[features_metriques].ge(0).all(axis=1)].copy()
df = df.dropna().copy()

print(f"✅ Données nettoyées : {len(df)} lignes")

# ====================== NORMALISATION ======================
print("📊 Normalisation...")

# Extraire heure et jour depuis Timestamp
df['hour_of_day'] = df['Timestamp'].dt.hour
df['day_of_week'] = df['Timestamp'].dt.dayofweek

# Normalisation des métriques
df['CPU_Usage']    = df['CPU_Usage'].clip(0, 100)
df['Memory_Usage'] = df['Memory_Usage'].clip(0, 100)
df['Disk_IO']      = (df['Disk_IO'] / df['Disk_IO'].max() * 100).clip(0, 100)
df['Network_IO']   = (df['Network_IO'] / df['Network_IO'].max() * 100).clip(0, 100)

# Features finales
features = ['CPU_Usage', 'Memory_Usage', 'Disk_IO', 'Network_IO', 'hour_of_day', 'day_of_week']
X = df[features].copy()

# ====================== ENTRAÎNEMENT ======================
print("🧠 Entraînement du modèle Isolation Forest...")

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

model = IsolationForest(
    n_estimators=300,
    contamination=0.08,
    random_state=42,
    n_jobs=-1
)

model.fit(X_scaled)
print("✅ Modèle entraîné avec succès")

# ====================== SAUVEGARDE ======================
print("💾 Sauvegarde du modèle...")

Path("models").mkdir(exist_ok=True)

joblib.dump(model,  "models/anomaly_model.joblib")
joblib.dump(scaler, "models/scaler.joblib")

print("✅ Sauvegarde terminée !")
print("   → models/anomaly_model.joblib")
print("   → models/scaler.joblib")
print(f"   → Features utilisées : {features}")