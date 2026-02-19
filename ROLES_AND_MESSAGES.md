# Roles & Error Messages

## 1. Why can users assign roles to themselves?

If members can change their own roles (e.g. add/remove Verified, Waitlist, Early Access), it's due to **Discord server settings**, not the bot.

### Fix: Disable self-assignable roles

1. Open your server → **Server Settings** (right-click server name).
2. Go to **Roles**.
3. Find the setting **"Allow members to choose their own roles"** or **"Display role members separately"** and the list of roles that members can assign.
4. **Turn OFF** "Allow members to choose their own roles"  
   **OR** remove **Verified**, **Unverified**, **Waitlist**, **Early Access**, **Form Submitted** from the list of roles members can assign.
5. Save.

Only **Admin** and **Moderator** (and the bot) should be able to assign or remove these roles. The bot assigns them automatically (verify button, form submission, XP promotion). No member should be able to give themselves Verified or Early Access.

### Also check

- **Server Settings → Roles → @everyone**: ensure **Manage Roles** is **OFF** for @everyone.
- Only **Admin** (or roles you use for staff) should have **Manage Roles** or **Administrator**.

---

## 2. Error messages – auto-dismiss

Discord does **not** let bots auto-delete or auto-hide **ephemeral** messages (the "Only you can see this" replies). So error messages from the bot **cannot** disappear automatically after a few seconds.

### What users can do

- Click **"Dismiss message"** under the error (Discord shows this for ephemeral messages).
- The message stays until they dismiss it.

### What we do

- Errors are sent as **ephemeral** (only the user sees them), so the channel is not spammed.
- We keep error text short and clear.

There is no Discord API to make ephemeral messages auto-expire.
