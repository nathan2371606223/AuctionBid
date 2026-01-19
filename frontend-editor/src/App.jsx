import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import ChangePassword from "./components/ChangePassword";
import PlayerManager from "./components/PlayerManager";
import ExportButtons from "./components/ExportButtons";
import TokenAlerts from "./components/TokenAlerts";
import Announcement from "./components/Announcement";
import DeadlineManager from "./components/DeadlineManager";
import { setTokenExpiredHandler } from "./services/api";

function App() {
  // Initialize token from localStorage directly (like LeagueBudget does)
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [activeTab, setActiveTab] = useState("players");
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    // Set up token expiration handler
    setTokenExpiredHandler(() => {
      setToken(null);
    });
    
    // Listen for token changes from other modules/tabs
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        if (e.newValue) {
          // Token was set in another tab/module
          setToken(e.newValue);
        } else {
          // Token was removed in another tab/module
          setToken(null);
        }
      }
    };
    
    // Check token on window focus (for same-tab navigation)
    const handleFocus = () => {
      const currentToken = localStorage.getItem("token");
      setToken((prevToken) => {
        if (currentToken !== prevToken) {
          return currentToken || null;
        }
        return prevToken;
      });
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      setTokenExpiredHandler(null);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // Empty dependency array - only run once on mount

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
          <button
            onClick={() => setActiveTab("alerts")}
            style={{
              backgroundColor: activeTab === "alerts" ? "#555" : "transparent",
              color: "white",
              border: "none",
              padding: "5px 15px",
              cursor: "pointer"
            }}
          >
            令牌提醒
          </button>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a
            href={import.meta.env.VITE_LEAGUE_BUDGET_EDITOR_URL || "https://nathan2371606223.github.io/LeagueBudget/editor"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "white",
              textDecoration: "none",
              padding: "5px 10px",
              border: "1px solid white",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          >
            联赛预算
          </a>
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

      <Announcement token={token} />
      <DeadlineManager token={token} />
      {showChangePassword ? (
        <ChangePassword token={token} onClose={() => setShowChangePassword(false)} />
      ) : activeTab === "players" ? (
        <PlayerManager token={token} />
      ) : activeTab === "export" ? (
        <ExportButtons token={token} />
      ) : (
        <TokenAlerts token={token} />
      )}
    </div>
  );
}

export default App;
