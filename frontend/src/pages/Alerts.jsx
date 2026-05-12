import React, { useState, useEffect } from "react";
import { FaBell, FaExclamationTriangle, FaSync } from "react-icons/fa";
import "./Overview.css";

const Alerts = () => {
  const [alertLogs, setAlertLogs] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [filter, setFilter]       = useState("all");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res  = await fetch("http://10.0.3.13:5000/api/alerts");
      const data = await res.json();
      setAlertLogs(data);
    } catch (err) {
      console.error("Erreur chargement alertes :", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    // ✅ MODIFIÉ : rafraîchir toutes les 10 secondes (était 30s)
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alertLogs.filter(a =>
    filter === "all" ? true : a.level === filter
  );

  // identique à l'original
  const getColor = (level) => {
    if (level === "critical") return "#ef4444";
    if (level === "warning")  return "#f59e0b";
    return "#3b82f6";
  };

  const getBg = (level) => {
    if (level === "critical") return "#450a0a";
    if (level === "warning")  return "#451a03";
    return "#0f2a4a";
  };

  // ✅ AJOUTÉ : icône emoji selon le niveau
  const getIcon = (level) => {
    if (level === "critical") return "🔴";
    if (level === "warning")  return "🟠";
    return "🔵";
  };

  const criticalCount = alertLogs.filter(a => a.level === "critical").length;

  return (
    <div className="overview">

      {/* HEADER — identique */}
      <div className="header-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "white" }}>
          <FaBell style={{ color: "#ef4444", marginRight: "10px" }} />
          System Alerts

          {/* ✅ MODIFIÉ : badge clignotant si critiques */}
          {criticalCount > 0 && (
            <span style={{
              background   : "#ef4444",
              color        : "white",
              borderRadius : "50%",
              padding      : "2px 8px",
              fontSize     : "14px",
              marginLeft   : "10px",
              animation    : "pulse 1.5s infinite",
            }}>
              {criticalCount}
            </span>
          )}
        </h2>

        <div style={{ display: "flex", gap: "10px" }}>
          {/* Filtre — identique */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              background   : "#1e293b",
              color        : "white",
              border       : "none",
              padding      : "10px",
              borderRadius : "8px",
              cursor       : "pointer"
            }}
          >
            <option value="all">Tous</option>
            <option value="critical">Critique</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Bouton rafraîchir — identique */}
          <button
            onClick={fetchAlerts}
            disabled={loading}
            style={{
              background   : "#1e293b",
              color        : "white",
              border       : "none",
              padding      : "10px 15px",
              borderRadius : "8px",
              cursor       : "pointer"
            }}
          >
            <FaSync className={loading ? "spin" : ""} /> {loading ? "..." : "Rafraîchir"}
          </button>
        </div>
      </div>

      {/* RÉSUMÉ — ✅ MODIFIÉ : cliquable pour filtrer */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <span
          style={{ color: "#ef4444", cursor: "pointer", fontWeight: filter === "critical" ? "bold" : "normal", textDecoration: filter === "critical" ? "underline" : "none" }}
          onClick={() => setFilter(filter === "critical" ? "all" : "critical")}
        >
          🔴 Critiques : {criticalCount}
        </span>
        <span
          style={{ color: "#f59e0b", cursor: "pointer", fontWeight: filter === "warning" ? "bold" : "normal", textDecoration: filter === "warning" ? "underline" : "none" }}
          onClick={() => setFilter(filter === "warning" ? "all" : "warning")}
        >
          🟠 Warnings : {alertLogs.filter(a => a.level === "warning").length}
        </span>
        <span
          style={{ color: "#3b82f6", cursor: "pointer", fontWeight: filter === "info" ? "bold" : "normal", textDecoration: filter === "info" ? "underline" : "none" }}
          onClick={() => setFilter(filter === "info" ? "all" : "info")}
        >
          🔵 Info : {alertLogs.filter(a => a.level === "info").length}
        </span>
      </div>

      {/* LISTE DES ALERTES — même structure card, ajout score IA + icône niveau */}
      <div className="alerts-container" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {loading && alertLogs.length === 0 ? (
          <p style={{ color: "white" }}>Chargement des alertes...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "white" }}>✅ Aucune alerte</p>
        ) : (
          filtered.map((alert, i) => (
            <div key={alert.id || i} style={{
              background     : "#1e293b",
              padding        : "20px",
              borderRadius   : "12px",
              borderLeft     : `5px solid ${getColor(alert.level)}`,
              display        : "flex",
              justifyContent : "space-between",
              alignItems     : "center"
            }}>
              {/* GAUCHE */}
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <FaExclamationTriangle style={{ color: getColor(alert.level), fontSize: "20px" }} />
                <div>
                  <h4 style={{ color: "white", margin: 0 }}>{alert.server}</h4>
                  <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>{alert.message}</p>
                  <p style={{ color: getColor(alert.level), margin: "3px 0 0 0", fontSize: "12px" }}>
                    {alert.status}
                  </p>
                  {/* ✅ AJOUTÉ : score IA sous le statut */}
                  {alert.score !== undefined && (
                    <p style={{ color: "#64748b", margin: "3px 0 0 0", fontSize: "11px" }}>
                      Score IA :&nbsp;
                      <span style={{ color: getColor(alert.level), fontWeight: "bold" }}>
                        {alert.score}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* DROITE */}
              <div style={{ textAlign: "right" }}>
                {/* ✅ MODIFIÉ : badge avec emoji de niveau */}
                <span style={{
                  background    : getBg(alert.level),
                  color         : getColor(alert.level),
                  padding       : "4px 10px",
                  borderRadius  : "20px",
                  fontSize      : "12px",
                  textTransform : "uppercase",
                  fontWeight    : "bold"
                }}>
                  {getIcon(alert.level)} {alert.level}
                </span>
                <p style={{ color: "#64748b", fontSize: "12px", marginTop: "10px" }}>
                  {new Date(alert.time).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
