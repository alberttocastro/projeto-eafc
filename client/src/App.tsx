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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  EmojiEvents, 
  Group, 
  Add as AddIcon, 
  PlayArrow as PlayIcon,
  Login as LoginIcon,
  BarChart,
  AdminPanelSettings,
  Person,
  ManageAccounts,
  SportsSoccer,
  History,
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
  const [activeTab, setActiveTab] = useState(0);
  const [players, setPlayers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  
  // Create player form state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerUserId, setNewPlayerUserId] = useState<string>('');

  // Edit player association modal state
  const [editPlayer, setEditPlayer] = useState<any>(null);
  const [editPlayerUserId, setEditPlayerUserId] = useState<string>('');

  // Create tournament form state
  const [newTournament, setNewTournament] = useState({ 
    name: '', 
    type: 'league', 
    isDoubleRound: false,
    cupConfig: { groupCount: 2, playersPerGroup: 4, playoffRounds: 2 } 
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([playersApi.list(), tournamentsApi.list()]);
      setPlayers(pRes.data);
      setTournaments(tRes.data);

      if (currentUser) {
        // Fetch stats
        try {
          const statsRes = await playersApi.getMyStats();
          setUserStats(statsRes.data);
        } catch (err) {
          console.error('Error fetching user stats', err);
        }

        // Fetch users if admin
        if (currentUser.isAdmin) {
          try {
            const usersRes = await authApi.getUsers();
            setUsers(usersRes.data);
          } catch (err) {
            console.error('Error fetching users', err);
          }
        }
      } else {
        setUserStats(null);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName) return;
    const userIdVal = newPlayerUserId === '' ? undefined : Number(newPlayerUserId);
    await playersApi.create(newPlayerName, userIdVal);
    setNewPlayerName('');
    setNewPlayerUserId('');
    fetchData();
  };

  const handleUpdatePlayerAssociation = async () => {
    if (!editPlayer) return;
    const userIdVal = editPlayerUserId === '' ? null : Number(editPlayerUserId);
    await playersApi.update(editPlayer.id, undefined, userIdVal);
    setEditPlayer(null);
    setEditPlayerUserId('');
    fetchData();
  };

  const handlePromoteUser = async (userId: number) => {
    if (confirm('Are you sure you want to promote this user to admin?')) {
      await authApi.promoteUser(userId);
      fetchData();
    }
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

  // Adjust active tab if user logs out and was on Admin tab
  useEffect(() => {
    if ((!currentUser || !currentUser.isAdmin) && activeTab === 2) {
      setActiveTab(0);
    }
  }, [currentUser, activeTab]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab icon={<BarChart />} label="My Stats" />
          <Tab icon={<EmojiEvents />} label="Tournaments" />
          {currentUser?.isAdmin && <Tab icon={<AdminPanelSettings />} label="Admin Panel" />}
        </Tabs>
      </Box>

      {/* Tab 0: My Stats */}
      {activeTab === 0 && (
        <Box>
          {!currentUser ? (
            <Card sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto', mt: 4 }}>
              <CardContent>
                <SportsSoccer sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Track Your EAFC Performance
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 3 }}>
                  Sign in or register to view your custom stats dashboard, including your tournament participation, match history, wins, draws, losses, and goal tallies.
                </Typography>
                <Button variant="contained" size="large" onClick={onOpenLogin}>
                  Sign In / Register
                </Button>
              </CardContent>
            </Card>
          ) : userStats && !userStats.hasPlayerLinked ? (
            <Card sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Person sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  No Player Profile Linked
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  Your user account is logged in as <strong>{currentUser.name}</strong>, but it has not been associated with an EAFC Player profile yet.
                </Typography>
                <Alert severity="info" sx={{ textAlign: 'left' }}>
                  Please contact a system administrator. They can register your player name and link it to your account (<strong>{currentUser.email}</strong>) from the Admin Panel.
                </Alert>
              </CardContent>
            </Card>
          ) : userStats ? (
            <Grid container spacing={3}>
              {/* Overall Summary Card */}
              <Grid size={12}>
                <Card sx={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
                      Welcome, {currentUser.name}!
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>
                      Here is the consolidated EAFC performance summary for your linked players ({userStats.players.map((p: any) => p.name).join(', ')}).
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>Tournaments</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{userStats.overall.tournamentsCount}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>Matches Played</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{userStats.overall.matchesCount}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', color: '#81c784' }}>Wins</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#81c784' }}>{userStats.overall.wins}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', color: '#ffe082' }}>Draws</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffe082' }}>{userStats.overall.draws}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', color: '#ef9a9a' }}>Losses</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ef9a9a' }}>{userStats.overall.losses}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>Goals (Diff)</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {userStats.overall.goalsScored}:{userStats.overall.goalsConceded} ({userStats.overall.goalsScored - userStats.overall.goalsConceded >= 0 ? '+' : ''}{userStats.overall.goalsScored - userStats.overall.goalsConceded})
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Tournament Participations */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                      <EmojiEvents color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>My Tournaments</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {userStats.tournaments.length === 0 ? (
                      <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                        Not participating in any tournament yet.
                      </Typography>
                    ) : (
                      <List sx={{ maxHeight: 350, overflow: 'auto' }}>
                        {userStats.tournaments.map((t: any, idx: number) => (
                          <Box key={t.id}>
                            <ListItem
                              secondaryAction={
                                <Button size="small" variant="outlined" onClick={() => navigate(`/tournament/${t.id}`)}>
                                  View
                                </Button>
                              }
                            >
                              <ListItemText 
                                primary={t.name}
                                secondary={`Club: ${t.clubName} • Type: ${t.type} • Status: ${t.status}`}
                              />
                            </ListItem>
                            {idx < userStats.tournaments.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Match History */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                      <History color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Match History</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {userStats.matches.length === 0 ? (
                      <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                        No matches played yet.
                      </Typography>
                    ) : (
                      <List sx={{ maxHeight: 350, overflow: 'auto' }}>
                        {userStats.matches.map((m: any, idx: number) => (
                          <Box key={m.id}>
                            <ListItem>
                              <Grid container sx={{ alignItems: 'center' }}>
                                <Grid size={8}>
                                  <ListItemText
                                    primary={`${m.homePlayerName} vs ${m.awayPlayerName}`}
                                    secondary={`${m.tournamentName} • ${m.status}`}
                                  />
                                </Grid>
                                <Grid size={4} sx={{ textAlign: 'right' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1, display: 'inline-block' }}>
                                    {m.homeScore} - {m.awayScore}
                                  </Typography>
                                  {m.status === 'finished' && (
                                    <Chip 
                                      label={m.result.toUpperCase()} 
                                      size="small" 
                                      color={m.result === 'win' ? 'success' : m.result === 'loss' ? 'error' : 'default'}
                                    />
                                  )}
                                </Grid>
                              </Grid>
                            </ListItem>
                            {idx < userStats.matches.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography>Loading stats...</Typography>
          )}
        </Box>
      )}

      {/* Tab 1: Tournaments List */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Create Tournament Form - Only for Admins */}
          {currentUser?.isAdmin && (
            <Grid size={{ xs: 12, md: 5 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <EmojiEvents color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>New Tournament</Typography>
                  </Box>
                  <Box component="form" onSubmit={handleCreateTournament} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField 
                      fullWidth
                      size="small"
                      label="Tournament Name"
                      value={newTournament.name}
                      onChange={e => setNewTournament({...newTournament, name: e.target.value})}
                      required
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
          )}

          {/* Tournaments List */}
          <Grid size={{ xs: 12, md: currentUser?.isAdmin ? 7 : 12 }}>
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              <EmojiEvents color="primary" /> EAFC Tournaments
            </Typography>
            {tournaments.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">No tournaments created yet.</Typography>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {tournaments.map(t => (
                  <Grid size={{ xs: 12, sm: currentUser?.isAdmin ? 12 : 6 }} key={t.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{t.name}</Typography>
                        <Typography color="textSecondary" variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {t.type} • {t.status} • {t.participants?.length || 0} participants
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          startIcon={<PlayIcon />}
                          onClick={() => navigate(`/tournament/${t.id}`)}
                        >
                          Open Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Admin Panel */}
      {activeTab === 2 && currentUser?.isAdmin && (
        <Grid container spacing={3}>
          {/* Players Administration */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Group color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Players Administration</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Create Player */}
                <Box component="form" onSubmit={handleCreatePlayer} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                  <Typography variant="subtitle2" color="primary">Create EAFC Player</Typography>
                  <TextField 
                    fullWidth
                    size="small"
                    value={newPlayerName} 
                    onChange={e => setNewPlayerName(e.target.value)}
                    placeholder="Player Name (e.g. John Doe)"
                    required
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Link to User Account (Optional)</InputLabel>
                    <Select 
                      label="Link to User Account (Optional)"
                      value={newPlayerUserId} 
                      onChange={e => setNewPlayerUserId(e.target.value)}
                    >
                      <MenuItem value=""><em>None (Guest Player)</em></MenuItem>
                      {users.map(u => (
                        <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" type="submit" startIcon={<AddIcon />}>
                    Add Player
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>All Registered Players ({players.length})</Typography>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {players.map((p, idx) => (
                    <Box key={p.id}>
                      <ListItem
                        secondaryAction={
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => {
                              setEditPlayer(p);
                              setEditPlayerUserId(p.user?.id?.toString() || '');
                            }}
                          >
                            Link User
                          </Button>
                        }
                      >
                        <ListItemText 
                          primary={p.name} 
                          secondary={p.user ? `Associated with user: ${p.user.name}` : 'Unassociated (Guest)'}
                        />
                      </ListItem>
                      {idx < players.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Users & Permissions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <ManageAccounts color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Users & Permissions</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {users.map((u, idx) => (
                    <Box key={u.id}>
                      <ListItem
                        secondaryAction={
                          u.isAdmin ? (
                            <Chip label="Admin" color="primary" size="small" />
                          ) : (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="secondary"
                              onClick={() => handlePromoteUser(u.id)}
                            >
                              Promote to Admin
                            </Button>
                          )
                        }
                      >
                        <ListItemText 
                          primary={u.name} 
                          secondary={u.email}
                        />
                      </ListItem>
                      {idx < users.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Edit Player Link Dialog */}
      <Dialog open={!!editPlayer} onClose={() => setEditPlayer(null)} fullWidth maxWidth="xs">
        <DialogTitle>Link Player to User</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Link EAFC player <strong>{editPlayer?.name}</strong> to a registered user account:</Typography>
            <FormControl fullWidth size="small">
              <InputLabel>User Account</InputLabel>
              <Select 
                label="User Account"
                value={editPlayerUserId} 
                onChange={e => setEditPlayerUserId(e.target.value)}
              >
                <MenuItem value=""><em>None (Unassociate / Guest)</em></MenuItem>
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPlayer(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdatePlayerAssociation}>Save Link</Button>
        </DialogActions>
      </Dialog>
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
                        label={`${currentUser.name} ${currentUser.isAdmin ? '(Admin)' : ''}`}
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
                <Route path="/tournament/:id" element={<TournamentDetails currentUser={currentUser} />} />
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
