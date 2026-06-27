import axios from 'axios';
import type { AuthResponse, AuthUser } from './types/auth';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

const AUTH_TOKEN_STORAGE_KEY = 'eafc.auth.token';

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const authStorage = {
  getToken: getStoredToken,
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }
  },
  clearToken: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  },
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }),
  loginWithGoogle: (token: string) =>
    api.post<AuthResponse>('/auth/google', { token }),
  loginWithMicrosoft: (token: string) =>
    api.post<AuthResponse>('/auth/microsoft', { token }),
  me: () => api.get<AuthUser | null>('/auth/me'),
};

export const playersApi = {
  list: () => api.get('/players'),
  create: (name: string) => api.post('/players', { name }),
};

export const tournamentsApi = {
  list: () => api.get('/tournaments'),
  get: (id: number) => api.get(`/tournaments/${id}`),
  create: (data: any) => api.post('/tournaments', data),
  addParticipant: (id: number, data: { playerId: number; clubName: string; groupName?: string }) => 
    api.post(`/tournaments/${id}/participants`, data),
  updateParticipant: (participantId: number, data: { clubName?: string; groupName?: string }) =>
    api.patch(`/tournaments/participants/${participantId}`, data),
  removeParticipant: (participantId: number) =>
    api.delete(`/tournaments/participants/${participantId}`),
  autoAssignGroups: (id: number) =>
    api.post(`/tournaments/${id}/auto-assign-groups`),
  generateSchedule: (id: number) => api.post(`/tournaments/${id}/generate-schedule`),
  getStandings: (id: number) => api.get(`/tournaments/${id}/standings`),
};

export const matchesApi = {
  addGoal: (id: number, side: 'home' | 'away') => api.patch(`/matches/${id}/goal`, { side }),
  updateStatus: (id: number, status: string) => api.patch(`/matches/${id}/status`, { status }),
};

export default api;
