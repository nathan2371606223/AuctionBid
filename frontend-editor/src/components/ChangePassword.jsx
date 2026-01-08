import React, { useState } from "react";
import { changePassword } from "../services/api";

function ChangePassword({ token, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("新密码与确认密码不匹配");
      return;
    }

    if (newPassword.length < 3) {
      setError("新密码至少需要3个字符");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(token, oldPassword, newPassword);
      setSuccess(result.message || "密码修改成功");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "修改密码失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>修改密码</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>原密码：</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={{ width: "100%", padding: "5px" }}
            required
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>新密码：</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: "5px" }}
            required
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>确认新密码：</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: "5px" }}
            required
          />
        </div>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        {success && <div style={{ color: "green", marginBottom: "10px" }}>{success}</div>}
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" disabled={loading} style={{ padding: "8px 20px" }}>
            {loading ? "修改中..." : "修改密码"}
          </button>
          <button type="button" onClick={onClose} style={{ padding: "8px 20px" }}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePassword;
