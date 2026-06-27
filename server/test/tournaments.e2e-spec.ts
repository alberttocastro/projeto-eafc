import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TournamentType } from './../src/entities/tournament.entity';
import { ConfigService } from '@nestjs/config';

describe('Tournaments (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(ConfigService)
    .useValue({
      get: (key: string, defaultValue?: any) => {
        const config = {
          DB_TYPE: 'sqlite',
          DB_DATABASE: ':memory:',
          DB_SYNC: true,
        };
        return config[key] ?? defaultValue;
      },
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 10000);

  afterAll(async () => {
    await app.close();
  });

  it('should flow through a complete tournament lifecycle', async () => {
    // 0. Register Admin User
    const adminRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Admin User', email: 'admin@eafc.com', password: 'password123' })
      .expect(201);
    
    const token = adminRegisterRes.body.accessToken;
    const authHeader = `Bearer ${token}`;

    // 1. Create Players
    const player1Res = await request(app.getHttpServer())
      .post('/players')
      .set('Authorization', authHeader)
      .send({ name: 'Player 1' })
      .expect(201);
    const p1Id = player1Res.body.id;

    const player2Res = await request(app.getHttpServer())
      .post('/players')
      .set('Authorization', authHeader)
      .send({ name: 'Player 2' })
      .expect(201);
    const p2Id = player2Res.body.id;

    // 2. Create Tournament
    const tournamentRes = await request(app.getHttpServer())
      .post('/tournaments')
      .set('Authorization', authHeader)
      .send({ name: 'E2E Test League', type: TournamentType.LEAGUE, isDoubleRound: false })
      .expect(201);
    const tId = tournamentRes.body.id;

    // 3. Add Participants
    await request(app.getHttpServer())
      .post(`/tournaments/${tId}/participants`)
      .set('Authorization', authHeader)
      .send({ playerId: p1Id, clubName: 'FC Test 1' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tournaments/${tId}/participants`)
      .set('Authorization', authHeader)
      .send({ playerId: p2Id, clubName: 'FC Test 2' })
      .expect(201);

    // 4. Generate Schedule
    const scheduleRes = await request(app.getHttpServer())
      .post(`/tournaments/${tId}/generate-schedule`)
      .set('Authorization', authHeader)
      .send()
      .expect(201);
    
    expect(scheduleRes.body.length).toBe(1); // 2 players, single round = 1 match
    const matchId = scheduleRes.body[0].id;

    // 5. Start Match
    await request(app.getHttpServer())
      .patch(`/matches/${matchId}/status`)
      .set('Authorization', authHeader)
      .send({ status: 'in_progress' })
      .expect(200);

    // 6. Record Goals
    await request(app.getHttpServer())
      .patch(`/matches/${matchId}/goal`)
      .set('Authorization', authHeader)
      .send({ side: 'home' })
      .expect(200);

    // 7. Finish Match
    await request(app.getHttpServer())
      .patch(`/matches/${matchId}/status`)
      .set('Authorization', authHeader)
      .send({ status: 'finished' })
      .expect(200);

    // 8. Check Standings
    const standingsRes = await request(app.getHttpServer())
      .get(`/tournaments/${tId}/standings`)
      .expect(200);

    const p1Stats = standingsRes.body.find((s: any) => s.playerId === p1Id);
    expect(p1Stats.points).toBe(3);
    expect(p1Stats.goalsFor).toBe(1);
    expect(p1Stats.goalsAgainst).toBe(0);

    const p2Stats = standingsRes.body.find((s: any) => s.playerId === p2Id);
    expect(p2Stats.points).toBe(0);
    expect(p2Stats.goalsFor).toBe(0);
    expect(p2Stats.goalsAgainst).toBe(1);
  });
});
