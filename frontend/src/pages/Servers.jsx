import React, { useState, useEffect } from "react";
import { FaServer, FaSearch, FaSync } from "react-icons/fa";
import "./Overview.css";

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://app-lb-1482715375.us-west-2.elb.amazonaws.com/api/servers");
      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error("Erreur de chargement :", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 300000);
    return () => clearInterval(interval);
  }, []);

  const filtered = servers.filter(s =>
    s.server_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getCpuColor = (cpu) => {
    if (cpu > 80) return "#ef4444";
    if (cpu > 50) return "#f97316";
    return "#22c55e";
  };

  const getScoreColor = (score) => {
    if (score < -0.15) return "#ef4444";
    if (score < -0.05) return "#f97316";
    if (score < 0.05)  return "#eab308";
    return "#22c55e";
  };

  const renderStatus = (status) => {
    if (!status) return null;
    if (status.includes("CRITIQUE")) return <span style={{ color: "#ef4444", fontWeight: "bold" }}>{status}</span>;
    if (status.includes("ANOMALIE")) return <span style={{ color: "#f97316", fontWeight: "bold" }}>⚡ {status}</span>;
    if (status.includes("ATTENTION")) return <span style={{ color: "#eab308", fontWeight: "bold" }}>{status}</span>;
    return <span style={{ color: "#22c55e", fontWeight: "bold" }}>{status}</span>;
  };

  return (
    <div className="overview">

      {/* HEADER */}
      <div className="servers-header">
        <div className="servers-title">
          <FaServer className="servers-title-icon" />
          <h2>Server Management</h2>
          <span className="servers-subtitle">Détection de Surcharge</span>
        </div>
        <div className="servers-actions">
          <button onClick={fetchServers} disabled={loading} className="refresh-btn">
            <FaSync className={loading ? "spin" : ""} />
            {loading ? "Chargement..." : "Actualiser"}
          </button>
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Rechercher un serveur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* RÉSUMÉ */}
      <div className="servers-summary">
        <div className="summary-item summary-normal">
          <span>Normaux : <strong>{servers.filter(s => s.prediction === "normal").length}</strong></span>
        </div>
        <div className="summary-item summary-attention">
          <span>Attention : <strong>{servers.filter(s => s.status?.includes("ATTENTION")).length}</strong></span>
        </div>
        <div className="summary-item summary-anomalie">
          <span>Anomalies : <strong>{servers.filter(s => s.prediction === "anomalie").length}</strong></span>
        </div>
        <div className="summary-item summary-total">
          <span>Total : <strong>{servers.length} instances</strong></span>
        </div>
      </div>

      {/* TABLE */}
      <div className="servers-table-wrapper">
        {loading && servers.length === 0 ? (
          <div className="loading-state">
            <FaSync className="spin" />
            <p>Chargement des données...</p>
          </div>
        ) : (
          <table className="servers-table">
            <thead>
              <tr>
                <th>Serveur</th>
                <th>CPU %</th>
                <th>RAM %</th>
                <th>Net In (MB)</th>
                <th>Net Out (MB)</th>
                <th>Disk Read</th>
                <th>Disk Write</th>
                <th>Score IA</th>
                <th>Statut</th>
                <th>Heure</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((srv, i) => (
                <tr key={i} className={srv.prediction === "anomalie" ? "row-anomalie" : "row-normal"}>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaServer style={{ color: "#ef4444" }} />
                      <span style={{ color: "white", fontWeight: "600" }}>{srv.server_name}</span>
                    </div>
                  </td>

                  <td>
                    <span className="badge" style={{ backgroundColor: getCpuColor(srv.cpu_usage) }}>
                      {srv.cpu_usage}%
                    </span>
                  </td>

                  <td>
                    <span className="badge" style={{
                      backgroundColor: srv.ram_usage > 80 ? "#ef4444" :
                                       srv.ram_usage > 60 ? "#f97316" : "#22c55e"
                    }}>
                      {srv.ram_usage}%
                    </span>
                  </td>

                  <td style={{ color: "white" }}>{srv.network_in} MB</td>
                  <td style={{ color: "white" }}>{srv.network_out} MB</td>
                  <td style={{ color: "white" }}>{srv.disk_read} MB</td>
                  <td style={{ color: "white" }}>{srv.disk_write} MB</td>

                  <td>
                    <span style={{ color: getScoreColor(srv.score), fontWeight: "bold" }}>
                      {srv.score}
                    </span>
                  </td>

                  <td>{renderStatus(srv.status)}</td>

                  <td style={{ color: "white", fontSize: "12px" }}>
                    {new Date(srv.timestamp).toLocaleTimeString()}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default Servers;