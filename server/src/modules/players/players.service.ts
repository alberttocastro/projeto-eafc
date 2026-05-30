import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../../entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
  ) {}

  create(name: string): Promise<Player> {
    const player = this.playersRepository.create({ name });
    return this.playersRepository.save(player);
  }

  findAll(): Promise<Player[]> {
    return this.playersRepository.find();
  }

  findOne(id: number): Promise<Player | null> {
    return this.playersRepository.findOneBy({ id });
  }
}
