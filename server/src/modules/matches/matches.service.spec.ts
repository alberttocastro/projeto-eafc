import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Match, MatchStatus } from '../../entities/match.entity';
import { Player } from '../../entities/player.entity';
import { Tournament } from '../../entities/tournament.entity';
import { NotFoundException } from '@nestjs/common';

describe('MatchesService', () => {
  let service: MatchesService;

  const mockMatchesRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((match) => Promise.resolve({ id: Date.now(), ...match })),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  const mockPlayersRepository = {
    findOneBy: jest.fn(),
  };

  const mockTournamentsRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: getRepositoryToken(Match),
          useValue: mockMatchesRepository,
        },
        {
          provide: getRepositoryToken(Player),
          useValue: mockPlayersRepository,
        },
        {
          provide: getRepositoryToken(Tournament),
          useValue: mockTournamentsRepository,
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a match if tournament and players exist', async () => {
      mockTournamentsRepository.findOneBy.mockResolvedValueOnce({ id: 1, name: 'Tournament 1' });
      mockPlayersRepository.findOneBy.mockResolvedValueOnce({ id: 1, name: 'Player 1' });
      mockPlayersRepository.findOneBy.mockResolvedValueOnce({ id: 2, name: 'Player 2' });

      const match = await service.create(1, 1, 2);

      expect(match).toEqual({
        id: expect.any(Number),
        tournament: { id: 1, name: 'Tournament 1' },
        homePlayer: { id: 1, name: 'Player 1' },
        awayPlayer: { id: 2, name: 'Player 2' },
      });
      expect(mockMatchesRepository.create).toHaveBeenCalled();
      expect(mockMatchesRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tournament or players are missing', async () => {
      mockTournamentsRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(service.create(1, 1, 2)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addGoal', () => {
    it('should add goal to home team', async () => {
      mockMatchesRepository.findOneBy.mockResolvedValueOnce({ id: 1, homeScore: 0, awayScore: 0 });
      await service.addGoal(1, 'home');
      expect(mockMatchesRepository.save).toHaveBeenCalledWith({ id: 1, homeScore: 1, awayScore: 0 });
    });

    it('should throw NotFoundException if match not found', async () => {
      mockMatchesRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(service.addGoal(1, 'home')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update match status', async () => {
      mockMatchesRepository.findOneBy.mockResolvedValueOnce({ id: 1, status: MatchStatus.SCHEDULED });
      await service.updateStatus(1, MatchStatus.IN_PROGRESS);
      expect(mockMatchesRepository.save).toHaveBeenCalledWith({ id: 1, status: MatchStatus.IN_PROGRESS });
    });
  });

  describe('findAllByTournament', () => {
    it('should find all matches by tournament', async () => {
      mockMatchesRepository.find.mockResolvedValueOnce([{ id: 1 }]);
      const matches = await service.findAllByTournament(1);
      expect(matches).toEqual([{ id: 1 }]);
      expect(mockMatchesRepository.find).toHaveBeenCalledWith({
        where: { tournament: { id: 1 } },
        relations: ['homePlayer', 'awayPlayer'],
      });
    });
  });
});
