# Deploy to Render (Simplest Option)

Render has everything in one place:
- ✅ Hosting
- ✅ PostgreSQL database (built-in, free)
- ✅ Auto-deploys from GitHub

## Deploy in 3 Steps

1. **Go to:** https://render.com
2. **Sign in with GitHub**
3. **Click:** "New +" → "Blueprint" → Select `HiChord/albumer`

That's it! Render will automatically:
- Create PostgreSQL database
- Deploy your app
- Give you a URL

## What Happens

The `render.yaml` file tells Render:
- Build: Install deps → Run Prisma → Build Next.js
- Database: Create PostgreSQL database (free tier)
- Environment: Automatically connect database

## Configure Google Drive (File Uploads)

Add these environment variables in Render → Services → albumer → Environment:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service-account-email>
GOOGLE_PRIVATE_KEY=<private-key-with-escaped-newlines>
GOOGLE_DRIVE_PARENT_ID=<shared-folder-id>
```

Share the target Google Drive folder with the service account so all uploads land in one place.

Optional: add Spotify/YouTube keys for reference search.

## After Deployment

Render will assign a URL like `https://albumer.onrender.com` (rename it if you want). No additional passwords—just send the link to your bandmates.

## Free Tier Limits

- Spins down after 15 min of inactivity (free tier)
- First load after spin-down takes ~30 seconds
- 750 hours/month free (enough for small teams)
- 1GB database storage

## Alternative: Paid Tier ($7/month)

- Always on (no spin-down)
- Faster performance
- More storage

No setup required - just deploy!
