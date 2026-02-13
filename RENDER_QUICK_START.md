# ⚡ Render Quick Start - 5 Minutes

## 🚀 Fast Deployment Steps

### Step 1: Render Account
1. [render.com](https://render.com) pe jao
2. **"Get Started for Free"** click karo
3. **GitHub se sign up** karo

### Step 2: New Web Service
1. **"New +"** → **"Web Service"** click karo
2. GitHub repo connect karo: `Simulationsai/the-system-discord-bot`
3. **"Connect"** click karo

### Step 3: Configure
- **Name:** `the-system-bot`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node index.js`
- **Plan:** `Free`

### Step 4: Environment Variable
1. **"Environment Variables"** section
2. **"Add Environment Variable"** click karo
3. Add:
   - **Key:** `DISCORD_BOT_TOKEN`
   - **Value:** `your_bot_token_here` (Discord Developer Portal se lo)
4. **"Add"** click karo

### Step 5: Deploy!
1. **"Create Web Service"** click karo
2. Wait 2-3 minutes
3. Check **"Logs"** tab
4. Bot online dikhna chahiye! ✅

---

## ⚠️ Free Tier Note

- Bot **15 min inactivity** ke baad sleep hota hai
- First request pe wake hoga (~30s)
- **24/7** ke liye **Starter Plan** ($7/month) upgrade karo

---

## ✅ Done!

Bot ab Render pe deploy ho gaya!

**Detailed guide:** `RENDER_DEPLOY.md` dekho
