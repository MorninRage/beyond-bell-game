# 🚀 Deploy Now - Step by Step

## Part 1: Deploy Backend Server to Railway

### Step 1: Push Code to GitHub (if not already done)

1. Open terminal in `bell-game` folder
2. Run these commands:
```bash
git init
git add .
git commit -m "Beyond Bell game with leaderboard"
```

3. Create a new repo on GitHub.com
4. Then:
```bash
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy to Railway

1. **Go to**: https://railway.app
2. **Click**: "Start a New Project"
3. **Select**: "Deploy from GitHub repo"
4. **Authorize** Railway to access GitHub
5. **Select your repository**
6. **Click**: "Add Service"
7. **In Settings**:
   - **Root Directory**: Set to `server`
   - Railway will auto-detect Node.js
8. **Click**: "Deploy"
9. **Wait** for deployment (1-2 minutes)
10. **Copy the URL** Railway gives you (e.g., `https://your-app.up.railway.app`)

### Step 3: Update Game Config

1. Open `bell-game/config.js`
2. Replace the URL:
```javascript
window.API_URL = 'https://YOUR-RAILWAY-URL.up.railway.app/api';
```

## Part 2: Deploy Game to Netlify

1. **Go to**: https://app.netlify.com
2. **Drag** the entire `bell-game` folder to Netlify
3. **Wait** for deployment
4. **Done!** Your game is live!

## Test It

1. Visit your Netlify URL
2. Play the game
3. Get a score
4. Press `L` to see leaderboard
5. All players will see the same scores!

---

**Your server files are ready in `bell-game/server/`**

