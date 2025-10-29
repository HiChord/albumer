# Albumer 🎵

A beautiful, serverless album organization tool for bands. All data stored in Google Drive - no database hosting needed!

**Perfect for small teams (3 people) managing music production workflows.**

## ✨ What Makes This Special

- **100% Serverless** - Uses Google Drive as the database (no PostgreSQL, no hosting costs)
- **Zero Setup for Users** - Just share a URL, no accounts needed
- **Shared Storage** - Everyone sees the same data automatically
- **FREE Forever** - Google Drive (15GB) + Vercel hosting = $0/month

## Features

### Core Functionality
- **💿 Album Management**: Create and organize multiple albums
- **🎵 Song Tracking**: Inline editing for all song details - just like a spreadsheet
- **📁 File Storage**:
  - Logic project files (.logic, .logicx)
  - Audio bounces (.wav, .mp3, .aiff) with built-in player
  - All stored in Google Drive
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

## 🚀 Quick Start

### For Band Members (Users)
Just open the URL shared by your bandmate. That's it!

### For Setup (One-Time)

**See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.**

Quick version:
1. Create Google Cloud project + enable Drive API
2. Create service account + download JSON key
3. Deploy to Vercel with the credentials
4. Share the URL with your bandmates

Total time: ~15 minutes

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router with Server Actions)
- **Language**: TypeScript
- **Storage**: Google Drive API (all data + files)
- **Hosting**: Vercel (free tier)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **APIs**: Spotify Web API, YouTube Data API v3

### Architecture

```
┌─────────────────┐
│   Vercel App    │
│   (Next.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google Drive   │
│                 │
│  - Albumer_Data │ ← Albums, songs, comments (JSON)
│  - Albumer_     │ ← Uploaded files
│    Uploads      │
└─────────────────┘
```

No database, no backend server - just static Next.js + Google Drive!

## 📖 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Alternative deployment options

## 🎯 Use Cases

Perfect for:
- Small bands managing album production
- Solo artists tracking multiple projects
- Music producers organizing client work
- Podcast teams managing episodes

## 💰 Cost Breakdown

| Service | Free Tier | Cost for 3 People |
|---------|-----------|-------------------|
| Google Drive | 15GB | $0/month |
| Vercel | 100GB bandwidth | $0/month |
| Spotify API | Unlimited | $0/month |
| YouTube API | 10,000 requests/day | $0/month |
| **Total** | | **$0/month** |

## 🔒 Security & Privacy

- **No authentication required** - Anyone with the URL can access
- **Not suitable for sensitive data** - Use at your own risk
- **Consider adding basic auth** - If you want password protection
- **Data is in your Google Drive** - You control the service account

## 🚧 Limitations

- **Not real-time** - Users need to refresh to see changes
- **No user management** - Everyone is "User" by default
- **No conflict resolution** - Last write wins
- **Google Drive limits** - 15GB free storage, API quotas

## 🔮 Future Ideas

- [ ] Basic password protection
- [ ] Real-time sync (WebSockets or Pusher)
- [ ] User authentication (names/avatars)
- [ ] Conflict detection
- [ ] Export to PDF/CSV
- [ ] Mobile app
- [ ] Desktop app (Electron)

## 📄 License

MIT

---

Made with ❤️ for musicians who just want to make music, not manage infrastructure.

