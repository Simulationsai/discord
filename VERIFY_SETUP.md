# ✅ Setup Complete! Verify Everything Works

**Status:** All 3 environment variables added to Render ✅

---

## 🔍 Step 1: Check Deployment

1. Go to **Render Dashboard** → Your service
2. Wait for **deployment to complete** (usually 1-2 minutes)
3. Status should show: **"Live"** ✅

---

## 📋 Step 2: Check Logs

1. In Render dashboard, click **"Logs"** tab
2. Look for these messages:

**✅ Success indicators:**
```
✅ Google Sheet connected: [Your Sheet Name]
✅ SQLite storage ready: /opt/render/project/src/data/submissions.db
✅ THE SYSTEM Bot is online as [Bot Name]
```

**❌ If you see errors:**
- `Google Sheet init failed` → Check JSON format
- `Permission denied` → Verify sheet is shared with service account
- `TokenInvalid` → Check DISCORD_BOT_TOKEN

---

## 🧪 Step 3: Test Form Submission

1. Go to your **Discord server**
2. Make sure you're **verified** (click "Verify Me" button in #verify channel)
3. Go to **#submit-access-form** channel
4. Click **"Open Form"** button
5. Fill out the form:
   - Wallet Address
   - Email Address
   - Twitter Handle (@username)
   - Telegram Handle (@username)
   - Checkbox: YES
6. Submit the form

---

## 📊 Step 4: Verify Data Saved

### Check Google Sheet:
1. Open: https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit
2. **New row should appear** with:
   - Timestamp
   - Discord User (your username)
   - Discord ID
   - Wallet
   - Email
   - Twitter
   - Telegram

### Check Discord:
1. Go to **#form-logs** channel
2. You should see an **embed** with your form submission details

---

## ✅ Success Checklist

- [x] All 3 environment variables added to Render ✅
- [x] Sheet shared with service account ✅
- [ ] Bot deployed and showing "Live" status
- [ ] Logs show: `✅ Google Sheet connected`
- [ ] Test form submitted successfully
- [ ] New row appears in Google Sheet
- [ ] Form submission logged in #form-logs channel
- [ ] Role assigned (Early Access or Waitlist)

---

## 🎉 Everything Working?

If all checks pass:
- ✅ **Form submissions** → Saved to Google Sheet automatically
- ✅ **Form submissions** → Saved to SQLite database (backup)
- ✅ **Form submissions** → Logged to Discord #form-logs
- ✅ **Role automation** → Early Access/Waitlist assigned automatically

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No row in sheet | Check logs for errors, verify sheet sharing |
| "Permission denied" | Re-share sheet with: `discord-bot@project-eccf73bc-6ff7-4021-92a.iam.gserviceaccount.com` |
| Bot offline | Check DISCORD_BOT_TOKEN in Render |
| Form not submitting | Check if you're verified first |

---

## 📊 Your Sheet

**Link:** https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit

All future form submissions will automatically appear here!

---

**Setup is complete! Test it now and verify everything works.** 🚀
