/**
 * Generate Render environment variables configuration
 * Run: node generate-render-config.js
 */

import fs from 'fs';

const jsonPath = './service-account-key.json';

if (!fs.existsSync(jsonPath)) {
  console.error('❌ service-account-key.json not found');
  console.log('💡 Make sure the JSON file is in the project directory');
  process.exit(1);
}

const jsonContent = fs.readFileSync(jsonPath, 'utf8');
const base64 = Buffer.from(jsonContent).toString('base64');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║     RENDER ENVIRONMENT VARIABLES CONFIGURATION               ║
╚══════════════════════════════════════════════════════════════╝

📋 Copy these EXACTLY into Render → Environment:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variable 1:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Key:   GOOGLE_SHEET_ID
Value: 1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variable 2:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Key:   GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
Value: true

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variable 3:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Key:   GOOGLE_SERVICE_ACCOUNT_JSON
Value: ${base64}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 IMPORTANT: Before deploying, share your sheet with:
   discord-bot@project-eccf73bc-6ff7-4021-92a.iam.gserviceaccount.com
   (Give Editor permission)

🔗 Sheet Link:
   https://docs.google.com/spreadsheets/d/1TVwZ8Jw21QII0USWyOZyrczjPMu_HfrP0WFRjLavKy8/edit

✅ After setting these in Render, bot will auto-redeploy and connect!

`);
