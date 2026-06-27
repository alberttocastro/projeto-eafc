import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Query,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchStatus } from '../../entities/match.entity';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(
    @Body('tournamentId') tournamentId: number,
    @Body('homePlayerId') homePlayerId: number,
    @Body('awayPlayerId') awayPlayerId: number,
  ) {
    return this.matchesService.create(tournamentId, homePlayerId, awayPlayerId);
  }

  @Patch(':id/goal')
  addGoal(@Param('id') id: string, @Body('side') side: 'home' | 'away') {
    return this.matchesService.addGoal(+id, side);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: MatchStatus) {
    return this.matchesService.updateStatus(+id, status);
  }

  @Get()
  findAll(@Query('tournamentId') tournamentId: string) {
    return this.matchesService.findAllByTournament(+tournamentId);
  }
}
