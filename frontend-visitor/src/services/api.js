import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export async function fetchPlayers(page = 1, pageSize = 20) {
  const res = await axios.get(`${API_BASE}/players`, { params: { page, pageSize } });
  return res.data;
}

export async function fetchTeams() {
  const res = await axios.get(`${API_BASE}/teams`);
  return res.data;
}

export async function submitBid(playerId, bidTeam, bidPrice) {
  const res = await axios.post(`${API_BASE}/bids/${playerId}`, {
    bid_team: bidTeam,
    bid_price: bidPrice
  });
  return res.data;
}
