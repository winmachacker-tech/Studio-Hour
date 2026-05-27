/**
 * Google Calendar OAuth constants and types.
 *
 * The actual OAuth flow requires expo-auth-session and expo-crypto,
 * which are not yet installed. This file defines constants and types
 * so that the auth flow, Edge Function call, and connection status
 * can be built against stable interfaces once dependencies are added.
 *
 * Install command (requires approval + native rebuild):
 *   npx expo install expo-auth-session expo-crypto
 */

export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.readonly";

export const REDIRECT_SCHEME = "studiohour";

export const GOOGLE_AUTH_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
} as const;

export interface GoogleAuthResult {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface GoogleAuthCallbackResponse {
  connected: boolean;
  provider: string;
  scope: string | null;
  tokenExpiry: string | null;
  error?: string;
}

export interface CalendarConnectionStatus {
  connected: boolean;
  provider: string | null;
  scope: string | null;
  expired: boolean | null;
}
