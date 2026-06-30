import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('me/stats')
  @UseGuards(AuthGuard)
  getMyStats(@CurrentUser() user: any) {
    return this.playersService.getUserStats(user.sub);
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.playersService.calculateAndCacheStats(false);
  }

  @Post('leaderboard/recalculate')
  recalculateLeaderboard() {
    return this.playersService.calculateAndCacheStats(true);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  create(@Body('name') name: string, @Body('userId') userId?: number) {
    return this.playersService.create(name, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('userId') userId?: number | null,
  ) {
    return this.playersService.update(+id, name, userId);
  }

  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(+id);
  }
}
