import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaServer,
  FaBrain,
  FaBell,
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="logo">
        <span className="logo-icon"></span>
        <h3>Log Monitor</h3>
      </div>

      {/* Profile */}
      <div className="profile">
        {/* Ajout de la classe avatar pour ton CSS */}
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRClWfr44mjsFpTJj0eHHLDuPUSWdsWx8rKZpQ8O4AuIICXH2XelNVK15U&s" alt="user" className="avatar" />
        <div>
          <h4>Admin</h4>
          <p>AWS System</p>
        </div>
        <span className="status"></span>
      </div>

      {/* Menu */}
      <ul className="menu">
        {/* On utilise une fonction dans className pour appliquer "active" sur le li selon l'URL */}
        
        <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaChartLine />
              <span>Overview</span>
            </li>
          )}
        </NavLink>

        <NavLink to="/servers" style={{ textDecoration: 'none', color: 'inherit' }}>
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaServer />
              <span>Servers</span>
            </li>
          )}
        </NavLink>

        <NavLink to="/alerts" style={{ textDecoration: 'none', color: 'inherit' }}>
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaBell />
              <span>Alerts</span>
            </li>
          )}
        </NavLink>
      </ul>
    </div>
  );
};

export default Sidebar;