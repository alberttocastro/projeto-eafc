import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Player } from '../../entities/player.entity';

describe('PlayersService', () => {
  let service: PlayersService;

  const mockPlayerRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((player) => Promise.resolve({ id: Date.now(), ...player })),
    find: jest.fn().mockResolvedValue([]),
    findOneBy: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: getRepositoryToken(Player),
          useValue: mockPlayerRepository,
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
    });
    expect(mockPlayerRepository.create).toHaveBeenCalledWith({ name: 'Test Player' });
    expect(mockPlayerRepository.save).toHaveBeenCalled();
  });

  it('should find all players', async () => {
    mockPlayerRepository.find.mockResolvedValueOnce([{ id: 1, name: 'Player 1' }]);
    const players = await service.findAll();
    expect(players.length).toEqual(1);
    expect(mockPlayerRepository.find).toHaveBeenCalled();
  });

  it('should find one player by id', async () => {
    mockPlayerRepository.findOneBy.mockResolvedValueOnce({ id: 1, name: 'Player 1' });
    const player = await service.findOne(1);
    expect(player).toEqual({ id: 1, name: 'Player 1' });
    expect(mockPlayerRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });
});
