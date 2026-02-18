# ✅ Your Google Sheet Setup

**Your Sheet ID:** `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`

**Your Sheet Link:** https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit

---

## 🚀 Quick Setup Steps

### Step 1: Create Google Cloud Service Account

1. Go to: **https://console.cloud.google.com/**
2. **Create Project** (or select existing)
   - Name: `discord-bot-storage`
3. **Enable API:**
   - APIs & Services → Library
   - Search: **Google Sheets API** → **Enable**
4. **Create Service Account:**
   - IAM & Admin → Service Accounts
   - Create Service Account → Name: `discord-bot`
   - Skip roles → **Done**
5. **Generate JSON Key:**
   - Click service account → **Keys** tab
   - Add Key → Create new key → **JSON**
   - Download the JSON file

### Step 2: Share Your Sheet

1. Open your sheet: https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit
2. Click **Share** (top right)
3. Add the **service account email** (from JSON file: `client_email` field)
   - Looks like: `discord-bot@your-project.iam.gserviceaccount.com`
4. Give **Editor** permission
5. Uncheck "Notify people" (optional)
6. Click **Share**

### Step 3: Configure Render

Go to **Render Dashboard** → Your service → **Environment** → Add:

**Variable 1:**
- **Key:** `GOOGLE_SHEET_ID`
- **Value:** `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`

**Variable 2 (Option A - Direct JSON):**
- **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
- **Value:** Paste entire JSON file content as **one line** (remove all line breaks)

**Variable 2 (Option B - Base64 - Recommended for Render):**
1. On your computer, run:
   ```bash
   cat path-to-your-service-account-key.json | base64
   ```
2. Copy the output
3. In Render, add:
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
   - **Value:** `true`
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value:** `<paste_base64_output_here>`

### Step 4: Redeploy

Render will auto-redeploy. Check logs for:
```
✅ Google Sheet connected: [Your Sheet Name]
```

### Step 5: Test

1. Submit a test form in Discord
2. Check your sheet - new row should appear automatically!

---

## 📊 Sheet Columns

The bot will automatically add these columns (if not already present):
- **Timestamp** - When form was submitted
- **Discord User** - Username#1234
- **Discord ID** - User ID
- **Wallet** - Wallet address
- **Email** - Email address
- **Twitter** - Twitter handle
- **Telegram** - Telegram handle

---

## ✅ Checklist

- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Service account created
- [ ] JSON key downloaded
- [ ] Sheet shared with service account email (Editor)
- [ ] `GOOGLE_SHEET_ID` set in Render = `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` set in Render
- [ ] Bot redeployed
- [ ] Test form submitted → row appears in sheet ✅

---

## 🔗 Your Sheet

**Link:** https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit

After setup, all form submissions will appear here automatically!
