// KEMETION API Configuration
// This file handles all API calls to the backend

const API_BASE_URL = 'https://kemetionplay.com/api'; // Will be updated during deployment
// For local development: 'http://localhost:3000/api'

class KemetionAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Clear auth token
  clearToken() {
    localStorage.removeItem('authToken');
    this.token = null;
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getToken();
  }

  // Generic fetch method
  async request(endpoint, method = 'GET', data = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  // Register new user
  async register(username, email, password, confirmPassword) {
    return this.request('/auth/register', 'POST', {
      username,
      email,
      password,
      confirmPassword
    });
  }

  // Login user
  async login(email, password) {
    const response = await this.request('/auth/login', 'POST', {
      email,
      password
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // Logout user
  logout() {
    this.clearToken();
  }

  // Get user profile
  async getProfile() {
    return this.request('/users/profile', 'GET');
  }

  // ==================== TEAM ENDPOINTS ====================

  // Create a new team
  async createTeam(matchId, teamName, players, captain, viceCaptain) {
    return this.request('/teams/create', 'POST', {
      matchId,
      teamName,
      players,
      captain,
      viceCaptain
    });
  }

  // Get user's teams
  async getUserTeams() {
    return this.request('/teams/user', 'GET');
  }

  // ==================== MATCH ENDPOINTS ====================

  // Get all matches
  async getMatches() {
    return this.request('/matches', 'GET');
  }

  // Get match details
  async getMatch(matchId) {
    return this.request(`/matches/${matchId}`, 'GET');
  }

  // ==================== LEADERBOARD ENDPOINTS ====================

  // Get leaderboard
  async getLeaderboard() {
    return this.request('/leaderboard', 'GET');
  }

  // ==================== CONTEST ENDPOINTS ====================

  // Get all contests
  async getContests() {
    return this.request('/contests', 'GET');
  }

  // Join a contest
  async joinContest(contestId, teamId) {
    return this.request('/contests/join', 'POST', {
      contestId,
      teamId
    });
  }

  // ==================== HEALTH CHECK ====================

  // Check API health
  async health() {
    return this.request('/health', 'GET');
  }
}

// Create global API instance
const api = new KemetionAPI();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
