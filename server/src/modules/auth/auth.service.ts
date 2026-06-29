import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { AuthResponse, AuthUser } from './auth.types';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const normalizedName = name.trim();
    const normalizedEmail = this.normalizeEmail(email);
    this.validateRegistration(normalizedName, normalizedEmail, password);

    const existingUser = await this.usersRepository.findOneBy({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const userCount = await this.usersRepository.count();
    const user = this.usersRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: this.hashPassword(password),
      isAdmin: userCount === 0,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.createAuthResponse(savedUser);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.usersRepository.findOneBy({ email: normalizedEmail });
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  async loginWithGoogle(token: string): Promise<AuthResponse> {
    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new BadRequestException('Google token does not contain email');
    }

    const email = this.normalizeEmail(payload.email);
    const name = payload.name || payload.email.split('@')[0];
    const googleId = payload.sub;

    let user = await this.usersRepository.findOneBy({ googleId });

    if (!user) {
      user = await this.usersRepository.findOneBy({ email });
      if (user) {
        user.googleId = googleId;
        await this.usersRepository.save(user);
      } else {
        const userCount = await this.usersRepository.count();
        user = this.usersRepository.create({
          email,
          name,
          googleId,
          passwordHash: null,
          isAdmin: userCount === 0,
        });
        user = await this.usersRepository.save(user);
      }
    }

    return this.createAuthResponse(user);
  }

  async loginWithMicrosoft(accessToken: string): Promise<AuthResponse> {
    let profile;
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile from Microsoft Graph');
      }
      profile = await response.json();
    } catch (error) {
      throw new UnauthorizedException('Invalid Microsoft token');
    }

    if (!profile || (!profile.mail && !profile.userPrincipalName)) {
      throw new BadRequestException('Microsoft account does not contain email');
    }

    const email = this.normalizeEmail(profile.mail || profile.userPrincipalName);
    const name = profile.displayName || email.split('@')[0];
    const microsoftId = profile.id;

    let user = await this.usersRepository.findOneBy({ microsoftId });

    if (!user) {
      user = await this.usersRepository.findOneBy({ email });
      if (user) {
        user.microsoftId = microsoftId;
        await this.usersRepository.save(user);
      } else {
        const userCount = await this.usersRepository.count();
        user = this.usersRepository.create({
          email,
          name,
          microsoftId,
          passwordHash: null,
          isAdmin: userCount === 0,
        });
        user = await this.usersRepository.save(user);
      }
    }

    return this.createAuthResponse(user);
  }

  async getCurrentUser(authorization?: string): Promise<AuthUser | null> {
    const token = this.extractBearerToken(authorization);
    if (!token) {
      return null;
    }

    let payload: { sub: number };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: number }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersRepository.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthUser(user);
  }

  private validateRegistration(name: string, email: string, password: string) {
    if (!name || !email || !password) {
      throw new BadRequestException('Name, email, and password are required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedPasswordHash: string | null) {
    if (!storedPasswordHash) {
      return false;
    }
    const [salt, storedHash] = storedPasswordHash.split(':');
    if (!salt || !storedHash) {
      return false;
    }

    const hashBuffer = scryptSync(password, salt, 64);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    return (
      hashBuffer.length === storedHashBuffer.length &&
      timingSafeEqual(hashBuffer, storedHashBuffer)
    );
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    return {
      accessToken,
      user: this.toAuthUser(user),
    };
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      microsoftId: user.microsoftId,
      isAdmin: user.isAdmin,
    };
  }

  async findAllUsers(): Promise<User[]> {
    return this.usersRepository.find({
      order: { name: 'ASC' },
    });
  }

  async promoteUser(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isAdmin = true;
    return this.usersRepository.save(user);
  }

  private extractBearerToken(authorization?: string) {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return token;
  }
}
