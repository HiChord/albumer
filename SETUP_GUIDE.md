# Albumer Setup Guide

## Overview

Albumer now uses **Google Drive** for ALL data storage (albums, songs, files). No database hosting needed!

All you need:
1. A Google Cloud project with Drive API enabled
2. A service account with JSON credentials
3. Vercel (free) for hosting the app

## Step 1: Set Up Google Cloud & Drive API

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Name it "Albumer" (or anything you like)
4. Click "Create"

### 1.2 Enable Google Drive API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click on it and click **"Enable"**

### 1.3 Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Name: `albumer-storage` (or anything you like)
4. Click "Create and Continue"
5. Skip the optional steps, click "Done"

### 1.4 Generate JSON Key

1. Click on the service account you just created
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **JSON** format
5. Click "Create" - a JSON file will download

### 1.5 Extract Credentials

Open the downloaded JSON file. You'll need:
- `client_email` - This is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` - This is your `GOOGLE_PRIVATE_KEY`

## Step 2: Set Up Your Environment Variables

### Option A: Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
   ```

   **Important:** Keep the `\n` characters in the private key - they represent newlines.

### Option B: Vercel Deployment

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = your service account email
   - `GOOGLE_PRIVATE_KEY` = your private key (paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub

```bash
git add .
git commit -m "Switch to Google Drive storage"
git push
```

### 3.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import your repository
5. Add the environment variables (from Step 2, Option B)
6. Click **"Deploy"**

That's it! Vercel will build and deploy your app.

## Step 4: Share with Your Team

1. Get your Vercel URL (e.g., `https://albumer.vercel.app`)
2. Share it with your 2 bandmates
3. Everyone uses the same URL - all data is shared via Google Drive!

## How It Works

### Data Storage
- All albums, songs, comments, etc. are stored as JSON files in a Google Drive folder called `Albumer_Data`
- Uploaded files (Logic projects, audio) go into `Albumer_Uploads` folder
- The service account automatically creates these folders on first use

### Shared Access
- Everyone sees the same data because it's all in one Google Drive
- Changes sync automatically (refresh the page to see updates)
- No authentication required - just share the URL

## Optional: Add Spotify & YouTube Search

If you want to search for reference tracks:

### Spotify API (Free)
1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Copy `Client ID` and `Client Secret`
4. Add to your environment variables:
   ```env
   SPOTIFY_CLIENT_ID="your_client_id"
   SPOTIFY_CLIENT_SECRET="your_client_secret"
   ```

### YouTube API (Free)
1. In Google Cloud Console (same project)
2. Go to **APIs & Services** → **Library**
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key
6. Add to your environment variables:
   ```env
   YOUTUBE_API_KEY="your_api_key"
   ```

## Troubleshooting

### "Google Drive credentials are missing"
- Make sure you added the environment variables correctly
- Check that the private key includes the `\n` newlines
- Redeploy on Vercel after adding env vars

### "Failed to create data folder"
- The service account might not have permissions
- Make sure the Drive API is enabled in your Google Cloud project

### Data not showing up
- Refresh the page - data updates aren't real-time
- Check the browser console for errors
- Verify your service account credentials are correct

### Files not uploading
- Check that the service account has Drive permissions
- Make sure you're under the Google Drive 15GB free tier limit
- The uploads folder is created automatically on first upload

## Cost

Everything is FREE:
- **Google Drive**: 15GB free
- **Google Drive API**: Free for normal usage
- **Vercel**: Free tier (100GB bandwidth/month)
- **Spotify API**: Free
- **YouTube API**: 10,000 requests/day free

Perfect for a small band managing albums!

## Support

If you run into issues:
1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Make sure the Google Drive API is enabled
4. Try redeploying on Vercel

## Next Steps

Consider adding:
- Password protection (basic auth)
- Custom domain name
- Backup script for your Drive data
- Real-time updates with Pusher or similar
