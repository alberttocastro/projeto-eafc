import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../../entities/player.entity';
import { User } from '../../entities/user.entity';
import { Match } from '../../entities/match.entity';
import { TournamentParticipant } from '../../entities/tournament-participant.entity';
import { PlayerStats } from '../../entities/player-stats.entity';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, User, Match, TournamentParticipant, PlayerStats]),
    AuthModule,
  ],
  providers: [PlayersService],
  controllers: [PlayersController],
  exports: [PlayersService],
})
export class PlayersModule {}

