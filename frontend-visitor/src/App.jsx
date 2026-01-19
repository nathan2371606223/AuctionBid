import React, { useEffect, useState } from "react";
import PlayerList from "./components/PlayerList";
import TokenGate from "./components/TokenGate";
import Announcement from "./components/Announcement";
import Countdown from "./components/Countdown";
import { getStoredToken, setStoredToken } from "./services/api";

function App() {
  // Check for admin token (JWT) first, then team token
  const adminToken = localStorage.getItem("token"); // JWT token from editor login
  const teamToken = getStoredToken(); // Team token
  const [tokenReady, setTokenReady] = useState(!!(adminToken || teamToken));
  const [prefillToken, setPrefillToken] = useState("");
  const [auctionExpired, setAuctionExpired] = useState(false);

  // Support ?token=... to prefill
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setPrefillToken(urlToken);
    }
  }, []);

  // Listen for admin token changes (when user logs in/out from editor site)
  useEffect(() => {
    const checkAdminToken = () => {
      const currentAdminToken = localStorage.getItem("token");
      const currentTeamToken = getStoredToken();
      const shouldBeReady = !!(currentAdminToken || currentTeamToken);
      
      // Update tokenReady state if it changed
      if (shouldBeReady !== tokenReady) {
        setTokenReady(shouldBeReady);
      }
    };

    // Check on storage change (when token is added/removed in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        checkAdminToken();
      }
    };

    // Check on window focus (catch cases where storage events don't fire)
    const handleFocus = () => {
      checkAdminToken();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [tokenReady]);

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
      <Countdown onExpiredChange={setAuctionExpired} />
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
      <PlayerList onAuthError={() => setTokenReady(false)} auctionExpired={auctionExpired} />
    </div>
  );
}

export default App;
