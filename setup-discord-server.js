import "dotenv/config";

import fs from "node:fs";
import path from "node:path";

import {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits
} from "discord.js";

import baseConfig from "./config.js";

const RUNTIME_CONFIG_PATH = path.join(process.cwd(), "data", "runtime-config.json");

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

async function runSetup(guild, actorTag = "setup-script") {
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
    if (existing) return existing;
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

  const allowViewAndRead = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ReadMessageHistory
  ];
  const denyView = PermissionFlagsBits.ViewChannel;
  const denySend = PermissionFlagsBits.SendMessages;
  const denyManage = [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.CreateInstantInvite
  ];

  const welcomeOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: verifiedId, allow: allowViewAndRead, deny: [denySend, ...denyManage] },
    { id: unverifiedId, allow: allowViewAndRead, deny: [denySend, ...denyManage] },
    { id: adminId, allow: allowViewAndRead },
    { id: modId, allow: allowViewAndRead }
  ];

  const verifyOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: verifiedId, allow: allowViewAndRead, deny: [denySend, ...denyManage] },
    { id: unverifiedId, allow: allowViewAndRead, deny: [denySend, ...denyManage] },
    { id: adminId, allow: allowViewAndRead },
    { id: modId, allow: allowViewAndRead }
  ];

  const regOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: verifiedId, allow: allowViewAndRead, deny: [denySend, ...denyManage] },
    { id: adminId, allow: allowViewAndRead },
    { id: modId, allow: allowViewAndRead }
  ];

  const announceOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: earlyId, allow: allowViewAndRead, deny: [denySend, ...denyManage] },
    { id: waitId, allow: allowViewAndRead, deny: [denySend, ...denyManage] },
    { id: adminId, allow: allowViewAndRead },
    { id: modId, allow: allowViewAndRead }
  ];

  const communityOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: earlyId, allow: allowViewAndRead, deny: denyManage },
    { id: waitId, allow: allowViewAndRead, deny: denyManage },
    { id: adminId, allow: allowViewAndRead },
    { id: modId, allow: allowViewAndRead }
  ];

  const earlyOnlyOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: earlyId, allow: allowViewAndRead, deny: denyManage },
    { id: adminId, allow: allowViewAndRead },
    { id: modId, allow: allowViewAndRead }
  ];

  const modOverwrites = [
    { id: everyone.id, deny: [denyView] },
    { id: adminId, allow: allowViewAndRead },
    { id: modId, allow: allowViewAndRead }
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

  const runtimeConfig = safeJsonRead(RUNTIME_CONFIG_PATH, {});
  const nextRuntime = mergeDeep(runtimeConfig, {
    roles: created.roles,
    channels: created.channels,
    xp: { ENABLED_CHANNEL: chEngage.id }
  });
  safeJsonWrite(RUNTIME_CONFIG_PATH, nextRuntime);

  // Useful output for copying into config.js if desired
  console.log("Setup complete. IDs saved to data/runtime-config.json");
  console.log(JSON.stringify(created, null, 2));
}

if (!process.env.DISCORD_BOT_TOKEN) {
  console.error("Missing DISCORD_BOT_TOKEN in environment.");
  process.exit(1);
}

const runtimeConfig = safeJsonRead(RUNTIME_CONFIG_PATH, {});
const config = mergeDeep(baseConfig, runtimeConfig);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", async () => {
  const guildId = process.env.GUILD_ID;
  const guild = guildId ? await client.guilds.fetch(guildId) : client.guilds.cache.first();
  if (!guild) {
    console.error("No guild found. Add the bot to a server and/or set GUILD_ID.");
    process.exit(1);
  }

  await guild.members.fetch().catch(() => null);
  await runSetup(guild, "setup-script");
  await client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_BOT_TOKEN);

