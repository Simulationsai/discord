import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import http from "node:http";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  ModalBuilder,
  Partials,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";

import baseConfig from "./config.js";
import { Storage } from "./storage.js";

const RUNTIME_CONFIG_PATH = path.join(process.cwd(), "data", "runtime-config.json");

const CUSTOM_IDS = {
  VERIFY_BUTTON: "system_verify_me",
  OPEN_FORM_BUTTON: "system_open_form",
  FORM_MODAL: "system_access_form",
  FORM_WALLET: "system_form_wallet",
  FORM_EMAIL: "system_form_email",
  FORM_TWITTER: "system_form_twitter",
  FORM_TELEGRAM: "system_form_telegram",
  FORM_ACK: "system_form_ack",
  CAPTCHA_MODAL: "system_captcha_verify",
  CAPTCHA_ANSWER: "system_captcha_answer"
};

// In-memory CAPTCHA storage (expires after timeout)
const captchaStore = new Map(); // userId -> { question, answer, expiresAt }

// Rate limiting storage (in-memory, cleared on restart)
const rateLimitStore = new Map(); // userId -> { attempts: [], lastAttempt: timestamp }

function safeJsonRead(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function safeJsonWrite(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function mergeDeep(a, b) {
  const out = Array.isArray(a) ? [...a] : { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && a?.[k] && typeof a[k] === "object") {
      out[k] = mergeDeep(a[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const runtimeConfig = safeJsonRead(RUNTIME_CONFIG_PATH, {});
const config = mergeDeep(baseConfig, runtimeConfig);

const twitterStatusRegex = new RegExp(config.linkRegex, "i");
const anyUrlRegex = /https?:\/\/\S+/i;
const keywordRegex = new RegExp(
  `\\b(${(config.security.KEYWORDS || []).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "i"
);

const storage = new Storage({
  dbPath: process.env.FORM_DB_PATH || path.join(process.cwd(), "data", "submissions.db")
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

function getPrimaryGuild() {
  return client.guilds.cache.first() || null;
}

function isAdminish(member) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  const adminRoleId = config.roles.ADMIN;
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;
  return false;
}

function isStaff(member) {
  if (!member) return false;
  if (isAdminish(member)) return true;
  const modRoleId = config.roles.MODERATOR;
  if (modRoleId && member.roles.cache.has(modRoleId)) return true;
  if (member.permissions?.has(PermissionFlagsBits.ManageMessages)) return true;
  if (member.permissions?.has(PermissionFlagsBits.ModerateMembers)) return true;
  return false;
}

function resolveRole(guild, key, fallbackName) {
  const id = config.roles[key];
  if (id) return guild.roles.cache.get(id) || null;
  if (!fallbackName) return null;
  return guild.roles.cache.find((r) => r.name === fallbackName) || null;
}

function resolveChannel(guild, key, fallbackName) {
  const id = config.channels[key];
  if (id) return guild.channels.cache.get(id) || null;
  if (!fallbackName) return null;
  return guild.channels.cache.find((c) => c?.name === fallbackName) || null;
}

async function sendEmbed(guild, channelId, embed, content) {
  if (!guild || !channelId) return;
  try {
    const ch = await guild.channels.fetch(channelId);
    if (!ch?.isTextBased?.()) return;
    await ch.send({ content, embeds: [embed] });
  } catch (e) {
    console.error("Failed to send embed:", e?.message || e);
  }
}

async function logAction(guild, title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x2b2d31)
    .setTimestamp(new Date());
  for (const f of fields) embed.addFields(f);
  await sendEmbed(guild, config.channels.LOGS, embed);
}

async function reportSecurity(guild, title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xff3b30)
    .setTimestamp(new Date());
  for (const f of fields) embed.addFields(f);
  await sendEmbed(guild, config.channels.REPORTS, embed);
}

function requiredConfigPresent() {
  return Boolean(process.env.DISCORD_BOT_TOKEN);
}

async function ensureVerifyMessage(guild) {
  const verifyChannel =
    resolveChannel(guild, "VERIFY", "verify") || resolveChannel(guild, "VERIFY", "verification");
  if (!verifyChannel?.isTextBased?.()) return false;

  const recent = await verifyChannel.messages.fetch({ limit: 25 }).catch(() => null);
  const existing = recent?.find((m) => {
    if (m.author?.id !== client.user?.id) return false;
    const hasButton = m.components?.some((row) =>
      row.components?.some((c) => c?.customId === CUSTOM_IDS.VERIFY_BUTTON)
    );
    return Boolean(hasButton);
  });
  if (existing) return true;

  const embed = new EmbedBuilder()
    .setTitle("Verification Required")
    .setDescription(
      [
        "Click **Verify Me** to enter THE SYSTEM onboarding.",
        "",
        `Requirements: Discord account must be at least **${config.verification.MIN_ACCOUNT_AGE_DAYS} days** old.`,
        "",
        "No manual approvals. No shortcuts."
      ].join("\n")
    )
    .setColor(0x57f287);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(CUSTOM_IDS.VERIFY_BUTTON).setLabel("Verify Me").setStyle(ButtonStyle.Success)
  );

  await verifyChannel.send({ embeds: [embed], components: [row] });
  return true;
}

async function ensureFormMessage(guild) {
  const formChannel = resolveChannel(guild, "SUBMIT_ACCESS_FORM", "submit-access-form");
  if (!formChannel?.isTextBased?.()) return false;

  const recent = await formChannel.messages.fetch({ limit: 25 }).catch(() => null);
  const existing = recent?.find((m) => {
    if (m.author?.id !== client.user?.id) return false;
    const hasButton = m.components?.some((row) =>
      row.components?.some((c) => c?.customId === CUSTOM_IDS.OPEN_FORM_BUTTON)
    );
    return Boolean(hasButton);
  });
  if (existing) return true;

  const embed = new EmbedBuilder()
    .setTitle("Access Registration")
    .setDescription(
      [
        "Submit the inbuilt access form.",
        "",
        "- One submission per Discord user (enforced permanently).",
        "- Never share private keys. Staff never DM first.",
        "",
        "Click **Open Form** to proceed."
      ].join("\n")
    )
    .setColor(0x5865f2);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(CUSTOM_IDS.OPEN_FORM_BUTTON).setLabel("Open Form").setStyle(ButtonStyle.Primary)
  );

  await formChannel.send({ embeds: [embed], components: [row] });
  return true;
}

async function assignUnverifiedIfNeeded(member) {
  const unverified = resolveRole(member.guild, "UNVERIFIED", "Unverified");
  const verified = resolveRole(member.guild, "VERIFIED", "Verified");
  if (!unverified || !verified) return;
  if (member.roles.cache.has(verified.id)) return;
  if (!member.roles.cache.has(unverified.id)) {
    await member.roles.add(unverified).catch(() => null);
  }
}

function accountAgeDays(user) {
  const created = user.createdAt?.getTime?.() ?? 0;
  return (Date.now() - created) / (1000 * 60 * 60 * 24);
}

function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10) + 1; // 1-10
  const num2 = Math.floor(Math.random() * 10) + 1; // 1-10
  const answer = num1 + num2;
  return { question: `${num1} + ${num2}`, answer };
}

function checkRateLimit(userId) {
  if (!config.verification.RATE_LIMIT_ENABLED) return { allowed: true };

  const attempts = storage.getVerificationAttempts(userId);
  const maxAttempts = config.verification.RATE_LIMIT_MAX_ATTEMPTS || 3;
  const windowHours = config.verification.RATE_LIMIT_WINDOW_HOURS || 1;
  const windowMs = windowHours * 60 * 60 * 1000;

  const now = Date.now();
  const timeSinceFirstAttempt = now - attempts.firstAttemptAt;

  // Reset if window has passed
  if (attempts.firstAttemptAt > 0 && timeSinceFirstAttempt > windowMs) {
    storage.resetVerificationAttempts(userId);
    return { allowed: true };
  }

  // Check if exceeded max attempts
  if (attempts.attempts >= maxAttempts) {
    const remainingMs = windowMs - timeSinceFirstAttempt;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return {
      allowed: false,
      message: `Rate limit exceeded. You can try again in ${remainingMinutes} minute(s).`
    };
  }

  return { allowed: true };
}

async function handleVerifyInteraction(interaction) {
  try {
    const guild = interaction.guild;
    const member = interaction.member;
    
    if (!guild || !member) {
      await interaction.reply({
        content: "❌ Error: Could not find server or member information.",
        ephemeral: true
      }).catch(() => null);
      return;
    }

    // Check rate limit
    const rateLimit = checkRateLimit(interaction.user.id);
    if (!rateLimit.allowed) {
      await interaction.reply({
        content: `❌ ${rateLimit.message}`,
        ephemeral: true
      }).catch(() => null);
      return;
    }

    const minDays = Number(config.verification.MIN_ACCOUNT_AGE_DAYS || 7);
    const age = accountAgeDays(interaction.user);
    if (age < minDays) {
      await interaction.reply({
        content: `❌ Verification denied. Your account must be at least **${minDays} days** old.`,
        ephemeral: true
      }).catch(() => null);
      return;
    }

    const verified = resolveRole(guild, "VERIFIED", "Verified");
    const unverified = resolveRole(guild, "UNVERIFIED", "Unverified");
    if (!verified || !unverified) {
      await interaction.reply({
        content: "❌ Server roles are not configured yet. Ask an admin to run `!setup`.",
        ephemeral: true
      }).catch(() => null);
      return;
    }

    // Show CAPTCHA if enabled
    if (config.verification.CAPTCHA_ENABLED) {
      const captcha = generateCaptcha();
      const timeoutMs = (config.verification.CAPTCHA_TIMEOUT_SECONDS || 300) * 1000;
      const expiresAt = Date.now() + timeoutMs;

      captchaStore.set(interaction.user.id, {
        question: captcha.question,
        answer: captcha.answer,
        expiresAt
      });

      setTimeout(() => captchaStore.delete(interaction.user.id), timeoutMs);

      const modal = new ModalBuilder()
        .setCustomId(CUSTOM_IDS.CAPTCHA_MODAL)
        .setTitle("Verification CAPTCHA");

      const answerInput = new TextInputBuilder()
        .setCustomId(CUSTOM_IDS.CAPTCHA_ANSWER)
        .setLabel(`What is ${captcha.question}?`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10)
        .setPlaceholder("Number only");

      modal.addComponents(new ActionRowBuilder().addComponents(answerInput));

      try {
        await interaction.showModal(modal);
      } catch (modalError) {
        console.error("Show modal error:", modalError);
        await interaction.reply({
          content: "❌ Could not open verification. Please try again.",
          ephemeral: true
        }).catch(() => null);
      }
      return;
    }

    // No CAPTCHA - verify directly
    await completeVerification(interaction, guild, member);
  } catch (error) {
    console.error("Error in handleVerifyInteraction:", error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: `❌ Verification failed: ${error.message || "Unknown error"}. Please try again or contact an admin.`
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: `❌ Verification failed: ${error.message || "Unknown error"}. Please try again or contact an admin.`,
          ephemeral: true
        }).catch(() => null);
      }
    } catch (replyError) {
      console.error("Failed to reply to interaction:", replyError);
    }
  }
}

async function completeVerification(interaction, guild, member) {
  try {
    // Record attempt
    storage.recordVerificationAttempt(interaction.user.id);

    // Defer reply first to prevent timeout
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true }).catch(() => null);
    }

    const verified = resolveRole(guild, "VERIFIED", "Verified");
    const unverified = resolveRole(guild, "UNVERIFIED", "Unverified");

    await member.roles.add(verified).catch((err) => {
      console.error("Failed to add Verified role:", err);
    });
    await member.roles.remove(unverified).catch((err) => {
      console.error("Failed to remove Unverified role:", err);
    });

    // Reset rate limit on success
    storage.resetVerificationAttempts(interaction.user.id);

    const replyContent = interaction.deferred
      ? "✅ Verified! Proceed to the access form."
      : "✅ Verified! Proceed to the access form.";

    if (interaction.deferred) {
      await interaction.editReply({ content: replyContent }).catch(() => null);
    } else {
      await interaction.reply({ content: replyContent, ephemeral: true }).catch(() => null);
    }

    await logAction(guild, "User Verified", `${interaction.user.tag} (\`${interaction.user.id}\`) verified.`).catch(() => null);
  } catch (error) {
    console.error("Error in completeVerification:", error);
    throw error;
  }
}

async function handleCaptchaModalSubmit(interaction) {
  // Defer immediately so Discord gets a response within 3 seconds
  await interaction.deferReply({ ephemeral: true }).catch(() => null);

  try {
    const guild = interaction.guild;
    const member = interaction.member;

    if (!guild || !member) {
      await interaction.editReply({
        content: "❌ Error: Could not find server or member information."
      }).catch(() => null);
      return;
    }

    const userAnswer = interaction.fields.getTextInputValue(CUSTOM_IDS.CAPTCHA_ANSWER)?.trim();
    const captchaData = captchaStore.get(interaction.user.id);

    if (!captchaData) {
      await interaction.editReply({
        content: "❌ CAPTCHA expired. Please click Verify Me again."
      }).catch(() => null);
      return;
    }

    // Check if expired
    if (Date.now() > captchaData.expiresAt) {
      captchaStore.delete(interaction.user.id);
      await interaction.editReply({
        content: "❌ CAPTCHA expired. Please click Verify Me again."
      }).catch(() => null);
      return;
    }

    // Validate answer
    const expectedAnswer = String(captchaData.answer);
    const providedAnswer = String(userAnswer || "").replace(/\s+/g, "");

    if (providedAnswer !== expectedAnswer) {
      captchaStore.delete(interaction.user.id);
      await interaction.editReply({
        content: `❌ Incorrect. The answer to "${captchaData.question}" was **${expectedAnswer}**. Click Verify Me to try again.`
      }).catch(() => null);
      return;
    }

    // CAPTCHA correct - complete verification (interaction already deferred)
    captchaStore.delete(interaction.user.id);
    await completeVerification(interaction, guild, member);
  } catch (error) {
    console.error("Error in handleCaptchaModalSubmit:", error);
    await interaction.editReply({
      content: `❌ Verification failed: ${error.message || "Unknown error"}. Please try again.`
    }).catch(() => null);
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateWallet(wallet) {
  // Minimal wallet validation: accept 0x EVM addresses; allow other formats by being permissive.
  if (!wallet) return false;
  if (/^0x[a-fA-F0-9]{40}$/.test(wallet)) return true;
  return wallet.length >= 10;
}

async function processRoleAfterForm(member) {
  const guild = member.guild;
  const early = resolveRole(guild, "EARLY_ACCESS", "Early Access");
  const wait = resolveRole(guild, "WAITLIST", "Waitlist");
  const formSubmitted = resolveRole(guild, "FORM_SUBMITTED", "Form Submitted");
  if (!early || !wait || !formSubmitted) return { assigned: null };

  await guild.members.fetch().catch(() => null); // populate role member caches best-effort

  const earlyCount = early.members?.size ?? 0;
  const waitCount = wait.members?.size ?? 0;

  if (earlyCount < Number(config.limits.EARLY_ACCESS_MAX || 500)) {
    await member.roles.add(early).catch(() => null);
    await member.roles.remove(wait).catch(() => null);
    await member.roles.remove(formSubmitted).catch(() => null);
    return { assigned: "EARLY_ACCESS" };
  }

  if (waitCount < Number(config.limits.WAITLIST_MAX || 10000)) {
    await member.roles.add(wait).catch(() => null);
    await member.roles.remove(early).catch(() => null);
    await member.roles.remove(formSubmitted).catch(() => null);
    return { assigned: "WAITLIST" };
  }

  return { assigned: null };
}

async function handleFormModalSubmit(interaction) {
  // Defer immediately so Discord gets a response within 3 seconds
  await interaction.deferReply({ ephemeral: true }).catch(() => null);

  const guild = interaction.guild;
  const member = interaction.member;

  if (!guild || !member) {
    await interaction.editReply({ content: "❌ Could not find server or member." }).catch(() => null);
    return;
  }

  const verified = resolveRole(guild, "VERIFIED", "Verified");
  if (verified && !member.roles.cache.has(verified.id)) {
    await interaction.editReply({ content: "❌ You must verify first in #verify." }).catch(() => null);
    return;
  }

  if (storage.hasSubmittedForm(interaction.user.id)) {
    await interaction.editReply({
      content: "❌ You have already submitted the access form."
    }).catch(() => null);
    return;
  }

  const wallet = interaction.fields.getTextInputValue(CUSTOM_IDS.FORM_WALLET)?.trim();
  const email = interaction.fields.getTextInputValue(CUSTOM_IDS.FORM_EMAIL)?.trim();
  const twitter = interaction.fields.getTextInputValue(CUSTOM_IDS.FORM_TWITTER)?.trim();
  const telegram = interaction.fields.getTextInputValue(CUSTOM_IDS.FORM_TELEGRAM)?.trim();
  const ack = (interaction.fields.getTextInputValue(CUSTOM_IDS.FORM_ACK) || "").trim();

  if (!validateWallet(wallet)) {
    await interaction.editReply({ content: "❌ Invalid wallet address." }).catch(() => null);
    return;
  }
  if (!validateEmail(email)) {
    await interaction.editReply({ content: "❌ Invalid email address." }).catch(() => null);
    return;
  }
  if (!twitter || !twitter.startsWith("@")) {
    await interaction.editReply({ content: "❌ Twitter handle must start with `@`." }).catch(() => null);
    return;
  }
  if (!telegram || !telegram.startsWith("@")) {
    await interaction.editReply({ content: "❌ Telegram handle must start with `@`." }).catch(() => null);
    return;
  }
  if (!ack || ack.toLowerCase() !== "i understand") {
    await interaction.editReply({
      content: "❌ Type exactly: **I UNDERSTAND** in the acknowledgement field."
    }).catch(() => null);
    return;
  }

  const formSubmittedRole = resolveRole(guild, "FORM_SUBMITTED", "Form Submitted");
  if (!formSubmittedRole) {
    await interaction.editReply({
      content: "❌ Server not configured. Ask an admin to run `!setup`."
    }).catch(() => null);
    return;
  }

  try {
    storage.saveFormSubmission({
      discordUserId: interaction.user.id,
      discordTag: interaction.user.tag,
      wallet,
      email,
      twitter,
      telegram
    });
  } catch (e) {
    await interaction.editReply({
      content: "❌ You have already submitted the form."
    }).catch(() => null);
    return;
  }

  await storage.appendFormSubmissionToSheet({
    discordUserId: interaction.user.id,
    discordTag: interaction.user.tag,
    wallet,
    email,
    twitter,
    telegram
  }).catch(() => null);

  await member.roles.add(formSubmittedRole).catch(() => null);
  const roleResult = await processRoleAfterForm(member);

  const embed = new EmbedBuilder()
    .setTitle("Access Form Submitted")
    .setColor(0x9b9b9b)
    .setTimestamp(new Date())
    .addFields(
      { name: "User", value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: false },
      { name: "Wallet", value: wallet, inline: false },
      { name: "Email", value: email, inline: false },
      { name: "Twitter", value: twitter, inline: true },
      { name: "Telegram", value: telegram, inline: true },
      { name: "Assigned", value: roleResult.assigned || "NONE", inline: false }
    );

  await sendEmbed(guild, config.channels.FORM_LOGS, embed).catch(() => null);
  await logAction(
    guild,
    "Form Submission Stored",
    `${interaction.user.tag} (\`${interaction.user.id}\`) submitted access form.`,
    [{ name: "Assigned", value: roleResult.assigned || "NONE", inline: true }]
  ).catch(() => null);

  const successMsg =
    roleResult.assigned === "EARLY_ACCESS"
      ? "✅ Submission accepted. You have been granted **Early Access**."
      : roleResult.assigned === "WAITLIST"
        ? "✅ Submission accepted. You have been placed on the **Waitlist**."
        : "✅ Submission accepted. Roles are currently full.";

  await interaction.editReply({ content: successMsg }).catch(() => null);
}

async function handleSecurity(message) {
  if (!message.guild || !message.member) return { action: "none" };
  if (message.author?.bot) return { action: "none" };
  if (isStaff(message.member)) return { action: "none" };

  const content = message.content || "";

  const hasKeyword = Boolean(config.security.KEYWORDS?.length) && keywordRegex.test(content);
  const hasUrl = anyUrlRegex.test(content);
  const hasBadUrl = hasUrl && !twitterStatusRegex.test(content);

  if (!hasKeyword && !hasBadUrl) return { action: "none" };

  await message.delete().catch(() => null);

  const timeoutMinutes = Number(config.security.TIMEOUT_MINUTES || 60);
  const until = Date.now() + timeoutMinutes * 60 * 1000;
  await message.member
    .timeout(until, hasKeyword ? "Scam keyword detected" : "Unauthorized link detected")
    .catch(() => null);

  await reportSecurity(
    message.guild,
    "Security Enforcement",
    `Message removed and user timed out (${timeoutMinutes}m).`,
    [
      { name: "User", value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
      { name: "Channel", value: `<#${message.channelId}>`, inline: true },
      { name: "Reason", value: hasKeyword ? "Keyword" : "Unauthorized link", inline: true },
      { name: "Content", value: content.slice(0, 900) || "(empty)", inline: false }
    ]
  );

  return { action: "deleted_timeout" };
}

function getEngageChannelId() {
  return config.xp.ENABLED_CHANNEL || config.channels.ENGAGE || "";
}

async function handleXp(message) {
  const engageId = getEngageChannelId();
  if (!engageId) return;
  if (message.channelId !== engageId) return;
  if (!message.guild || !message.member) return;
  if (message.author?.bot) return;

  // Strict: only Twitter/X post links allowed in #engage
  if (!twitterStatusRegex.test(message.content || "")) {
    await message.delete().catch(() => null);
    return;
  }

  const wait = resolveRole(message.guild, "WAITLIST", "Waitlist");
  if (!wait || !message.member.roles.cache.has(wait.id)) return;

  if (storage.hasAwardedForMessage(message.id)) return;

  const { xp, lastPostAt } = storage.getXp(message.author.id);
  const cooldownMs = Number(config.xp.COOLDOWN_SECONDS || 120) * 1000;
  if (Date.now() - lastPostAt < cooldownMs) {
    await message.delete().catch(() => null);
    return;
  }

  const xpPer = Number(config.xp.XP_PER_POST || 10);
  const newXp = xp + xpPer;
  storage.setXp(message.author.id, { xp: newXp, lastPostAt: Date.now() });
  storage.recordAwardedMessage({ messageId: message.id, discordUserId: message.author.id, xpAwarded: xpPer });

  if (newXp >= Number(config.xp.PROMOTION_THRESHOLD || 1000)) {
    const early = resolveRole(message.guild, "EARLY_ACCESS", "Early Access");
    if (early) {
      await message.guild.members.fetch().catch(() => null);
      const earlyCount = early.members?.size ?? 0;
      if (earlyCount < Number(config.limits.EARLY_ACCESS_MAX || 500)) {
        await message.member.roles.add(early).catch(() => null);
        await message.member.roles.remove(wait).catch(() => null);
        await logAction(
          message.guild,
          "XP Promotion",
          `${message.author.tag} (\`${message.author.id}\`) promoted to Early Access.`,
          [{ name: "XP", value: String(newXp), inline: true }]
        );
      }
    }
  }
}

async function rollbackXpForMessage(guild, messageId) {
  const awarded = storage.getAwardedMessage(messageId);
  if (!awarded) return;
  const { xp, lastPostAt } = storage.getXp(awarded.discord_user_id);
  storage.setXp(awarded.discord_user_id, { xp: Math.max(0, xp - awarded.xp_awarded), lastPostAt });
  storage.deleteAwardedMessage(messageId);
  await logAction(
    guild,
    "XP Rollback",
    `XP rolled back due to edit/delete.`,
    [
      { name: "User ID", value: `\`${awarded.discord_user_id}\``, inline: true },
      { name: "Message ID", value: `\`${messageId}\``, inline: true },
      { name: "XP Removed", value: String(awarded.xp_awarded), inline: true }
    ]
  );
}

async function runSetup(guild, actorTag = "system") {
  const roleSpecs = [
    { key: "ADMIN", name: "Admin", color: 0xed4245, perms: [PermissionFlagsBits.Administrator] },
    {
      key: "MODERATOR",
      name: "Moderator",
      color: 0xfaa61a,
      perms: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ViewAuditLog]
    },
    { key: "EARLY_ACCESS", name: "Early Access", color: 0xf1c40f, perms: [] },
    { key: "WAITLIST", name: "Waitlist", color: 0x3498db, perms: [] },
    { key: "FORM_SUBMITTED", name: "Form Submitted", color: 0x95a5a6, perms: [] },
    { key: "VERIFIED", name: "Verified", color: 0x57f287, perms: [] },
    { key: "UNVERIFIED", name: "Unverified", color: 0x95a5a6, perms: [] }
  ];

  const created = { roles: {}, channels: {} };

  for (const spec of roleSpecs) {
    let role = guild.roles.cache.find((r) => r.name === spec.name) || null;
    if (!role) {
      role = await guild.roles.create({
        name: spec.name,
        color: spec.color,
        permissions: spec.perms,
        reason: `THE SYSTEM setup by ${actorTag}`
      });
    }
    created.roles[spec.key] = role.id;
  }

  const everyone = guild.roles.everyone;
  const adminId = created.roles.ADMIN;
  const modId = created.roles.MODERATOR;
  const verifiedId = created.roles.VERIFIED;
  const unverifiedId = created.roles.UNVERIFIED;
  const earlyId = created.roles.EARLY_ACCESS;
  const waitId = created.roles.WAITLIST;

  async function ensureCategory(name) {
    const existing = guild.channels.cache.find((c) => c.type === 4 && c.name === name) || null;
    if (existing) return existing;
    return await guild.channels.create({ name, type: 4, reason: `THE SYSTEM setup by ${actorTag}` });
  }

  async function ensureTextChannel({ name, parent, overwrites }) {
    const existing =
      guild.channels.cache.find((c) => c.isTextBased?.() && c.name === name && c.parentId === parent.id) || null;
    if (existing) {
      // Update overwrites so Admin/Mod-only actions apply (e.g. edit channel, add members)
      await existing.permissionOverwrites.set(overwrites).catch(() => null);
      return existing;
    }
    return await guild.channels.create({
      name,
      type: 0,
      parent: parent.id,
      permissionOverwrites: overwrites,
      reason: `THE SYSTEM setup by ${actorTag}`
    });
  }

  const catWelcome = await ensureCategory("Welcome");
  const catRegistration = await ensureCategory("Registration");
  const catAnnouncements = await ensureCategory("Announcements");
  const catCommunity = await ensureCategory("Community");
  const catEngagement = await ensureCategory("Engagement");
  const catEarly = await ensureCategory("Early Access");
  const catModeration = await ensureCategory("Moderation");

  const allowView = PermissionFlagsBits.ViewChannel;
  const denyView = PermissionFlagsBits.ViewChannel;
  const denySend = PermissionFlagsBits.SendMessages;
  // Only Admin/Mod can edit channel or add members/roles
  const denyManage = [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.CreateInstantInvite
  ];

  const welcomeOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: verifiedId, allow: [allowView], deny: [denySend, ...denyManage] },
    { id: unverifiedId, allow: [allowView], deny: [denySend, ...denyManage] },
    { id: adminId, allow: [allowView] },
    { id: modId, allow: [allowView] }
  ];

  const verifyOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: verifiedId, allow: [allowView], deny: [denySend, ...denyManage] },
    { id: unverifiedId, allow: [allowView], deny: [denySend, ...denyManage] },
    { id: adminId, allow: [allowView] },
    { id: modId, allow: [allowView] }
  ];

  const regOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: verifiedId, allow: [allowView], deny: [denySend, ...denyManage] },
    { id: adminId, allow: [allowView] },
    { id: modId, allow: [allowView] }
  ];

  const announceOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: earlyId, allow: [allowView], deny: [denySend, ...denyManage] },
    { id: waitId, allow: [allowView], deny: [denySend, ...denyManage] },
    { id: adminId, allow: [allowView] },
    { id: modId, allow: [allowView] }
  ];

  const communityOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: earlyId, allow: [allowView], deny: denyManage },
    { id: waitId, allow: [allowView], deny: denyManage },
    { id: adminId, allow: [allowView] },
    { id: modId, allow: [allowView] }
  ];

  const earlyOnlyOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: earlyId, allow: [allowView], deny: denyManage },
    { id: adminId, allow: [allowView] },
    { id: modId, allow: [allowView] }
  ];

  const modOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: adminId, allow: [allowView] },
    { id: modId, allow: [allowView] }
  ];

  const chWelcome = await ensureTextChannel({ name: "welcome", parent: catWelcome, overwrites: welcomeOverwrites });
  const chRules = await ensureTextChannel({ name: "rules", parent: catWelcome, overwrites: welcomeOverwrites });
  const chVerify = await ensureTextChannel({ name: "verify", parent: catWelcome, overwrites: verifyOverwrites });

  const chSubmit = await ensureTextChannel({
    name: "submit-access-form",
    parent: catRegistration,
    overwrites: regOverwrites
  });

  const chAnnouncements = await ensureTextChannel({
    name: "announcements",
    parent: catAnnouncements,
    overwrites: announceOverwrites
  });

  const chGeneral = await ensureTextChannel({ name: "general", parent: catCommunity, overwrites: communityOverwrites });
  const chGm = await ensureTextChannel({ name: "gm", parent: catCommunity, overwrites: communityOverwrites });
  const chGn = await ensureTextChannel({ name: "gn", parent: catCommunity, overwrites: communityOverwrites });

  const chEngage = await ensureTextChannel({ name: "engage", parent: catEngagement, overwrites: communityOverwrites });

  const chEarlyChat = await ensureTextChannel({
    name: "early-access-chat",
    parent: catEarly,
    overwrites: earlyOnlyOverwrites
  });

  const chLogs = await ensureTextChannel({ name: "logs", parent: catModeration, overwrites: modOverwrites });
  const chReports = await ensureTextChannel({ name: "reports", parent: catModeration, overwrites: modOverwrites });
  const chFormLogs = await ensureTextChannel({ name: "form-logs", parent: catModeration, overwrites: modOverwrites });

  created.channels = {
    WELCOME: chWelcome.id,
    RULES: chRules.id,
    VERIFY: chVerify.id,
    SUBMIT_ACCESS_FORM: chSubmit.id,
    ANNOUNCEMENTS: chAnnouncements.id,
    GENERAL: chGeneral.id,
    GM: chGm.id,
    GN: chGn.id,
    ENGAGE: chEngage.id,
    EARLY_ACCESS_CHAT: chEarlyChat.id,
    LOGS: chLogs.id,
    REPORTS: chReports.id,
    FORM_LOGS: chFormLogs.id
  };

  const nextRuntime = mergeDeep(runtimeConfig, {
    roles: created.roles,
    channels: created.channels,
    xp: { ENABLED_CHANNEL: chEngage.id }
  });
  safeJsonWrite(RUNTIME_CONFIG_PATH, nextRuntime);

  // Update in-memory config so it works immediately without restart.
  Object.assign(config.roles, created.roles);
  Object.assign(config.channels, created.channels);
  config.xp.ENABLED_CHANNEL = chEngage.id;

  await ensureVerifyMessage(guild);
  await ensureFormMessage(guild);

  await logAction(guild, "Setup Completed", "Roles/channels created and configured.", [
    { name: "Actor", value: actorTag, inline: true }
  ]);

  return created;
}

