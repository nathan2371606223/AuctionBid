import React, { useEffect, useState } from "react";
import PlayerList from "./components/PlayerList";
import TokenGate from "./components/TokenGate";
import Announcement from "./components/Announcement";
import { getStoredToken, setStoredToken } from "./services/api";

function App() {
  const [tokenReady, setTokenReady] = useState(!!getStoredToken());
  const [prefillToken, setPrefillToken] = useState("");

  // Support ?token=... to prefill
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setPrefillToken(urlToken);
    }
  }, []);

  const handleValidated = (token) => {
    setStoredToken(token);
    setTokenReady(true);
  };

  // When token missing, show gate
  if (!tokenReady) {
    return <TokenGate initialToken={prefillToken} onValidated={handleValidated} />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Announcement />
      <div
        style={{
          backgroundColor: "#333",
          color: "white",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center"
        }}
      >
        <a
          href={import.meta.env.VITE_LEAGUE_BUDGET_VISITOR_URL || "https://nathan2371606223.github.io/LeagueBudget/visitor"}
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
      </div>
      <PlayerList onAuthError={() => setTokenReady(false)} />
    </div>
  );
}

export default App;
