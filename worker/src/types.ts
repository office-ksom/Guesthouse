export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID?: string;
}

export type Role = 'admin' | 'receptionist' | 'viewer' | 'sponsor';

export interface JWTPayload {
  sub: number | string;      // user id or sponsor email
  email: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
}
