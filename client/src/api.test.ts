import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { playersApi, tournamentsApi, matchesApi } from './api';

// Mock axios
vi.mock('axios', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: {
      create: () => mockApi,
    },
  };
});

describe('API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('playersApi', () => {
    it('list should call GET /players', () => {
      playersApi.list();
      expect(api.get).toHaveBeenCalledWith('/players');
    });

    it('create should call POST /players', () => {
      playersApi.create('John Doe');
      expect(api.post).toHaveBeenCalledWith('/players', { name: 'John Doe' });
    });
  });

  describe('tournamentsApi', () => {
    it('list should call GET /tournaments', () => {
      tournamentsApi.list();
      expect(api.get).toHaveBeenCalledWith('/tournaments');
    });

    it('get should call GET /tournaments/:id', () => {
      tournamentsApi.get(1);
      expect(api.get).toHaveBeenCalledWith('/tournaments/1');
    });

    it('create should call POST /tournaments', () => {
      const data = { name: 'Cup' };
      tournamentsApi.create(data);
      expect(api.post).toHaveBeenCalledWith('/tournaments', data);
    });
  });

  describe('matchesApi', () => {
    it('addGoal should call PATCH /matches/:id/goal', () => {
      matchesApi.addGoal(1, 'home');
      expect(api.patch).toHaveBeenCalledWith('/matches/1/goal', { side: 'home' });
    });
  });
});
