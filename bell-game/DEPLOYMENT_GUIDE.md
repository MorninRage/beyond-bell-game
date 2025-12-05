# Deployment Guide - Beyond Bell Game

## Step 1: Deploy Backend Server (Railway - Recommended)

### Option A: Railway (Easiest - Free Tier)

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub (easiest)
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Connect your repository** (or create a new repo and push the code)
6. **Select the `bell-game/server` folder** as the root
7. Railway will auto-detect Node.js
8. **Add Environment Variable** (optional):
   - Key: `PORT`
   - Value: `3000`
9. **Deploy!** Railway will give you a URL like: `https://your-app.railway.app`
10. **Copy your server URL**

### Option B: Render (Alternative - Free Tier)

1. Go to https://render.com
2. Sign up/login
3. Click "New" → "Web Service"
4. Connect GitHub repo
5. Settings:
   - **Name**: bell-game-leaderboard
   - **Root Directory**: `bell-game/server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Click "Create Web Service"
7. Copy your Render URL

## Step 2: Update Game Configuration

1. Open `bell-game/config.js`
2. Replace the URL with your deployed server:
   ```javascript
   window.API_URL = 'https://your-server-url.railway.app/api';
   ```
   OR
   ```javascript
   window.API_URL = 'https://your-server-url.onrender.com/api';
   ```

## Step 3: Deploy Game to Netlify

1. Go to https://app.netlify.com
2. Drag and drop the `bell-game` folder (or connect via Git)
3. **Important**: Make sure `config.js` has your server URL
4. Deploy!

## Step 4: Test

1. Visit your Netlify site
2. Play the game
3. Get a score
4. Press `L` to view leaderboard
5. Scores should be shared across all players!

## Troubleshooting

### Server not responding?
- Check Railway/Render dashboard for logs
- Verify the server is running
- Test: Visit `https://your-server.com/api/health`

### CORS errors?
- The server allows all origins by default
- If issues persist, check server logs

### Scores not saving?
- Check browser console for errors
- Verify `config.js` has correct API URL
- Check server logs in Railway/Render dashboard

## Quick Test Commands

Test server locally first:
```bash
cd bell-game/server
npm install
npm start
```

Then test API:
- Visit: http://localhost:3000/api/health
- Should see: `{"success":true,"message":"Server is running"}`

