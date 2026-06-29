import { Controller, Post, Body, Param, Patch, Get, Query, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchStatus } from '../../entities/match.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  create(
    @Body('tournamentId') tournamentId: number,
    @Body('homePlayerId') homePlayerId: number,
    @Body('awayPlayerId') awayPlayerId: number,
  ) {
    return this.matchesService.create(tournamentId, homePlayerId, awayPlayerId);
  }

  @Patch(':id/goal')
  @UseGuards(AuthGuard, AdminGuard)
  addGoal(@Param('id') id: string, @Body('side') side: 'home' | 'away') {
    return this.matchesService.addGoal(+id, side);
  }

  @Patch(':id/remove-goal')
  @UseGuards(AuthGuard, AdminGuard)
  removeGoal(@Param('id') id: string, @Body('side') side: 'home' | 'away') {
    return this.matchesService.removeGoal(+id, side);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: MatchStatus) {
    return this.matchesService.updateStatus(+id, status);
  }

  @Get()
  findAll(@Query('tournamentId') tournamentId: string) {
    return this.matchesService.findAllByTournament(+tournamentId);
  }
}
