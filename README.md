# MemoirArk

**Your personal archive for preserving, organizing, and connecting a lifetime of memories.**

MemoirArk is a memoir-building application that helps you capture life events, relationships, artifacts, and the meaningful connections between them—all guided by Noah, your AI interviewer.

## Features

### 📝 Core Archive
- **Events** — Record life moments with dates, locations, emotions, and detailed notes
- **People** — Track relationships and the roles people played in your story
- **Artifacts** — Store photos, letters, recordings, and documents
- **Chapters** — Organize your memoir into narrative sections
- **Synchronicities** — Capture dreams, omens, and meaningful coincidences
- **Timeline** — View your life chronologically

### 🧔 Noah AI Guide
Noah is your memoir guide—an AI assistant inspired by interviewers like Barbara Walters and Oprah Winfrey. He helps you:

- **Interview Wizard** — A conversational interview that digs beneath the surface of your memories
- **Contextual Tips** — Page-specific guidance as you navigate the app
- **Probing Questions** — Reactive follow-ups based on what you actually say
- **Tag Suggestions** — AI-powered recommendations for organizing content

### 🔍 Discovery Tools
- **Search** — Find anything across your archive
- **Query Builder** — Advanced filtering and exploration
- **Tags** — Organize by theme and emotion
- **Collections** — Group related content
- **Export** — Download your memoir as Markdown

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Prisma
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **State**: React Query

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/terryholliday/memoir_ark.git
cd memoir_ark/memoirark

# Install server dependencies
cd server
npm install

# Set up the database
npx prisma generate
npx prisma db push

# Start the server
npm run dev

# In a new terminal, install client dependencies
cd ../client
npm install

# Start the client
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in terminal).

## Project Structure

```
memoirark/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # API client and utilities
│   │   └── App.tsx        # Main app with routing
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
└── README.md
```

## Key Components

| Component | Description |
|-----------|-------------|
| `NoahWizardPage` | Barbara Walters-style interview wizard |
| `NoahGuide` | Floating AI assistant with contextual tips |
| `ContextAssistant` | Follow-up questions for uploads |
| `TagSuggestions` | AI-powered tag recommendations |
| `Dashboard` | Actions-first home page |
| `Timeline` | Chronological event visualization |

## License

MIT

## Author

Terry Holliday
