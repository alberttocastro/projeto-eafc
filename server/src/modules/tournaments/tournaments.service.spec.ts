import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsService } from './tournaments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tournament, TournamentStatus, TournamentType } from '../../entities/tournament.entity';
import { TournamentParticipant } from '../../entities/tournament-participant.entity';
import { Player } from '../../entities/player.entity';
import { Match, MatchStatus } from '../../entities/match.entity';

describe('TournamentsService', () => {
  let service: TournamentsService;

  const mockTournamentsRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((t) => Promise.resolve({ id: Date.now(), ...t })),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockParticipantsRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((p) => Promise.resolve({ id: Date.now(), ...p })),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const mockPlayersRepository = {
    findOneBy: jest.fn(),
  };

  const mockMatchesRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((m) => Promise.resolve(m)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        { provide: getRepositoryToken(Tournament), useValue: mockTournamentsRepository },
        { provide: getRepositoryToken(TournamentParticipant), useValue: mockParticipantsRepository },
        { provide: getRepositoryToken(Player), useValue: mockPlayersRepository },
        { provide: getRepositoryToken(Match), useValue: mockMatchesRepository },
      ],
    }).compile();

    service = module.get<TournamentsService>(TournamentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tournament', async () => {
      const result = await service.create('Test League', TournamentType.LEAGUE, true);
      expect(result).toEqual(expect.objectContaining({ name: 'Test League', type: TournamentType.LEAGUE, isDoubleRound: true }));
      expect(mockTournamentsRepository.create).toHaveBeenCalled();
      expect(mockTournamentsRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update tournament status', async () => {
      mockTournamentsRepository.findOne.mockResolvedValueOnce({ id: 1, status: TournamentStatus.IN_PROGRESS });
      const result = await service.updateStatus(1, TournamentStatus.IN_PROGRESS);
      expect(mockTournamentsRepository.update).toHaveBeenCalledWith(1, { status: TournamentStatus.IN_PROGRESS });
      expect(result).toEqual({ id: 1, status: TournamentStatus.IN_PROGRESS });
    });
  });

  describe('addParticipant', () => {
    it('should add a participant', async () => {
      mockTournamentsRepository.findOne.mockResolvedValueOnce({ id: 1, participants: [] });
      mockPlayersRepository.findOneBy.mockResolvedValueOnce({ id: 1 });

      const result = await service.addParticipant(1, 1, 'Club A');
      expect(result).toEqual(expect.objectContaining({ clubName: 'Club A' }));
      expect(mockParticipantsRepository.create).toHaveBeenCalled();
      expect(mockParticipantsRepository.save).toHaveBeenCalled();
    });
  });

  describe('generateSchedule', () => {
    it('should generate a league schedule', async () => {
      mockTournamentsRepository.findOne.mockResolvedValueOnce({
        id: 1,
        type: TournamentType.LEAGUE,
        isDoubleRound: false,
        participants: [
          { player: { id: 1 } },
          { player: { id: 2 } },
        ]
      });

      const matches = await service.generateSchedule(1);
      expect(matches.length).toBe(1);
      expect(mockMatchesRepository.save).toHaveBeenCalled();
    });
  });

  describe('getStandings', () => {
    it('should calculate league standings correctly', async () => {
      mockTournamentsRepository.findOne.mockResolvedValueOnce({
        id: 1,
        type: TournamentType.LEAGUE,
        participants: [
          { player: { id: 1, name: 'P1' }, clubName: 'C1' },
          { player: { id: 2, name: 'P2' }, clubName: 'C2' },
        ],
        matches: [
          { status: MatchStatus.FINISHED, homePlayer: { id: 1 }, awayPlayer: { id: 2 }, homeScore: 2, awayScore: 1 },
        ]
      });

      const standings = await service.getStandings(1) as any[];
      expect(standings.length).toBe(2);
      expect(standings[0].playerId).toBe(1); // Winner P1
      expect(standings[0].points).toBe(3);
      expect(standings[1].playerId).toBe(2); // Loser P2
      expect(standings[1].points).toBe(0);
    });
  });
});
