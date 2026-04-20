/**
 * Production environment configuration.
 */
export const environment = {
  production: true,
  trimbleId: {
    clientId: '47811b82-ab80-432f-a44e-2f80ea65e621',
    redirectUri: 'https://project-delivery-ux.vercel.app/auth/callback',
    logoutRedirectUri: 'https://project-delivery-ux.vercel.app/login',
    wellKnownEndpoint: 'https://id.trimble.com/.well-known/openid-configuration',
    scopes: ['openid'],
  },
};
