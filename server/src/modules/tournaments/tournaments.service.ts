import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentStatus, TournamentType } from '../../entities/tournament.entity';
import { TournamentParticipant } from '../../entities/tournament-participant.entity';
import { Player } from '../../entities/player.entity';
import { Match, MatchStatus } from '../../entities/match.entity';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(TournamentParticipant)
    private participantsRepository: Repository<TournamentParticipant>,
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  create(
    name: string,
    type: TournamentType = TournamentType.LEAGUE,
    isDoubleRound: boolean = false,
    cupConfig?: { groupCount: number; playersPerGroup: number; playoffRounds: number },
  ): Promise<Tournament> {
    const tournament = this.tournamentsRepository.create({
      name,
      type,
      isDoubleRound,
      ...cupConfig,
    });
    return this.tournamentsRepository.save(tournament);
  }

  findAll(): Promise<Tournament[]> {
    return this.tournamentsRepository.find({ relations: ['matches', 'participants', 'participants.player'] });
  }

  findOne(id: number): Promise<Tournament> {
    return this.tournamentsRepository.findOne({
      where: { id },
      relations: ['matches', 'matches.homePlayer', 'matches.awayPlayer', 'participants', 'participants.player'],
    });
  }

  async updateStatus(id: number, status: TournamentStatus): Promise<Tournament> {
    await this.tournamentsRepository.update(id, { status });
    return this.findOne(id);
  }

  async addParticipant(tournamentId: number, playerId: number, clubName: string): Promise<TournamentParticipant> {
    const tournament = await this.tournamentsRepository.findOneBy({ id: tournamentId });
    const player = await this.playersRepository.findOneBy({ id: playerId });

    if (!tournament || !player) {
      throw new NotFoundException('Tournament or Player not found');
    }

    const participant = this.participantsRepository.create({
      tournament,
      player,
      clubName,
    });

    return this.participantsRepository.save(participant);
  }

  async generateSchedule(tournamentId: number): Promise<Match[]> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id: tournamentId },
      relations: ['participants', 'participants.player'],
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    if (tournament.type === TournamentType.LEAGUE) {
      return this.generateLeagueSchedule(tournament);
    } else {
      return this.generateCupGroupSchedule(tournament);
    }
  }

  private async generateLeagueSchedule(tournament: Tournament): Promise<Match[]> {
    const participants = tournament.participants;
    if (participants.length < 2) throw new BadRequestException('Not enough players');
    
    const matches: Match[] = [];
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push(this.createMatchObj(tournament, participants[i].player, participants[j].player));
        if (tournament.isDoubleRound) {
          matches.push(this.createMatchObj(tournament, participants[j].player, participants[i].player));
        }
      }
    }
    return this.matchesRepository.save(matches);
  }

  private async generateCupGroupSchedule(tournament: Tournament): Promise<Match[]> {
    const participants = [...tournament.participants].sort(() => Math.random() - 0.5); // Random seed
    const { groupCount, playersPerGroup } = tournament;

    if (participants.length !== groupCount * playersPerGroup) {
      throw new BadRequestException(`Expected ${groupCount * playersPerGroup} players, but got ${participants.length}`);
    }

    const matches: Match[] = [];
    for (let g = 0; g < groupCount; g++) {
      const groupName = String.fromCharCode(65 + g); // A, B, C...
      const groupPlayers = participants.slice(g * playersPerGroup, (g + 1) * playersPerGroup);

      for (let i = 0; i < groupPlayers.length; i++) {
        for (let j = i + 1; j < groupPlayers.length; j++) {
          matches.push(this.createMatchObj(tournament, groupPlayers[i].player, groupPlayers[j].player, groupName, 'Group'));
          if (tournament.isDoubleRound) {
            matches.push(this.createMatchObj(tournament, groupPlayers[j].player, groupPlayers[i].player, groupName, 'Group'));
          }
        }
      }
    }
    return this.matchesRepository.save(matches);
  }

  private createMatchObj(tournament: Tournament, home: Player, away: Player, group?: string, round?: string): Match {
    return this.matchesRepository.create({
      tournament,
      homePlayer: home,
      awayPlayer: away,
      status: MatchStatus.SCHEDULED,
      groupName: group,
      round: round,
    });
  }

  async getStandings(tournamentId: number) {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id: tournamentId },
      relations: ['participants', 'participants.player', 'matches', 'matches.homePlayer', 'matches.awayPlayer'],
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    const finishedMatches = tournament.matches.filter((m) => m.status === MatchStatus.FINISHED);

    const stats = tournament.participants.map((p) => ({
      playerId: p.player.id,
      playerName: p.player.name,
      clubName: p.clubName,
      groupName: tournament.type === TournamentType.CUP ? this.getParticipantGroup(p, tournament.matches) : null,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }));

    finishedMatches.forEach((m) => {
      const homeStats = stats.find((s) => s.playerId === m.homePlayer.id);
      const awayStats = stats.find((s) => s.playerId === m.awayPlayer.id);

      if (homeStats && awayStats) {
        homeStats.played++;
        awayStats.played++;
        homeStats.goalsFor += m.homeScore;
        homeStats.goalsAgainst += m.awayScore;
        awayStats.goalsFor += m.awayScore;
        awayStats.goalsAgainst += m.homeScore;

        if (m.homeScore > m.awayScore) {
          homeStats.won++;
          homeStats.points += 3;
          awayStats.lost++;
        } else if (m.homeScore < m.awayScore) {
          awayStats.won++;
          awayStats.points += 3;
          homeStats.lost++;
        } else {
          homeStats.drawn++;
          awayStats.drawn++;
          homeStats.points += 1;
          awayStats.points += 1;
        }
      }
    });

    stats.forEach((s) => {
      s.goalDifference = s.goalsFor - s.goalsAgainst;
    });

    // Sort function: Points > GD > GF
    const sortFn = (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor;

    if (tournament.type === TournamentType.LEAGUE) {
      return stats.sort(sortFn);
    } else {
      // Grouped standings for Cup
      const groups = {};
      stats.forEach((s) => {
        const g = s.groupName || 'Unassigned';
        if (!groups[g]) groups[g] = [];
        groups[g].push(s);
      });
      Object.keys(groups).forEach((g) => groups[g].sort(sortFn));
      return groups;
    }
  }

  private getParticipantGroup(participant: TournamentParticipant, matches: Match[]): string | null {
    // Find a match where this player participated to identify their group
    const match = matches.find(
      (m) => (m.homePlayer.id === participant.player.id || m.awayPlayer.id === participant.player.id) && m.groupName,
    );
    return match ? match.groupName : null;
  }
}
