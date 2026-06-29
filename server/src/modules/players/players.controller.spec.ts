import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

describe('PlayersController', () => {
  let controller: PlayersController;

  const mockPlayersService = {
    create: jest.fn((name) => {
      return { id: 1, name };
    }),
    findAll: jest.fn(() => {
      return [{ id: 1, name: 'Test Player' }];
    }),
    findOne: jest.fn((id) => {
      return { id, name: 'Test Player' };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [PlayersService],
    })
      .overrideProvider(PlayersService)
      .useValue(mockPlayersService)
      .compile();

    controller = module.get<PlayersController>(PlayersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a player', () => {
    expect(controller.create('Test Player')).toEqual({
      id: 1,
      name: 'Test Player',
    });
    expect(mockPlayersService.create).toHaveBeenCalledWith('Test Player');
  });

  it('should get all players', () => {
    expect(controller.findAll()).toEqual([{ id: 1, name: 'Test Player' }]);
    expect(mockPlayersService.findAll).toHaveBeenCalled();
  });

  it('should get one player', () => {
    expect(controller.findOne('1')).toEqual({ id: 1, name: 'Test Player' });
    expect(mockPlayersService.findOne).toHaveBeenCalledWith(1);
  });
});
