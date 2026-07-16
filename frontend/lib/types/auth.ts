import type { EntityId, ISODateTime } from "./common";

export type UserRole = "OWNER" | "ADMIN" | "EDITOR";

export interface User {
  id: EntityId;
  email: string;
  fullName: string;
  role: UserRole;
  businessId: EntityId;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  industry?: string;
  businessDescription?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer" | string;
  /** Thời gian sống của access token, tính bằng giây. */
  expiresIn?: number;
  /** Thời gian sống của refresh token, tính bằng giây. */
  refreshExpiresIn?: number;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type RefreshTokenResponse = AuthTokens;

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}
