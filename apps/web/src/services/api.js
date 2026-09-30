const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
  return response.json();
}

export const api = {
  knowledge: (q = '', language = 'en') => request(`/knowledge?q=${encodeURIComponent(q)}&language=${encodeURIComponent(language)}`),
  facilities: () => request('/facilities'),
  workers: () => request('/workers'),
  conversations: (deviceId) => request(`/conversations?deviceId=${encodeURIComponent(deviceId)}`),
  assessments: (deviceId) => request(`/assessments?deviceId=${encodeURIComponent(deviceId)}`),
};