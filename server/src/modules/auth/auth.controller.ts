import { Body, Controller, Get, Post, Patch, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.register(name, email, password);
  }

  @Post('login')
  login(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.login(email, password);
  }

  @Post('google')
  loginWithGoogle(@Body('token') token: string) {
    return this.authService.loginWithGoogle(token);
  }

  @Post('microsoft')
  loginWithMicrosoft(@Body('token') token: string) {
    return this.authService.loginWithMicrosoft(token);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    // The user payload is injected from the JWT by AuthGuard
    return user;
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get('users')
  findAllUsers() {
    return this.authService.findAllUsers();
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch('users/:id/promote')
  promoteUser(@Param('id') id: string) {
    return this.authService.promoteUser(+id);
  }
}

