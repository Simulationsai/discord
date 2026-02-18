# 🔧 Fix Token Error on Render

## ❌ Error:
```
Error [TokenInvalid]: An invalid token was provided.
```

## ✅ Solution:

Bot token Render ke Environment Variables mein properly set nahi hai. Ye steps follow karo:

### Step 1: Render Dashboard Mein Jao

1. [dashboard.render.com](https://dashboard.render.com) pe jao
2. **"the-system"** service pe click karo

### Step 2: Environment Variables Tab Pe Jao

1. Left sidebar mein **"Environment"** tab pe click karo
2. Ya top menu mein **"MANAGE"** → **"Environment"** click karo

### Step 3: DISCORD_BOT_TOKEN Add/Update Karo

1. **"Add Environment Variable"** button pe click karo
2. Ya agar already hai toh edit karo

3. Add/Update karo:
   - **Key:** `DISCORD_BOT_TOKEN`
   - **Value:** `your_bot_token_here`

4. **Important:** 
   - Value mein koi extra spaces nahi hone chahiye
   - Quotes nahi lagane
   - Exact token copy-paste karo

5. **"Save Changes"** click karo

### Step 4: Redeploy Karo

1. **"Manual Deploy"** dropdown pe click karo
2. **"Deploy latest commit"** select karo
3. Ya **"Events"** tab pe jao aur **"Redeploy"** click karo

### Step 5: Verify Karo

1. **"Logs"** tab pe jao
2. Ye dikhna chahiye:
   ```
   ✅ THE SYSTEM Bot is online as The System#8698
   📊 Monitoring 1 server(s)
   ```

---

## 🔍 Common Issues:

### Issue 1: Token Already Expired
- Agar token expired hai, naya token lo:
  1. [Discord Developer Portal](https://discord.com/developers/applications) pe jao
  2. Apna application select karo
  3. "Bot" section mein jao
  4. "Reset Token" click karo
  5. Naya token copy karo
  6. Render mein update karo

### Issue 2: Extra Spaces
- Token ke aage/peeche spaces check karo
- Copy-paste karte waqt extra spaces na aayein

### Issue 3: Wrong Variable Name
- Variable name exactly `DISCORD_BOT_TOKEN` hona chahiye
- Case-sensitive hai - capital letters use karo

### Issue 4: Token Not Saved
- "Save Changes" click karna mat bhoolo
- Redeploy karna zaroori hai after saving

---

## ✅ Quick Checklist:

- [ ] Render dashboard mein "Environment" tab pe gaya
- [ ] `DISCORD_BOT_TOKEN` variable add/update kiya
- [ ] Token value correctly paste kiya (no spaces)
- [ ] "Save Changes" click kiya
- [ ] Service redeploy kiya
- [ ] Logs check kiye - bot online dikhna chahiye

---

**Token set karne ke baad bot automatically restart hoga aur online ho jayega!** 🚀
