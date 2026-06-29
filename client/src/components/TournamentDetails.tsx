import { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { tournamentsApi, playersApi, matchesApi } from '../api';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  ArrowBack, 
  PlayArrow, 
  Save, 
  Add, 
  Remove,
  SportsEsports,
  Leaderboard,
  History,
  Edit,
  Delete,
  AutoFixHigh
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

import type { AuthUser } from '../types/auth';

interface TournamentDetailsProps {
  currentUser: AuthUser | null;
}

export default function TournamentDetails({ currentUser }: TournamentDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [clubName, setClubName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);

  const fetchTournament = useCallback(async () => {
    try {
      const [tRes, sRes, pRes] = await Promise.all([
        tournamentsApi.get(Number(id)),
        tournamentsApi.getStandings(Number(id)),
        playersApi.list()
      ]);
      setTournament(tRes.data);
      setStandings(sRes.data);
      setPlayers(pRes.data);
    } catch (err) {
      console.error('Error fetching tournament', err);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    await tournamentsApi.addParticipant(Number(id), { 
      playerId: Number(selectedPlayerId), 
      clubName,
      groupName: tournament.type === 'cup' ? groupName : undefined
    });
    setClubName('');
    setGroupName('');
    setSelectedPlayerId('');
    fetchTournament();
  };

  const handleUpdateParticipant = async () => {
    if (!editingParticipant) return;
    await tournamentsApi.updateParticipant(editingParticipant.id, {
      clubName: editingParticipant.clubName,
      groupName: editingParticipant.groupName
    });
    setEditDialogOpen(false);
    fetchTournament();
  };

  const handleRemoveParticipant = async (participantId: number) => {
    if (confirm('Are you sure you want to remove this participant?')) {
      await tournamentsApi.removeParticipant(participantId);
      fetchTournament();
    }
  };

  const handleAutoAssign = async () => {
    await tournamentsApi.autoAssignGroups(Number(id));
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

  const handleRemoveGoal = async (matchId: number, side: 'home' | 'away') => {
    await matchesApi.removeGoal(matchId, side);
    fetchTournament();
  };

  const handleUpdateMatchStatus = async (matchId: number, status: string) => {
    await matchesApi.updateStatus(matchId, status);
    fetchTournament();
  };

  const isScheduleGeneratable = () => {
    if (!tournament) return false;
    if (tournament.matches.length > 0) return false;

    if (tournament.type === 'league') {
      return tournament.participants.length >= 2;
    }

    if (tournament.type === 'cup') {
      const requiredTotal = tournament.groupCount * tournament.playersPerGroup;
      if (tournament.participants.length !== requiredTotal) return false;

      // Check if all players are assigned to a group
      if (tournament.participants.some((p: any) => !p.groupName)) return false;

      // Check if each group has the correct amount of players
      for (let i = 0; i < tournament.groupCount; i++) {
        const groupName = String.fromCharCode(65 + i);
        const groupCount = tournament.participants.filter((p: any) => p.groupName === groupName).length;
        if (groupCount !== tournament.playersPerGroup) return false;
      }

      return true;
    }

    return false;
  };

  if (!tournament) return <Container sx={{ py: 4 }}><Typography>Loading...</Typography></Container>;

  const groupOptions = tournament.type === 'cup' 
    ? Array.from({ length: tournament.groupCount }, (_, i) => String.fromCharCode(65 + i))
    : [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button 
        component={RouterLink} 
        to="/" 
        startIcon={<ArrowBack />} 
        sx={{ mb: 2 }}
      >
        Dashboard
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom>{tournament.name}</Typography>
              <Stack direction="row" spacing={1}>
                <Chip label={tournament.type} size="small" color="primary" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                <Chip label={tournament.status} size="small" variant="filled" />
              </Stack>
            </Box>
            {tournament.matches.length === 0 && currentUser?.isAdmin && (
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<PlayArrow />} 
                onClick={handleGenerateSchedule}
                disabled={!isScheduleGeneratable()}
              >
                Generate Schedule
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth">
          <Tab icon={<Leaderboard />} label="Standings" />
          <Tab icon={<History />} label="Matches" />
          <Tab icon={<Add />} label="Players" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {tournament.type === 'league' ? (
          <StandingsTable data={standings} />
        ) : (
          Object.entries(standings || {})
            .sort(([a], [b]) => {
              if (a === 'Unassigned') return 1;
              if (b === 'Unassigned') return -1;
              return a.localeCompare(b);
            })
            .map(([group, data]: [string, any]) => (
              <Box key={group} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom color={group === 'Unassigned' ? 'textSecondary' : 'primary'}>
                  {group === 'Unassigned' ? 'Players Without Group' : `Group ${group}`}
                </Typography>
                <StandingsTable data={data} />
              </Box>
            ))
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Stack spacing={2}>
          {[...tournament.matches].sort((a: any, b: any) => {
            if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
            if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
            return 0;
          }).map((m: any) => (
            <Card key={m.id} variant="outlined">
              <CardContent sx={{ p: '16px !important' }}>
                <Grid container spacing={1} sx={{ alignItems: 'center' }}>
                  <Grid size={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" noWrap>{m.homePlayer.name}</Typography>
                  </Grid>
                  <Grid size={4} sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {m.status === 'in_progress' && currentUser?.isAdmin && (
                        <>
                          <IconButton size="small" onClick={() => handleRemoveGoal(m.id, 'home')} disabled={m.homeScore === 0}>
                            <Remove fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleAddGoal(m.id, 'home')}>
                            <Add fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      <Typography variant="h5" sx={{ fontWeight: 'bold', minWidth: 60 }}>
                        {m.homeScore} - {m.awayScore}
                      </Typography>
                      {m.status === 'in_progress' && currentUser?.isAdmin && (
                        <>
                          <IconButton size="small" onClick={() => handleAddGoal(m.id, 'away')}>
                            <Add fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleRemoveGoal(m.id, 'away')} disabled={m.awayScore === 0}>
                            <Remove fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {m.round} {m.groupName ? `(Group ${m.groupName})` : ''}
                    </Typography>
                  </Grid>
                  <Grid size={4} sx={{ textAlign: 'left' }}>
                    <Typography variant="subtitle2" noWrap>{m.awayPlayer.name}</Typography>
                  </Grid>
                  
                  <Grid size={12} sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                    {m.status === 'scheduled' && currentUser?.isAdmin && (
                      <Button size="small" variant="contained" startIcon={<SportsEsports />} onClick={() => handleUpdateMatchStatus(m.id, 'in_progress')}>
                        Start
                      </Button>
                    )}
                    {m.status === 'in_progress' && currentUser?.isAdmin && (
                      <Button size="small" variant="contained" color="error" startIcon={<Save />} onClick={() => handleUpdateMatchStatus(m.id, 'finished')}>
                        Finish
                      </Button>
                    )}
                    {m.status === 'finished' && (
                      <Chip label="Finished" size="small" />
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
          {tournament.matches.length === 0 && (
            <Typography color="textSecondary" sx={{ textAlign: 'center' }}>No matches generated yet.</Typography>
          )}
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {currentUser?.isAdmin && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Add Participant</Typography>
              {tournament.status === 'planned' ? (
                <Box component="form" onSubmit={handleAddParticipant} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Player</InputLabel>
                    <Select 
                      label="Select Player"
                      value={selectedPlayerId} 
                      onChange={e => setSelectedPlayerId(e.target.value)}
                    >
                      {players
                        .filter(p => !tournament.participants.some((part: any) => part.player.id === p.id))
                        .map(p => (
                          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <Grid container spacing={2}>
                    <Grid size={tournament.type === 'cup' ? 8 : 12}>
                      <TextField 
                        fullWidth 
                        size="small" 
                        label="Club Name"
                        value={clubName} 
                        onChange={e => setClubName(e.target.value)} 
                      />
                    </Grid>
                    {tournament.type === 'cup' && (
                      <Grid size={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Group</InputLabel>
                          <Select 
                            label="Group"
                            value={groupName} 
                            onChange={e => setGroupName(e.target.value)}
                          >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {groupOptions.map(g => (
                              <MenuItem key={g} value={g}>{g}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                  <Button variant="contained" type="submit" startIcon={<Add />} >
                    Add to Tournament
                  </Button>
                </Box>
              ) : (
                <Typography color="textSecondary" gutterBottom>Registration closed (tournament in progress or finished).</Typography>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Participants ({tournament.participants.length})</Typography>
              {tournament.type === 'cup' && tournament.status === 'planned' && currentUser?.isAdmin && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<AutoFixHigh />}
                  onClick={handleAutoAssign}
                >
                  Auto-Assign Groups
                </Button>
              )}
            </Box>
            
            <List>
              {tournament.participants.map((p: any, idx: number) => (
                <Box key={p.id}>
                  <ListItem
                    secondaryAction={
                      tournament.status === 'planned' && currentUser?.isAdmin && (
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" onClick={() => { setEditingParticipant(p); setEditDialogOpen(true); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleRemoveParticipant(p.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      )
                    }
                  >
                    <ListItemText 
                      primary={p.player.name} 
                      secondary={
                        <span>
                          {p.clubName} {p.groupName && `• Group ${p.groupName}`}
                        </span>
                      }
                    />
                  </ListItem>
                  {idx < tournament.participants.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Participant Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Participant</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Player: {editingParticipant?.player.name}</Typography>
            <TextField 
              fullWidth 
              size="small" 
              label="Club Name"
              value={editingParticipant?.clubName || ''} 
              onChange={e => setEditingParticipant({...editingParticipant, clubName: e.target.value})} 
            />
            {tournament.type === 'cup' && (
              <FormControl fullWidth size="small">
                <InputLabel>Group</InputLabel>
                <Select 
                  label="Group"
                  value={editingParticipant?.groupName || ''} 
                  onChange={e => setEditingParticipant({...editingParticipant, groupName: e.target.value})}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {groupOptions.map(g => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateParticipant}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

function StandingsTable({ data }: { data: any[] }) {
  if (!data) return <Typography color="textSecondary">No standings data yet.</Typography>;
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">P</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">GD</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">Pts</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((s, i) => (
            <TableRow key={s.playerId}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{s.playerName}</Typography>
                <Typography variant="caption" color="textSecondary">{s.clubName}</Typography>
              </TableCell>
              <TableCell align="right">{s.played}</TableCell>
              <TableCell align="right">{s.goalDifference}</TableCell>
              <TableCell align="right"><strong>{s.points}</strong></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
