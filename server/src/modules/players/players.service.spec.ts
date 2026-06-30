import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Player } from '../../entities/player.entity';
import { User } from '../../entities/user.entity';
import { Match } from '../../entities/match.entity';
import { TournamentParticipant } from '../../entities/tournament-participant.entity';
import { PlayerStats } from '../../entities/player-stats.entity';

describe('PlayersService', () => {
  let service: PlayersService;

  const mockPlayerRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((player) => Promise.resolve({ id: Date.now(), ...player })),
    find: jest.fn().mockResolvedValue([]),
    findOneBy: jest.fn().mockResolvedValue(null),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOneBy: jest.fn(),
  };

  const mockMatchRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockTournamentParticipantRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockPlayerStatsRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOneBy: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: getRepositoryToken(Player),
          useValue: mockPlayerRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Match),
          useValue: mockMatchRepository,
        },
        {
          provide: getRepositoryToken(TournamentParticipant),
          useValue: mockTournamentParticipantRepository,
        },
        {
          provide: getRepositoryToken(PlayerStats),
          useValue: mockPlayerStatsRepository,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a player', async () => {
    const player = await service.create('Test Player');
    expect(player).toEqual({
      id: expect.any(Number),
      name: 'Test Player',
      user: null,
    });
    expect(mockPlayerRepository.create).toHaveBeenCalledWith({ name: 'Test Player', user: null });
    expect(mockPlayerRepository.save).toHaveBeenCalled();
  });

  it('should find all players', async () => {
    mockPlayerRepository.find.mockResolvedValueOnce([{ id: 1, name: 'Player 1' }]);
    const players = await service.findAll();
    expect(players.length).toEqual(1);
    expect(mockPlayerRepository.find).toHaveBeenCalled();
  });

  it('should find one player by id', async () => {
    mockPlayerRepository.findOne.mockResolvedValueOnce({ id: 1, name: 'Player 1' });
    const player = await service.findOne(1);
    expect(player).toEqual({ id: 1, name: 'Player 1' });
    expect(mockPlayerRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['user'],
    });
  });
});
