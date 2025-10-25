# Deploy to Render (Simplest Option)

Render has everything in one place:
- ✅ Hosting
- ✅ PostgreSQL database (built-in, free)
- ✅ Persistent file storage (files stay after deploys)
- ✅ Auto-deploys from GitHub

## Deploy in 3 Steps

1. **Go to:** https://render.com
2. **Sign in with GitHub**
3. **Click:** "New +" → "Blueprint" → Select `HiChord/albumer`

That's it! Render will automatically:
- Create PostgreSQL database
- Set up persistent storage for uploads
- Deploy your app
- Give you a URL

## What Happens

The `render.yaml` file tells Render:
- Build: Install deps → Run Prisma → Build Next.js
- Database: Create PostgreSQL database (free tier)
- Storage: 1GB persistent disk for file uploads
- Environment: Automatically connect database

## After Deployment

Your app will be live at: `https://albumer.onrender.com`

Password: `test`

## Free Tier Limits

- Spins down after 15 min of inactivity (free tier)
- First load after spin-down takes ~30 seconds
- 750 hours/month free (enough for small teams)
- 1GB file storage
- 1GB database storage

## Alternative: Paid Tier ($7/month)

- Always on (no spin-down)
- Faster performance
- More storage

No setup required - just deploy!
