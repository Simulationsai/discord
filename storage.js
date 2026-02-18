import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { GoogleSpreadsheet } from "google-spreadsheet";

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseServiceAccountFromEnv() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  const isBase64 =
    String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 || "").toLowerCase() === "true";

  const jsonString = isBase64 ? Buffer.from(raw, "base64").toString("utf8") : raw;
  return JSON.parse(jsonString);
}

function parseServiceAccountFromFile() {
  const p = process.env.GOOGLE_CREDENTIALS_PATH;
  if (!p) return null;
  const jsonString = fs.readFileSync(p, "utf8");
  return JSON.parse(jsonString);
}

export class Storage {
  constructor({ dbPath }) {
    this.dbPath = dbPath;
    this.db = null;
    this.sheet = null;
    this.sheetEnabled = false;
  }

  init() {
    ensureDirForFile(this.dbPath);
    this.db = new Database(this.dbPath);
    this.db.pragma("journal_mode = WAL");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        discord_user_id TEXT PRIMARY KEY,
        discord_tag TEXT NOT NULL,
        wallet TEXT NOT NULL,
        email TEXT NOT NULL,
        twitter TEXT NOT NULL,
        telegram TEXT NOT NULL,
        submitted_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS xp (
        discord_user_id TEXT PRIMARY KEY,
        xp INTEGER NOT NULL DEFAULT 0,
        last_post_at INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS xp_messages (
        message_id TEXT PRIMARY KEY,
        discord_user_id TEXT NOT NULL,
        xp_awarded INTEGER NOT NULL,
        awarded_at INTEGER NOT NULL
      );
    `);

    this._prepareStatements();
  }

  _prepareStatements() {
    this.stmt = {
      hasSubmission: this.db.prepare(
        `SELECT 1 AS ok FROM form_submissions WHERE discord_user_id = ? LIMIT 1`
      ),
      insertSubmission: this.db.prepare(
        `INSERT INTO form_submissions
         (discord_user_id, discord_tag, wallet, email, twitter, telegram, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ),
      listSubmittedIds: this.db.prepare(`SELECT discord_user_id FROM form_submissions`),

      getXpRow: this.db.prepare(`SELECT xp, last_post_at FROM xp WHERE discord_user_id = ?`),
      upsertXpRow: this.db.prepare(
        `INSERT INTO xp (discord_user_id, xp, last_post_at)
         VALUES (?, ?, ?)
         ON CONFLICT(discord_user_id) DO UPDATE SET xp = excluded.xp, last_post_at = excluded.last_post_at`
      ),

      hasXpMessage: this.db.prepare(`SELECT 1 AS ok FROM xp_messages WHERE message_id = ? LIMIT 1`),
      insertXpMessage: this.db.prepare(
        `INSERT INTO xp_messages (message_id, discord_user_id, xp_awarded, awarded_at)
         VALUES (?, ?, ?, ?)`
      ),
      getXpMessage: this.db.prepare(
        `SELECT message_id, discord_user_id, xp_awarded FROM xp_messages WHERE message_id = ? LIMIT 1`
      ),
      deleteXpMessage: this.db.prepare(`DELETE FROM xp_messages WHERE message_id = ?`)
    };
  }

  async initGoogleSheetIfConfigured() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) return false;

    const creds = parseServiceAccountFromEnv() || parseServiceAccountFromFile();
    if (!creds) return false;

    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key
    });
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex?.[0];
    if (!sheet) return false;

    this.sheet = sheet;
    this.sheetEnabled = true;
    return true;
  }

  hasSubmittedForm(discordUserId) {
    return Boolean(this.stmt.hasSubmission.get(discordUserId));
  }

  listSubmittedUserIds() {
    return new Set(this.stmt.listSubmittedIds.all().map((r) => r.discord_user_id));
  }

  saveFormSubmission({ discordUserId, discordTag, wallet, email, twitter, telegram }) {
    const submittedAt = Date.now();
    this.stmt.insertSubmission.run(
      discordUserId,
      discordTag,
      wallet,
      email,
      twitter,
      telegram,
      submittedAt
    );
    return submittedAt;
  }

  async appendFormSubmissionToSheet({ discordUserId, discordTag, wallet, email, twitter, telegram }) {
    if (!this.sheetEnabled || !this.sheet) return false;
    await this.sheet.addRow({
      discord_user_id: discordUserId,
      discord_tag: discordTag,
      wallet,
      email,
      twitter,
      telegram,
      submitted_at: new Date().toISOString()
    });
    return true;
  }

  getXp(discordUserId) {
    const row = this.stmt.getXpRow.get(discordUserId);
    if (!row) return { xp: 0, lastPostAt: 0 };
    return { xp: row.xp ?? 0, lastPostAt: row.last_post_at ?? 0 };
  }

  setXp(discordUserId, { xp, lastPostAt }) {
    this.stmt.upsertXpRow.run(discordUserId, xp, lastPostAt);
  }

  hasAwardedForMessage(messageId) {
    return Boolean(this.stmt.hasXpMessage.get(messageId));
  }

  recordAwardedMessage({ messageId, discordUserId, xpAwarded }) {
    this.stmt.insertXpMessage.run(messageId, discordUserId, xpAwarded, Date.now());
  }

  getAwardedMessage(messageId) {
    return this.stmt.getXpMessage.get(messageId) || null;
  }

  deleteAwardedMessage(messageId) {
    this.stmt.deleteXpMessage.run(messageId);
  }
}

