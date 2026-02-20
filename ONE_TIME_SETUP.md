# One-Time Setup — Run Once, Use Forever

Follow this **once**. After that, the bot and server should run without repeated fixes.

---

## 1. Deploy the bot (Render)

- Push code to GitHub (already done if you’re reading this).
- Render deploys from the repo. Set env var: `DISCORD_BOT_TOKEN`.
- Wait until the service is **Live** and logs show: `Bot logged in as ...`

---

## 2. Discord Developer Portal (one time)

1. https://discord.com/developers/applications → your application.
2. **Bot** → **Privileged Gateway Intents**:
   - **Server Members Intent** → ON  
   - **Message Content Intent** → ON  
3. **Save Changes**.

---

## 3. Invite the bot

1. **OAuth2** → **URL Generator**.
2. Scopes: `bot`. Permissions: **Administrator** (or at least Manage Roles, Manage Channels, Send Messages, Read Message History).
3. Open the generated URL, select your server, authorize.
4. Confirm the bot appears **online** in the server.

---

## 4. Server setup in Discord (one command)

1. In **any channel** where you have admin rights, run:  
   **`!setup`**
2. Wait ~30–60 seconds. The bot will create:
   - All roles (Admin, Moderator, Early Access, Waitlist, Form Submitted, Verified, Unverified).
   - All channels and categories with correct permissions.
   - Verification button in **#verify** and form button in **#submit-access-form**.
3. If you already ran `!setup` before, run **`!setup`** again once after the latest deploy so channel permissions (including “Read Message History”) are updated and **“Messages Failed To Load”** in #verify is fixed.

---

## 5. Lock down roles — only Admin/Mod can assign (one time)

**If users see a "+" to add roles on profiles, turn this off:**

1. **Right‑click server name** → **Server Settings** → **Roles**.
2. Turn **OFF** “Allow members to choose their own roles” (or remove Verified / Waitlist / Early Access / etc. from the list).
3. Ensure **@everyone** does **not** have **Manage Roles**.
4. Only **Admin** / **Moderator** (and the bot) should assign the system roles.

---

## 6. Optional: welcome text

- In **#welcome** and **#rules**, add your server intro and rules (plain text or embeds). The bot does not overwrite existing messages.

---

## After this

- **Bot**: Stays online as long as Render is running and the token is valid.
- **Channels**: Permissions are set by `!setup` (and updated when you run it again).
- **Verification**: Users use the **Verify Me** button in #verify, then the **Open Form** button in #submit-access-form. No manual approval.
- **Issues**: If something breaks (e.g. new channel or permission change), run **`!setup`** again to re-apply roles and channel permissions.

---

## Quick checklist

- [ ] Render: bot deployed, `DISCORD_BOT_TOKEN` set, service Live.  
- [ ] Developer Portal: Server Members + Message Content intents ON.  
- [ ] Bot invited with correct permissions and online.  
- [ ] Ran **`!setup`** in the server (and once more after the latest permission fix).  
- [ ] Roles: members cannot assign themselves Verified / Early Access / Waitlist.  
- [ ] #verify loads messages (no “Messages Failed To Load”) and shows the Verify Me button.  

That’s the one-time setup. After this, the server and bot are intended to run without repeated changes.
