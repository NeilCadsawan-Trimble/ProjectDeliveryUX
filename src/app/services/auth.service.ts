import { Injectable, signal, computed } from '@angular/core';
import {
  OpenIdEndpointProvider,
  AuthorizationCodeGrantTokenProvider,
  ValidatedClaimsetProvider,
  OpenIdKeysetProvider,
} from '@trimble-oss/trimble-id';
import type { Claimset } from '@trimble-oss/trimble-id';
import { environment } from '../../environments/environment';

const STORAGE_KEYS = {
  accessToken: 'tid_access_token',
  idToken: 'tid_id_token',
  refreshToken: 'tid_refresh_token',
  tokenExpiry: 'tid_token_expiry',
  codeVerifier: 'tid_code_verifier',
  returnUrl: 'tid_return_url',
} as const;

export interface AuthUser {
  sub: string;
  givenName: string;
  familyName: string;
  email: string;
  picture: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _config = {
    ...environment.trimbleId,
    redirectUri: `${window.location.origin}/auth/callback`,
    logoutRedirectUri: `${window.location.origin}/login`,
  };
  private readonly _endpointProvider = new OpenIdEndpointProvider(this._config.wellKnownEndpoint);
  private _tokenProvider: AuthorizationCodeGrantTokenProvider | null = null;

  private readonly _isAuthenticated = signal(false);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly displayName = computed(() => {
    const u = this._user();
    if (!u) return '';
    return `${u.givenName} ${u.familyName}`.trim();
  });

  constructor() {
    this._restoreSession();
  }

  async login(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const codeVerifier = AuthorizationCodeGrantTokenProvider.GenerateCodeVerifier();
      localStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier);

      const provider = this._createTokenProvider(codeVerifier);
      const redirectUrl = await provider.GetOAuthRedirect();
      window.location.href = redirectUrl;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Login failed');
      this._isLoading.set(false);
    }
  }

  async handleCallback(queryString: string): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const codeVerifier = localStorage.getItem(STORAGE_KEYS.codeVerifier);
      if (!codeVerifier) {
        throw new Error('Missing PKCE code verifier. Please try logging in again.');
      }

      const provider = this._createTokenProvider(codeVerifier);
      await provider.ValidateQuery(queryString);

      const accessToken = await provider.RetrieveToken();
      const idToken = await provider.RetrieveIdToken();
      const refreshToken = await provider.RetrieveRefreshToken();
      const tokenExpiry = await provider.RetrieveTokenExpiry();
      const newCodeVerifier = await provider.RetrieveCodeVerifier();

      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
      localStorage.setItem(STORAGE_KEYS.idToken, idToken);
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
      localStorage.setItem(STORAGE_KEYS.tokenExpiry, tokenExpiry.toISOString());
      localStorage.setItem(STORAGE_KEYS.codeVerifier, newCodeVerifier);

      await this._parseUserFromIdToken(idToken);
      this._isAuthenticated.set(true);
      this._isLoading.set(false);
      return true;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Authentication failed');
      this._isLoading.set(false);
      this._clearStorage();
      return false;
    }
  }

  async logout(): Promise<void> {
    this._clearStorage();
    this._isAuthenticated.set(false);
    this._user.set(null);

    try {
      const codeVerifier = localStorage.getItem(STORAGE_KEYS.codeVerifier);
      if (codeVerifier) {
        const provider = this._createTokenProvider(codeVerifier);
        const logoutUrl = await Promise.race([
          provider.GetOAuthLogoutRedirect(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);
        window.location.href = logoutUrl;
        return;
      }
    } catch {
      // Trimble ID logout unavailable -- fall through to local redirect
    }
    window.location.href = this._config.logoutRedirectUri;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  getReturnUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.returnUrl) || '/select';
  }

  setReturnUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.returnUrl, url);
  }

  clearReturnUrl(): void {
    localStorage.removeItem(STORAGE_KEYS.returnUrl);
  }

  private _createTokenProvider(codeVerifier: string): AuthorizationCodeGrantTokenProvider {
    const provider = new AuthorizationCodeGrantTokenProvider(
      this._endpointProvider,
      this._config.clientId,
      this._config.redirectUri,
    )
      .WithScopes(this._config.scopes)
      .WithProofKeyForCodeExchange(codeVerifier)
      .WithLogoutRedirect(this._config.logoutRedirectUri);

    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (refreshToken) {
      provider.WithRefreshToken(refreshToken);
    }

    this._tokenProvider = provider;
    return provider;
  }

  private _restoreSession(): void {
    const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const expiryStr = localStorage.getItem(STORAGE_KEYS.tokenExpiry);
    const idToken = localStorage.getItem(STORAGE_KEYS.idToken);

    if (!accessToken || !expiryStr) {
      this._isAuthenticated.set(false);
      return;
    }

    const expiry = new Date(expiryStr);
    if (expiry <= new Date()) {
      this._clearStorage();
      this._isAuthenticated.set(false);
      return;
    }

    this._isAuthenticated.set(true);
    if (idToken) {
      this._parseUserFromIdToken(idToken).catch(() => {});
    }
  }

  private async _parseUserFromIdToken(idToken: string): Promise<void> {
    try {
      const keysetProvider = new OpenIdKeysetProvider(this._endpointProvider);
      const claimsetProvider = new ValidatedClaimsetProvider(keysetProvider).WithTokenValidation(false);
      const claims: Claimset = await claimsetProvider.RetrieveClaimset(idToken);

      this._user.set({
        sub: claims.sub,
        givenName: claims.given_name || '',
        familyName: claims.family_name || '',
        email: claims.email || '',
        picture: claims.picture || '',
      });
    } catch {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          this._user.set({
            sub: payload.sub || '',
            givenName: payload.given_name || '',
            familyName: payload.family_name || '',
            email: payload.email || '',
            picture: payload.picture || '',
          });
        } catch {
          // Token payload unparseable
        }
      }
    }
  }

  private _clearStorage(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }
}
