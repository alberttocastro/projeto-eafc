import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Player } from '../../entities/player.entity';
import { User } from '../../entities/user.entity';
import { Match, MatchStatus } from '../../entities/match.entity';
import { TournamentParticipant } from '../../entities/tournament-participant.entity';

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
}
