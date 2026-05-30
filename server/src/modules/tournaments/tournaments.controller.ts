import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentStatus, TournamentType } from '../../entities/tournament.entity';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  create(
    @Body('name') name: string,
    @Body('type') type: TournamentType,
    @Body('isDoubleRound') isDoubleRound: boolean,
    @Body('cupConfig') cupConfig?: { groupCount: number; playersPerGroup: number; playoffRounds: number },
  ) {
    return this.tournamentsService.create(name, type, isDoubleRound, cupConfig);
  }

  @Get()
  findAll() {
    return this.tournamentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(+id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: TournamentStatus) {
    return this.tournamentsService.updateStatus(+id, status);
  }

  @Post(':id/participants')
  addParticipant(
    @Param('id') id: string,
    @Body('playerId') playerId: number,
    @Body('clubName') clubName: string,
  ) {
    return this.tournamentsService.addParticipant(+id, playerId, clubName);
  }

  @Post(':id/generate-schedule')
  generateSchedule(@Param('id') id: string) {
    return this.tournamentsService.generateSchedule(+id);
  }

  @Get(':id/standings')
  getStandings(@Param('id') id: string) {
    return this.tournamentsService.getStandings(+id);
  }
}
