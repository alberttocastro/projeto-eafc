import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentsApi, playersApi, matchesApi } from '../api';
import { ArrowLeft, Play, Save, Plus, Swords } from 'lucide-react';

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [clubName, setClubName] = useState('');

  const fetchTournament = useCallback(async () => {
    const [tRes, sRes, pRes] = await Promise.all([
      tournamentsApi.get(Number(id)),
      tournamentsApi.getStandings(Number(id)),
      playersApi.list()
    ]);
    setTournament(tRes.data);
    setStandings(sRes.data);
    setPlayers(pRes.data);
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    await tournamentsApi.addParticipant(Number(id), { 
      playerId: Number(selectedPlayerId), 
      clubName 
    });
    setClubName('');
    fetchTournament();
  };

  const handleGenerateSchedule = async () => {
    await tournamentsApi.generateSchedule(Number(id));
    fetchTournament();
  };

  const handleAddGoal = async (matchId: number, side: 'home' | 'away') => {
    await matchesApi.addGoal(matchId, side);
    fetchTournament();
  };

  const handleUpdateMatchStatus = async (matchId: number, status: string) => {
    await matchesApi.updateStatus(matchId, status);
    fetchTournament();
  };

  if (!tournament) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', textDecoration: 'none', color: '#646cff' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <header className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{tournament.name}</h1>
          <p>Type: <span style={{ textTransform: 'capitalize' }}>{tournament.type}</span> | Status: {tournament.status}</p>
        </div>
        {tournament.matches.length === 0 && tournament.participants.length >= 2 && (
          <button onClick={handleGenerateSchedule}><Play size={16} /> Generate Schedule</button>
        )}
      </header>

      <div className="grid">
        {/* Participants Section */}
        <div className="card">
          <h2>Participants ({tournament.participants.length})</h2>
          {tournament.status === 'planned' && (
            <form onSubmit={handleAddParticipant} style={{ marginBottom: '1rem' }}>
              <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)}>
                <option value="">Select Player</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Club Name" />
              <button type="submit"><Plus size={16} /></button>
            </form>
          )}
          <ul>
            {tournament.participants.map((p: any) => (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>{p.player.name}</span>
                <span style={{ color: '#888' }}>{p.clubName}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Standings Section */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h2>Standings</h2>
          {tournament.type === 'league' ? (
            <StandingsTable data={standings} />
          ) : (
            Object.entries(standings || {}).map(([group, data]: [string, any]) => (
              <div key={group} style={{ marginBottom: '1.5rem' }}>
                <h3>Group {group}</h3>
                <StandingsTable data={data} />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Matches</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tournament.matches.map((m: any) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#2a2a2a', borderRadius: '4px' }}>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <strong>{m.homePlayer.name}</strong>
              </div>
              <div style={{ padding: '0 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {m.status !== 'scheduled' && <button onClick={() => handleAddGoal(m.id, 'home')}>+</button>}
                  {m.homeScore} - {m.awayScore}
                  {m.status !== 'scheduled' && <button onClick={() => handleAddGoal(m.id, 'away')}>+</button>}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                  {m.round} {m.groupName ? `(Group ${m.groupName})` : ''}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <strong>{m.awayPlayer.name}</strong>
              </div>
              <div style={{ marginLeft: '2rem' }}>
                {m.status === 'scheduled' && (
                  <button onClick={() => handleUpdateMatchStatus(m.id, 'in_progress')}><Swords size={14} /> Start</button>
                )}
                {m.status === 'in_progress' && (
                  <button onClick={() => handleUpdateMatchStatus(m.id, 'finished')} style={{ background: '#c62828' }}><Save size={14} /> Finish</button>
                )}
                {m.status === 'finished' && <span className="status-tag status-finished">Finished</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StandingsTable({ data }: { data: any[] }) {
  if (!data) return null;
  return (
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Player</th>
          <th>Club</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {data.map((s, i) => (
          <tr key={s.playerId}>
            <td>{i + 1}</td>
            <td>{s.playerName}</td>
            <td>{s.clubName}</td>
            <td>{s.played}</td>
            <td>{s.won}</td>
            <td>{s.drawn}</td>
            <td>{s.lost}</td>
            <td>{s.goalDifference}</td>
            <td><strong>{s.points}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
