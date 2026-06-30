import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { playersApi, tournamentsApi } from './api';

// Mock the APIs
vi.mock('./api', () => ({
  authApi: {
    me: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Admin User',
        email: 'admin@eafc.com',
        isAdmin: true,
      },
    }),
    getUsers: vi.fn().mockResolvedValue({ data: [] }),
  },
  authStorage: {
    getToken: vi.fn().mockReturnValue('dummy-token'),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
  playersApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
    getMyStats: vi.fn().mockResolvedValue({
      data: {
        hasPlayerLinked: true,
        players: [],
        overall: {
          tournamentsCount: 0,
          matchesCount: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsScored: 0,
          goalsConceded: 0,
        },
        tournaments: [],
        matches: [],
      },
    }),
    getLeaderboard: vi.fn().mockResolvedValue({ data: [] }),
    recalculateLeaderboard: vi.fn().mockResolvedValue({ data: [] }),
  },
  tournamentsApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
  },
}));

describe('App Component', () => {
  it('renders EAFC Manager title', async () => {
    render(<App />);
    expect(screen.getByText(/EAFC Manager/i)).toBeInTheDocument();
    
    // Wait for the async API calls to resolve
    await waitFor(() => {
      expect(playersApi.getMyStats).toHaveBeenCalled();
      expect(tournamentsApi.list).toHaveBeenCalled();
    });
  });

  it('renders Players and New Tournament sections', async () => {
    render(<App />);

    // Wait for initial stats load
    await waitFor(() => {
      expect(playersApi.getMyStats).toHaveBeenCalled();
    });

    // 1. Check Tournaments Tab
    const tournamentsTab = screen.getByText('Tournaments');
    fireEvent.click(tournamentsTab);
    
    expect(screen.getByText('New Tournament', { selector: 'h6' })).toBeInTheDocument();
    expect(screen.getByText('EAFC Tournaments')).toBeInTheDocument();

    // 2. Check Admin Panel Tab
    const adminPanelTab = screen.getByText('Admin Panel');
    fireEvent.click(adminPanelTab);
    
    expect(screen.getByText('Players Administration', { selector: 'h6' })).toBeInTheDocument();
  });
});
