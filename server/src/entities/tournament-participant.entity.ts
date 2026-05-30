import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Tournament } from './tournament.entity';
import { Player } from './player.entity';

@Entity()
export class TournamentParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tournament, (tournament) => tournament.participants)
  tournament: Tournament;

  @ManyToOne(() => Player)
  player: Player;

  @Column()
  clubName: string;
}
