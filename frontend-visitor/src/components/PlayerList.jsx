import React, { useState, useEffect } from "react";
import { fetchPlayers } from "../services/api";
import BidModal from "./BidModal";

export default function PlayerList() {
  const [players, setPlayers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    loadPlayers();
  }, [page]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const result = await fetchPlayers(page, pageSize);
      setPlayers(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error("Failed to load players", err);
      alert("加载球员列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleBidClick = (player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const handleBidSuccess = () => {
    // Refresh players list after successful bid
    loadPlayers();
  };

  const handleRefresh = () => {
    loadPlayers();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>球员拍卖列表</h1>
        <button onClick={handleRefresh} disabled={loading}>
          {loading ? "加载中..." : "刷新"}
        </button>
      </div>

      {loading && players.length === 0 ? (
        <div>加载中...</div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>球员</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>转出球队</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>年龄</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>CA</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>PA</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>位置</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>次要位置</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>身高</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>体重</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>最低价格</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>最高价格</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>当前出价</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>出价球队</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>状态</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.player}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.team_out}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.age}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.ca}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.pa}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.position}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.secondary_position || ""}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.height || ""}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.weight || ""}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.min_price}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{player.max_price}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {player.current_bid_price || "无"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {player.current_bid_team || "无"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {player.buyout ? "已买断" : "进行中"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button
                      onClick={() => handleBidClick(player)}
                      disabled={player.buyout}
                      style={{
                        padding: "5px 10px",
                        cursor: player.buyout ? "not-allowed" : "pointer",
                        opacity: player.buyout ? 0.5 : 1
                      }}
                    >
                      {player.buyout ? "已锁定" : "出价"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
        </>
      )}

      {selectedPlayer && (
        <BidModal
          player={selectedPlayer}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlayer(null);
          }}
          onBidSuccess={handleBidSuccess}
        />
      )}
    </div>
  );
}
