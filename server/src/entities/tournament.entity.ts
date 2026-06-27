import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Match } from './match.entity';
import { TournamentParticipant } from './tournament-participant.entity';

export enum TournamentStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  FINISHED = 'finished',
}

export enum TournamentType {
  LEAGUE = 'league',
  CUP = 'cup',
}

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: TournamentStatus,
    default: TournamentStatus.PLANNED,
  })
  status: TournamentStatus;

  @Column({
    type: 'simple-enum',
    enum: TournamentType,
    default: TournamentType.LEAGUE,
  })
  type: TournamentType;

  @Column({ default: false })
  isDoubleRound: boolean; // Only for LEAGUE type or Group Stage

  // Cup Configuration
  @Column({ nullable: true })
  groupCount: number;

  @Column({ nullable: true })
  playersPerGroup: number;

  @Column({ nullable: true })
  playoffRounds: number; // e.g., 3 for Quarter-finals (8 players), 4 for Round of 16 (16 players)

  @OneToMany(() => Match, (match) => match.tournament)
  matches: Match[];

  @OneToMany(
    () => TournamentParticipant,
    (participant) => participant.tournament,
  )
  participants: TournamentParticipant[];
}
