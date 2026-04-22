import React, { useState, useEffect } from "react";
import { FaServer, FaExclamationTriangle, FaMicrochip, FaExclamationCircle } from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from "recharts";
import "./Overview.css";

const Overview = () => {
  const [servers, setServers]   = useState([]);
  const [alerts, setAlerts]     = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchData = async () => {
    try {
      // Charger serveurs et alertes en même temps
      const [resServers, resAlerts] = await Promise.all([
        fetch("http://localhost:5000/api/servers"),
        fetch("http://localhost:5000/api/alerts")
      ]);

      const dataServers = await resServers.json();
      const dataAlerts  = await resAlerts.json();

      setServers(dataServers);
      setAlerts(dataAlerts);

      // Construire les données du graphique depuis les serveurs
      const chart = dataServers.map((srv, i) => ({
        time    : `Srv-${i + 1}`,
        cpu     : srv.cpu_usage,
        ram     : srv.ram_usage,
        disk    : srv.disk_usage,
        network : srv.network_in
      }));
      setChartData(chart);

    } catch (err) {
      console.error("Erreur chargement données :", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculs pour les cards
  const totalServers   = servers.length;
  const totalAlerts    = alerts.filter(a => a.level === "critical" || a.level === "warning").length;
  const avgCPU         = servers.length > 0
    ? (servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length).toFixed(1)
    : 0;
  const totalRisks     = alerts.filter(a => a.level === "critical").length;

  if (loading) {
    return <div style={{ color: "white", padding: "20px" }}>Chargement...</div>;
  }

  return (
    <div className="overview">

      {/* ✅ CARDS — données réelles */}
      <div className="cards">
        <div className="card">
          <FaServer className="icon" />
          <div className="card-content">
            <span>Servers</span>
            <span className="value">{totalServers}</span>
          </div>
        </div>

        <div className="card">
          <FaExclamationTriangle className="icon" />
          <div className="card-content">
            <span>Alerts</span>
            <span className="value" style={{ color: totalAlerts > 0 ? "#ef4444" : "white" }}>
              {totalAlerts}
            </span>
          </div>
        </div>

        <div className="card">
          <FaMicrochip className="icon" />
          <div className="card-content">
            <span>CPU Avg</span>
            <span className="value" style={{ color: avgCPU > 80 ? "#ef4444" : "#22c55e" }}>
              {avgCPU}%
            </span>
          </div>
        </div>

        <div className="card">
          <FaExclamationCircle className="icon" />
          <div className="card-content">
            <span>Risks</span>
            <span className="value" style={{ color: totalRisks > 0 ? "#ef4444" : "white" }}>
              {totalRisks}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ CHARTS — données réelles */}
      <div className="charts">
        <div className="chart-box">
          <h3>CPU Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>RAM Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="ram" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✅ BOTTOM — données réelles */}
      <div className="bottom">

        {/* Alertes récentes */}
        <div className="alerts">
          <h3>Recent Alerts</h3>
          <ul>
            {alerts.slice(0, 5).map((alert, i) => (
              <li key={i} style={{
                color : alert.level === "critical" ? "#ef4444" :
                        alert.level === "warning"  ? "#f59e0b" : "#3b82f6"
              }}>
                {alert.server} → {alert.message}
              </li>
            ))}
          </ul>
        </div>

        {/* Table des serveurs */}
        <div className="table">
          <h3>Servers Status</h3>
          <table>
            <thead>
              <tr>
                <th>Server</th>
                <th>Status</th>
                <th>CPU</th>
                <th>RAM</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((srv, i) => (
                <tr key={i}>
                  <td>{srv.server_name}</td>
                  <td className={srv.prediction === "anomalie" ? "alert" : "ok"}>
                    {srv.prediction === "anomalie" ? "⚠️ Alert" : "✅ OK"}
                  </td>
                  <td style={{ color: srv.cpu_usage > 80 ? "#ef4444" : "white" }}>
                    {srv.cpu_usage}%
                  </td>
                  <td style={{ color: srv.ram_usage > 80 ? "#ef4444" : "white" }}>
                    {srv.ram_usage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;