import React, { useState, useEffect } from "react";
import TeamSelector from "./TeamSelector";
import { submitBid, fetchTeams } from "../services/api";

export default function BidModal({ player, isOpen, onClose, onBidSuccess, onAuthError }) {
  const [bidTeam, setBidTeam] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [teamsByLevel, setTeamsByLevel] = useState({});
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      const data = await fetchTeams();
      setTeamsByLevel(data);
    } catch (err) {
      console.error("Failed to load teams", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        onAuthError && onAuthError();
      } else {
        setMessage({ type: "error", text: "加载球队失败" });
      }
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bidTeam || !bidPrice) {
      setMessage({ type: "error", text: "请选择球队并输入出价" });
      return;
    }

    const priceNum = Number(bidPrice);
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      setMessage({ type: "error", text: "出价必须为非负整数" });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await submitBid(player.id, bidTeam, priceNum);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setTimeout(() => {
          onBidSuccess();
          onClose();
        }, 1000);
      } else {
        setMessage({ type: "error", text: result.message || "出价失败" });
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onAuthError && onAuthError();
      } else {
        const errorMsg = err.response?.data?.message || err.message || "出价失败";
        setMessage({ type: "error", text: errorMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>出价 - {player.player}</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              选择球队：
            </label>
            <TeamSelector
              teamsByLevel={teamsByLevel}
              loading={loadingTeams}
              value={bidTeam}
              onChange={setBidTeam}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              出价：
            </label>
            {(() => {
              const minBidPrice = player.current_bid_price && player.current_bid_price > 0 
                ? player.current_bid_price 
                : player.min_price;
              return (
                <>
                  <input
                    type="number"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    placeholder={`最低: ${minBidPrice}, 最高: ${player.max_price}`}
                    min={player.min_price}
                    max={player.max_price}
                    step="1"
                    required
                    style={{ width: "100%", padding: "5px" }}
                  />
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                    当前最高出价: {player.current_bid_price || "无"} | 
                    最低: {player.min_price} | 最高: {player.max_price}
                  </div>
                </>
              );
            })()}
          </div>

          {message.text && (
            <div
              style={{
                padding: "10px",
                marginBottom: "15px",
                backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
                color: message.type === "success" ? "#155724" : "#721c24",
                borderRadius: "4px"
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} disabled={submitting}>
              取消
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : "提交出价"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
