/**
 * One-time script: set header row on your Google Sheet and test connection.
 * Run: node setup-sheet-headers.js
 *
 * Requires in .env:
 *   GOOGLE_SHEET_ID=your_sheet_id
 *   GOOGLE_SERVICE_ACCOUNT_JSON=... or GOOGLE_CREDENTIALS_PATH=./key.json
 */

import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const HEADERS = ['Timestamp', 'Discord User', 'Discord ID', 'Wallet', 'Email', 'Twitter', 'Telegram'];

async function main() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    console.error('❌ Set GOOGLE_SHEET_ID in .env (the ID from your sheet URL: .../d/SHEET_ID/edit)');
    process.exit(1);
  }

  let creds = null;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const path = process.env.GOOGLE_CREDENTIALS_PATH;
  if (json) {
    try {
      creds = JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
          ? Buffer.from(json, 'base64').toString('utf8')
          : json
      );
    } catch (e) {
      console.error('❌ Invalid GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
      process.exit(1);
    }
  } else if (path) {
    const fs = await import('fs');
    if (!fs.existsSync(path)) {
      console.error('❌ File not found:', path);
      process.exit(1);
    }
    creds = JSON.parse(fs.readFileSync(path, 'utf8'));
  } else {
    console.error('❌ Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CREDENTIALS_PATH in .env');
    process.exit(1);
  }

  try {
    const { GoogleSpreadsheet } = await import('google-spreadsheet');
    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: (creds.private_key || '').replace(/\\n/g, '\n')
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.setHeaderRow(HEADERS);
    console.log('✅ Sheet connected:', doc.title);
    console.log('✅ Header row set:', HEADERS.join(', '));
    console.log('\n📋 Your sheet link:');
    console.log(`   https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
    console.log('\nBot is ready to save form responses to this sheet.');
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.message && e.message.includes('Permission')) {
      console.error('\n💡 Share the sheet with this email (Editor):', creds.client_email);
    }
    process.exit(1);
  }
}

main();
