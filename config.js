/**
 * THE SYSTEM Discord Bot Configuration
 * 
 * IMPORTANT: Update role IDs and channel IDs after creating them in Discord
 * Get IDs by enabling Developer Mode in Discord and right-clicking → Copy ID
 */

export const config = {
  // Role IDs (Updated from Discord setup)
  roles: {
    ADMIN: '1471896756785643551',
    MODERATOR: '1471899353437311016',
    EARLY_ACCESS: '1471896762389233836',
    WAITLIST: '1471896764121616558',
    FORM_SUBMITTED: '1471896766164111448',
    VERIFIED: '1471896768072384675',
    UNVERIFIED: '1471896770555547718'
  },

  // Channel IDs (Updated from Discord setup)
  channels: {
    WELCOME: '1471896793452249181',
    RULES: '1471896798913364022',
    VERIFY: '1471896803782950983',
    SUBMIT_FORM: '1471896812066570508',
    ANNOUNCEMENTS: '1471896833684013218',
    GENERAL: '1471896841724625050',
    GM: '', // Good Morning — run !setup to create, then paste ID here
    GN: '', // Good Night — run !setup to create, then paste ID here
    ENGAGE: '1471896848917729483',
    EARLY_ACCESS_CHAT: '1471896857243422863',
    LOGS: '1471896865049153714',
    REPORTS: '1471896870530977987',
    FORM_LOGS: '1471896874897375373'
  },

  // Limits
  limits: {
    EARLY_ACCESS_MAX: 500,
    WAITLIST_MAX: 10000
  },

  // XP System Configuration
  xp: {
    ENABLED_CHANNEL: '1471896848917729483', // #engage channel (updated)
    XP_PER_POST: 10,
    COOLDOWN_SECONDS: 120, // 2 minutes
    PROMOTION_THRESHOLD: 1000 // XP needed for Waitlist → Early Access upgrade
  },

  // Link Validation Regex (Twitter/X only)
  linkRegex: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+/,

  // Form validation
  form: {
    MAX_SUBMISSIONS_PER_USER: 1,
    REQUIRED_FIELDS: ['wallet', 'email', 'twitter', 'telegram', 'checkbox']
  }
};
