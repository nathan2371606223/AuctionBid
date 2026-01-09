import React, { useEffect, useState } from "react";
import PlayerList from "./components/PlayerList";
import TokenGate from "./components/TokenGate";
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
      <PlayerList onAuthError={() => setTokenReady(false)} />
    </div>
  );
}

export default App;
