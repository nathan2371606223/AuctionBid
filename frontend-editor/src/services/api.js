import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { password });
  return res.data;
}

export async function changePassword(token, oldPassword, newPassword) {
  const res = await axios.post(
    `${API_BASE}/auth/change-password`,
    { oldPassword, newPassword },
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function fetchPlayers(token, page = 1, pageSize = 20) {
  const res = await axios.get(`${API_BASE}/players`, {
    params: { page, pageSize },
    headers: authHeaders(token)
  });
  return res.data;
}

export async function createPlayer(token, data) {
  const res = await axios.post(`${API_BASE}/players`, data, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function updatePlayer(token, id, data) {
  const res = await axios.put(`${API_BASE}/players/${id}`, data, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function deletePlayer(token, id) {
  const res = await axios.delete(`${API_BASE}/players/${id}`, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function batchImportPlayers(token, players) {
  const res = await axios.post(
    `${API_BASE}/players/batch`,
    { players },
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function unlockBuyout(token, playerId) {
  const res = await axios.put(
    `${API_BASE}/players/${playerId}/unlock`,
    {},
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function fetchBidHistory(token, playerId, page = 1, pageSize = 20) {
  const res = await axios.get(`${API_BASE}/bids/history/${playerId}`, {
    params: { page, pageSize },
    headers: authHeaders(token)
  });
  return res.data;
}

export async function exportCsv(token) {
  const res = await axios.get(`${API_BASE}/export/csv`, {
    headers: authHeaders(token),
    responseType: "blob"
  });
  return res.data;
}

// Token alerts (shared table)
export async function fetchTokenAlerts(token, resolved = false) {
  const res = await axios.get(`${API_BASE}/token-alerts`, {
    params: { resolved },
    headers: authHeaders(token)
  });
  return res.data;
}

export async function resolveTokenAlert(token, id) {
  const res = await axios.post(`${API_BASE}/token-alerts/${id}/resolve`, {}, { headers: authHeaders(token) });
  return res.data;
}

export async function deleteTokenAlert(token, id) {
  const res = await axios.delete(`${API_BASE}/token-alerts/${id}`, { headers: authHeaders(token) });
  return res.data;
}
