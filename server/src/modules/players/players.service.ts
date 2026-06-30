import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Player } from '../../entities/player.entity';
import { User } from '../../entities/user.entity';
import { Match, MatchStatus } from '../../entities/match.entity';
import { TournamentParticipant } from '../../entities/tournament-participant.entity';
import { PlayerStats } from '../../entities/player-stats.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(TournamentParticipant)
    private participantsRepository: Repository<TournamentParticipant>,
    @InjectRepository(PlayerStats)
    private playerStatsRepository: Repository<PlayerStats>,
  ) {}

  async create(name: string, userId?: number): Promise<Player> {
    let user = null;
    if (userId) {
      user = await this.usersRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }
    const player = this.playersRepository.create({ name, user });
    return this.playersRepository.save(player);
  }

  async update(id: number, name?: string, userId?: number | null): Promise<Player> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    if (name !== undefined) {
      player.name = name;
    }
    if (userId !== undefined) {
      if (userId === null) {
        player.user = null;
      } else {
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        player.user = user;
      }
    }
    return this.playersRepository.save(player);
  }

  findAll(): Promise<Player[]> {
    return this.playersRepository.find({ relations: ['user'] });
  }

  findOne(id: number): Promise<Player | null> {
    return this.playersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async getUserStats(userId: number) {
    // 1. Fetch players for this user
    const players = await this.playersRepository.find({
      where: { user: { id: userId } },
    });

    if (players.length === 0) {
      return {
        hasPlayerLinked: false,
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
      };
    }

    const playerIds = players.map((p) => p.id);

    // 2. Fetch tournament participants (participation details)
    const participants = await this.participantsRepository.find({
      where: { player: { id: In(playerIds) } },
      relations: ['tournament', 'player'],
    });

    // 3. Fetch matches played by these players
    const matches = await this.matchesRepository.find({
      where: [
        { homePlayer: { id: In(playerIds) } },
        { awayPlayer: { id: In(playerIds) } },
      ],
      relations: ['homePlayer', 'awayPlayer', 'tournament'],
      order: { id: 'DESC' },
    });

    // We compile stats per player and overall
    const playerStatsMap = new Map<number, any>();
    players.forEach((p) => {
      playerStatsMap.set(p.id, {
        id: p.id,
        name: p.name,
        tournamentsCount: 0,
        matchesCount: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
      });
    });

    // Track tournaments participated in
    const uniqueTournamentsMap = new Map<number, any>();
    participants.forEach((part) => {
      const pStats = playerStatsMap.get(part.player.id);
      if (pStats) {
        pStats.tournamentsCount++;
      }
      uniqueTournamentsMap.set(part.tournament.id, {
        id: part.tournament.id,
        name: part.tournament.name,
        type: part.tournament.type,
        status: part.tournament.status,
        clubName: part.clubName,
      });
    });

    let overallWins = 0;
    let overallDraws = 0;
    let overallLosses = 0;
    let overallGoalsScored = 0;
    let overallGoalsConceded = 0;
    let overallMatchesCount = 0;

    const matchesList = matches.map((m) => {
      const isHome = playerIds.includes(m.homePlayer.id);
      const playedAs: 'home' | 'away' = isHome ? 'home' : 'away';
      const myPlayer = isHome ? m.homePlayer : m.awayPlayer;

      const myGoals = isHome ? m.homeScore : m.awayScore;
      const opponentGoals = isHome ? m.awayScore : m.homeScore;

      let result: 'win' | 'draw' | 'loss' | 'scheduled' = 'scheduled';

      if (m.status === MatchStatus.FINISHED) {
        overallMatchesCount++;
        const pStats = playerStatsMap.get(myPlayer.id);
        if (pStats) {
          pStats.matchesCount++;
          pStats.goalsScored += myGoals;
          pStats.goalsConceded += opponentGoals;
        }
        overallGoalsScored += myGoals;
        overallGoalsConceded += opponentGoals;

        if (myGoals > opponentGoals) {
          result = 'win';
          overallWins++;
          if (pStats) pStats.wins++;
        } else if (myGoals < opponentGoals) {
          result = 'loss';
          overallLosses++;
          if (pStats) pStats.losses++;
        } else {
          result = 'draw';
          overallDraws++;
          if (pStats) pStats.draws++;
        }
      }

      return {
        id: m.id,
        tournamentName: m.tournament.name,
        tournamentId: m.tournament.id,
        homePlayerName: m.homePlayer.name,
        awayPlayerName: m.awayPlayer.name,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
        playedAs,
        result,
      };
    });

    return {
      hasPlayerLinked: true,
      players: Array.from(playerStatsMap.values()),
      overall: {
        tournamentsCount: uniqueTournamentsMap.size,
        matchesCount: overallMatchesCount,
        wins: overallWins,
        draws: overallDraws,
        losses: overallLosses,
        goalsScored: overallGoalsScored,
        goalsConceded: overallGoalsConceded,
      },
      tournaments: Array.from(uniqueTournamentsMap.values()),
      matches: matchesList,
    };
  }

  async calculateAndCacheStats(force = false): Promise<PlayerStats[]> {
    const cachedStats = await this.playerStatsRepository.find({
      order: { points: 'DESC', goalDifference: 'DESC', goalsFor: 'DESC' }
    });

    if (!force && cachedStats.length > 0) {
      const lastUpdated = cachedStats[0].lastUpdated;
      const hoursSinceLastUpdate = (new Date().getTime() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastUpdate < 24) {
        return cachedStats;
      }
    }

    const players = await this.playersRepository.find();
    const finishedMatches = await this.matchesRepository.find({
      where: { status: MatchStatus.FINISHED },
      relations: ['homePlayer', 'awayPlayer']
    });

    const statsMap = new Map<number, {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
    }>();

    players.forEach(p => {
      statsMap.set(p.id, {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      });
    });

    finishedMatches.forEach(m => {
      if (!m.homePlayer || !m.awayPlayer) return;
      
      const homeStats = statsMap.get(m.homePlayer.id);
      const awayStats = statsMap.get(m.awayPlayer.id);

      if (homeStats) {
        homeStats.played++;
        homeStats.goalsFor += m.homeScore;
        homeStats.goalsAgainst += m.awayScore;
        if (m.homeScore > m.awayScore) {
          homeStats.won++;
          homeStats.points += 3;
        } else if (m.homeScore < m.awayScore) {
          homeStats.lost++;
        } else {
          homeStats.drawn++;
          homeStats.points += 1;
        }
      }

      if (awayStats) {
        awayStats.played++;
        awayStats.goalsFor += m.awayScore;
        awayStats.goalsAgainst += m.homeScore;
        if (m.awayScore > m.homeScore) {
          awayStats.won++;
          awayStats.points += 3;
        } else if (m.awayScore < m.homeScore) {
          awayStats.lost++;
        } else {
          awayStats.drawn++;
          awayStats.points += 1;
        }
      }
    });

    await this.playerStatsRepository.createQueryBuilder().delete().execute();

    const newStatsEntities: PlayerStats[] = [];
    for (const p of players) {
      const s = statsMap.get(p.id);
      if (s) {
        const entity = this.playerStatsRepository.create({
          player: p,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalsFor - s.goalsAgainst,
          points: s.points,
          lastUpdated: new Date()
        });
        newStatsEntities.push(entity);
      }
    }

    await this.playerStatsRepository.save(newStatsEntities);

    return this.playerStatsRepository.find({
      order: { points: 'DESC', goalDifference: 'DESC', goalsFor: 'DESC' }
    });
  }
}
