import React, { useState, useEffect } from "react";
import { fetchDeadline, setDeadline } from "../services/api";

export default function DeadlineManager({ token }) {
  const [deadline, setDeadlineState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");

  useEffect(() => {
    if (token) {
      loadDeadline();
    }
  }, [token]);

  const loadDeadline = async () => {
    try {
      setLoading(true);
      const data = await fetchDeadline(token);
      if (data.deadline) {
        const deadlineDate = new Date(data.deadline);
        setDeadlineState(deadlineDate);
        // Set inputs to current deadline
        const dateStr = deadlineDate.toISOString().split("T")[0];
        const timeStr = deadlineDate.toTimeString().split(":").slice(0, 2).join(":");
        setDateInput(dateStr);
        setTimeInput(timeStr);
      } else {
        setDeadlineState(null);
        setDateInput("");
        setTimeInput("");
      }
    } catch (err) {
      console.error("Failed to load deadline:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDeadline = async () => {
    if (!dateInput || !timeInput) {
      setMessage("请选择日期和时间");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      const dateTimeStr = `${dateInput}T${timeInput}:00`;
      const deadlineDate = new Date(dateTimeStr);
      
      // Validate deadline is within 24 hours
      const now = new Date();
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (deadlineDate <= now) {
        setMessage("截止时间必须晚于当前时间");
        return;
      }

      if (diffHours > 24) {
        setMessage("截止时间必须在24小时内");
        return;
      }

      await setDeadline(token, deadlineDate.toISOString());
      setDeadlineState(deadlineDate);
      setMessage("截止时间已设置");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "设置失败");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDeadline = async () => {
    try {
      setSaving(true);
      setMessage("");
      await setDeadline(token, null);
      setDeadlineState(null);
      setDateInput("");
      setTimeInput("");
      setMessage("截止时间已清除");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "清除失败");
    } finally {
      setSaving(false);
    }
  };

  // Calculate min datetime (now) and max datetime (24 hours from now)
  const now = new Date();
  const maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const minDateStr = now.toISOString().split("T")[0];
  const minTimeStr = now.toTimeString().split(":").slice(0, 2).join(":");
  const maxDateStr = maxDate.toISOString().split("T")[0];
  const maxTimeStr = maxDate.toTimeString().split(":").slice(0, 2).join(":");

  if (loading) {
    return <div style={{ padding: "10px", backgroundColor: "#f5f5f5" }}>加载中...</div>;
  }

  return (
    <div style={{ padding: "15px", backgroundColor: "#e3f2fd", border: "1px solid #2196f3", marginBottom: "20px", borderRadius: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", color: "#1565c0" }}>拍卖截止时间设置</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {message && (
            <span style={{ color: message.includes("失败") || message.includes("必须") ? "#dc3545" : "#28a745", fontSize: "14px" }}>
              {message}
            </span>
          )}
        </div>
      </div>
      
      {deadline && (
        <div style={{ marginBottom: "10px", padding: "8px", backgroundColor: "#fff", borderRadius: "4px" }}>
          <div style={{ fontSize: "14px", color: "#666" }}>
            当前截止时间: {deadline.toLocaleString("zh-CN", { 
              year: "numeric", 
              month: "2-digit", 
              day: "2-digit", 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: "14px", marginRight: "5px" }}>日期:</label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            min={minDateStr}
            max={maxDateStr}
            style={{ padding: "5px", border: "1px solid #ddd", borderRadius: "4px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "14px", marginRight: "5px" }}>时间:</label>
          <input
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            min={dateInput === minDateStr ? minTimeStr : undefined}
            max={dateInput === maxDateStr ? maxTimeStr : undefined}
            style={{ padding: "5px", border: "1px solid #ddd", borderRadius: "4px" }}
          />
        </div>
        <button
          onClick={handleSetDeadline}
          disabled={saving || !dateInput || !timeInput}
          style={{
            padding: "5px 15px",
            backgroundColor: dateInput && timeInput ? "#2196f3" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: dateInput && timeInput && !saving ? "pointer" : "not-allowed",
            fontSize: "14px"
          }}
        >
          {saving ? "设置中..." : "设置截止时间"}
        </button>
        {deadline && (
          <button
            onClick={handleClearDeadline}
            disabled={saving}
            style={{
              padding: "5px 15px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "14px"
            }}
          >
            清除截止时间
          </button>
        )}
      </div>
      <div style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
        截止时间必须在24小时内，精确到分钟。到达截止时间后，所有出价将被锁定。
      </div>
    </div>
  );
}
