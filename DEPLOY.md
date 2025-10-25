# Quick Deploy Guide

## Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it "albumer" (or whatever you prefer)
   - Make it public or private
   - **DO NOT** initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Push your local code:**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/albumer.git
   git branch -M main
   git push -u origin main
   ```

## Setup API Keys (Later)

### UploadThing (Required for file uploads)
1. Visit: https://uploadthing.com
2. Sign up/login
3. Create new app
4. Copy `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`

### Spotify API (Optional - for reference search)
1. Visit: https://developer.spotify.com/dashboard
2. Create app
3. Copy `Client ID` and `Client Secret`

### YouTube API (Optional - for reference search)
1. Visit: https://console.cloud.google.com
2. Enable "YouTube Data API v3"
3. Create credentials → API Key

### Database (For Production)
**Option 1: Neon (Recommended)**
1. Visit: https://neon.tech
2. Create project
3. Copy PostgreSQL connection string

**Option 2: Supabase**
1. Visit: https://supabase.com
2. Create project
3. Get connection string from Settings → Database

## Deploy on Vercel

1. Visit: https://vercel.com
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard
4. Click Deploy

Done! 🎉
