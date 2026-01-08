import React, { useState, useEffect } from "react";
import { fetchBidHistory } from "../services/api";

export default function BidHistory({ token, playerId, playerName, onClose }) {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    if (playerId) {
      loadHistory();
    }
  }, [playerId, page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await fetchBidHistory(token, playerId, page, pageSize);
      setHistory(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error("Failed to load bid history", err);
      alert("加载出价历史失败");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

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
          maxWidth: "800px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>出价历史 - {playerName}</h2>
          <button onClick={onClose}>关闭</button>
        </div>

        {loading && history.length === 0 ? (
          <div>加载中...</div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>时间</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>出价球队</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>出价</th>
                </tr>
              </thead>
              <tbody>
                {history.map((bid) => (
                  <tr key={bid.id}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {new Date(bid.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{bid.bid_team}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{bid.bid_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </div>
                <div>
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                    上一页
                  </button>
                  <span style={{ margin: "0 10px" }}>
                    {page} / {totalPages}
                  </span>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
