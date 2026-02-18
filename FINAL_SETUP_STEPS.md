# ✅ Final Setup Steps - Your Sheet is Ready!

**Service Account Email:** `discord-bot@project-eccf73bc-6ff7-4021-92a.iam.gserviceaccount.com`

**Sheet ID:** `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`

---

## 🚀 Step 1: Share Your Sheet (REQUIRED)

1. Open your sheet: https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit

2. Click **Share** button (top right)

3. Add this email:
   ```
   discord-bot@project-eccf73bc-6ff7-4021-92a.iam.gserviceaccount.com
   ```

4. Give **Editor** permission

5. Uncheck "Notify people" (optional)

6. Click **Share**

**✅ This is CRITICAL - without sharing, bot can't write to sheet!**

---

## 🚀 Step 2: Configure Render

Go to **Render Dashboard** → Your service → **Environment** → Add these variables:

### Option A: Base64 (Recommended - Easiest)

1. On your computer, run:
   ```bash
   cat "/Users/santosh/Downloads/project-eccf73bc-6ff7-4021-92a-de84223e0106.json" | base64
   ```

2. Copy the entire base64 output

3. In Render, add these 3 variables:

   **Variable 1:**
   - **Key:** `GOOGLE_SHEET_ID`
   - **Value:** `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`

   **Variable 2:**
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
   - **Value:** `true`

   **Variable 3:**
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value:** `<paste_base64_output_here>`

### Option B: Direct JSON (Alternative)

1. Open the JSON file and copy ALL content

2. Minify it (remove line breaks) using: https://jsonformatter.org/json-minify

3. In Render, add:

   **Variable 1:**
   - **Key:** `GOOGLE_SHEET_ID`
   - **Value:** `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`

   **Variable 2:**
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value:** `<paste_minified_json_here>`

---

## 🚀 Step 3: Redeploy

1. Save all environment variables in Render
2. Bot will **auto-redeploy**
3. Wait for deployment to complete

---

## ✅ Step 4: Verify It's Working

1. Check Render logs - look for:
   ```
   ✅ Google Sheet connected: [Your Sheet Name]
   ```

2. Submit a test form in Discord

3. Open your sheet: https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit

4. **New row should appear automatically!** ✅

   Columns will be:
   - Timestamp
   - Discord User
   - Discord ID
   - Wallet
   - Email
   - Twitter
   - Telegram

---

## 📋 Quick Checklist

- [ ] Sheet shared with: `discord-bot@project-eccf73bc-6ff7-4021-92a.iam.gserviceaccount.com` (Editor)
- [ ] `GOOGLE_SHEET_ID` set in Render = `1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8`
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` set in Render (base64 or direct)
- [ ] Bot redeployed
- [ ] Logs show: `✅ Google Sheet connected`
- [ ] Test form submitted → row appears in sheet ✅

---

## 🔗 Your Sheet Link

**https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit**

After setup, all form submissions will appear here automatically!

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Permission denied" | Share sheet with service account email (Step 1) |
| "Google Sheet init failed" | Check JSON is correct base64 or valid JSON |
| No rows appearing | Check logs for errors, verify sheet is shared |

---

**That's it! Once you share the sheet and set Render env vars, everything will work automatically.** 🎉
