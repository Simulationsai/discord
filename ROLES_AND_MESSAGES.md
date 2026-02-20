# Roles & Error Messages

## 1. Why do users see "+" to add roles? (Only Admin/Mod should assign roles)

The **"+" next to roles** on a user profile (e.g. Verified, Waitlist, Early Access) is controlled only by **Discord server settings**. The bot cannot remove it — you must change this in Discord.

### Fix: Turn OFF member-selectable roles (exact steps)

1. **Right‑click your server name** ("The System") → **Server Settings**.
2. In the left sidebar, click **Roles**.
3. At the **top** of the Roles page, look for:
   - **"Allow members to choose their own roles"** or  
   - **"Selectable roles"** / **"Role selection"**
4. **Turn it OFF** (toggle to disabled)  
   **OR** if you see a **list of roles** that members can assign:
   - **Remove** these from that list: **Verified**, **Unverified**, **Waitlist**, **Early Access**, **Form Submitted**.
   - Leave only roles that are safe for members to add (e.g. "Pronouns", "Region" — if you use them). Do **not** allow THE SYSTEM roles.
5. **Save** / close settings.

After this, the **"+" to add roles** will no longer appear for Verified / Waitlist / Early Access. Only people with **Manage Roles** (Admin/Mod) or the **bot** will be able to assign or remove those roles.

### Also check

- **Server Settings → Roles → @everyone**: **Manage Roles** must be **OFF**.
- Only **Admin** and **Moderator** (and the bot) should have **Manage Roles** or **Administrator**.

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
