# THE SYSTEM Discord Bot

Node.js (ES modules) Discord bot for a fully automated gated community:

- Verification button (`#verify`) → assigns **Verified**, removes **Unverified** (account age gate).
- Inbuilt Discord modal form (`#submit-access-form`) → stored in **SQLite** (always) + **Google Sheets** (optional).
- Automated role assignment after form submission (**Early Access** max 500, else **Waitlist** max 10,000).
- XP system only in `#engage` (Twitter/X post links only) with cooldown + Waitlist → Early Access promotion.
- Anti-scam enforcement: deletes + timeouts on scam keywords or unauthorized links; reports to `#reports`.
- Logging to `#logs` and `#form-logs`.
- Render-compatible health server on `PORT`.

## Setup

1) Install deps:

```bash
npm install
```

2) Create `.env` from `.env.example` and set:

- `DISCORD_BOT_TOKEN`
- (optional) `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`

3) In Discord Developer Portal for the bot, enable:

- **Server Members Intent**
- **Message Content Intent**

4) Start the bot:

```bash
npm start
```

## Server creation (automated)

As a server admin, run in any channel:

- `!setup` (or `!setup-server`)

This creates all roles/channels and saves IDs to `data/runtime-config.json` so the bot can run immediately without editing `config.js`.

## Notes

- Discord modals do not support real checkboxes. The “checkbox” requirement is enforced by a required acknowledgement field where users must type **`I UNDERSTAND`**.
- Security: if you ever exposed your bot token, rotate it immediately in the Discord Developer Portal and update `.env`.

