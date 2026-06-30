import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TournamentDetails from './TournamentDetails';
import { tournamentsApi } from '../api';

vi.mock('../api', () => ({
  tournamentsApi: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Test Tournament',
        type: 'league',
        status: 'planned',
        matches: [],
        participants: []
      }
    }),
    getStandings: vi.fn().mockResolvedValue({ data: [] }),
    addParticipant: vi.fn(),
  },
  playersApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
  },
  matchesApi: {
    addGoal: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

describe('TournamentDetails Component', () => {
  it('renders tournament details', async () => {
    render(
      <MemoryRouter initialEntries={['/tournament/1']}>
        <Routes>
          <Route path="/tournament/:id" element={<TournamentDetails currentUser={null} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument();
      expect(tournamentsApi.get).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
