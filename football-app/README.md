# football-app (Expo)

Match list screen for football-backend: day picker, matches grouped by league,
live scores refreshed every 30s while viewing today, pull-to-refresh.

## Run
    npm install
    cp .env.example .env     # set EXPO_PUBLIC_API_URL (see the file for emulator/phone values)
    npx expo start           # scan the QR code with Expo Go, or press i / a

Start football-backend first (`npm run dev` in that project).

## Structure
- `App.tsx`                     screen: header, date strip, SectionList
- `src/useMatches.ts`           loading, live polling, overlay, grouping
- `src/api.ts`                  calls to /matches and /matches/live
- `src/status.ts`               live detection and status labels (1H, HT, FT ...)
- `src/components/`             MatchRow, DateStrip
