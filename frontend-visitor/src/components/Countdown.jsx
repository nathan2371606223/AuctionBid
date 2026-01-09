import React, { useState, useEffect } from "react";
import { fetchDeadline } from "../services/api";

export default function Countdown() {
  const [deadline, setDeadline] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeadline();
  }, []);

  useEffect(() => {
    // Only set up interval if deadline exists
    let interval = null;
    if (deadline) {
      updateTimeLeft(deadline);
      interval = setInterval(() => {
        updateTimeLeft(deadline);
      }, 1000); // Update every second
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deadline]);

  const loadDeadline = async () => {
    try {
      setLoading(true);
      const data = await fetchDeadline();
      if (data.deadline) {
        const deadlineDate = new Date(data.deadline);
        setDeadline(deadlineDate);
        updateTimeLeft(deadlineDate);
      } else {
        setDeadline(null);
        setTimeLeft(null);
      }
    } catch (err) {
      console.error("Failed to load deadline:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeLeft = (deadlineDate = deadline) => {
    if (!deadlineDate) return;
    
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) {
      setExpired(true);
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    setExpired(false);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeft({ hours, minutes, seconds });
  };

  if (loading) {
    return null;
  }

  if (!deadline || !timeLeft) {
    return null; // Don't show countdown if no deadline is set
  }

  return (
    <div style={{ 
      padding: "15px", 
      backgroundColor: expired ? "#f8d7da" : "#d4edda", 
      border: `1px solid ${expired ? "#dc3545" : "#28a745"}`, 
      marginBottom: "20px", 
      borderRadius: "4px",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "16px", fontWeight: "bold", color: expired ? "#721c24" : "#155724", marginBottom: "5px" }}>
        {expired ? "拍卖已截止" : "拍卖倒计时"}
      </div>
      {!expired && (
        <div style={{ fontSize: "24px", color: "#155724", fontFamily: "monospace" }}>
          {String(timeLeft.hours).padStart(2, "0")}:
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </div>
      )}
      <div style={{ fontSize: "12px", color: expired ? "#721c24" : "#155724", marginTop: "5px" }}>
        截止时间: {deadline.toLocaleString("zh-CN", { 
          year: "numeric", 
          month: "2-digit", 
          day: "2-digit", 
          hour: "2-digit", 
          minute: "2-digit" 
        })}
      </div>
    </div>
  );
}
