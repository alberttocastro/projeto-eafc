import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../../entities/match.entity';
import { Player } from '../../entities/player.entity';
import { Tournament } from '../../entities/tournament.entity';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Player, Tournament])],
  providers: [MatchesService],
  controllers: [MatchesController],
})
export class MatchesModule {}
