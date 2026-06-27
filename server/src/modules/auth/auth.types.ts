export interface AuthUser {
  id: number;
  name: string;
  email: string;
  googleId?: string | null;
  microsoftId?: string | null;
  isAdmin: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
