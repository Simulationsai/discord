/**
 * Form submission storage: Google Sheet and/or SQLite
 * Set env vars to enable. At least one recommended for persistence.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let sqliteDb = null;
let gsheetDoc = null;
let gsheetReady = false;

function getCreds() {
  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const credsPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (credsJson) {
    try {
      return JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
          ? Buffer.from(credsJson, 'base64').toString('utf8')
          : credsJson
      );
    } catch (e) {
      return null;
    }
  }
  if (credsPath && fs.existsSync(credsPath)) {
    return JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  }
  return null;
}

async function initGoogleSheet() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const creds = getCreds();
  if (!sheetId || !creds) {
    if (sheetId) console.warn('⚠️  Google Sheet: set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CREDENTIALS_PATH');
    return false;
  }
  try {
    const { GoogleSpreadsheet } = await import('google-spreadsheet');
    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: (creds.private_key || '').replace(/\\n/g, '\n')
    });
    await doc.loadInfo();
    gsheetDoc = doc;
    gsheetReady = true;
    console.log('✅ Google Sheet connected:', doc.title);
    return true;
  } catch (e) {
    console.warn('⚠️  Google Sheet init failed:', e.message);
    return false;
  }
}

function getSqlite() {
  if (sqliteDb) return sqliteDb;
  try {
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    const dbPath = process.env.FORM_DB_PATH || path.join(process.cwd(), 'data', 'submissions.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    sqliteDb = db(dbPath);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_user_id TEXT NOT NULL,
        discord_tag TEXT,
        wallet TEXT,
        email TEXT,
        twitter TEXT,
        telegram TEXT,
        submitted_at TEXT DEFAULT (datetime('now'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user ON form_submissions(discord_user_id);
    `);
    console.log('✅ SQLite storage ready:', dbPath);
    return sqliteDb;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.warn('⚠️  SQLite: install with npm install better-sqlite3');
    } else {
      console.warn('⚠️  SQLite init failed:', e.message);
    }
    return null;
  }
}

/**
 * Load all Discord user IDs that have already submitted (for persistence across restarts)
 */
export function loadSubmittedUserIds() {
  const db = getSqlite();
  if (!db) return [];
  try {
    const rows = db.prepare('SELECT discord_user_id FROM form_submissions').all();
    return rows.map(r => r.discord_user_id);
  } catch (e) {
    console.warn('loadSubmittedUserIds error:', e.message);
    return [];
  }
}

/**
 * Save form submission to SQLite and/or Google Sheet
 */
export async function saveFormSubmission(userId, userTag, data) {
  const { wallet = '', email = '', twitter = '', telegram = '' } = data;

  // SQLite
  const db = getSqlite();
  if (db) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO form_submissions (discord_user_id, discord_tag, wallet, email, twitter, telegram, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(userId, userTag || '', wallet, email, twitter, telegram);
    } catch (e) {
      console.error('SQLite save error:', e.message);
    }
  }

  // Google Sheet (use cached doc)
  if (gsheetReady && gsheetDoc) {
    try {
      const sheet = gsheetDoc.sheetsByIndex[0];
      const rows = await sheet.getRows({ limit: 1 });
      if (!rows || rows.length === 0) {
        await sheet.setHeaderRow(['Timestamp', 'Discord User', 'Discord ID', 'Wallet', 'Email', 'Twitter', 'Telegram']);
      }
      await sheet.addRow({
        'Timestamp': new Date().toISOString(),
        'Discord User': userTag || '',
        'Discord ID': userId,
        'Wallet': wallet,
        'Email': email,
        'Twitter': twitter,
        'Telegram': telegram
      });
    } catch (e) {
      console.error('Google Sheet save error:', e.message);
    }
  }
}

/**
 * Initialize storage: connect Google Sheet if configured
 */
export async function initStorage() {
  await initGoogleSheet();
  getSqlite();
}
