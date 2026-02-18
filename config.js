export default {
  // Fill these in after running !setup (or set manually).
  roles: {
    ADMIN: "", // optional; used for checks in addition to Discord Administrator permission
    MODERATOR: "",
    EARLY_ACCESS: "",
    WAITLIST: "",
    FORM_SUBMITTED: "",
    VERIFIED: "",
    UNVERIFIED: ""
  },

  channels: {
    WELCOME: "",
    RULES: "",
    VERIFY: "",
    SUBMIT_ACCESS_FORM: "",
    ANNOUNCEMENTS: "",
    GENERAL: "",
    GM: "",
    GN: "",
    ENGAGE: "",
    EARLY_ACCESS_CHAT: "",
    LOGS: "",
    REPORTS: "",
    FORM_LOGS: ""
  },

  limits: {
    EARLY_ACCESS_MAX: 500,
    WAITLIST_MAX: 10000
  },

  verification: {
    MIN_ACCOUNT_AGE_DAYS: 7,
    CAPTCHA_ENABLED: true,
    CAPTCHA_TIMEOUT_SECONDS: 300, // 5 minutes
    RATE_LIMIT_ENABLED: true,
    RATE_LIMIT_MAX_ATTEMPTS: 3,
    RATE_LIMIT_WINDOW_HOURS: 1 // per hour
  },

  xp: {
    ENABLED_CHANNEL: "", // set to channels.ENGAGE id after setup
    XP_PER_POST: 10,
    COOLDOWN_SECONDS: 120,
    PROMOTION_THRESHOLD: 1000
  },

  linkRegex: String.raw`https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+`,

  security: {
    TIMEOUT_MINUTES: 60,
    KEYWORDS: [
      "private key",
      "seed phrase",
      "send me",
      "dm me",
      "click here",
      "free money",
      "giveaway",
      "airdrop"
    ]
  },

  form: {
    MAX_SUBMISSIONS_PER_USER: 1
  },

  // Prefix commands (text commands)
  commands: {
    PREFIX: "!"
  }
};

