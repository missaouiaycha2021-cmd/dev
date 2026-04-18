import React from "react";
import { FaServer, FaExclamationTriangle, FaMicrochip, FaExclamationCircle } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./Overview.css";

const data = [
  { time: "10:00", cpu: 40, ram: 60 },
  { time: "10:05", cpu: 55, ram: 65 },
  { time: "10:10", cpu: 70, ram: 75 },
  { time: "10:15", cpu: 90, ram: 85 },
  { time: "10:20", cpu: 80, ram: 78 },
];

const Overview = () => {
  return (
    <div className="overview">

      {/* Cards */}
<div className="cards">
  <div className="card">
    <FaServer className="icon" />
    <div className="card-content">
      <span>Servers</span>
      <span className="value">10</span>
    </div>
  </div>

  <div className="card">
    <FaExclamationTriangle className="icon" />
    <div className="card-content">
      <span>Alerts</span>
      <span className="value">3</span>
    </div>
  </div>

  <div className="card">
    <FaMicrochip className="icon" />
    <div className="card-content">
      <span>CPU Avg</span>
      <span className="value">75%</span>
    </div>
  </div>

  <div className="card">
    <FaExclamationCircle className="icon" />
    <div className="card-content">
      <span>Risks</span>
      <span className="value">2</span>
    </div>
  </div>
</div>

      {/* Charts */}
      <div className="charts">
        <div className="chart-box">
          <h3>CPU Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>RAM Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ram" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom">

        {/* Alerts */}
        <div className="alerts">
          <h3>Recent Alerts</h3>
          <ul>
            <li>Server-1 → CPU &gt; 90%</li>
            <li>Server-2 → Error 500</li>
            <li>Server-3 → Memory High</li>
          </ul>
        </div>

        {/* Table */}
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
              <tr>
                <td>EC2-1</td>
                <td className="ok">OK</td>
                <td>40%</td>
                <td>60%</td>
              </tr>
              <tr>
                <td>EC2-2</td>
                <td className="alert">Alert</td>
                <td>95%</td>
                <td>88%</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Overview;