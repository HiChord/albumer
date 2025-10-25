# Albumer 🎵

A beautiful, modern album organization tool for bands to manage their music production workflow.

**Live Demo:** Deploy your own in minutes for FREE on Vercel!

## ✨ Features

### Core Functionality
- **💿 Album Management**: Create and organize multiple albums with database persistence
- **🎵 Song Tracking**: Inline editing for all song details - just like a spreadsheet
- **📁 File Management**:
  - Free cloud file hosting via UploadThing
  - Logic project files (.logic, .logicx)
  - Audio bounces (.wav, .mp3, .aiff) with built-in player
- **📝 Production Tools**:
  - Inline editable lyrics and notes
  - Progress tracking (Not Started → Complete)
  - Full version history with timestamps

### Advanced Features
- **🔍 Reference Tracks**:
  - Real Spotify API integration for music search
  - YouTube API integration for video references
  - Thumbnail previews
- **💬 Commenting System**: Collaborative feedback on each track
- **🎨 Beautiful Design**:
  - Minimal, high-fidelity UI inspired by SoundCloud
  - Inline editing like Excel/Notion
  - Full dark mode support
  - Smooth animations and transitions

### Free Hosting Stack
- **Database**: SQLite (local) or Neon/Supabase (production) - FREE
- **File Storage**: UploadThing - FREE tier
- **Deployment**: Vercel - FREE tier
- **All integrated with GitHub for continuous deployment**

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation

1. **Clone and install**:
```bash
git clone <your-repo-url>
cd Albumer
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

3. **Initialize database**:
```bash
npx prisma generate
npx prisma db push
```

4. **Run development server**:
```bash
npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy to Production (FREE)

### Step 1: Set up UploadThing (Free File Hosting)

1. Go to [uploadthing.com](https://uploadthing.com) and sign up
2. Create a new app
3. Copy your `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`

### Step 2: Set up Database (FREE Options)

**Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the `DATABASE_URL` connection string

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Get the Postgres connection string from Settings → Database

### Step 3: Set up APIs (Optional but Recommended)

**Spotify API (Free)**
1. Go to [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Create an app
3. Copy `Client ID` and `Client Secret`

**YouTube API (Free)**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create credentials → API Key

### Step 4: Deploy to Vercel (FREE)

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     ```
     DATABASE_URL=<your-neon-or-supabase-url>
     UPLOADTHING_SECRET=<your-uploadthing-secret>
     UPLOADTHING_APP_ID=<your-uploadthing-app-id>
     SPOTIFY_CLIENT_ID=<your-spotify-client-id>
     SPOTIFY_CLIENT_SECRET=<your-spotify-client-secret>
     YOUTUBE_API_KEY=<your-youtube-api-key>
     ```
   - Click "Deploy"

3. **Run database migrations** (one-time):
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables above
   - In your terminal:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

That's it! Your Albumer instance is now live and FREE! 🎉

## Usage

### Creating an Album

1. Click "New Album" on the home page
2. Enter your album name
3. Click "Create"

### Adding Songs

1. Open an album
2. Click "Add Song"
3. Enter the song title
4. Click "Add"

### Managing Song Details

For each song, you can:

- **Upload Files**: Drag and drop Logic files and audio bounces into the designated areas
- **Play Audio**: Once an audio file is uploaded, use the built-in player to listen
- **Edit Lyrics**: Click in the lyrics field to add or edit lyrics
- **Add Notes**: Use the notes field for production ideas, feedback, or reminders
- **Track Progress**: Select the current stage from the dropdown (Not Started → Complete)
- **Add References**: Search Spotify or YouTube for reference tracks and save them
- **View History**: Click the version count to see all changes with timestamps

### Version History

Every change is automatically tracked with:
- Timestamp of the change
- Type of change (e.g., "Updated lyrics", "Updated progress")
- User who made the change

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router with Server Actions)
- **Language**: TypeScript
- **Database**: Prisma ORM with SQLite/PostgreSQL
- **File Storage**: UploadThing (free cloud hosting)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **APIs**: Spotify Web API, YouTube Data API v3
- **Deployment**: Vercel (free tier)
- **Version Control**: Git + GitHub

## 🎯 Roadmap

- [ ] Authentication (NextAuth.js)
- [ ] Multi-user collaboration with permissions
- [ ] Real-time updates (Pusher/Supabase Realtime)
- [ ] Export capabilities (PDF, CSV)
- [ ] Mobile-optimized views
- [ ] Keyboard shortcuts
- [ ] Bulk operations
- [ ] Advanced search and filtering
- [ ] Analytics dashboard

## Project Structure

```
albumer/
├── app/
│   ├── album/[id]/
│   │   └── page.tsx       # Album detail page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── AudioPlayer.tsx    # Audio playback component
│   ├── DropZone.tsx       # Drag-and-drop file upload
│   └── ReferenceSearch.tsx # Reference track search
└── public/                # Static assets
```

## Development Notes

### Data Storage

Currently using browser LocalStorage for simplicity. Data is stored as:
- `albums`: Array of all albums
- `songs_{albumId}`: Array of songs for each album

Files are stored as base64-encoded strings in LocalStorage (suitable for demo, but should use cloud storage in production).

### Extending the App

To add database persistence:
1. Install Prisma: `npm install prisma @prisma/client`
2. Create schema in `prisma/schema.prisma`
3. Replace LocalStorage calls with Prisma queries
4. Set up file upload to cloud storage (S3, Cloudflare R2, etc.)

## License

MIT
