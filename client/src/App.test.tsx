import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { playersApi, tournamentsApi } from './api';

// Mock the APIs
vi.mock('./api', () => ({
  playersApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
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
    
    // Wait for the async API calls to resolve so the warnings don't leak
    await waitFor(() => {
      expect(playersApi.list).toHaveBeenCalled();
      expect(tournamentsApi.list).toHaveBeenCalled();
    });
  });

  it('renders Players and New Tournament sections', async () => {
    render(<App />);
    
    expect(screen.getByText('Players', { selector: 'h6' })).toBeInTheDocument();
    expect(screen.getByText('New Tournament', { selector: 'h6' })).toBeInTheDocument();
    expect(screen.getByText('All Tournaments')).toBeInTheDocument();

    await waitFor(() => {
      expect(playersApi.list).toHaveBeenCalled();
    });
  });
});
