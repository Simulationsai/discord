# 🎨 Render Deployment Guide - THE SYSTEM Bot

Complete step-by-step guide to deploy your Discord bot on Render.

## 📋 Prerequisites

- ✅ GitHub repo ready: `Simulationsai/the-system-discord-bot`
- ✅ Bot token ready
- ✅ Render account (free signup)

---

## 🚀 Step-by-Step Deployment

### Step 1: Render Account Banao

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"** or **"Sign Up"**
3. Sign up with **GitHub** (recommended - easiest way)
4. Authorize Render to access your GitHub

### Step 2: New Web Service Create Karo

1. Dashboard mein **"New +"** button click karo (top right)
2. **"Web Service"** select karo
3. **"Connect account"** pe click karo (agar GitHub connect nahi hai)
4. **"Connect"** button pe click karo GitHub repo ke saath

### Step 3: Repository Select Karo

1. **"Connect a repository"** section mein
2. Apna repo search karo: `the-system-discord-bot`
3. Ya directly select karo: `Simulationsai/the-system-discord-bot`
4. **"Connect"** click karo

### Step 4: Service Configure Karo

Fill these details:

- **Name:** `the-system-bot` (ya apna naam)
- **Region:** Choose closest to you (e.g., `Oregon (US West)`)
- **Branch:** `main` (default)
- **Root Directory:** Leave empty (root se run hoga)
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node index.js`
- **Plan:** **Free** (ya **Starter** agar paid chahiye)

### Step 5: Environment Variables Add Karo

1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"**
3. Add:
   - **Key:** `DISCORD_BOT_TOKEN`
   - **Value:** `your_bot_token_here` (Discord Developer Portal se lo)
4. Click **"Add"**

### Step 6: Deploy!

1. Scroll down to bottom
2. Click **"Create Web Service"**
3. Render automatically:
   - ✅ Clone karega repo
   - ✅ Install karega dependencies (`npm install`)
   - ✅ Start karega bot (`node index.js`)
   - ✅ Deploy kar dega!

### Step 7: Wait for Deployment

- Deployment takes 2-3 minutes
- You'll see build logs in real-time
- Wait for **"Your service is live"** message

### Step 8: Verify Deployment

1. Go to **"Logs"** tab
2. You should see:
   ```
   ✅ THE SYSTEM Bot is online as The System#8698
   📊 Monitoring 1 server(s)
   ✅ Verification channel setup complete
   ```

3. Check Discord - bot should show as **Online** (green dot)!

---

## ✅ Done!

Your bot is now running on Render!

---

## ⚠️ Important Notes

### Free Tier Limitations:

- **Sleeps after 15 minutes** of inactivity
- **Auto-wakes** on first request (takes ~30 seconds)
- For **24/7 uptime**, upgrade to **Starter Plan** ($7/month)

### For 24/7 Uptime:

1. Go to **"Settings"** tab
2. Scroll to **"Plan"** section
3. Upgrade to **"Starter"** ($7/month)
4. Bot will run 24/7 without sleeping

---

## 🔄 Updates Kaise Kare?

### Automatic (GitHub Push):

1. Code update karo locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update message"
   git push
   ```
3. Render automatically redeploy kar dega!

### Manual Redeploy:

1. Render dashboard mein jao
2. **"Manual Deploy"** → **"Deploy latest commit"** click karo

---

## 📊 Monitoring

### View Logs:

1. **"Logs"** tab pe jao
2. Real-time logs dikhenge
3. Errors bhi yahan dikhenge

### Check Status:

- **"Events"** tab - deployment history
- **"Metrics"** tab - CPU, memory usage (paid plans)

---

## 🆘 Troubleshooting

### Bot Offline?

1. **Logs** check karo - errors dekho
2. Bot token verify karo
3. Bot server mein hai ya nahi check karo
4. **"Manual Deploy"** try karo

### Deployment Failed?

1. **Logs** tab mein error dekho
2. `package.json` verify karo
3. Node.js version check karo (needs 18+)
4. Build command verify karo: `npm install`

### Bot Sleeping (Free Tier)?

- Free tier pe bot 15 min inactivity ke baad sleep hota hai
- First request pe wake hoga (~30 seconds)
- 24/7 ke liye Starter plan upgrade karo

### Environment Variables Not Working?

1. **"Environment"** tab check karo
2. Variable name verify karo: `DISCORD_BOT_TOKEN`
3. Value verify karo (no extra spaces)
4. **"Save Changes"** click karo
5. Redeploy karo

---

## 💰 Render Pricing

| Plan | Price | Uptime | Best For |
|------|-------|--------|----------|
| **Free** | $0/month | Sleeps after 15min | Testing |
| **Starter** | $7/month | 24/7 | Production |
| **Standard** | $25/month | 24/7 + More resources | High traffic |

**For Discord bots:** Free tier is good for testing, Starter for production.

---

## 📝 Configuration Files

Render automatically detects:
- ✅ `package.json` - Dependencies
- ✅ `render.yaml` - Render config (optional)

**Current setup:**
- Build Command: `npm install`
- Start Command: `node index.js`

---

## 🔗 Useful Links

- [Render Dashboard](https://dashboard.render.com)
- [Render Docs](https://render.com/docs)
- [Render Discord Support](https://render.com/discord)

---

## ✅ Quick Checklist

- [ ] Render account created
- [ ] GitHub connected
- [ ] Web Service created
- [ ] Repository connected
- [ ] Environment variable added (`DISCORD_BOT_TOKEN`)
- [ ] Service deployed
- [ ] Bot online in Discord
- [ ] Logs showing success message

---

**🎉 Your bot is now deployed on Render!**

For 24/7 uptime, consider upgrading to Starter plan ($7/month).
