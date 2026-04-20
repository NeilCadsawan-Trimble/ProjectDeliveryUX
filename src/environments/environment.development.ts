/**
 * Development environment configuration.
 */
export const environment = {
  production: false,
  trimbleId: {
    clientId: '47811b82-ab80-432f-a44e-2f80ea65e621',
    redirectUri: 'http://localhost:4200/auth/callback',
    logoutRedirectUri: 'http://localhost:4200/login',
    wellKnownEndpoint: 'https://id.trimble.com/.well-known/openid-configuration',
    scopes: ['openid'],
  },
};
