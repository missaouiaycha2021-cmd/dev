import React, { useState, useEffect } from "react";
import { FaServer, FaSearch, FaPlay } from "react-icons/fa";
import "./Overview.css";

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/servers");
      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error("Erreur de chargement :", err);
    }
    setLoading(false);
  };

  const handleDetect = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:5000/api/detect-anomalies", {
        method: "POST",
      });
      await fetchServers();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const filtered = servers.filter(s =>
    s.server_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="overview">
      <div className="header-section">
        <h2><FaServer /> Server Management - Détection Surcharge</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

          {/* ✅ NOUVEAU : Bouton Détecter */}
          <button
            onClick={handleDetect}
            disabled={loading}
            style={{
              display       : "flex",
              alignItems    : "center",
              gap           : "8px",
              padding       : "8px 16px",
              backgroundColor: loading ? "#ccc" : "#e74c3c",
              color         : "white",
              border        : "none",
              borderRadius  : "6px",
              cursor        : loading ? "not-allowed" : "pointer",
              fontWeight    : "bold"
            }}
          >
            
            <FaPlay />
            {loading ? "Détection..." : "Lancer Détection"}
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

      <div className="table" style={{ marginTop: "20px" }}>
        {loading && servers.length === 0 ? (
          <p>Chargement des données...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Server Name</th>
                <th>CPU %</th>
                <th>RAM %</th>
                <th>Network In</th>
                <th>Network Out</th>
                <th>Score</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((srv, i) => (
                <tr key={i}>
                  <td>{srv.server_name}</td>
                  <td>{srv.cpu_usage}%</td>
                  <td>{srv.ram_usage}%</td>
                  <td>{srv.network_in}</td>
                  <td>{srv.network_out}</td>

                  {/* ✅ NOUVEAU : Score */}
                  <td>{srv.score}</td>

                  {/* ✅ NOUVEAU : Couleur selon le niveau */}
                  <td className={
                    srv.prediction === "anomalie" ? "alert" : "ok"
                  }>
                    {srv.status}
                  </td>

                  <td>{new Date(srv.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ✅ NOUVEAU : Résumé en bas */}
        {servers.length > 0 && (
          <div style={{ marginTop: "15px", display: "flex", gap: "20px" }}>
            <span style={{ color: "green" }}>
              ✅ Normaux : {servers.filter(s => s.prediction === "normal").length}
            </span>
            <span style={{ color: "red" }}>
              🔴 Anomalies : {servers.filter(s => s.prediction === "anomalie").length}
            </span>
            <span>
              Total : {servers.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Servers;