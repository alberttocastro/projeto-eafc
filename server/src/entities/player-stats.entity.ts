import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Player } from './player.entity';

@Entity()
export class PlayerStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Player, { onDelete: 'CASCADE', eager: true })
  player: Player;

  @Column({ default: 0 })
  played: number;

  @Column({ default: 0 })
  won: number;

  @Column({ default: 0 })
  drawn: number;

  @Column({ default: 0 })
  lost: number;

  @Column({ default: 0 })
  goalsFor: number;

  @Column({ default: 0 })
  goalsAgainst: number;

  @Column({ default: 0 })
  goalDifference: number;

  @Column({ default: 0 })
  points: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;
}
