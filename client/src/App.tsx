import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { authApi, playersApi, setAuthToken, tournamentsApi } from './api';
import { LogIn, Plus, PlayCircle, Trophy, Users } from 'lucide-react';
import TournamentDetails from './components/TournamentDetails';

type SessionUser = {
  id: number;
  email: string;
  displayName: string;
};

function Dashboard() {
  const [players, setPlayers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newTournament, setNewTournament] = useState({
    name: '',
    type: 'league',
    isDoubleRound: false,
    cupConfig: { groupCount: 2, playersPerGroup: 4, playoffRounds: 2 },
  });
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authStatusMessage, setAuthStatusMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();

    const token = localStorage.getItem('authToken');

    if (token) {
      setAuthToken(token);
      void fetchSession();
    }
  }, []);

  async function fetchData() {
    try {
      const [pRes, tRes] = await Promise.all([playersApi.list(), tournamentsApi.list()]);
      setPlayers(pRes.data);
      setTournaments(tRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  }

  async function fetchSession() {
    try {
      const sessionResponse = await authApi.getSession();
      const session = sessionResponse.data as { authenticated: boolean; user: SessionUser | null };

      if (session.authenticated && session.user) {
        setCurrentUser(session.user);
        return;
      }

      setCurrentUser(null);
      localStorage.removeItem('authToken');
      setAuthToken(null);
    } catch (err) {
      console.error('Error fetching session', err);
      setCurrentUser(null);
    }
  }

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
      cupConfig: { groupCount: 2, playersPerGroup: 4, playoffRounds: 2 },
    });
    fetchData();
  };

  const saveAuthSession = (responseData: { accessToken?: string; user?: SessionUser }) => {
    const token = responseData.accessToken;
    const user = responseData.user;

    if (!token || !user) {
      throw new Error('Sessão inválida retornada pelo servidor');
    }

    localStorage.setItem('authToken', token);
    setAuthToken(token);
    setCurrentUser(user);
    setAuthStatusMessage(`Conectado como ${user.displayName}`);
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const response = await authApi.registerWithEmail({
        displayName: authDisplayName,
        email: authEmail,
        password: authPassword,
      });
      saveAuthSession(response.data);
    } catch (err) {
      console.error('Error registering user', err);
      setAuthStatusMessage('Não foi possível cadastrar com email.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setAuthLoading(true);

    try {
      const response = await authApi.loginWithEmail({
        email: authEmail,
        password: authPassword,
      });
      saveAuthSession(response.data);
    } catch (err) {
      console.error('Error logging in with email', err);
      setAuthStatusMessage('Falha ao autenticar com email/senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
    setAuthLoading(true);

    try {
      const response =
        provider === 'google'
          ? await authApi.getGoogleProviderUrl()
          : await authApi.getMicrosoftProviderUrl();

      const providerConfig = response.data as {
        configured: boolean;
        loginUrl: string | null;
      };

      if (!providerConfig.configured || !providerConfig.loginUrl) {
        setAuthStatusMessage(
          `Login com ${provider} ainda não configurado no backend (client id/redirect URI).`,
        );
        return;
      }

      window.location.href = providerConfig.loginUrl;
    } catch (err) {
      console.error('Error logging in socially', err);
      setAuthStatusMessage(`Falha ao iniciar autenticação com ${provider}.`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setCurrentUser(null);
    setAuthStatusMessage('Sessão encerrada.');
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1>EAFC Tournament Manager</h1>
      </header>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>
          <LogIn size={20} /> Autenticação (opcional)
        </h2>

        <p style={{ marginTop: '0.5rem' }}>
          O sistema continua disponível sem login; email já está funcional e Google/Microsoft estão prontos para configurar OAuth.
        </p>

        {currentUser ? (
          <div>
            <p style={{ margin: '0.75rem 0' }}>
              Usuário atual: <strong>{currentUser.displayName}</strong> ({currentUser.email})
            </p>
            <button type="button" onClick={handleLogout}>
              Sair
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailRegister}>
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                value={authDisplayName}
                onChange={(e) => setAuthDisplayName(e.target.value)}
                placeholder="Nome de exibição"
              />
              <input
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Email"
                type="email"
              />
              <input
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Senha"
                type="password"
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button disabled={authLoading} type="submit">
                Cadastrar com email
              </button>
              <button disabled={authLoading} onClick={handleEmailLogin} type="button">
                Entrar com email
              </button>
              <button
                disabled={authLoading}
                onClick={() => {
                  void handleSocialLogin('google');
                }}
                type="button"
              >
                Entrar com Google
              </button>
              <button
                disabled={authLoading}
                onClick={() => {
                  void handleSocialLogin('microsoft');
                }}
                type="button"
              >
                Entrar com Microsoft
              </button>
            </div>
          </form>
        )}

        {authStatusMessage ? <p style={{ marginTop: '0.75rem' }}>{authStatusMessage}</p> : null}
      </div>

      <div className="grid">
        <div className="card">
          <h2>
            <Users size={20} /> Players
          </h2>
          <form onSubmit={handleCreatePlayer}>
            <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Player Name" />
            <button type="submit">
              <Plus size={16} /> Add
            </button>
          </form>
          <ul>
            {players.map((p) => (
              <li key={p.id} style={{ padding: '0.5rem 0' }}>
                {p.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>
            <Trophy size={20} /> New Tournament
          </h2>
          <form onSubmit={handleCreateTournament}>
            <input
              value={newTournament.name}
              onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
              placeholder="Tournament Name"
            />
            <select
              value={newTournament.type}
              onChange={(e) => setNewTournament({ ...newTournament, type: e.target.value })}
            >
              <option value="league">League</option>
              <option value="cup">Cup</option>
            </select>

            {newTournament.type === 'cup' && (
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                }}
              >
                <input
                  type="number"
                  placeholder="Groups"
                  value={newTournament.cupConfig.groupCount}
                  onChange={(e) =>
                    setNewTournament({
                      ...newTournament,
                      cupConfig: { ...newTournament.cupConfig, groupCount: Number(e.target.value) },
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Per Group"
                  value={newTournament.cupConfig.playersPerGroup}
                  onChange={(e) =>
                    setNewTournament({
                      ...newTournament,
                      cupConfig: {
                        ...newTournament.cupConfig,
                        playersPerGroup: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            )}

            <label style={{ display: 'block', margin: '0.5rem 0' }}>
              <input
                type="checkbox"
                checked={newTournament.isDoubleRound}
                onChange={(e) => setNewTournament({ ...newTournament, isDoubleRound: e.target.checked })}
              />{' '}
              Double Round
            </label>
            <button type="submit">
              <Plus size={16} /> Create
            </button>
          </form>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>All Tournaments</h2>
        <div className="grid">
          {tournaments.map((t) => (
            <div key={t.id} className="card">
              <h3>{t.name}</h3>
              <p>
                Type: <span style={{ textTransform: 'capitalize' }}>{t.type}</span>
              </p>
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
