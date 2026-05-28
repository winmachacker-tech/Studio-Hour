import { useState, useEffect, useCallback } from "react";
import * as AuthSession from "expo-auth-session";
import {
  GOOGLE_AUTH_DISCOVERY,
  createAuthRequest,
  exchangeCodeWithServer,
  fetchConnectionStatus,
  getRedirectUri,
  type CalendarConnectionStatus,
  type ConnectResult,
} from "../lib/calendar/googleCalendarAuth";

type ConnectionState = "loading" | "not_connected" | "connected" | "expired";

export function useCalendarConnection() {
  const [state, setState] = useState<ConnectionState>("loading");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    const status: CalendarConnectionStatus = await fetchConnectionStatus();

    if (!status.connected) {
      setState("not_connected");
    } else if (status.expired) {
      setState("expired");
    } else {
      setState("connected");
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    setError(null);
    setIsConnecting(true);

    try {
      const request = createAuthRequest();
      if (!request) {
        const msg =
          "Google Calendar is not configured. EXPO_PUBLIC_GOOGLE_CLIENT_ID is missing.";
        setError(msg);
        return { connected: false, error: msg };
      }

      const redirectUri = getRedirectUri();
      const response = await request.promptAsync(GOOGLE_AUTH_DISCOVERY);

      if (response.type !== "success" || !response.params?.code) {
        const msg =
          response.type === "dismiss"
            ? null
            : "Google sign-in was not completed.";
        if (msg) setError(msg);
        return { connected: false, error: msg };
      }

      if (!request.codeVerifier) {
        const msg = "PKCE code verifier missing.";
        setError(msg);
        return { connected: false, error: msg };
      }

      const result = await exchangeCodeWithServer({
        code: response.params.code,
        codeVerifier: request.codeVerifier,
        redirectUri,
      });

      if (result.connected) {
        setState("connected");
        setError(null);
      } else if (result.error) {
        setError(result.error);
      }

      return result;
    } catch {
      const msg = "Something went wrong. Try again.";
      setError(msg);
      return { connected: false, error: msg };
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return {
    state,
    isConnecting,
    error,
    connect,
    refresh: checkStatus,
  };
}
