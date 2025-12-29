# PROVENIQ Origins — Mobile App

Production-ready React Native (Expo) scaffold for the Origins legacy preservation platform.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Navigation | expo-router (file-based) |
| Server State | @tanstack/react-query |
| Client State | Zustand |
| Styling | NativeWind (Tailwind for RN) |
| Audio | expo-av |
| Auth Storage | expo-secure-store |

## Project Structure

```
/mobile
  /src
    /app                 # expo-router screens
      _layout.tsx        # root layout with providers
      index.tsx          # home screen
      stories.tsx        # stories list
      timeline.tsx       # chronological view
      artifacts.tsx      # physical items
      create-story.tsx   # story creation + audio
      story/[id].tsx     # story detail
    /api                 # typed API client
    /components          # shared UI components
    /hooks               # React Query hooks + audio recorder
    /store               # Zustand stores (auth, draft)
    /types               # TypeScript domain types
    /utils               # helpers
  App.tsx                # entry point with providers
```

## Setup

```bash
cd mobile
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL (optional — app works with mock data if not set) |

## Running

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

For physical device testing, scan the QR code with **Expo Go** app.

## Architecture Decisions

### 1. Auth Boundary (Path A)
Full auth infrastructure scaffolded:
- `useAuthStore` with SecureStore persistence
- Token loaded on app mount via `_layout.tsx`
- `signInDev()` for development testing
- Ready for OAuth/email auth integration

### 2. API Client
- Centralized fetch wrapper in `/src/api/client.ts`
- Uses `EXPO_PUBLIC_API_BASE_URL` environment variable
- Falls back to mock data when API not configured
- Typed request/response contracts
- Normalized error handling via `ApiError` class

### 3. State Management
- **React Query** for server state (stories, timelines)
- **Zustand** for client state (draft story, recording state, auth)
- No prop drilling — hooks access stores directly

### 4. Audio Recording
- `useAudioRecorder` hook wraps expo-av
- Handles permissions, recording lifecycle, duration tracking
- URI returned for attachment to stories

### 5. Styling
- NativeWind v4 with Tailwind CSS classes
- Dark theme by default (`bg-[#0a0a0f]`)
- Consistent with PROVENIQ design system

## Screens

| Route | Description |
|-------|-------------|
| `/` | Home — recent stories, primary actions |
| `/stories` | All stories with search |
| `/timeline` | Chronological story timeline |
| `/artifacts` | Physical items (placeholder) |
| `/create-story` | Create story with voice recording |
| `/story/[id]` | Story detail view |

## Development Notes

### Mock Data
When `EXPO_PUBLIC_API_BASE_URL` is not set, the API client returns mock stories. This allows UI development without a running backend.

### Audio Recording
Audio recording requires microphone permissions. On iOS simulator, use a physical device for full audio testing.

### TypeScript Paths
Path alias `@/*` maps to `src/*` via:
- `tsconfig.json` paths
- `babel-plugin-module-resolver`

## Definition of Done

- [x] App boots cleanly on Expo Go
- [x] All screens render and navigate
- [x] API client exists and is typed
- [x] State layers wired (React Query + Zustand)
- [x] Audio recording functional
- [x] Auth boundary scaffolded with SecureStore
- [x] README accurate
