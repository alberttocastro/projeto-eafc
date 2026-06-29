import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { playersApi, tournamentsApi } from './api';

// Mock the APIs
vi.mock('./api', () => ({
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
      }
    }),
  },
  tournamentsApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
  },
  authApi: {
    getUsers: vi.fn().mockResolvedValue({ data: [] }),
    me: vi.fn().mockResolvedValue({ data: { id: 1, name: 'Admin User', email: 'admin@test.com', isAdmin: true } }),
  },
  authStorage: {
    getToken: vi.fn().mockReturnValue('mock-token'),
    getUser: vi.fn().mockReturnValue({ id: 1, name: 'Admin User', email: 'admin@test.com', isAdmin: true }),
    clearToken: vi.fn(),
  },
}));

describe('App Component', () => {
  it('renders EAFC Manager title', async () => {
    render(<App />);
    expect(screen.getByText(/EAFC Manager/i)).toBeInTheDocument();
    
    // Wait for the async API calls to resolve so the warnings don't leak
    await waitFor(() => {
      expect(playersApi.list).toHaveBeenCalled();
      expect(tournamentsApi.list).toHaveBeenCalled();
    });
  });

  it('renders Players and New Tournament sections', async () => {
    render(<App />);
    
    // Switch to Tournaments tab to see tournaments and creation form
    await waitFor(() => {
      const tournamentsTab = screen.getByRole('tab', { name: /Tournaments/i });
      expect(tournamentsTab).toBeInTheDocument();
      tournamentsTab.click();
    });

    await waitFor(() => {
      expect(screen.getByText('New Tournament', { selector: 'h6' })).toBeInTheDocument();
      expect(screen.getByText('EAFC Tournaments')).toBeInTheDocument();
    });

    // Switch to Admin Panel tab to see player administration
    await waitFor(() => {
      const adminTab = screen.getByRole('tab', { name: /Admin Panel/i });
      expect(adminTab).toBeInTheDocument();
      adminTab.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Players Administration', { selector: 'h6' })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(playersApi.list).toHaveBeenCalled();
    });
  });
});
