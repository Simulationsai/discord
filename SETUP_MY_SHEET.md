# Connect Your Google Sheet for Form Responses

You have a sheet. Follow these steps to connect it so the bot saves every form submission there.

---

## 1. Get your Sheet ID

1. Open your Google Sheet in the browser.
2. Look at the URL. It looks like:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
   ```
3. **Copy the long ID** between `/d/` and `/edit`:
   ```
   1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   ```
   That is your **Sheet ID**.

---

## 2. (Optional) Add header row in the sheet

In **Row 1** of your sheet, add these column headers (or leave row 1 empty; the bot will add them on first submission):

| A          | B             | C          | D      | E     | F       | G        |
|-----------|---------------|------------|--------|-------|---------|----------|
| Timestamp | Discord User  | Discord ID | Wallet | Email | Twitter | Telegram |

You can type these in the first row, or leave the sheet empty and the bot will add them automatically.

---

## 3. Create a Google Cloud service account

1. Go to **https://console.cloud.google.com/**
2. Create a project (or select one) → name it e.g. `discord-bot`.
3. **Enable the API**
   - **APIs & Services** → **Library**
   - Search **Google Sheets API** → **Enable**.
4. **Create service account**
   - **IAM & Admin** → **Service Accounts**
   - **Create Service Account**
   - Name: e.g. `discord-bot` → **Create and Continue** → **Done**.
5. **Create key**
   - Click the new service account
   - **Keys** tab → **Add Key** → **Create new key**
   - Choose **JSON** → **Create**
   - The JSON file will download. Keep it safe.

---

## 4. Share the sheet with the service account

1. Open your Google Sheet.
2. Click **Share** (top right).
3. In “Add people and groups”, paste the **service account email** from the JSON file (field `client_email`). It looks like:
   ```
   discord-bot@your-project.iam.gserviceaccount.com
   ```
4. Set permission to **Editor**.
5. Uncheck “Notify people” (optional).
6. Click **Share** or **Send**.

---

## 5. Set environment variables

### On Render

1. Open your service on **Render** → **Environment**.
2. Add:

**Option A – Sheet ID + raw JSON**

- **Key:** `GOOGLE_SHEET_ID`  
  **Value:** your Sheet ID from step 1.

- **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`  
  **Value:** entire contents of the downloaded JSON file, as **one line** (minify: remove newlines).

**Option B – Sheet ID + base64 JSON (often easier on Render)**

- **Key:** `GOOGLE_SHEET_ID`  
  **Value:** your Sheet ID.

- **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`  
  **Value:** `true`

- **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`  
  **Value:** base64 of the JSON file. On your computer:
  ```bash
  cat path-to-your-key.json | base64
  ```
  Paste the output as the value.

3. Save. Render will redeploy.

### Locally (.env)

1. Copy `.env.example` to `.env`.
2. Set:
   ```
   GOOGLE_SHEET_ID=your_sheet_id_here
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```
   Or put the JSON in a file and set:
   ```
   GOOGLE_CREDENTIALS_PATH=./path-to-your-key.json
   ```

---

## 6. Redeploy and test

1. Redeploy the bot on Render (or restart locally).
2. In logs, look for: **Google Sheet connected: [your sheet name]**.
3. Submit a test form in Discord.
4. Open your sheet — a new row should appear with Timestamp, Discord User, Discord ID, Wallet, Email, Twitter, Telegram.

---

## Your sheet link

After setup, form responses will appear in the same sheet. Your link is:

```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

Replace `YOUR_SHEET_ID` with the ID you copied in step 1.

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| “Google Sheet init failed” | Check Sheet ID, JSON is valid one line (or base64), and sheet is shared with `client_email`. |
| “Permission denied” | Share the sheet with the service account email with **Editor** access. |
| No new rows | Confirm logs show “Google Sheet connected” and “Form submission saved to Google Sheet”. Check Render env vars are saved and service was redeployed. |

Once these steps are done, your sheet is set up for taking responses.
