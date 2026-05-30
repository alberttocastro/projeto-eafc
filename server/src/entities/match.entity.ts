import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Tournament } from './tournament.entity';
import { Player } from './player.entity';

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tournament, (tournament) => tournament.matches)
  tournament: Tournament;

  @ManyToOne(() => Player)
  homePlayer: Player;

  @ManyToOne(() => Player)
  awayPlayer: Player;

  @Column({ default: 0 })
  homeScore: number;

  @Column({ default: 0 })
  awayScore: number;

  @Column({
    type: 'simple-enum',
    enum: MatchStatus,
    default: MatchStatus.SCHEDULED,
  })
  status: MatchStatus;

  @Column({ nullable: true })
  groupName: string; // "A", "B", etc.

  @Column({ nullable: true })
  round: string; // "Group", "Quarter-final", "Semi-final", "Final"
}
