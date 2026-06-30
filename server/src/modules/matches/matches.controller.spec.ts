import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchStatus } from '../../entities/match.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('MatchesController', () => {
  let controller: MatchesController;

  const mockMatchesService = {
    create: jest.fn((tournamentId, homePlayerId, awayPlayerId) => {
      return { id: 1, tournamentId, homePlayerId, awayPlayerId };
    }),
    addGoal: jest.fn((id, side) => {
      return { id, side, homeScore: side === 'home' ? 1 : 0, awayScore: side === 'away' ? 1 : 0 };
    }),
    updateStatus: jest.fn((id, status) => {
      return { id, status };
    }),
    findAllByTournament: jest.fn((tournamentId) => {
      return [{ id: 1, tournamentId }];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [
        MatchesService,
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    })
      .overrideProvider(MatchesService)
      .useValue(mockMatchesService)
      .compile();

    controller = module.get<MatchesController>(MatchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a match', () => {
    expect(controller.create(1, 1, 2)).toEqual({ id: 1, tournamentId: 1, homePlayerId: 1, awayPlayerId: 2 });
    expect(mockMatchesService.create).toHaveBeenCalledWith(1, 1, 2);
  });

  it('should add a goal', () => {
    expect(controller.addGoal('1', 'home')).toEqual({ id: 1, side: 'home', homeScore: 1, awayScore: 0 });
    expect(mockMatchesService.addGoal).toHaveBeenCalledWith(1, 'home');
  });

  it('should update status', () => {
    expect(controller.updateStatus('1', MatchStatus.FINISHED)).toEqual({ id: 1, status: MatchStatus.FINISHED });
    expect(mockMatchesService.updateStatus).toHaveBeenCalledWith(1, MatchStatus.FINISHED);
  });

  it('should find all by tournament', () => {
    expect(controller.findAll('1')).toEqual([{ id: 1, tournamentId: 1 }]);
    expect(mockMatchesService.findAllByTournament).toHaveBeenCalledWith(1);
  });
});
