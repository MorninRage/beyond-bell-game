# Quick Deployment Steps

## 🚀 Deploy Backend (5 minutes)

### Using Railway (Recommended):

1. **Create Railway Account**
   - Go to: https://railway.app
   - Sign up with GitHub

2. **Deploy Server**
   - Click "New Project"
   - Click "Deploy from GitHub repo"
   - If you haven't pushed code yet:
     ```bash
     cd bell-game
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin YOUR_GITHUB_REPO_URL
     git push -u origin main
     ```
   - In Railway, select your repo
   - **Set Root Directory**: `bell-game/server`
   - Railway auto-detects Node.js
   - Click "Deploy"

3. **Get Your Server URL**
   - Railway will give you a URL like: `https://your-app.up.railway.app`
   - Copy this URL

## 🎮 Update Game Config

1. Open `bell-game/config.js`
2. Change the URL:
   ```javascript
   window.API_URL = 'https://your-app.up.railway.app/api';
   ```
   (Replace with your actual Railway URL)

## 🌐 Deploy Game to Netlify

1. Go to: https://app.netlify.com
2. Drag the entire `bell-game` folder to Netlify
3. Wait for deployment
4. Done! Your game is live with shared leaderboard!

## ✅ Test It

1. Visit your Netlify URL
2. Play the game
3. Get a score
4. Press `L` to see leaderboard
5. All players will see the same scores!

---

**Need Help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

