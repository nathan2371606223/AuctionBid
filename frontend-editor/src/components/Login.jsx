import React, { useState } from "react";
import { login } from "../services/api";

function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(password);
      if (result.token) {
        localStorage.setItem("token", result.token);
        onLogin(result.token);
      } else {
        setError(result.message || "登录失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <form onSubmit={handleSubmit} style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "4px" }}>
        <h2>登录</h2>
        <div style={{ marginBottom: "15px" }}>
          <label>密码：</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "200px", padding: "5px" }}
            required
          />
        </div>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: "8px 20px" }}>
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
}

export default Login;
