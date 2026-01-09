import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
const TOKEN_KEY = "team_token";

export function getStoredToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (typeof localStorage === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Axios instance with token header
const client = axios.create({ baseURL: API_BASE });
client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers["X-Team-Token"] = token;
  }
  return config;
});

export async function validateToken(token) {
  const res = await client.get("/teams", {
    headers: { "X-Team-Token": token }
  });
  return res.data;
}

export async function fetchPlayers(page = 1, pageSize = 50) {
  const res = await client.get("/players", { params: { page, pageSize } });
  return res.data;
}

export async function fetchTeams() {
  const res = await client.get("/teams");
  return res.data;
}

export async function submitBid(playerId, bidTeam, bidPrice) {
  const res = await client.post(`/bids/${playerId}`, {
    bid_team: bidTeam,
    bid_price: bidPrice
  });
  return res.data;
}

export async function fetchAnnouncement() {
  const res = await client.get(`/announcement`);
  return res.data;
}

export async function fetchDeadline() {
  const res = await client.get(`/deadline`);
  return res.data;
}
