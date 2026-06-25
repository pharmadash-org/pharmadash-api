export type AppRole = 'Admin' | 'Vendedor';

export interface AuthenticatedUser {
  oid: string;
  preferred_username: string;
  roles: AppRole[];
  displayName?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
    interface Request {
      correlationId?: string;
      authenticatedUser?: AuthenticatedUser;
    }
  }
}
