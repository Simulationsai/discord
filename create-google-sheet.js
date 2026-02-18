/**
 * Helper script to create Google Sheet setup instructions
 * Run: node create-google-sheet.js
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║     GOOGLE SHEET SETUP FOR FORM SUBMISSIONS                  ║
╚══════════════════════════════════════════════════════════════╝

📋 STEP-BY-STEP GUIDE:

1️⃣ CREATE GOOGLE SHEET
   → Go to: https://sheets.google.com
   → Click "Blank" to create new sheet
   → Name it: "THE SYSTEM - Form Submissions"
   → Copy the Sheet ID from URL:
     https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
     ⬆️ Copy the SHEET_ID_HERE part

2️⃣ CREATE GOOGLE CLOUD PROJECT
   → Go to: https://console.cloud.google.com/
   → Click "Create Project"
   → Name: "discord-bot-storage" (or any name)
   → Click "Create"

3️⃣ ENABLE GOOGLE SHEETS API
   → In your project, go to "APIs & Services" → "Library"
   → Search: "Google Sheets API"
   → Click "Enable"

4️⃣ CREATE SERVICE ACCOUNT
   → Go to "IAM & Admin" → "Service Accounts"
   → Click "Create Service Account"
   → Name: "discord-bot"
   → Click "Create and Continue"
   → Skip role → "Done"

5️⃣ GENERATE JSON KEY
   → Click on the service account you just created
   → Go to "Keys" tab
   → Click "Add Key" → "Create new key"
   → Select "JSON" → "Create"
   → JSON file will download (KEEP IT SECURE!)

6️⃣ SHARE SHEET WITH SERVICE ACCOUNT
   → Open your Google Sheet
   → Click "Share" button (top right)
   → Add email: [from JSON file: "client_email" field]
   → Give "Editor" permission
   → Click "Send"

7️⃣ SET ENVIRONMENT VARIABLES IN RENDER
   → Go to Render dashboard → Your service → Environment
   → Add these variables:

   GOOGLE_SHEET_ID=your_sheet_id_from_step_1
   GOOGLE_SERVICE_ACCOUNT_JSON=<paste_full_json_content_here>

   For JSON: Open the downloaded JSON file, copy ALL content,
   minify it to one line (remove line breaks), and paste.

   OR use base64 (easier for Render):
   GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=true
   GOOGLE_SERVICE_ACCOUNT_JSON=<base64_encoded_json>

   To base64 encode:
   cat service-account-key.json | base64

8️⃣ REDEPLOY BOT
   → Render will auto-deploy
   → Check logs for: "✅ Google Sheet connected"

═══════════════════════════════════════════════════════════════

📊 YOUR SHEET LINK:
   After setup, your sheet will be:
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit

   Form submissions will auto-appear with columns:
   - Timestamp
   - Discord User
   - Discord ID
   - Wallet
   - Email
   - Twitter
   - Telegram

═══════════════════════════════════════════════════════════════

💡 QUICK CHECKLIST:
   ☐ Google Sheet created
   ☐ Sheet ID copied
   ☐ Google Cloud project created
   ☐ Google Sheets API enabled
   ☐ Service account created
   ☐ JSON key downloaded
   ☐ Sheet shared with service account email
   ☐ GOOGLE_SHEET_ID set in Render
   ☐ GOOGLE_SERVICE_ACCOUNT_JSON set in Render
   ☐ Bot redeployed

═══════════════════════════════════════════════════════════════

❓ NEED HELP?
   See STORAGE_SETUP.md for detailed instructions.

`);
