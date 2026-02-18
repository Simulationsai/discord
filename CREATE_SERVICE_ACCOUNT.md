# 🔑 Create Service Account (Correct JSON)

The file you have is an **OAuth client secret**, but the bot needs a **Service Account JSON**. Follow these steps:

---

## ✅ Step-by-Step: Create Service Account

### Step 1: Go to Google Cloud Console

**https://console.cloud.google.com/**

### Step 2: Select Your Project

- If you see project `project-eccf73bc-6ff7-4021-92a` (from your OAuth file), select it
- OR create a new project

### Step 3: Enable Google Sheets API

1. In the left menu: **APIs & Services** → **Library**
2. Search: **Google Sheets API**
3. Click **Enable**

### Step 4: Create Service Account

1. Left menu: **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account** (top)
3. Fill in:
   - **Service account name:** `discord-bot` (or any name)
   - **Service account ID:** (auto-filled)
   - Click **Create and Continue**
4. **Grant access:** Skip this step → Click **Continue**
5. Click **Done**

### Step 5: Create JSON Key

1. Click on the service account you just created
2. Go to **Keys** tab (top menu)
3. Click **Add Key** → **Create new key**
4. Select **JSON** → Click **Create**
5. **JSON file will download automatically** ✅

This JSON file will look like:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "discord-bot@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

**This is the correct JSON file you need!**

---

## Step 6: Share Your Sheet

1. Open your sheet: https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit
2. Click **Share** (top right)
3. Add email: **`client_email`** from the JSON file (looks like `discord-bot@project-id.iam.gserviceaccount.com`)
4. Give **Editor** permission
5. Click **Share**

---

## Step 7: Configure Render

### Option A: Direct JSON (Simple)

1. Open the downloaded JSON file
2. Copy **ALL content**
3. **Minify it** (remove all line breaks) - use: https://jsonformatter.org/json-minify
4. In Render → Environment → Add:
   - **Key:** `GOOGLE_SHEET_ID`
   - **Value:** `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value:** `<paste_minified_json_here>`

### Option B: Base64 (Recommended for Render)

1. On your computer, run:
   ```bash
   cat /path/to/service-account-key.json | base64
   ```
   (Replace `/path/to/` with actual path to downloaded JSON)

2. Copy the base64 output

3. In Render → Environment → Add:
   - **Key:** `GOOGLE_SHEET_ID`
   - **Value:** `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
   - **Value:** `true`
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value:** `<paste_base64_output_here>`

---

## Step 8: Redeploy & Test

1. Save environment variables in Render
2. Bot will auto-redeploy
3. Check logs for: `✅ Google Sheet connected: [Your Sheet Name]`
4. Submit a test form in Discord
5. Check your sheet - new row should appear! ✅

---

## 🔍 How to Identify Correct JSON

**✅ Service Account JSON (CORRECT):**
- Has `"type": "service_account"`
- Has `"client_email"` field (ends with `.iam.gserviceaccount.com`)
- Has `"private_key"` field (long string with BEGIN/END PRIVATE KEY)

**❌ OAuth Client Secret (WRONG):**
- Has `"web"` or `"installed"` wrapper
- Has `"client_id"` and `"client_secret"`
- No `"client_email"` field

---

## 📋 Quick Checklist

- [ ] Google Cloud project selected/created
- [ ] Google Sheets API enabled
- [ ] Service Account created
- [ ] JSON key downloaded (service account type, not OAuth)
- [ ] Sheet shared with `client_email` from JSON (Editor)
- [ ] `GOOGLE_SHEET_ID` set in Render = `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` set in Render
- [ ] Bot redeployed
- [ ] Test form submitted → row appears ✅

---

**Need help?** The service account JSON is different from OAuth. Follow steps above to get the correct one!
