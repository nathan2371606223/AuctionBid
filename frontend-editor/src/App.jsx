import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import ChangePassword from "./components/ChangePassword";
import PlayerManager from "./components/PlayerManager";
import ExportButtons from "./components/ExportButtons";

function App() {
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("players");
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <div
        style={{
          backgroundColor: "#333",
          color: "white",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", gap: "20px" }}>
          <button
            onClick={() => setActiveTab("players")}
            style={{
              backgroundColor: activeTab === "players" ? "#555" : "transparent",
              color: "white",
              border: "none",
              padding: "5px 15px",
              cursor: "pointer"
            }}
          >
            球员管理
          </button>
          <button
            onClick={() => setActiveTab("export")}
            style={{
              backgroundColor: activeTab === "export" ? "#555" : "transparent",
              color: "white",
              border: "none",
              padding: "5px 15px",
              cursor: "pointer"
            }}
          >
            导出数据
          </button>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowChangePassword(true)}
            style={{
              backgroundColor: "transparent",
              color: "white",
              border: "1px solid white",
              padding: "5px 15px",
              cursor: "pointer"
            }}
          >
            修改密码
          </button>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              color: "white",
              border: "1px solid white",
              padding: "5px 15px",
              cursor: "pointer"
            }}
          >
            退出
          </button>
        </div>
      </div>

      {showChangePassword ? (
        <ChangePassword token={token} onClose={() => setShowChangePassword(false)} />
      ) : activeTab === "players" ? (
        <PlayerManager token={token} />
      ) : (
        <ExportButtons token={token} />
      )}
    </div>
  );
}

export default App;
