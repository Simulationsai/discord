# 📊 Get Your Google Sheet Link

## Current Status

**Google Sheet is NOT configured yet.** You need to set it up first.

---

## 🚀 Quick Setup (5 minutes)

### Option 1: Use the Helper Script

```bash
node create-google-sheet.js
```

This will print step-by-step instructions.

---

### Option 2: Manual Setup

#### Step 1: Create Google Sheet

1. Go to https://sheets.google.com
2. Create a new blank sheet
3. Name it: **"THE SYSTEM - Form Submissions"**
4. **Copy the Sheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
   Copy the `SHEET_ID_HERE` part

#### Step 2: Google Cloud Setup

1. **Create Project**: https://console.cloud.google.com/
   - Click "Create Project"
   - Name: `discord-bot-storage`

2. **Enable API**:
   - APIs & Services → Library
   - Search "Google Sheets API" → Enable

3. **Create Service Account**:
   - IAM & Admin → Service Accounts
   - Create Service Account → Name: `discord-bot`
   - Skip roles → Done

4. **Generate Key**:
   - Click service account → Keys tab
   - Add Key → Create new key → JSON
   - Download JSON file

5. **Share Sheet**:
   - Open your Google Sheet
   - Share → Add service account email (from JSON: `client_email`)
   - Give "Editor" permission

#### Step 3: Configure Render

Go to Render dashboard → Your service → Environment → Add:

```
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**For JSON**: Copy entire JSON file content, minify to one line, paste.

**OR use Base64** (easier):
```bash
# On your computer:
cat service-account-key.json | base64
```

Then in Render:
```
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=true
GOOGLE_SERVICE_ACCOUNT_JSON=<paste_base64_output>
```

#### Step 4: Redeploy

Render will auto-deploy. Check logs for:
```
✅ Google Sheet connected: THE SYSTEM - Form Submissions
```

---

## 📋 Your Sheet Link

After setup, your sheet link will be:

```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

Replace `YOUR_SHEET_ID` with the ID you copied in Step 1.

---

## ✅ Verify It's Working

1. Submit a test form in Discord
2. Check your Google Sheet - new row should appear
3. Columns will be:
   - Timestamp
   - Discord User
   - Discord ID
   - Wallet
   - Email
   - Twitter
   - Telegram

---

## 🔍 Check Current Configuration

To see if Google Sheet is configured, check Render logs:

- ✅ **"Google Sheet connected"** = Working!
- ⚠️ **"Google Sheet init failed"** = Check env vars
- (No message) = Not configured (SQLite still works)

---

## 💡 Alternative: Use SQLite Only

If you don't want Google Sheets, **SQLite works automatically**:

- No setup needed
- Data stored in `data/submissions.db`
- Access via Render logs or download the file

---

**Need detailed help?** See `STORAGE_SETUP.md`
