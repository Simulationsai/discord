# 📊 Form Submission Storage Setup

The bot can store form submissions in **Google Sheets** and/or **SQLite database**. At least one is recommended for persistence.

---

## 🗄️ Option 1: Google Sheets (Recommended)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google Sheets API**:
   - APIs & Services → Enable APIs → Search "Google Sheets API" → Enable

### Step 2: Create Service Account

1. Go to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., "discord-bot-sheets")
4. Click **Create and Continue**
5. Skip role assignment → **Done**

### Step 3: Generate JSON Key

1. Click on the service account you created
2. Go to **Keys** tab
3. Click **Add Key → Create new key**
4. Select **JSON** → **Create**
5. Download the JSON file (keep it secure!)

### Step 4: Create Google Sheet

1. Create a new Google Sheet
2. **Share** the sheet with the service account email:
   - Click **Share** button
   - Add email: `your-service-account@project-id.iam.gserviceaccount.com`
   - Give **Editor** permission
   - Click **Send**

### Step 5: Get Sheet ID

From the Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```
Copy the `SHEET_ID_HERE` part.

### Step 6: Set Environment Variables

**For Render:**
1. Go to your Render service → **Environment**
2. Add these variables:

```
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**Option A: Paste JSON directly** (minify to one line):
```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com",...}'
```

**Option B: Base64 encode JSON** (recommended for Render):
```bash
# On your local machine:
cat service-account-key.json | base64

# Then in Render:
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=true
GOOGLE_SERVICE_ACCOUNT_JSON=<paste_base64_output_here>
```

**For local development (.env file):**
```env
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# OR use file path:
GOOGLE_CREDENTIALS_PATH=./service-account-key.json
```

---

## 💾 Option 2: SQLite Database

SQLite stores data locally in a file. No external setup needed!

### Setup

**For Render:**
- SQLite works automatically (stores in `/opt/render/project/src/data/submissions.db`)
- No env vars needed

**For local:**
- Creates `data/submissions.db` automatically
- Optional: Set `FORM_DB_PATH=/custom/path/to/db.db`

### Install Dependency

```bash
npm install better-sqlite3
```

---

## ✅ Both Options (Recommended)

You can use **both** Google Sheets and SQLite:
- **SQLite**: Fast local storage, persists across restarts
- **Google Sheets**: Easy to view/export, share with team

Set env vars for both - the bot will save to both automatically!

---

## 🔍 Verify It's Working

After deployment:

1. Submit a form in Discord
2. Check:
   - **Google Sheet**: New row should appear
   - **SQLite**: Check `data/submissions.db` (or Render logs for path)
   - **Discord #form-logs**: Embed should appear

---

## 📋 Sheet Columns (Auto-created)

The bot automatically creates these columns in Google Sheet:
- **Timestamp** - ISO date/time
- **Discord User** - Username#1234
- **Discord ID** - User ID
- **Wallet** - Full wallet address
- **Email** - Email address
- **Twitter** - Twitter handle
- **Telegram** - Telegram handle

---

## 🐛 Troubleshooting

### Google Sheet: "Permission denied"
- Ensure sheet is shared with service account email
- Check service account has Editor access

### Google Sheet: "Invalid credentials"
- Verify JSON is valid (no extra spaces/newlines)
- Try base64 encoding if direct JSON fails
- Check `client_email` and `private_key` are correct

### SQLite: "Module not found"
- Run: `npm install better-sqlite3`
- On Render: Ensure `package.json` includes it

### No data saved
- Check bot logs for errors
- Verify env vars are set correctly
- Test with both storage options enabled

---

## 🔐 Security Notes

- **Never commit** service account JSON to Git
- Use Render secrets/env vars for credentials
- Service account should only have access to the specific sheet
- SQLite file contains sensitive data - keep secure