async function handleCommand(message) {
  const prefix = config.commands.PREFIX || "!";
  if (!message.content?.startsWith(prefix)) return false;
  if (!message.guild || !message.member) {
    console.log("Command ignored: no guild or member", { guild: !!message.guild, member: !!message.member });
    return false;
  }
  if (message.author?.bot) return false;

  const [cmdRaw] = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmd = (cmdRaw || "").toLowerCase();

  if (cmd === "setup" || cmd === "setup-server") {
    if (!isAdminish(message.member)) {
      await message.reply("❌ Permission denied. You must be a server administrator to run this command.").catch(() => null);
      return true;
    }
    try {
      await message.reply("⏳ Starting setup... This may take 30-60 seconds.").catch(() => null);
      await runSetup(message.guild, message.author.tag);
      await message.reply("✅ Setup complete! Verification + form messages ensured. Check #logs for details.").catch(() => null);
    } catch (error) {
      console.error("Setup error:", error);
      await message.reply(`❌ Setup failed: ${error.message || "Unknown error"}. Check Render logs.`).catch(() => null);
    }
    return true;
  }

  if (cmd === "fix-verify" || cmd === "fixverification") {
    if (!isAdminish(message.member)) {
      await message.reply("❌ Permission denied. You must be a server administrator to run this command.").catch(() => null);
      return true;
    }
    try {
      await ensureVerifyMessage(message.guild);
      await message.reply("✅ Verification button ensured.").catch(() => null);
    } catch (error) {
      console.error("Fix verify error:", error);
      await message.reply(`❌ Failed: ${error.message || "Unknown error"}`).catch(() => null);
    }
    return true;
  }

  if (cmd === "get-roles") {
    if (!isAdminish(message.member)) {
      await message.reply("❌ Permission denied. You must be a server administrator to run this command.").catch(() => null);
      return true;
    }
    try {
      const lines = message.guild.roles.cache
        .sort((a, b) => b.position - a.position)
        .map((r) => `${r.name}: ${r.id}`);
      await message.reply(`\`\`\`\n${lines.join("\n")}\n\`\`\``.slice(0, 1900)).catch(() => null);
    } catch (error) {
      console.error("Get roles error:", error);
      await message.reply(`❌ Failed: ${error.message || "Unknown error"}`).catch(() => null);
    }
    return true;
  }

  if (cmd === "ping" || cmd === "test") {
    await message.reply("✅ Bot is online and responding! If you're an admin, use `!setup` to configure the server.").catch(() => null);
    return true;
  }

  return false;
}

