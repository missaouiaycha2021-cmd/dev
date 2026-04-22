import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview"; 
import Servers from "./pages/Servers";
import Alerts from "./pages/Alerts";         


function App() {
  return (
    <Router>
      {/* On utilise le fond sombre #0f172a pour que tout soit uni */}
      <div style={{ display: "flex", background: "#0f172a", minHeight: "100vh" }}>
        
        {/* La Sidebar reste fixe à gauche */}
        <Sidebar />

        {/* Le contenu à droite (on enlève le padding pour coller à la sidebar) */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;