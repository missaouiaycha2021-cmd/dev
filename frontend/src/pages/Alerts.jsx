import React from "react";
import { FaBell, FaExclamationTriangle, FaFilter } from "react-icons/fa";
import "./Overview.css";

const Alerts = () => {
  const alertLogs = [
    { id: 1, server: "EC2-1", message: "CPU Usage critical > 95%", level: "critical", time: "2 mins ago" },
    { id: 2, server: "EC2-2", message: "High latency on port 80", level: "warning", time: "12 mins ago" },
    { id: 3, server: "RDS-DB", message: "Unusual connection spike", level: "warning", time: "1 hour ago" },
    { id: 4, server: "EC2-1", message: "System reboot detected", level: "info", time: "3 hours ago" },
  ];

  return (
    <div className="overview">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'white' }}><FaBell style={{ color: '#ef4444', marginRight: '10px' }}/> System Alerts</h2>
        <button style={{ background: '#1e293b', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}>
          <FaFilter /> Filter Logs
        </button>
      </div>

      <div className="alerts-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {alertLogs.map((alert) => (
          <div key={alert.id} style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            borderLeft: `5px solid ${alert.level === 'critical' ? '#ef4444' : alert.level === 'warning' ? '#f59e0b' : '#3b82f6'}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FaExclamationTriangle style={{ color: alert.level === 'critical' ? '#ef4444' : '#f59e0b', fontSize: '20px' }} />
              <div>
                <h4 style={{ color: 'white', margin: 0 }}>{alert.server}</h4>
                <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>{alert.message}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                background: alert.level === 'critical' ? '#450a0a' : '#451a03', 
                color: alert.level === 'critical' ? '#ef4444' : '#f59e0b',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}>
                {alert.level}
              </span>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '10px' }}>{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;