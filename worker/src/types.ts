export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  RESEND_API_KEY?: string;
  BREVO_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  MAILCHANNELS_API_KEY?: string;
  EMAIL_FROM_ADDRESS?: string;
  EMAIL_FROM_NAME?: string;
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

