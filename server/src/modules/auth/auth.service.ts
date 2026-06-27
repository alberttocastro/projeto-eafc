import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

const scrypt = promisify(scryptCallback);
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_SALT_SIZE = 16;
const PASSWORD_KEY_LENGTH = 64;

type SupportedSocialProvider = 'google' | 'microsoft';

type SessionUser = {
  id: number;
  email: string;
  displayName: string | null;
  googleId: string | null;
  microsoftId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  private readonly fallbackTokenSecret = randomBytes(64).toString('hex');

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async registerWithEmail(
    email: unknown,
    password: unknown,
    displayName?: unknown,
  ) {
    const normalizedEmail = this.normalizeEmail(email);
    this.validatePassword(password);

    const existing = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new BadRequestException('Email já cadastrado');
    }

    const passwordHash = await this.hashPassword(
      this.requiredString(password, 'password'),
    );
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email: normalizedEmail,
        displayName:
          this.normalizeOptionalString(displayName) || normalizedEmail,
        passwordHash,
      }),
    );

    return this.createAuthResponse(user);
  }

  async loginWithEmail(email: unknown, password: unknown) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const validPassword = await this.verifyPassword(
      this.requiredString(password, 'password'),
      user.passwordHash,
    );

    if (!validPassword) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    return this.createAuthResponse(user);
  }

  async loginWithSocialProvider(
    provider: SupportedSocialProvider,
    providerId: unknown,
    email: unknown,
    displayName?: unknown,
  ) {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedProviderId = this.requiredString(providerId, 'providerId');

    const idField = provider === 'google' ? 'googleId' : 'microsoftId';

    const userByProvider = await this.usersRepository.findOneBy(
      idField === 'googleId'
        ? { googleId: normalizedProviderId }
        : { microsoftId: normalizedProviderId },
    );

    if (userByProvider) {
      return this.createAuthResponse(userByProvider);
    }

    const userByEmail = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (userByEmail) {
      if (idField === 'googleId') {
        userByEmail.googleId = normalizedProviderId;
      } else {
        userByEmail.microsoftId = normalizedProviderId;
      }

      const normalizedDisplayName = this.normalizeOptionalString(displayName);

      if (normalizedDisplayName) {
        userByEmail.displayName = normalizedDisplayName;
      }

      const linkedUser = await this.usersRepository.save(userByEmail);
      return this.createAuthResponse(linkedUser);
    }

    const user = new User();
    user.email = normalizedEmail;
    user.displayName =
      this.normalizeOptionalString(displayName) || normalizedEmail;
    user.googleId = provider === 'google' ? normalizedProviderId : null;
    user.microsoftId = provider === 'microsoft' ? normalizedProviderId : null;

    const savedUser = await this.usersRepository.save(user);

    return this.createAuthResponse(savedUser);
  }

  async getSessionFromToken(authorizationHeader?: string) {
    const token = this.extractBearerToken(authorizationHeader);

    if (!token) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const payload = this.decodeToken(token);

    if (!payload) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: this.toSessionUser(user),
    };
  }

  getGoogleLoginUrl() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return {
        provider: 'google',
        configured: false,
        loginUrl: null,
      };
    }

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');

    return {
      provider: 'google',
      configured: true,
      loginUrl: url.toString(),
    };
  }

  getMicrosoftLoginUrl() {
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    const redirectUri = this.configService.get<string>(
      'MICROSOFT_REDIRECT_URI',
    );
    const tenantId = this.configService.get<string>(
      'MICROSOFT_TENANT_ID',
      'common',
    );

    if (!clientId || !redirectUri) {
      return {
        provider: 'microsoft',
        configured: false,
        loginUrl: null,
      };
    }

    const url = new URL(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
    );
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile User.Read');

    return {
      provider: 'microsoft',
      configured: true,
      loginUrl: url.toString(),
    };
  }

  private createAuthResponse(user: User) {
    return {
      accessToken: this.generateToken(user),
      user: this.toSessionUser(user),
    };
  }

  private toSessionUser(user: User): SessionUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      googleId: user.googleId,
      microsoftId: user.microsoftId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private normalizeEmail(email: unknown) {
    return this.requiredString(email, 'email').toLowerCase();
  }

  private validatePassword(password: unknown) {
    const normalizedPassword = this.requiredString(password, 'password');

    if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(PASSWORD_SALT_SIZE).toString('hex');
    const hashBuffer = (await scrypt(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
    )) as Buffer;
    return `${salt}:${hashBuffer.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedHash: string) {
    const [salt, hashHex] = storedHash.split(':');

    if (!salt || !hashHex) {
      return false;
    }

    const calculatedHash = (await scrypt(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
    )) as Buffer;
    const storedHashBuffer = Buffer.from(hashHex, 'hex');

    if (calculatedHash.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(calculatedHash, storedHashBuffer);
  }

  private generateToken(user: User) {
    const secret = this.getTokenSecret();
    const ttlHours = Number(
      this.configService.get<string>('AUTH_TOKEN_TTL_HOURS', '24'),
    );

    const payload = {
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + ttlHours * 60 * 60,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');

    return `${encodedPayload}.${signature}`;
  }

  private decodeToken(
    token: string,
  ): { sub: number; email: string; exp: number } | null {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      return null;
    }

    const secret = this.getTokenSecret();
    const expectedSignature = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as {
        sub: number;
        email: string;
        exp: number;
      };

      const nowInSeconds = Math.floor(Date.now() / 1000);

      if (!payload.sub || !payload.exp || payload.exp < nowInSeconds) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private extractBearerToken(authorizationHeader?: string) {
    if (!authorizationHeader) {
      return null;
    }

    const [type, token] = authorizationHeader.split(' ');

    if (type?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }

  private requiredString(value: unknown, fieldName: string) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} deve ser uma string`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} é obrigatório`);
    }

    return normalizedValue;
  }

  private normalizeOptionalString(value?: unknown) {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Campo opcional deve ser string');
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }

  private getTokenSecret() {
    return (
      this.configService.get<string>('AUTH_TOKEN_SECRET') ||
      this.fallbackTokenSecret
    );
  }
}
