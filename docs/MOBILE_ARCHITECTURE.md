# PROVENIQ Origins Mobile App Architecture

## Status: PLANNING (Phase 5)

## Overview

Origins Mobile will be a React Native app for iOS and Android that provides:
- Voice-first memoir capture
- Photo artifact scanning
- Offline-first data with sync
- Family sharing notifications
- Push reminders for memory prompts

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React Native + Expo | Shared codebase, fast iteration |
| State | Zustand + React Query | Lightweight, offline-friendly |
| Storage | MMKV + SQLite | Fast local storage + offline DB |
| Sync | Custom sync engine | Conflict resolution for memoir data |
| Auth | Firebase Auth | Consistent with web client |
| Push | Expo Notifications | Cross-platform push |

## Project Structure

```
origins-mobile/
├── app/                      # Expo Router screens
│   ├── (auth)/               # Auth flow screens
│   │   ├── login.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/               # Main tab navigation
│   │   ├── index.tsx         # Dashboard
│   │   ├── capture.tsx       # Voice/photo capture
│   │   ├── timeline.tsx      # Event timeline
│   │   ├── people.tsx        # People list
│   │   └── settings.tsx      # Settings
│   ├── event/
│   │   ├── [id].tsx          # Event detail
│   │   └── new.tsx           # Create event
│   └── _layout.tsx           # Root layout
├── components/
│   ├── ui/                   # Shared UI components
│   ├── VoiceRecorder.tsx     # Voice capture component
│   ├── PhotoScanner.tsx      # Camera + AI recognition
│   └── SyncIndicator.tsx     # Online/offline status
├── lib/
│   ├── api.ts                # API client (shared from web)
│   ├── sync.ts               # Offline sync engine
│   ├── storage.ts            # MMKV + SQLite helpers
│   └── auth.ts               # Firebase auth
├── hooks/
│   ├── useOffline.ts         # Offline detection
│   ├── useSync.ts            # Sync status
│   └── useVoice.ts           # Voice recording
└── assets/
```

## Core Features

### 1. Voice-First Capture

```typescript
interface VoiceCaptureFlow {
  // User taps "Record Memory"
  startRecording(): void
  
  // Recording stops, transcription begins
  stopRecording(): Promise<Transcript>
  
  // AI extracts entities from transcript
  extractEntities(transcript: string): Promise<{
    potentialEvents: PartialEvent[]
    mentionedPeople: string[]
    mentionedDates: string[]
    emotionTags: string[]
  }>
  
  // User reviews and confirms
  confirmEvents(events: PartialEvent[]): Promise<Event[]>
}
```

### 2. Photo Artifact Scanning

```typescript
interface PhotoScanFlow {
  // Camera opens with overlay guide
  capturePhoto(): Promise<ImageUri>
  
  // AI analyzes photo
  analyzePhoto(uri: string): Promise<{
    type: 'document' | 'photo' | 'artifact'
    extractedText?: string
    suggestedDescription?: string
    detectedPeople?: string[]
    estimatedDate?: string
  }>
  
  // Create artifact linked to events
  createArtifact(data: ArtifactData): Promise<Artifact>
}
```

### 3. Offline-First Sync

```typescript
interface SyncEngine {
  // Queue local changes
  queueChange(change: Change): void
  
  // Sync when online
  sync(): Promise<SyncResult>
  
  // Conflict resolution
  resolveConflict(local: Entity, remote: Entity): Entity
  
  // Last sync status
  lastSyncAt: Date | null
  pendingChanges: number
  syncStatus: 'synced' | 'pending' | 'syncing' | 'error'
}

// Conflict resolution strategy
// - Events: Last-write-wins with merge for non-conflicting fields
// - Artifacts: Last-write-wins (binary, can't merge)
// - Links: Union (merge links from both)
```

### 4. Push Notifications

```typescript
interface NotificationTypes {
  // Daily memory prompts
  DAILY_PROMPT: {
    title: string
    prompt: string
  }
  
  // Family member shared something
  FAMILY_SHARE: {
    sharerName: string
    contentType: 'event' | 'artifact' | 'perspective'
  }
  
  // This Day in Your Life
  THIS_DAY: {
    eventTitle: string
    yearsAgo: number
  }
  
  // Sync reminder (if pending changes)
  SYNC_REMINDER: {
    pendingChanges: number
  }
}
```

## Data Model (Local SQLite)

```sql
-- Mirrors Prisma schema but with sync metadata
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  location TEXT,
  summary TEXT,
  emotion_tags TEXT, -- JSON array
  notes TEXT,
  chapter_id TEXT,
  is_keystone INTEGER DEFAULT 0,
  -- Sync metadata
  sync_status TEXT DEFAULT 'pending', -- pending, synced, conflict
  local_updated_at TEXT,
  remote_updated_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- create, update, delete
  payload TEXT, -- JSON
  created_at TEXT,
  retries INTEGER DEFAULT 0
);
```

## API Client Sharing

The mobile app will share the same API types from the web client:

```typescript
// Shared from @origins/shared
export { 
  Event,
  Person,
  Artifact,
  Chapter,
  FamilyShare,
  // ... all types
} from '@origins/shared/types'

// Mobile-specific API wrapper
import { API_BASE_URL } from '@origins/shared/config'

export const mobileApi = {
  ...webApi,
  
  // Mobile-specific endpoints
  transcribeAudio: async (audioUri: string): Promise<string> => {
    // Upload to /api/ai/transcribe
  },
  
  analyzePhoto: async (photoUri: string): Promise<PhotoAnalysis> => {
    // Upload to /api/ai/analyze-photo
  },
}
```

## Authentication Flow

1. User opens app
2. Check for stored Firebase refresh token
3. If valid → restore session, sync pending changes
4. If invalid → show login screen
5. Login options:
   - Google Sign-In (OAuth)
   - Email magic link
6. After login → full sync from server

## Offline Strategy

| Scenario | Behavior |
|----------|----------|
| Create event offline | Save locally, queue for sync |
| Edit event offline | Save locally, queue for sync |
| View data offline | Show local data with "offline" badge |
| Come online | Auto-sync queued changes |
| Conflict detected | Show conflict resolution UI |
| Sync fails | Retry with exponential backoff |

## Phase 5 Deliverables

### Minimum Viable Mobile

- [ ] Expo project scaffold
- [ ] Firebase auth integration
- [ ] Basic event list view
- [ ] Create event form
- [ ] Voice recording → transcription
- [ ] Offline storage with MMKV
- [ ] Sync engine (basic)

### Future Phases

- [ ] Photo scanning with AI
- [ ] Push notifications
- [ ] Family sharing UI
- [ ] Timeline visualization
- [ ] Widget for quick capture
- [ ] Apple Watch companion

## Development Setup

```bash
# Create Expo project
npx create-expo-app origins-mobile --template tabs

# Install dependencies
cd origins-mobile
npm install @tanstack/react-query zustand
npm install react-native-mmkv
npm install @react-native-firebase/app @react-native-firebase/auth
npm install expo-av  # For voice recording
npm install expo-camera expo-image-picker

# Start development
npx expo start
```

## Shared Code Strategy

```
proveniq-origins/
├── packages/
│   └── shared/           # Shared types and utilities
│       ├── types/        # TypeScript interfaces
│       ├── api/          # API client logic
│       └── constants/    # Shared constants
├── client/               # Web client (existing)
└── mobile/               # React Native app (new)
```

Both clients import from `@origins/shared` to ensure type consistency.

---

*Document created: Phase 5 Planning*
*Last updated: December 2025*
