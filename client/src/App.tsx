import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { playersApi, tournamentsApi } from './api';
import { 
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
  Fab
} from '@mui/material';
import { 
  EmojiEvents, 
  Group, 
  Add as AddIcon, 
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import TournamentDetails from './components/TournamentDetails';
import theme from './theme';

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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Players Section */}
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="primary" /> All Tournaments
          </Typography>
          <Grid container spacing={2}>
            {tournaments.map(t => (
              <Grid item xs={12} sm={6} key={t.id}>
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              EAFC Manager
            </Typography>
            <IconButton color="inherit">
              <EmojiEvents />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tournament/:id" element={<TournamentDetails />} />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
