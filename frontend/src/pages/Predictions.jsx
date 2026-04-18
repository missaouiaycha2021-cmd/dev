import React from "react";
import { FaBrain, FaChartLine, FaRobot } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import "./Overview.css";

const predictionData = [
  { time: "11:00", probability: 0.15 },
  { time: "12:00", probability: 0.20 },
  { time: "13:00", probability: 0.65 },
  { time: "14:00", probability: 0.88 }, // Risque élevé prédit
  { time: "15:00", probability: 0.45 },
];

const Predictions = () => {
  return (
    <div className="overview">
      <div className="cards">
        <div className="card">
          <FaBrain className="icon" style={{ color: "#a855f7" }} />
          <div className="card-content">
            <span>Model Accuracy</span>
            <span className="value">94.2%</span>
          </div>
        </div>
        <div className="card">
          <FaRobot className="icon" style={{ color: "#6366f1" }} />
          <div className="card-content">
            <span>Next Risk Window</span>
            <span className="value">14:00 PM</span>
          </div>
        </div>
      </div>

      <div className="charts">
        <div className="chart-box" style={{ flex: 2 }}>
          <h3>Failure Probability Forecast (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={predictionData}>
              <defs>
                <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
              <Area type="monotone" dataKey="probability" stroke="#ef4444" fillOpacity={1} fill="url(#colorProb)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bottom">
        <div className="table" style={{ width: "100%" }}>
          <h3>AI Prediction Logs</h3>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Target Server</th>
                <th>Predicted Event</th>
                <th>Probability</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>11:45:02</td>
                <td>EC2-Web-Prod</td>
                <td style={{ color: "#22c55e" }}>Normal Operations</td>
                <td>12%</td>
              </tr>
              <tr>
                <td>11:50:00</td>
                <td>RDS-Database</td>
                <td style={{ color: "#ef4444" }}>Memory Leak Risk</td>
                <td>88%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Predictions;