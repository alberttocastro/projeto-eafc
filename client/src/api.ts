import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

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
