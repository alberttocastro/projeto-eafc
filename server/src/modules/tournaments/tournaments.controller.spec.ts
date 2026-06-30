import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { TournamentStatus, TournamentType } from '../../entities/tournament.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TournamentsController', () => {
  let controller: TournamentsController;

  const mockTournamentsService = {
    create: jest.fn((name, type, isDoubleRound, cupConfig) => {
      return { id: 1, name, type, isDoubleRound, ...cupConfig };
    }),
    findAll: jest.fn(() => [{ id: 1 }]),
    findOne: jest.fn((id) => ({ id })),
    updateStatus: jest.fn((id, status) => ({ id, status })),
    addParticipant: jest.fn((id, playerId, clubName, groupName) => ({ id: 1, tournament: { id }, player: { id: playerId }, clubName, groupName })),
    updateParticipant: jest.fn((participantId, data) => ({ id: participantId, ...data })),
    removeParticipant: jest.fn(() => {}),
    autoAssignGroups: jest.fn(() => {}),
    generateSchedule: jest.fn(() => [{ id: 1 }]),
    getStandings: jest.fn(() => [{ playerId: 1, points: 3 }]),
    archive: jest.fn((id, isArchived) => ({ id, isArchived })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentsController],
      providers: [
        TournamentsService,
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    })
      .overrideProvider(TournamentsService)
      .useValue(mockTournamentsService)
      .compile();

    controller = module.get<TournamentsController>(TournamentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a tournament', () => {
    expect(controller.create('Cup', TournamentType.CUP, false, { groupCount: 2, playersPerGroup: 4, playoffRounds: 1 })).toEqual(expect.objectContaining({
      name: 'Cup', type: TournamentType.CUP, groupCount: 2,
    }));
  });

  it('should get all tournaments', () => {
    expect(controller.findAll()).toEqual([{ id: 1 }]);
  });

  it('should get one tournament', () => {
    expect(controller.findOne('1')).toEqual({ id: 1 });
  });

  it('should update status', () => {
    expect(controller.updateStatus('1', TournamentStatus.IN_PROGRESS)).toEqual({ id: 1, status: TournamentStatus.IN_PROGRESS });
  });

  it('should archive tournament', () => {
    expect(controller.archive('1', true)).toEqual({ id: 1, isArchived: true });
  });

  it('should add participant', () => {
    expect(controller.addParticipant('1', 1, 'Club A')).toEqual({ id: 1, tournament: { id: 1 }, player: { id: 1 }, clubName: 'Club A', groupName: undefined });
  });

  it('should update participant', () => {
    expect(controller.updateParticipant('1', { clubName: 'Club B' })).toEqual({ id: 1, clubName: 'Club B' });
  });

  it('should remove participant', () => {
    expect(controller.removeParticipant('1')).toBeUndefined();
  });

  it('should generate schedule', () => {
    expect(controller.generateSchedule('1')).toEqual([{ id: 1 }]);
  });

  it('should get standings', () => {
    expect(controller.getStandings('1')).toEqual([{ playerId: 1, points: 3 }]);
  });
});
