// ASTRA: ONE SHOTTED // Frontend REST & Telemetry API Client

export class ApiClient {
  constructor(baseUrl = null) {
    this.baseUrl = baseUrl || (window.location.port === '8000' 
      ? window.location.origin 
      : (localStorage.getItem('astra_api_endpoint') || 'http://localhost:8000'));
    this.token = localStorage.getItem('astra_access_token') || null;
    this.refreshToken = localStorage.getItem('astra_refresh_token') || null;
    this.isConnected = false;
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    if (token) localStorage.setItem('astra_access_token', token);
    else localStorage.removeItem('astra_access_token');

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('astra_refresh_token', refreshToken);
    }
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      this.isConnected = res.ok;
      return res.ok;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: options.signal || AbortSignal.timeout(4000)
      });

      if (res.status === 401 && this.refreshToken) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryRes = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
          return await retryRes.json();
        }
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errBody.detail || `Request failed with status ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      // Return null or propagate depending on caller
      console.warn(`[ApiClient] ${endpoint} failed: ${err.message}`);
      throw err;
    }
  }

  async tryRefreshToken() {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh?refresh_token=${this.refreshToken}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        this.setToken(data.access_token, data.refresh_token);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  // --- AUTHENTICATION ---
  async loginGuest(username = '') {
    try {
      const deviceId = localStorage.getItem('astra_device_id') || `dev_${Math.floor(Math.random() * 1000000)}`;
      localStorage.setItem('astra_device_id', deviceId);

      const data = await this.request('/auth/guest', {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId, custom_username: username || null })
      });

      this.setToken(data.access_token, data.refresh_token);
      return data;
    } catch (err) {
      console.warn('Backend offline, using client guest fallback:', err.message);
      return null;
    }
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.access_token, data.refresh_token);
    return data;
  }

  async register(username, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    this.setToken(data.access_token, data.refresh_token);
    return data;
  }

  logout() {
    this.setToken(null, null);
  }

  // --- PLAYER & LOADOUTS ---
  async getProfile() {
    return this.request('/player/profile');
  }

  async getWeapons(category = null) {
    const path = category ? `/weapons/category/${category}` : '/weapons';
    return this.request(path);
  }

  async getLoadouts() {
    return this.request('/loadouts');
  }

  async saveLoadout(slotIndex, loadoutData) {
    return this.request(`/loadouts/${slotIndex}`, {
      method: 'PUT',
      body: JSON.stringify(loadoutData)
    });
  }

  // --- MATCHMAKING & MATCH LIFECYCLE ---
  async joinMatchmaking(mode = 'TDM', mapId = 'city', maxLatency = 100) {
    return this.request('/matchmaking/join', {
      method: 'POST',
      body: JSON.stringify({ mode, map_id: mapId, max_latency_ms: maxLatency })
    });
  }

  async getMatchmakingStatus() {
    return this.request('/matchmaking/status');
  }

  async leaveMatchmaking() {
    return this.request('/matchmaking/leave', { method: 'POST' });
  }

  async startMatch(mode = 'TDM', mapId = 'city', teamPlayers = []) {
    return this.request('/matches/start', {
      method: 'POST',
      body: JSON.stringify({ mode, map_id: mapId, team_players: teamPlayers })
    });
  }

  async submitEvents(matchId, events = []) {
    return this.request(`/matches/${matchId}/events`, {
      method: 'POST',
      body: JSON.stringify({ events })
    });
  }

  async finishMatch(matchId, summary = {}) {
    return this.request(`/matches/${matchId}/finish`, {
      method: 'POST',
      body: JSON.stringify(summary)
    });
  }

  // --- RANKING & MISSIONS ---
  async getLeaderboard(limit = 50) {
    return this.request(`/ranking/leaderboard?limit=${limit}`);
  }

  async getTierProgress() {
    return this.request('/ranking/tier');
  }

  async getMissions() {
    return this.request('/missions');
  }

  async claimMission(missionId) {
    return this.request(`/missions/${missionId}/claim`, { method: 'POST' });
  }

  // --- ML PREDICTION & COACHING ---
  async getAimAnalysis(telemetry) {
    return this.request('/ml/aim', {
      method: 'POST',
      body: JSON.stringify(telemetry)
    });
  }

  async getMLSkill(stats) {
    return this.request('/ml/skill', {
      method: 'POST',
      body: JSON.stringify(stats)
    });
  }

  async getRecommendations(playstyle, accuracy) {
    return this.request('/ml/recommendations', {
      method: 'POST',
      body: JSON.stringify({ playstyle, accuracy })
    });
  }
}

export const apiClient = new ApiClient();
