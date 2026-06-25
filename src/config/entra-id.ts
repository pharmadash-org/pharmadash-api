import { IBearerStrategyOption } from 'passport-azure-ad';
import { env } from './env';

export const bearerStrategyOptions: IBearerStrategyOption = {
  // v1.0 endpoint — compatible con tokens client_credentials (ver:1.0) y authorization_code (ver:2.0)
  identityMetadata: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/.well-known/openid-configuration`,
  clientID: env.AZURE_CLIENT_ID,
  // Acepta tanto api://<id> (token client_credentials/.default) como <id> pelado (token SPA access_as_user)
  audience: [env.AZURE_AUDIENCE, env.AZURE_CLIENT_ID],
  validateIssuer: true,
  issuer: [
    `https://sts.windows.net/${env.AZURE_TENANT_ID}/`,
    `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/v2.0`,
  ],
  loggingLevel: env.NODE_ENV === 'development' ? 'info' : 'error',
  passReqToCallback: false,
  loggingNoPII: true,
};
