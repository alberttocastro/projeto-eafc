import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/email')
  registerWithEmail(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('displayName') displayName?: string,
  ) {
    return this.authService.registerWithEmail(email, password, displayName);
  }

  @Post('login/email')
  loginWithEmail(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.loginWithEmail(email, password);
  }

  @Post('login/google')
  loginWithGoogle(
    @Body('providerId') providerId: string,
    @Body('email') email: string,
    @Body('displayName') displayName?: string,
  ) {
    return this.authService.loginWithSocialProvider(
      'google',
      providerId,
      email,
      displayName,
    );
  }

  @Post('login/microsoft')
  loginWithMicrosoft(
    @Body('providerId') providerId: string,
    @Body('email') email: string,
    @Body('displayName') displayName?: string,
  ) {
    return this.authService.loginWithSocialProvider(
      'microsoft',
      providerId,
      email,
      displayName,
    );
  }

  @Get('providers/google/url')
  getGoogleLoginUrl() {
    return this.authService.getGoogleLoginUrl();
  }

  @Get('providers/microsoft/url')
  getMicrosoftLoginUrl() {
    return this.authService.getMicrosoftLoginUrl();
  }

  @Get('session')
  getSession(@Headers('authorization') authorizationHeader?: string) {
    return this.authService.getSessionFromToken(authorizationHeader);
  }
}