client.on("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag} (${client.user.id})`);
  console.log(`📊 Connected to ${client.guilds.cache.size} server(s)`);

  if (!requiredConfigPresent()) {
    console.error("❌ DISCORD_BOT_TOKEN missing.");
    return;
  }

  storage.init();
  await storage.initGoogleSheetIfConfigured().catch(() => null);

  const guild = getPrimaryGuild();
  if (guild) {
    console.log(`🏠 Primary guild: ${guild.name} (${guild.id})`);
    await guild.members.fetch().catch(() => null);
    await ensureVerifyMessage(guild).catch(() => null);
    await ensureFormMessage(guild).catch(() => null);
    await logAction(guild, "Bot Online", `Logged in as ${client.user.tag}.`).catch(() => null);
  } else {
    console.warn("⚠️  No guilds found. Make sure the bot is invited to a server.");
  }

  setInterval(async () => {
    const g = getPrimaryGuild();
    if (!g) return;
    await ensureVerifyMessage(g).catch(() => null);
    await ensureFormMessage(g).catch(() => null);
  }, 6 * 60 * 60 * 1000);
});

client.on("guildMemberAdd", async (member) => {
  await assignUnverifiedIfNeeded(member);
  await ensureVerifyMessage(member.guild).catch(() => null);

  const welcomeText = [
    `Welcome to THE SYSTEM, ${member.user}!`,
    "",
    "**Getting Started:**",
    "1) Go to <#verify> and click **Verify Me**",
    "2) After verification, go to <#submit-access-form> and submit the inbuilt access form",
    "",
    "No manual approvals. No shortcuts. History is permanent."
  ].join("\n");

  // Try to send welcome message to welcome channel first, fallback to DM
  const welcomeChannel = resolveChannel(member.guild, "WELCOME", "welcome");
  if (welcomeChannel?.isTextBased?.()) {
    try {
      await welcomeChannel.send(welcomeText);
    } catch (error) {
      console.error("Failed to send welcome message to channel:", error.message);
      // Fallback to DM (may fail silently due to user settings)
      await member.send(welcomeText).catch(() => null);
    }
  } else {
    // No welcome channel, try DM (may fail silently)
    await member.send(welcomeText).catch(() => null);
  }

  await logAction(
    member.guild,
    "Member Joined",
    `${member.user.tag} (\`${member.user.id}\`) joined.`,
    [{ name: "Account Age (days)", value: accountAgeDays(member.user).toFixed(1), inline: true }]
  );
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === CUSTOM_IDS.VERIFY_BUTTON) {
        await handleVerifyInteraction(interaction);
        return;
      }

      if (interaction.customId === CUSTOM_IDS.OPEN_FORM_BUTTON) {
        if (storage.hasSubmittedForm(interaction.user.id)) {
          await interaction.reply({
            content: "❌ You have already submitted the access form.",
            ephemeral: true
          }).catch(() => null);
          return;
        }

        const modal = new ModalBuilder()
          .setCustomId(CUSTOM_IDS.FORM_MODAL)
          .setTitle("THE SYSTEM Access Form");

        const wallet = new TextInputBuilder()
          .setCustomId(CUSTOM_IDS.FORM_WALLET)
          .setLabel("Wallet Address")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(120);

        const email = new TextInputBuilder()
          .setCustomId(CUSTOM_IDS.FORM_EMAIL)
          .setLabel("Email Address")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(120);

        const twitter = new TextInputBuilder()
          .setCustomId(CUSTOM_IDS.FORM_TWITTER)
          .setLabel("Twitter (start with @)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(40);

        const telegram = new TextInputBuilder()
          .setCustomId(CUSTOM_IDS.FORM_TELEGRAM)
          .setLabel("Telegram (start with @)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(40);

        const ack = new TextInputBuilder()
          .setCustomId(CUSTOM_IDS.FORM_ACK)
          .setLabel("Type: I UNDERSTAND")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20);

        modal.addComponents(
          new ActionRowBuilder().addComponents(wallet),
          new ActionRowBuilder().addComponents(email),
          new ActionRowBuilder().addComponents(twitter),
          new ActionRowBuilder().addComponents(telegram),
          new ActionRowBuilder().addComponents(ack)
        );

        try {
          await interaction.showModal(modal);
        } catch (err) {
          console.error("Open Form showModal error:", err);
          await interaction.reply({
            content: "❌ Could not open form. Please try again.",
            ephemeral: true
          }).catch(() => null);
        }
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === CUSTOM_IDS.CAPTCHA_MODAL) {
        await handleCaptchaModalSubmit(interaction);
        return;
      }

      if (interaction.customId === CUSTOM_IDS.FORM_MODAL) {
        await handleFormModalSubmit(interaction);
      }
    }
  } catch (error) {
    console.error("Error in interactionCreate:", error);
    if (interaction.isButton() || interaction.isModalSubmit()) {
      try {
        const errMsg = "❌ An error occurred. Please try again or contact an admin. _(You can dismiss this message below.)_";
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ content: errMsg }).catch(() => null);
        } else {
          await interaction.reply({ content: errMsg, ephemeral: true }).catch(() => null);
        }
      } catch (replyError) {
        console.error("Failed to send error reply:", replyError);
      }
    }
  }
});

client.on("messageCreate", async (message) => {
  try {
    const handled = await handleCommand(message);
    if (handled) return; // Command was handled, skip security/XP checks

    const sec = await handleSecurity(message).catch(() => ({ action: "none" }));
    if (sec?.action === "deleted_timeout") return;

    await handleXp(message).catch(() => null);
  } catch (error) {
    console.error("Error in messageCreate:", error);
  }
});

client.on("messageUpdate", async (oldMsg, newMsg) => {
  const guild = newMsg.guild || oldMsg.guild;
  if (!guild) return;
  const messageId = newMsg.id || oldMsg.id;
  await rollbackXpForMessage(guild, messageId);
});

client.on("messageDelete", async (msg) => {
  const guild = msg.guild;
  if (!guild) return;
  await rollbackXpForMessage(guild, msg.id);
});

const port = Number(process.env.PORT || 3000);
http
  .createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("THE SYSTEM bot online.");
  })
  .listen(port, () => console.log(`Health server listening on :${port}`));

client.login(process.env.DISCORD_BOT_TOKEN);

