import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { BearerStrategy, ITokenPayload } from 'passport-azure-ad';
import { bearerStrategyOptions } from '../config/entra-id';
import { AppRole, AuthenticatedUser } from '../shared/types';
import { sendError } from '../shared/utils/response';
import { logger } from '../config/logger';
import { prisma } from '../config/database';

passport.use(
  new BearerStrategy(bearerStrategyOptions, async (token: ITokenPayload, done) => {
    try {
      const oid = token.oid as string;
      // Fallback único por oid: evita colisión de unique(email) cuando el token no trae email
      // (p. ej. tokens client_credentials sin preferred_username)
      const email = (token.preferred_username ?? token.upn ?? `${oid}@no-email.local`) as string;
      const displayName = (token.name ?? email) as string;
      const roles = ((token.roles ?? []) as string[]).filter(
        (r): r is AppRole => r === 'Admin' || r === 'Vendedor',
      );

      // Upsert user so our DB stays in sync with Entra ID
      await prisma.user.upsert({
        where: { entraId: oid },
        update: { email, displayName, role: roles.includes('Admin') ? 'Admin' : 'Vendedor' },
        create: {
          entraId: oid,
          email,
          displayName,
          role: roles.includes('Admin') ? 'Admin' : 'Vendedor',
        },
      });

      const user: AuthenticatedUser = { oid, preferred_username: email, roles, displayName };
      done(null, user);
    } catch (err) {
      done(err);
    }
  }),
);

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    'oauth-bearer',
    { session: false },
    (err: unknown, user: AuthenticatedUser | false) => {
      if (err) {
        logger.error({ err, correlationId: req.correlationId }, 'Auth strategy error');
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication failed');
        return;
      }
      if (!user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
        return;
      }
      req.authenticatedUser = user;
      next();
    },
  )(req, res, next);
}

export function requireRoles(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.authenticatedUser;
    if (!user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Not authenticated');
      return;
    }
    const hasRole = roles.some((r) => user.roles.includes(r));
    if (!hasRole) {
      sendError(res, 403, 'FORBIDDEN', `Required role(s): ${roles.join(', ')}`);
      return;
    }
    next();
  };
}

