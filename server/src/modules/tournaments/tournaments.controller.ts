import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
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
    @Body('groupName') groupName?: string,
  ) {
    return this.tournamentsService.addParticipant(+id, playerId, clubName, groupName);
  }

  @Patch('participants/:participantId')
  updateParticipant(
    @Param('participantId') participantId: string,
    @Body() data: { clubName?: string, groupName?: string },
  ) {
    return this.tournamentsService.updateParticipant(+participantId, data);
  }

  @Delete('participants/:participantId')
  removeParticipant(@Param('participantId') participantId: string) {
    return this.tournamentsService.removeParticipant(+participantId);
  }

  @Post(':id/auto-assign-groups')
  autoAssignGroups(@Param('id') id: string) {
    return this.tournamentsService.autoAssignGroups(+id);
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
