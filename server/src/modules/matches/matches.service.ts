import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus } from '../../entities/match.entity';
import { Player } from '../../entities/player.entity';
import { Tournament } from '../../entities/tournament.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
  ) {}

  async create(tournamentId: number, homePlayerId: number, awayPlayerId: number): Promise<Match> {
    const tournament = await this.tournamentsRepository.findOneBy({ id: tournamentId });
    const homePlayer = await this.playersRepository.findOneBy({ id: homePlayerId });
    const awayPlayer = await this.playersRepository.findOneBy({ id: awayPlayerId });

    if (!tournament || !homePlayer || !awayPlayer) {
      throw new NotFoundException('Tournament or Player not found');
    }

    const match = this.matchesRepository.create({
      tournament,
      homePlayer,
      awayPlayer,
    });

    return this.matchesRepository.save(match);
  }

  async addGoal(matchId: number, side: 'home' | 'away'): Promise<Match> {
    const match = await this.matchesRepository.findOneBy({ id: matchId });
    if (!match) throw new NotFoundException('Match not found');

    if (side === 'home') {
      match.homeScore += 1;
    } else {
      match.awayScore += 1;
    }

    return this.matchesRepository.save(match);
  }

  async removeGoal(matchId: number, side: 'home' | 'away'): Promise<Match> {
    const match = await this.matchesRepository.findOneBy({ id: matchId });
    if (!match) throw new NotFoundException('Match not found');

    if (side === 'home') {
      match.homeScore = Math.max(0, match.homeScore - 1);
    } else {
      match.awayScore = Math.max(0, match.awayScore - 1);
    }

    return this.matchesRepository.save(match);
  }

  async updateStatus(matchId: number, status: MatchStatus): Promise<Match> {
    const match = await this.matchesRepository.findOneBy({ id: matchId });
    if (!match) throw new NotFoundException('Match not found');

    match.status = status;
    return this.matchesRepository.save(match);
  }

  findAllByTournament(tournamentId: number): Promise<Match[]> {
    return this.matchesRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['homePlayer', 'awayPlayer'],
    });
  }
}
