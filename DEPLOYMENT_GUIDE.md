# 🚀 One-Click Deploy to Vercel

Since this is a Next.js app with server-side features (database, file uploads, APIs), it needs to be deployed on Vercel (not GitHub Pages).

## ✨ Super Easy Deploy (5 Minutes)

### Option 1: Deploy Button (Easiest)

Click this button to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HiChord/albumer)

Vercel will:
1. Fork/clone your repo
2. Ask for environment variables
3. Deploy automatically
4. Give you a live URL!

### Option 2: Manual Deploy (Still Easy)

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select "HiChord/albumer" from your repos
   - Click "Import"

3. **Configure:**
   - Framework: Next.js (auto-detected)
   - Build Command: `prisma generate && next build`
   - Click "Deploy"

4. **Done!**
   - Your app is now live at `your-app.vercel.app`

---

## 🔑 Add Environment Variables (Later)

After deployment, add these in Vercel Dashboard → Settings → Environment Variables:

### Required for File Uploads (Google Drive)
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_DRIVE_PARENT_ID=drive_folder_id
```
1. In Google Cloud Console, create a service account and download its JSON key.
2. Share a folder in Google Drive with that service account (Editor access).
3. Use the folder ID in `GOOGLE_DRIVE_PARENT_ID`.

### Required for Database
```
DATABASE_URL=postgresql://...
```
Get from: [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)

### Optional (for reference search)
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_secret
YOUTUBE_API_KEY=your_key
```

---

## 🔄 Auto-Deploy on Push

GitHub Actions is set up to automatically deploy to Vercel whenever you push to `main`!

To enable:
1. Get Vercel Token: Vercel Dashboard → Settings → Tokens → Create
2. Add to GitHub: Repo Settings → Secrets and Variables → Actions
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID` (from Vercel project settings)
   - `VERCEL_PROJECT_ID` (from Vercel project settings)

Now every `git push` auto-deploys! 🎉

---

## 📝 Free Tier Limits

All services have generous free tiers:

- **Vercel**: 100GB bandwidth/month
- **Neon DB**: 512MB storage, 0.5GB data transfer
- **Google Drive**: 15GB shared across the Google account (service account uses the parent drive quota)
- **Spotify API**: Unlimited requests
- **YouTube API**: 10,000 units/day

Perfect for a band managing albums! 🎵
