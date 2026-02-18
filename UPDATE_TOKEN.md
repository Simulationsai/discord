# 🔑 Update Bot Token in Render

## New Token:
```
your_bot_token_here
```

## ✅ Steps to Update:

### Step 1: Render Dashboard Mein Jao

1. [dashboard.render.com](https://dashboard.render.com) pe jao
2. **"the-system"** service pe click karo

### Step 2: Environment Variables Update Karo

1. Left sidebar mein **"Environment"** tab pe click karo
   - Ya **"MANAGE"** → **"Environment"** pe jao

2. **`DISCORD_BOT_TOKEN`** variable dhoondo:
   - Agar already hai → **Edit** button pe click karo
   - Agar nahi hai → **"Add Environment Variable"** click karo

3. **Value update karo:**
   - **Key:** `DISCORD_BOT_TOKEN`
   - **Value:** `your_bot_token_here`

4. **Important:**
   - ✅ No extra spaces
   - ✅ No quotes
   - ✅ Exact token copy-paste

5. **"Save Changes"** click karo

### Step 3: Redeploy Karo

1. **"Manual Deploy"** dropdown pe click karo
2. **"Deploy latest commit"** select karo
   - Ya **"Events"** tab pe jao aur **"Redeploy"** click karo

### Step 4: Verify Karo

1. **"Logs"** tab pe jao
2. Wait karo deployment complete hone tak
3. Ye dikhna chahiye:
   ```
   ✅ THE SYSTEM Bot is online as The System#8698
   📊 Monitoring 1 server(s)
   ✅ Verification channel setup complete
   ```

4. Discord mein check karo - bot **Online** (green dot) dikhna chahiye!

---

## ✅ Quick Checklist:

- [ ] Render dashboard → "Environment" tab
- [ ] `DISCORD_BOT_TOKEN` variable update kiya
- [ ] New token value paste kiya: `your_bot_token_here`
- [ ] "Save Changes" click kiya
- [ ] Service redeploy kiya
- [ ] Logs check kiye - bot online dikhna chahiye

---

**Token update karne ke baad bot automatically restart hoga aur online ho jayega!** 🚀
