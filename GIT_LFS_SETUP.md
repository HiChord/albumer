# Git LFS Setup Guide

Your app is now configured to use **local file storage** with **Git LFS** for large files.

## What's Already Configured

✅ Local storage in `/data` and `/uploads` folders
✅ `.gitattributes` configured for Git LFS
✅ Audio files (.mp3, .wav, .aiff, .m4a)
✅ Logic files (.logic, .logicx)
✅ All files in `uploads/` tracked with LFS

## One-Time Setup (Do This Once)

### 1. Install Git LFS

**Mac:**
```bash
brew install git-lfs
```

**Windows:**
Download from: https://git-lfs.github.com/

**Linux:**
```bash
sudo apt-get install git-lfs
```

### 2. Initialize Git LFS in Your Repo

```bash
cd /Users/ao/Desktop/Albumer
git lfs install
```

### 3. Add Your Files to Git

```bash
# Add data and uploads folders
git add data/
git add uploads/
git add .gitattributes

# Commit
git commit -m "Switch to local storage with Git LFS"
```

### 4. Push to GitHub

```bash
git push
```

## Storage Limits

**GitHub Free Tier:**
- 1GB storage
- 1GB bandwidth/month

**GitHub Paid ($5/month):**
- 50GB storage
- 50GB bandwidth/month

## How It Works

### Small Files (JSON data)
- Stored normally in git
- Fast, lightweight
- In `/data` folder

### Large Files (Audio/Logic)
- Tracked with Git LFS
- Only pointers stored in git
- Actual files stored on LFS server
- In `/uploads` folder

## For Your 3-Person Team

### Initial Setup (Person 1 - You)
1. Install Git LFS
2. Run `git lfs install`
3. Commit and push

### Team Members (Persons 2 & 3)
1. Install Git LFS
2. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd Albumer
   git lfs install
   git lfs pull
   ```
3. Run `npm install`
4. Run `npm run dev`

## Daily Workflow

### Add Albums/Songs
1. Use the app normally
2. Files saved to `/data` and `/uploads`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Added new album"
   git push
   ```

### Get Updates from Team
```bash
git pull
```

Git LFS automatically downloads large files!

## Checking Your Usage

```bash
# See which files are tracked by LFS
git lfs ls-files

# Check your LFS quota (requires GitHub CLI)
gh api /repos/YOUR_USERNAME/YOUR_REPO/lfs
```

## Troubleshooting

### "This repository is over its data quota"
- You've exceeded 1GB free tier
- Upgrade to paid ($5/month) on GitHub
- OR use GitLab (10GB free per repo)

### Large files not uploading
```bash
# Re-track all LFS files
git lfs track "uploads/**/*"
git add .gitattributes
git commit -m "Update LFS tracking"
```

### Team member can't download files
```bash
# They need to pull LFS files
git lfs pull
```

## Alternative: GitLab (10GB Free)

If you need more space:

1. Create repo on GitLab.com
2. Same Git LFS commands work
3. 10GB free storage per repo
4. Can split into multiple repos if needed

## Current Storage

Your app will store:
- Album metadata: ~1KB per album
- Song data: ~5-10KB per song
- Audio files: 5-50MB each
- Logic projects: 10-100MB each

**1GB = ~20-50 songs** with audio + Logic files

---

**Need help?** Check:
- Git LFS docs: https://git-lfs.github.com/
- GitHub LFS: https://docs.github.com/en/repositories/working-with-files/managing-large-files
