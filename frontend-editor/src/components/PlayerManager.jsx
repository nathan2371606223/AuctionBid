import React, { useState, useEffect } from "react";
import {
  fetchPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  batchImportPlayers,
  unlockBuyout
} from "../services/api";
import BidHistory from "./BidHistory";

export default function PlayerManager({ token }) {
  const [players, setPlayers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState("");
  const initialNewPlayer = {
    player: "",
    team_out: "",
    age: "",
    ca: "",
    pa: "",
    position: "",
    secondary_position: "",
    height: "",
    weight: "",
    min_price: "",
    max_price: ""
  };
  const [showCreate, setShowCreate] = useState(false);
  const [newPlayer, setNewPlayer] = useState(initialNewPlayer);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [page, token]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const result = await fetchPlayers(token, page, 50);
      setPlayers(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error("Failed to load players", err);
      alert("加载球员列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (player) => {
    setEditingId(player.id);
    setEditData({
      player: player.player,
      team_out: player.team_out,
      age: player.age,
      ca: player.ca,
      pa: player.pa,
      position: player.position,
      secondary_position: player.secondary_position || "",
      height: player.height || "",
      weight: player.weight || "",
      min_price: player.min_price,
      max_price: player.max_price
    });
  };

  const handleSave = async (id) => {
    try {
      await updatePlayer(token, id, editData);
      setEditingId(null);
      setEditData({});
      loadPlayers();
    } catch (err) {
      alert(err.response?.data?.message || "更新失败");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id) => {
    if (!confirm("确定要删除这个球员吗？相关的出价历史也会被删除。")) {
      return;
    }
    try {
      await deletePlayer(token, id);
      loadPlayers();
    } catch (err) {
      alert(err.response?.data?.message || "删除失败");
    }
  };

  const handleUnlock = async (id) => {
    if (!confirm("确定要解锁买断锁定吗？这将允许继续出价。")) {
      return;
    }
    try {
      await unlockBuyout(token, id);
      loadPlayers();
    } catch (err) {
      alert(err.response?.data?.message || "解锁失败");
    }
  };

  const handleBatchImport = async () => {
    if (!batchText.trim()) {
      alert("请输入数据");
      return;
    }

    const lines = batchText.trim().split("\n");
    const players = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Tab-separated values only (avoid commas to prevent data conflicts)
      const parts = line.split("\t").map((p) => p.trim());
      if (parts.length < 11) {
        alert(`第 ${i + 1} 行数据格式错误：需要11个字段，且必须使用Tab分隔`);
        return;
      }

      const [player, team_out, age, ca, pa, position, secondary_position, height, weight, min_price, max_price] = parts;

      players.push({
        player,
        team_out,
        age: Number(age),
        ca: Number(ca),
        pa: Number(pa),
        position,
        secondary_position: secondary_position || null,
        height: height || null,
        weight: weight || null,
        min_price: Number(min_price),
        max_price: Number(max_price)
      });
    }

    setBatchLoading(true);
    try {
      const result = await batchImportPlayers(token, players);
      alert(`批量导入完成：创建 ${result.created} 条，更新 ${result.updated} 条${result.errors.length > 0 ? `，错误 ${result.errors.length} 条` : ""}`);
      setBatchText("");
      setShowBatchImport(false);
      loadPlayers();
    } catch (err) {
      alert(err.response?.data?.message || "批量导入失败");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleViewHistory = (player) => {
    setSelectedPlayerId(player.id);
    setSelectedPlayerName(player.player);
  };

  const handleCreateSubmit = async () => {
    const requiredFields = ["player", "team_out", "age", "ca", "pa", "position", "min_price", "max_price"];
    for (const field of requiredFields) {
      if (newPlayer[field] === "" || newPlayer[field] === null || newPlayer[field] === undefined) {
        alert("请填写所有必填字段");
        return;
      }
    }

    const age = Number(newPlayer.age);
    const ca = Number(newPlayer.ca);
    const pa = Number(newPlayer.pa);
    const min_price = Number(newPlayer.min_price);
    const max_price = Number(newPlayer.max_price);

    if (![age, ca, pa, min_price, max_price].every(Number.isInteger)) {
      alert("年龄、CA、PA、价格必须为整数");
      return;
    }
    if (min_price < 0 || max_price < 0 || min_price > max_price) {
      alert("价格无效：最低价需小于等于最高价，且均为非负数");
      return;
    }

    setCreateLoading(true);
    try {
      await createPlayer(token, {
        player: newPlayer.player,
        team_out: newPlayer.team_out,
        age,
        ca,
        pa,
        position: newPlayer.position,
        secondary_position: newPlayer.secondary_position || "",
        height: newPlayer.height || "",
        weight: newPlayer.weight || "",
        min_price,
        max_price
      });
      setShowCreate(false);
      setNewPlayer(initialNewPlayer);
      loadPlayers();
    } catch (err) {
      alert(err.response?.data?.message || "创建失败");
    } finally {
      setCreateLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>球员管理</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "取消新建" : "新建球员"}
          </button>
          <button onClick={() => setShowBatchImport(!showBatchImport)}>
            {showBatchImport ? "取消批量导入" : "批量导入"}
          </button>
        </div>
      </div>

      {showCreate && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
          <h3>新建球员</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <div>
              <label style={{ fontWeight: "bold" }}>球员名*</label>
              <input
                type="text"
                value={newPlayer.player}
                onChange={(e) => setNewPlayer({ ...newPlayer, player: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>转出球队*</label>
              <input
                type="text"
                value={newPlayer.team_out}
                onChange={(e) => setNewPlayer({ ...newPlayer, team_out: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>年龄*</label>
              <input
                type="number"
                value={newPlayer.age}
                onChange={(e) => setNewPlayer({ ...newPlayer, age: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>CA*</label>
              <input
                type="number"
                value={newPlayer.ca}
                onChange={(e) => setNewPlayer({ ...newPlayer, ca: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>PA*</label>
              <input
                type="number"
                value={newPlayer.pa}
                onChange={(e) => setNewPlayer({ ...newPlayer, pa: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>位置*</label>
              <input
                type="text"
                value={newPlayer.position}
                onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>次要位置</label>
              <input
                type="text"
                value={newPlayer.secondary_position}
                onChange={(e) => setNewPlayer({ ...newPlayer, secondary_position: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>身高</label>
              <input
                type="text"
                value={newPlayer.height}
                onChange={(e) => setNewPlayer({ ...newPlayer, height: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>体重</label>
              <input
                type="text"
                value={newPlayer.weight}
                onChange={(e) => setNewPlayer({ ...newPlayer, weight: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>最低价格*</label>
              <input
                type="number"
                value={newPlayer.min_price}
                onChange={(e) => setNewPlayer({ ...newPlayer, min_price: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
                min="0"
                step="1"
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>最高价格*</label>
              <input
                type="number"
                value={newPlayer.max_price}
                onChange={(e) => setNewPlayer({ ...newPlayer, max_price: e.target.value })}
                style={{ width: "100%", padding: "5px" }}
                min="0"
                step="1"
              />
            </div>
          </div>
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleCreateSubmit} disabled={createLoading} style={{ marginRight: "10px" }}>
              {createLoading ? "创建中..." : "创建"}
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewPlayer(initialNewPlayer);
              }}
              disabled={createLoading}
            >
              取消
            </button>
          </div>
        </div>
      )}


      {showBatchImport && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
          <h3>批量导入/更新</h3>
          <p style={{ fontSize: "12px", color: "#666" }}>
            格式：每行一个球员，字段用「制表符」分隔（Tab），不要使用逗号：
            球员名[TAB]转出球队[TAB]年龄[TAB]CA[TAB]PA[TAB]位置[TAB]次要位置[TAB]身高[TAB]体重[TAB]最低价格[TAB]最高价格
            <br />
            如果球员名已存在则更新，否则创建新记录
          </p>
          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="球员名[TAB]转出球队[TAB]年龄[TAB]CA[TAB]PA[TAB]位置[TAB]次要位置[TAB]身高[TAB]体重[TAB]最低价格[TAB]最高价格"
            style={{ width: "100%", minHeight: "150px", padding: "5px", fontFamily: "monospace" }}
          />
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleBatchImport} disabled={batchLoading}>
              {batchLoading ? "导入中..." : "导入"}
            </button>
          </div>
        </div>
      )}

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
                  {editingId === player.id ? (
                    <>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="text"
                          value={editData.player}
                          onChange={(e) => setEditData({ ...editData, player: e.target.value })}
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="text"
                          value={editData.team_out}
                          onChange={(e) => setEditData({ ...editData, team_out: e.target.value })}
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="number"
                          value={editData.age}
                          onChange={(e) => setEditData({ ...editData, age: Number(e.target.value) })}
                          style={{ width: "60px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="number"
                          value={editData.ca}
                          onChange={(e) => setEditData({ ...editData, ca: Number(e.target.value) })}
                          style={{ width: "60px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="number"
                          value={editData.pa}
                          onChange={(e) => setEditData({ ...editData, pa: Number(e.target.value) })}
                          style={{ width: "60px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="text"
                          value={editData.position}
                          onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                          style={{ width: "80px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="text"
                          value={editData.secondary_position}
                          onChange={(e) => setEditData({ ...editData, secondary_position: e.target.value })}
                          style={{ width: "80px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="text"
                          value={editData.height}
                          onChange={(e) => setEditData({ ...editData, height: e.target.value })}
                          style={{ width: "60px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="text"
                          value={editData.weight}
                          onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
                          style={{ width: "60px" }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="number"
                          value={editData.min_price}
                          onChange={(e) => setEditData({ ...editData, min_price: Number(e.target.value) })}
                          style={{ width: "80px" }}
                          step="1"
                          min="0"
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <input
                          type="number"
                          value={editData.max_price}
                          onChange={(e) => setEditData({ ...editData, max_price: Number(e.target.value) })}
                          style={{ width: "80px" }}
                          step="1"
                          min="0"
                        />
                      </td>
                      <td colSpan="4" style={{ border: "1px solid #ddd", padding: "8px" }}>
                        <button onClick={() => handleSave(player.id)}>保存</button>
                        <button onClick={handleCancel} style={{ marginLeft: "5px" }}>取消</button>
                      </td>
                    </>
                  ) : (
                    <>
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
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          <button onClick={() => handleEdit(player)} style={{ fontSize: "12px" }}>
                            编辑
                          </button>
                          <button onClick={() => handleViewHistory(player)} style={{ fontSize: "12px" }}>
                            历史
                          </button>
                          {player.buyout && (
                            <button onClick={() => handleUnlock(player.id)} style={{ fontSize: "12px" }}>
                              解锁
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(player.id)}
                            style={{ fontSize: "12px", color: "red" }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </>
                  )}
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

      {selectedPlayerId && (
        <BidHistory
          token={token}
          playerId={selectedPlayerId}
          playerName={selectedPlayerName}
          onClose={() => {
            setSelectedPlayerId(null);
            setSelectedPlayerName("");
          }}
        />
      )}
    </div>
  );
}
