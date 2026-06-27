import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { authApi, authStorage, playersApi, tournamentsApi } from './api';
import { 
  Alert,
  ThemeProvider, 
  Box, 
  Container, 
  Typography, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Checkbox, 
  FormControlLabel, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  AppBar, 
  Toolbar, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import { 
  EmojiEvents, 
  Group, 
  Add as AddIcon, 
  PlayArrow as PlayIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import TournamentDetails from './components/TournamentDetails';
import AuthDialog from './components/AuthDialog';
import theme from './theme';
import type { AuthResponse, AuthUser } from './types/auth';

interface DashboardProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
}

function Dashboard({ currentUser, onOpenLogin }: DashboardProps) {
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Alert
            severity={currentUser ? 'success' : 'info'}
            action={
              !currentUser ? (
                <Button color="inherit" size="small" onClick={onOpenLogin}>
                  Log in
                </Button>
              ) : undefined
            }
          >
            {currentUser
              ? `Logged in as ${currentUser.name}. Existing screens are still open while auth is being rolled out.`
              : 'You can keep using the app while signed out. Logging in is available now for future user-specific features.'}
          </Alert>
        </Grid>

        {/* Players Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <Group color="primary" />
                <Typography variant="h6">Players</Typography>
              </Box>
              <Box component="form" onSubmit={handleCreatePlayer} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField 
                  fullWidth
                  size="small"
                  value={newPlayerName} 
                  onChange={e => setNewPlayerName(e.target.value)}
                  placeholder="Player Name"
                />
                <Button variant="contained" type="submit" startIcon={<AddIcon />}>
                  Add
                </Button>
              </Box>
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {players.map((p, index) => (
                  <Box key={p.id}>
                    <ListItem>
                      <ListItemText primary={p.name} />
                    </ListItem>
                    {index < players.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Create Tournament Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <EmojiEvents color="primary" />
                <Typography variant="h6">New Tournament</Typography>
              </Box>
              <Box component="form" onSubmit={handleCreateTournament} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  fullWidth
                  size="small"
                  label="Tournament Name"
                  value={newTournament.name}
                  onChange={e => setNewTournament({...newTournament, name: e.target.value})}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select 
                    label="Type"
                    value={newTournament.type}
                    onChange={e => setNewTournament({...newTournament, type: e.target.value})}
                  >
                    <MenuItem value="league">League</MenuItem>
                    <MenuItem value="cup">Cup</MenuItem>
                  </Select>
                </FormControl>
                
                {newTournament.type === 'cup' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField 
                      fullWidth
                      size="small"
                      type="number" 
                      label="Groups" 
                      value={newTournament.cupConfig.groupCount}
                      onChange={e => setNewTournament({
                        ...newTournament, 
                        cupConfig: {...newTournament.cupConfig, groupCount: Number(e.target.value)}
                      })}
                    />
                    <TextField 
                      fullWidth
                      size="small"
                      type="number" 
                      label="Per Group" 
                      value={newTournament.cupConfig.playersPerGroup}
                      onChange={e => setNewTournament({
                        ...newTournament, 
                        cupConfig: {...newTournament.cupConfig, playersPerGroup: Number(e.target.value)}
                      })}
                    />
                  </Box>
                )}

                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={newTournament.isDoubleRound}
                      onChange={e => setNewTournament({...newTournament, isDoubleRound: e.target.checked})}
                    />
                  }
                  label="Double Round"
                />
                <Button variant="contained" type="submit" fullWidth startIcon={<AddIcon />}>
                  Create Tournament
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tournaments List Section */}
        <Grid size={12}>
          <Typography variant="h5" sx={{ mb: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="primary" /> All Tournaments
          </Typography>
          <Grid container spacing={2}>
            {tournaments.map(t => (
              <Grid size={{ xs: 12, sm: 6 }} key={t.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{t.name}</Typography>
                    <Typography color="textSecondary" variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {t.type} • {t.status}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<PlayIcon />}
                      onClick={() => navigate(`/tournament/${t.id}`)}
                    >
                      Open
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || "dummy-google-client-id.apps.googleusercontent.com";

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: (import.meta.env.VITE_MICROSOFT_CLIENT_ID as string) || "dummy-microsoft-client-id",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  }
});

msalInstance.initialize().catch(err => {
  console.error("MSAL initialization failed", err);
});

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      if (!authStorage.getToken()) {
        return;
      }

      try {
        const response = await authApi.me();
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error restoring session', err);
        authStorage.clearToken();
      }
    };

    restoreSession();
  }, []);

  const handleAuthenticated = (response: AuthResponse) => {
    setCurrentUser(response.user);
    setIsAuthDialogOpen(false);
  };

  const handleLogout = () => {
    authStorage.clearToken();
    setCurrentUser(null);
  };

  return (
    <MsalProvider instance={msalInstance}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider theme={theme}>
          <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="static" elevation={0}>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                  EAFC Manager
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  {currentUser ? (
                    <>
                      <Chip
                        color="secondary"
                        label={currentUser.name}
                        sx={{ color: 'secondary.contrastText', fontWeight: 500 }}
                      />
                      <Button color="inherit" onClick={handleLogout}>
                        Log out
                      </Button>
                    </>
                  ) : (
                    <Button color="inherit" startIcon={<LoginIcon />} onClick={() => setIsAuthDialogOpen(true)}>
                      Log in
                    </Button>
                  )}
                  <IconButton color="inherit">
                    <EmojiEvents />
                  </IconButton>
                </Stack>
              </Toolbar>
            </AppBar>
            
            <Router>
              <Routes>
                <Route
                  path="/"
                  element={<Dashboard currentUser={currentUser} onOpenLogin={() => setIsAuthDialogOpen(true)} />}
                />
                <Route path="/tournament/:id" element={<TournamentDetails />} />
              </Routes>
            </Router>

            <AuthDialog
              open={isAuthDialogOpen}
              onClose={() => setIsAuthDialogOpen(false)}
              onAuthenticated={handleAuthenticated}
            />
          </Box>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </MsalProvider>
  );
}

export default App;
