import { Platform } from "react-native";

/**
 * Where football-backend runs. Set EXPO_PUBLIC_API_URL in .env, e.g.
 *   iOS simulator:      http://localhost:3000
 *   Android emulator:   http://10.0.2.2:3000
 *   Physical phone:     http://<your computer's LAN IP>:3000
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  Platform.select({ android: "http://10.0.2.2:3000", default: "http://localhost:3000" });

/** How often to refresh live scores while viewing today. */
export const LIVE_REFRESH_MS = 30_000;

/** How often to re-fetch today's full list (picks up finished matches). */
export const TODAY_REFRESH_MS = 120_000;
