import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { playersApi, tournamentsApi } from './api';
import { Trophy, Users, Plus, PlayCircle } from 'lucide-react';
import TournamentDetails from './components/TournamentDetails';

function Dashboard() {
  const [players, setPlayers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newTournament, setNewTournament] = useState({ 
    name: '', 
    type: 'league', 
    isDoubleRound: false,
    cupConfig: { groupCount: 2, playersPerGroup: 4, playoffRounds: 2 } 
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([playersApi.list(), tournamentsApi.list()]);
      setPlayers(pRes.data);
      setTournaments(tRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName) return;
    await playersApi.create(newPlayerName);
    setNewPlayerName('');
    fetchData();
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    await tournamentsApi.create(newTournament);
    setNewTournament({ 
      name: '', 
      type: 'league', 
      isDoubleRound: false,
      cupConfig: { groupCount: 2, playersPerGroup: 4, playoffRounds: 2 } 
    });
    fetchData();
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1>EAFC Tournament Manager</h1>
      </header>

      <div className="grid">
        <div className="card">
          <h2><Users size={20} /> Players</h2>
          <form onSubmit={handleCreatePlayer}>
            <input 
              value={newPlayerName} 
              onChange={e => setNewPlayerName(e.target.value)}
              placeholder="Player Name"
            />
            <button type="submit"><Plus size={16} /> Add</button>
          </form>
          <ul>
            {players.map(p => (
              <li key={p.id} style={{ padding: '0.5rem 0' }}>{p.name}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2><Trophy size={20} /> New Tournament</h2>
          <form onSubmit={handleCreateTournament}>
            <input 
              value={newTournament.name}
              onChange={e => setNewTournament({...newTournament, name: e.target.value})}
              placeholder="Tournament Name"
            />
            <select 
              value={newTournament.type}
              onChange={e => setNewTournament({...newTournament, type: e.target.value})}
            >
              <option value="league">League</option>
              <option value="cup">Cup</option>
            </select>
            
            {newTournament.type === 'cup' && (
              <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  placeholder="Groups" 
                  value={newTournament.cupConfig.groupCount}
                  onChange={e => setNewTournament({
                    ...newTournament, 
                    cupConfig: {...newTournament.cupConfig, groupCount: Number(e.target.value)}
                  })}
                />
                <input 
                  type="number" 
                  placeholder="Per Group" 
                  value={newTournament.cupConfig.playersPerGroup}
                  onChange={e => setNewTournament({
                    ...newTournament, 
                    cupConfig: {...newTournament.cupConfig, playersPerGroup: Number(e.target.value)}
                  })}
                />
              </div>
            )}

            <label style={{ display: 'block', margin: '0.5rem 0' }}>
              <input 
                type="checkbox"
                checked={newTournament.isDoubleRound}
                onChange={e => setNewTournament({...newTournament, isDoubleRound: e.target.checked})}
              /> Double Round
            </label>
            <button type="submit"><Plus size={16} /> Create</button>
          </form>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>All Tournaments</h2>
        <div className="grid">
          {tournaments.map(t => (
            <div key={t.id} className="card">
              <h3>{t.name}</h3>
              <p>Type: <span style={{ textTransform: 'capitalize' }}>{t.type}</span></p>
              <div className={`status-tag status-${t.status}`}>{t.status}</div>
              <div style={{ marginTop: '1rem' }}>
                <button onClick={() => navigate(`/tournament/${t.id}`)}>
                  <PlayCircle size={16} /> Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tournament/:id" element={<TournamentDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
