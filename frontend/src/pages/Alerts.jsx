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
      const res  = await fetch("http://localhost:5000/api/alerts");
      const data = await res.json();
      setAlertLogs(data);
    } catch (err) {
      console.error("Erreur chargement alertes :", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alertLogs.filter(a =>
    filter === "all" ? true : a.level === filter
  );

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

  return (
    <div className="overview">

      {/* HEADER */}
      <div className="header-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "white" }}>
          <FaBell style={{ color: "#ef4444", marginRight: "10px" }} />
          System Alerts
          {/* Compteur critiques */}
          {alertLogs.filter(a => a.level === "critical").length > 0 && (
            <span style={{
              background   : "#ef4444",
              color        : "white",
              borderRadius : "50%",
              padding      : "2px 8px",
              fontSize     : "14px",
              marginLeft   : "10px"
            }}>
              {alertLogs.filter(a => a.level === "critical").length}
            </span>
          )}
        </h2>

        <div style={{ display: "flex", gap: "10px" }}>
          {/* Filtre */}
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

          {/* Bouton rafraîchir */}
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
            <FaSync /> {loading ? "..." : "Rafraîchir"}
          </button>
        </div>
      </div>

      {/* RÉSUMÉ */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <span style={{ color: "#ef4444" }}>
          🔴 Critiques : {alertLogs.filter(a => a.level === "critical").length}
        </span>
        <span style={{ color: "#f59e0b" }}>
          🟠 Warnings : {alertLogs.filter(a => a.level === "warning").length}
        </span>
        <span style={{ color: "#3b82f6" }}>
          🔵 Info : {alertLogs.filter(a => a.level === "info").length}
        </span>
      </div>

      {/* LISTE DES ALERTES */}
      <div className="alerts-container" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {loading && alertLogs.length === 0 ? (
          <p style={{ color: "white" }}>Chargement des alertes...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "white" }}>✅ Aucune alerte</p>
        ) : (
          filtered.map((alert) => (
            <div key={alert.id} style={{
              background     : "#1e293b",
              padding        : "20px",
              borderRadius   : "12px",
              borderLeft     : `5px solid ${getColor(alert.level)}`,
              display        : "flex",
              justifyContent : "space-between",
              alignItems     : "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <FaExclamationTriangle style={{ color: getColor(alert.level), fontSize: "20px" }} />
                <div>
                  <h4 style={{ color: "white", margin: 0 }}>{alert.server}</h4>
                  <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>{alert.message}</p>
                  <p style={{ color: getColor(alert.level), margin: "3px 0 0 0", fontSize: "12px" }}>
                    {alert.status}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{
                  background    : getBg(alert.level),
                  color         : getColor(alert.level),
                  padding       : "4px 10px",
                  borderRadius  : "20px",
                  fontSize      : "12px",
                  textTransform : "uppercase",
                  fontWeight    : "bold"
                }}>
                  {alert.level}
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