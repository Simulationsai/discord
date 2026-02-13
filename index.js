/**
 * THE SYSTEM Discord Bot
 * 
 * Fully automated Discord community bot with:
 * - Gated onboarding
 * - Role automation
 * - Engagement-based XP system
 * - Anti-scam protection
 * - Form submission handling
 */

import { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
import { config } from './config.js';

dotenv.config();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Data storage (in production, use a database)
const userData = new Map(); // userId -> { xp, formSubmitted, lastXpTime, roles }
const formSubmissions = new Set(); // Track who has submitted forms

/**
 * Initialize bot
 */
client.once('clientReady', async () => {
  console.log(`✅ THE SYSTEM Bot is online as ${client.user.tag}`);
  console.log(`📊 Monitoring ${client.guilds.cache.size} server(s)`);
  
  // Auto-setup if channels/roles don't exist
  const guild = client.guilds.cache.first();
  if (guild) {
    const verifyChannel = guild.channels.cache.find(c => c.name === 'verify');
    const unverifiedRole = guild.roles.cache.find(r => r.name === 'Unverified');
    
    if (!verifyChannel || !unverifiedRole) {
      console.log('🔧 Auto-setup: Channels/roles not found. Starting automatic setup...');
      try {
        // Find a channel to send setup messages (use general or first text channel)
        const setupChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name === 'general') || 
                           guild.channels.cache.find(c => c.type === ChannelType.GuildText);
        
        if (setupChannel) {
          await setupChannel.send('🚀 **Auto-Setup Starting...** Bot detected missing channels/roles. Setting up automatically...');
          await setupDiscordServer(guild, setupChannel);
        } else {
          console.log('⚠️  No channel found for setup messages. Please run !setup command manually.');
        }
      } catch (error) {
        console.error('❌ Auto-setup failed:', error);
        console.log('💡 Please run !setup command manually in Discord.');
      }
    }
  }
  
  // Sync existing members
  await syncExistingMembers();
});

/**
 * Sync existing members and assign Unverified role
 */
async function syncExistingMembers() {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  const unverifiedRole = await guild.roles.fetch(config.roles.UNVERIFIED).catch(() => null);
  if (!unverifiedRole) {
    console.warn('⚠️  Unverified role not found. Please check config.js');
    return;
  }

  const members = await guild.members.fetch();
  let synced = 0;

  for (const [id, member] of members) {
    if (member.user.bot) continue;
    
    // Check if user has any of our roles
    const hasRole = member.roles.cache.has(config.roles.VERIFIED) ||
                   member.roles.cache.has(config.roles.EARLY_ACCESS) ||
                   member.roles.cache.has(config.roles.WAITLIST);
    
    if (!hasRole && !member.roles.cache.has(config.roles.UNVERIFIED)) {
      await member.roles.add(config.roles.UNVERIFIED).catch(() => {});
      synced++;
    }
  }

  console.log(`🔄 Synced ${synced} members with Unverified role`);
}

/**
 * Handle new member joins
 */
client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;

  const guild = member.guild;
  const unverifiedRole = await guild.roles.fetch(config.roles.UNVERIFIED).catch(() => null);
  
  if (unverifiedRole) {
    await member.roles.add(unverifiedRole).catch(console.error);
    logAction('MEMBER_JOIN', `New member: ${member.user.tag} (${member.id})`);
  }

  // Send welcome message
  const welcomeChannel = await guild.channels.fetch(config.channels.WELCOME).catch(() => null);
  if (welcomeChannel) {
    const embed = new EmbedBuilder()
      .setTitle('🌌 Welcome to THE SYSTEM')
      .setDescription(`
**You are now UNVERIFIED**

To proceed:
1. Read the rules in ${guild.channels.cache.get(config.channels.RULES) || '#rules'}
2. Verify yourself in ${guild.channels.cache.get(config.channels.VERIFY) || '#verify'}
3. Submit the access form
4. Wait for role assignment

**Remember:**
- Never share private keys
- Staff will NEVER DM you first
- No shortcuts - the system decides everything
      `)
      .setColor(0x5865F2)
      .setTimestamp();

    await welcomeChannel.send({ embeds: [embed] }).catch(console.error);
  }
});

/**
 * Handle verification button click
 */
client.on('interactionCreate', async (interaction) => {
  // Verification button
  if (interaction.isButton() && interaction.customId === 'verify_button') {
    await handleVerification(interaction);
  }

  // Form submission button
  if (interaction.isButton() && interaction.customId === 'submit_form_button') {
    await handleFormModal(interaction);
  }

  // Form modal submission
  if (interaction.isModalSubmit() && interaction.customId === 'access_form_modal') {
    await handleFormSubmission(interaction);
  }
});

/**
 * Handle verification process
 */
async function handleVerification(interaction) {
  const member = interaction.member;
  const guild = interaction.guild;

  // Check if already verified
  if (member.roles.cache.has(config.roles.VERIFIED)) {
    return interaction.reply({
      content: '✅ You are already verified!',
      ephemeral: true
    });
  }

  // Anti-alt check (basic - can be enhanced)
  const accountAge = Date.now() - member.user.createdTimestamp;
  const daysOld = accountAge / (1000 * 60 * 60 * 24);

  if (daysOld < 7) {
    return interaction.reply({
      content: '❌ Account must be at least 7 days old to verify. This helps prevent alt accounts.',
      ephemeral: true
    });
  }

  // Assign Verified role, remove Unverified
  try {
    const verifiedRole = await guild.roles.fetch(config.roles.VERIFIED).catch(() => null);
    const unverifiedRole = await guild.roles.fetch(config.roles.UNVERIFIED).catch(() => null);

    if (verifiedRole) await member.roles.add(verifiedRole);
    if (unverifiedRole) await member.roles.remove(unverifiedRole);

    logAction('VERIFICATION', `${member.user.tag} (${member.id}) verified`);

    // Show form submission button
    const embed = new EmbedBuilder()
      .setTitle('✅ Verification Successful')
      .setDescription(`
You are now **VERIFIED**!

Next step: Submit the access form to get your role assignment.

Click the button below to open the form.
      `)
      .setColor(0x00FF00)
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('submit_form_button')
          .setLabel('Submit Access Form')
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Verification error:', error);
    await interaction.reply({
      content: '❌ Error during verification. Please contact an admin.',
      ephemeral: true
    });
  }
}

/**
 * Show form modal
 */
async function handleFormModal(interaction) {
  // Check if already submitted
  if (formSubmissions.has(interaction.user.id)) {
    return interaction.reply({
      content: '❌ You have already submitted the form. Only one submission per user is allowed.',
      ephemeral: true
    });
  }

  // Check if verified
  if (!interaction.member.roles.cache.has(config.roles.VERIFIED)) {
    return interaction.reply({
      content: '❌ You must be verified first. Please verify in #verify',
      ephemeral: true
    });
  }

  // Create modal form
  const modal = new ModalBuilder()
    .setCustomId('access_form_modal')
    .setTitle('THE SYSTEM - Access Form');

  const walletInput = new TextInputBuilder()
    .setCustomId('wallet_address')
    .setLabel('Wallet Address')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('0x...')
    .setRequired(true)
    .setMaxLength(100);

  const emailInput = new TextInputBuilder()
    .setCustomId('email_address')
    .setLabel('Email Address')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('your@email.com')
    .setRequired(true)
    .setMaxLength(100);

  const twitterInput = new TextInputBuilder()
    .setCustomId('twitter_handle')
    .setLabel('Twitter Handle')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('@yourhandle')
    .setRequired(true)
    .setMaxLength(50);

  const telegramInput = new TextInputBuilder()
    .setCustomId('telegram_handle')
    .setLabel('Telegram Handle')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('@yourhandle')
    .setRequired(true)
    .setMaxLength(50);

  const checkboxInput = new TextInputBuilder()
    .setCustomId('private_key_checkbox')
    .setLabel('I understand never to share private keys')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Type "YES" to confirm')
    .setRequired(true)
    .setMaxLength(10);

  const row1 = new ActionRowBuilder().addComponents(walletInput);
  const row2 = new ActionRowBuilder().addComponents(emailInput);
  const row3 = new ActionRowBuilder().addComponents(twitterInput);
  const row4 = new ActionRowBuilder().addComponents(telegramInput);
  const row5 = new ActionRowBuilder().addComponents(checkboxInput);

  modal.addComponents(row1, row2, row3, row4, row5);

  await interaction.showModal(modal);
}

/**
 * Handle form submission
 */
async function handleFormSubmission(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const wallet = interaction.fields.getTextInputValue('wallet_address');
  const email = interaction.fields.getTextInputValue('email_address');
  const twitter = interaction.fields.getTextInputValue('twitter_handle');
  const telegram = interaction.fields.getTextInputValue('telegram_handle');
  const checkbox = interaction.fields.getTextInputValue('private_key_checkbox');

  // Validation
  const errors = [];

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Twitter handle validation
  if (!twitter.startsWith('@')) {
    errors.push('Twitter handle must start with @');
  }

  // Telegram handle validation
  if (!telegram.startsWith('@')) {
    errors.push('Telegram handle must start with @');
  }

  // Checkbox validation
  if (checkbox.toUpperCase() !== 'YES') {
    errors.push('You must confirm that you understand never to share private keys');
  }

  // Wallet address basic validation
  if (!wallet || wallet.length < 10) {
    errors.push('Invalid wallet address');
  }

  if (errors.length > 0) {
    return interaction.editReply({
      content: `❌ Form validation failed:\n${errors.map(e => `• ${e}`).join('\n')}`
    });
  }

  // Check if already submitted
  if (formSubmissions.has(interaction.user.id)) {
    return interaction.editReply({
      content: '❌ You have already submitted the form.'
    });
  }

  // Mark as submitted
  formSubmissions.add(interaction.user.id);

  // Assign Form Submitted role
  const member = interaction.member;
  const guild = interaction.guild;
  
  try {
    const formSubmittedRole = await guild.roles.fetch(config.roles.FORM_SUBMITTED).catch(() => null);
    if (formSubmittedRole) {
      await member.roles.add(formSubmittedRole);
    }

    // Log submission
    logFormSubmission(interaction.user, { wallet, email, twitter, telegram });

    // Process role assignment
    await processRoleAssignment(member);

    await interaction.editReply({
      content: '✅ Form submitted successfully! Your role is being assigned automatically...'
    });
  } catch (error) {
    console.error('Form submission error:', error);
    await interaction.editReply({
      content: '❌ Error processing form. Please contact an admin.'
    });
  }
}

/**
 * Process automatic role assignment after form submission
 */
async function processRoleAssignment(member) {
  const guild = member.guild;

  // Get current role counts
  const earlyAccessRole = await guild.roles.fetch(config.roles.EARLY_ACCESS).catch(() => null);
  const waitlistRole = await guild.roles.fetch(config.roles.WAITLIST).catch(() => null);
  const formSubmittedRole = await guild.roles.fetch(config.roles.FORM_SUBMITTED).catch(() => null);

  if (!earlyAccessRole || !waitlistRole || !formSubmittedRole) {
    console.error('Required roles not found');
    return;
  }

  const earlyAccessCount = earlyAccessRole.members.size;
  const waitlistCount = waitlistRole.members.size;

  // Rule A: Early Access if < 500
  if (earlyAccessCount < config.limits.EARLY_ACCESS_MAX) {
    await member.roles.add(earlyAccessRole);
    await member.roles.remove(formSubmittedRole);
    
    logAction('ROLE_ASSIGNMENT', `${member.user.tag} → Early Access (${earlyAccessCount + 1}/${config.limits.EARLY_ACCESS_MAX})`);
    
    // Notify user
    try {
      await member.send({
        embeds: [new EmbedBuilder()
          .setTitle('🎉 Early Access Granted!')
          .setDescription('You have been assigned **Early Access** role. Welcome to THE SYSTEM!')
          .setColor(0x00FF00)
        ]
      });
    } catch {} // User may have DMs disabled
  }
  // Rule B: Waitlist if EA full and Waitlist < 10,000
  else if (waitlistCount < config.limits.WAITLIST_MAX) {
    await member.roles.add(waitlistRole);
    await member.roles.remove(formSubmittedRole);
    
    logAction('ROLE_ASSIGNMENT', `${member.user.tag} → Waitlist (${waitlistCount + 1}/${config.limits.WAITLIST_MAX})`);
    
    try {
      await member.send({
        embeds: [new EmbedBuilder()
          .setTitle('📋 Waitlist Assignment')
          .setDescription(`You have been assigned **Waitlist** role. Early Access is full (${earlyAccessCount}/${config.limits.EARLY_ACCESS_MAX}).\n\nEngage in #engage to earn XP and upgrade to Early Access!`)
          .setColor(0xFFA500)
        ]
      });
    } catch {}
  }
  // No role if both full
  else {
    logAction('ROLE_ASSIGNMENT', `${member.user.tag} → No role (both EA and Waitlist full)`);
    await member.roles.remove(formSubmittedRole);
  }
}

/**
 * Setup Discord Server - Create all roles and channels
 */
async function setupDiscordServer(guild, statusChannel) {
  const rolesConfig = [
    { name: 'Admin', color: '#FF0000', permissions: PermissionFlagsBits.Administrator, mentionable: true, hoist: true },
    { name: 'Moderator', color: '#FFA500', permissions: PermissionFlagsBits.ManageMessages | PermissionFlagsBits.TimeoutMembers | PermissionFlagsBits.ViewAuditLog, mentionable: true, hoist: true },
    { name: 'Early Access', color: '#FFD700', permissions: 0n, mentionable: true, hoist: true },
    { name: 'Waitlist', color: '#0099FF', permissions: 0n, mentionable: true, hoist: true },
    { name: 'Form Submitted', color: '#808080', permissions: 0n, mentionable: false, hoist: false },
    { name: 'Verified', color: '#00FF00', permissions: 0n, mentionable: false, hoist: false },
    { name: 'Unverified', color: '#808080', permissions: 0n, mentionable: false, hoist: false }
  ];

  const channelsConfig = [
    {
      category: 'Welcome',
      channels: [
        { name: 'welcome', topic: 'Welcome to THE SYSTEM! Read the rules and verify yourself.', permissions: { everyone: { ViewChannel: true, SendMessages: false }, unverified: { ViewChannel: true, SendMessages: false }, verified: { ViewChannel: true, SendMessages: false } } },
        { name: 'rules', topic: 'Community rules and guidelines', permissions: { everyone: { ViewChannel: true, SendMessages: false }, unverified: { ViewChannel: true, SendMessages: false }, verified: { ViewChannel: true, SendMessages: false } } },
        { name: 'verify', topic: 'Click the button to verify your account', permissions: { everyone: { ViewChannel: false }, unverified: { ViewChannel: true, SendMessages: false }, verified: { ViewChannel: true, SendMessages: false } } }
      ]
    },
    {
      category: 'Registration',
      channels: [
        { name: 'submit-access-form', topic: 'Submit your access form here', permissions: { everyone: { ViewChannel: false }, verified: { ViewChannel: true, SendMessages: false } } }
      ]
    },
    {
      category: 'Announcements',
      channels: [
        { name: 'announcements', topic: 'Important announcements', permissions: { everyone: { ViewChannel: false }, earlyAccess: { ViewChannel: true, SendMessages: false }, waitlist: { ViewChannel: true, SendMessages: false }, admin: { ViewChannel: true, SendMessages: true }, moderator: { ViewChannel: true, SendMessages: true } } }
      ]
    },
    {
      category: 'Community',
      channels: [
        { name: 'general', topic: 'General discussion', permissions: { everyone: { ViewChannel: false }, earlyAccess: { ViewChannel: true, SendMessages: true }, waitlist: { ViewChannel: true, SendMessages: true } } }
      ]
    },
    {
      category: 'Engagement',
      channels: [
        { name: 'engage', topic: 'Share Twitter/X links here to earn XP!', permissions: { everyone: { ViewChannel: false }, earlyAccess: { ViewChannel: true, SendMessages: true }, waitlist: { ViewChannel: true, SendMessages: true } } }
      ]
    },
    {
      category: 'Early Access',
      channels: [
        { name: 'early-access-chat', topic: 'Exclusive chat for Early Access members', permissions: { everyone: { ViewChannel: false }, earlyAccess: { ViewChannel: true, SendMessages: true } } }
      ]
    },
    {
      category: 'Moderation',
      channels: [
        { name: 'logs', topic: 'Bot action logs', permissions: { everyone: { ViewChannel: false }, admin: { ViewChannel: true }, moderator: { ViewChannel: true } } },
        { name: 'reports', topic: 'Security reports and incidents', permissions: { everyone: { ViewChannel: false }, admin: { ViewChannel: true }, moderator: { ViewChannel: true } } },
        { name: 'form-logs', topic: 'Form submission logs', permissions: { everyone: { ViewChannel: false }, admin: { ViewChannel: true }, moderator: { ViewChannel: true } } }
      ]
    }
  ];

  const createdRoles = {};
  const createdChannels = {};

  try {
    // Step 1: Create roles
    await statusChannel.send('📋 **Step 1:** Creating roles...');
    const existingRoles = await guild.roles.fetch();
    
    for (const roleConfig of rolesConfig) {
      const existing = existingRoles.find(r => r.name === roleConfig.name);
      if (existing) {
        createdRoles[roleConfig.name.toLowerCase().replace(/\s+/g, '_')] = existing.id;
        continue;
      }

      try {
        const role = await guild.roles.create({
          name: roleConfig.name,
          color: roleConfig.color,
          permissions: roleConfig.permissions,
          mentionable: roleConfig.mentionable,
          hoist: roleConfig.hoist,
          reason: 'THE SYSTEM automated setup'
        });
        createdRoles[roleConfig.name.toLowerCase().replace(/\s+/g, '_')] = role.id;
        await statusChannel.send(`  ✅ Created role: ${roleConfig.name}`);
      } catch (error) {
        await statusChannel.send(`  ❌ Failed to create role "${roleConfig.name}": ${error.message}`);
      }
    }

    // Step 2: Create channels
    await statusChannel.send('📋 **Step 2:** Creating channels...');
    
    for (const categoryConfig of channelsConfig) {
      let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === categoryConfig.category);
      
      if (!category) {
        try {
          category = await guild.channels.create({
            name: categoryConfig.category,
            type: ChannelType.GuildCategory,
            reason: 'THE SYSTEM setup'
          });
          await statusChannel.send(`  ✅ Created category: ${categoryConfig.category}`);
        } catch (error) {
          await statusChannel.send(`  ❌ Failed to create category "${categoryConfig.category}": ${error.message}`);
          continue;
        }
      }

      for (const channelConfig of categoryConfig.channels) {
        const existing = guild.channels.cache.find(c => c.name === channelConfig.name && c.parentId === category.id);
        if (existing) {
          createdChannels[channelConfig.name.toUpperCase().replace(/-/g, '_')] = existing.id;
          continue;
        }

        try {
          const channel = await guild.channels.create({
            name: channelConfig.name,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: channelConfig.topic,
            reason: 'THE SYSTEM setup'
          });
          createdChannels[channelConfig.name.toUpperCase().replace(/-/g, '_')] = channel.id;
          await statusChannel.send(`    ✅ Created channel: #${channelConfig.name}`);

          // Set permissions
          const everyoneRole = guild.roles.everyone;
          const permissions = channelConfig.permissions;

          if (permissions.everyone) {
            await channel.permissionOverwrites.edit(everyoneRole, permissions.everyone);
          }

          const roleMap = {
            unverified: createdRoles.unverified,
            verified: createdRoles.verified,
            earlyAccess: createdRoles.early_access,
            waitlist: createdRoles.waitlist,
            admin: createdRoles.admin,
            moderator: createdRoles.moderator
          };

          for (const [key, roleId] of Object.entries(roleMap)) {
            if (roleId && permissions[key]) {
              const role = guild.roles.cache.get(roleId);
              if (role) {
                await channel.permissionOverwrites.edit(role, permissions[key]);
              }
            }
          }

          const botMember = guild.members.me;
          await channel.permissionOverwrites.edit(botMember, {
            ViewChannel: true,
            SendMessages: true,
            EmbedLinks: true,
            ManageMessages: true
          });
        } catch (error) {
          await statusChannel.send(`    ❌ Failed to create channel "#${channelConfig.name}": ${error.message}`);
        }
      }
    }

    // Step 3: Update config.js with IDs
    await statusChannel.send('📋 **Step 3:** Generating config update...');
    
    const configUpdate = `\`\`\`javascript
export const config = {
  roles: {
    ADMIN: '${createdRoles.admin || 'YOUR_ADMIN_ROLE_ID'}',
    MODERATOR: '${createdRoles.moderator || 'YOUR_MODERATOR_ROLE_ID'}',
    EARLY_ACCESS: '${createdRoles.early_access || 'YOUR_EARLY_ACCESS_ROLE_ID'}',
    WAITLIST: '${createdRoles.waitlist || 'YOUR_WAITLIST_ROLE_ID'}',
    FORM_SUBMITTED: '${createdRoles.form_submitted || 'YOUR_FORM_SUBMITTED_ROLE_ID'}',
    VERIFIED: '${createdRoles.verified || 'YOUR_VERIFIED_ROLE_ID'}',
    UNVERIFIED: '${createdRoles.unverified || 'YOUR_UNVERIFIED_ROLE_ID}'
  },
  channels: {
    WELCOME: '${createdChannels.WELCOME || 'YOUR_WELCOME_CHANNEL_ID'}',
    RULES: '${createdChannels.RULES || 'YOUR_RULES_CHANNEL_ID'}',
    VERIFY: '${createdChannels.VERIFY || 'YOUR_VERIFY_CHANNEL_ID'}',
    SUBMIT_FORM: '${createdChannels.SUBMIT_ACCESS_FORM || 'YOUR_SUBMIT_FORM_CHANNEL_ID'}',
    ANNOUNCEMENTS: '${createdChannels.ANNOUNCEMENTS || 'YOUR_ANNOUNCEMENTS_CHANNEL_ID'}',
    GENERAL: '${createdChannels.GENERAL || 'YOUR_GENERAL_CHANNEL_ID'}',
    ENGAGE: '${createdChannels.ENGAGE || 'YOUR_ENGAGE_CHANNEL_ID'}',
    EARLY_ACCESS_CHAT: '${createdChannels.EARLY_ACCESS_CHAT || 'YOUR_EARLY_ACCESS_CHAT_CHANNEL_ID'}',
    LOGS: '${createdChannels.LOGS || 'YOUR_LOGS_CHANNEL_ID'}',
    REPORTS: '${createdChannels.REPORTS || 'YOUR_REPORTS_CHANNEL_ID'}',
    FORM_LOGS: '${createdChannels.FORM_LOGS || 'YOUR_FORM_LOGS_CHANNEL_ID}'
  },
  limits: {
    EARLY_ACCESS_MAX: 500,
    WAITLIST_MAX: 10000
  },
  xp: {
    ENABLED_CHANNEL: '${createdChannels.ENGAGE || 'YOUR_ENGAGE_CHANNEL_ID'}',
    XP_PER_POST: 10,
    COOLDOWN_SECONDS: 120,
    PROMOTION_THRESHOLD: 1000
  },
  linkRegex: /https?:\\/\\/(www\\.)?(twitter\\.com|x\\.com)\\/[A-Za-z0-9_]+\\/status\\/[0-9]+/,
  form: {
    MAX_SUBMISSIONS_PER_USER: 1,
    REQUIRED_FIELDS: ['wallet', 'email', 'twitter', 'telegram', 'checkbox']
  }
};
\`\`\`

**Copy this config and update your config.js file, then restart the bot!**`;

    await statusChannel.send(configUpdate);
    await statusChannel.send('🎉 **Server setup complete!** All roles and channels have been created. Update config.js with the IDs above and restart the bot.');

  } catch (error) {
    await statusChannel.send(`❌ **Error during setup:** ${error.message}`);
    console.error('Setup error:', error);
  }
}

/**
 * Handle messages - XP system, link filtering, and setup command
 */
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const member = message.member;
  if (!member) return;

  // Setup command (Admin only)
  if (message.content.toLowerCase() === '!setup' || message.content.toLowerCase() === '!setup-server') {
    // Check if user has admin permissions
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Only administrators can run setup command.');
    }

    await message.reply('🚀 Starting server setup... This may take a few minutes.');
    await setupDiscordServer(message.guild, message.channel);
    return;
  }

  // Link filtering in #engage channel
  if (message.channel.id === config.channels.ENGAGE) {
    await handleEngageChannel(message);
  }

  // Anti-scam protection (check all channels)
  await checkForScams(message);
});

/**
 * Handle #engage channel - XP system
 */
async function handleEngageChannel(message) {
  const member = message.member;
  const userId = message.author.id;

  // Check if user has Early Access or Waitlist role
  const hasAccess = member.roles.cache.has(config.roles.EARLY_ACCESS) ||
                   member.roles.cache.has(config.roles.WAITLIST);

  if (!hasAccess) {
    await message.delete().catch(() => {});
    return;
  }

  // Check for valid Twitter/X link
  const content = message.content;
  const hasValidLink = config.linkRegex.test(content);

  if (!hasValidLink) {
    await message.delete().catch(() => {});
    await message.channel.send({
      content: `${message.author}, ❌ Only Twitter/X post links are allowed in this channel. Format: https://twitter.com/username/status/1234567890`,
      deleteAfter: 5000
    }).catch(() => {});
    return;
  }

  // Check cooldown
  const userDataEntry = userData.get(userId) || { xp: 0, lastXpTime: 0 };
  const now = Date.now();
  const timeSinceLastXP = now - userDataEntry.lastXpTime;

  if (timeSinceLastXP < config.xp.COOLDOWN_SECONDS * 1000) {
    const remaining = Math.ceil((config.xp.COOLDOWN_SECONDS * 1000 - timeSinceLastXP) / 1000);
    await message.reply({
      content: `⏳ Cooldown: ${remaining}s remaining`,
      deleteAfter: 3000
    }).catch(() => {});
    return;
  }

  // Award XP
  userDataEntry.xp = (userDataEntry.xp || 0) + config.xp.XP_PER_POST;
  userDataEntry.lastXpTime = now;
  userData.set(userId, userDataEntry);

  // Check for promotion (Waitlist → Early Access)
  if (member.roles.cache.has(config.roles.WAITLIST) && 
      userDataEntry.xp >= config.xp.PROMOTION_THRESHOLD) {
    await checkPromotion(member, userDataEntry.xp);
  }

  // React to message
  await message.react('✅').catch(() => {});
}

/**
 * Check if user should be promoted from Waitlist to Early Access
 */
async function checkPromotion(member, userXP) {
  const guild = member.guild;
  const earlyAccessRole = await guild.roles.fetch(config.roles.EARLY_ACCESS).catch(() => null);
  const waitlistRole = await guild.roles.fetch(config.roles.WAITLIST).catch(() => null);

  if (!earlyAccessRole || !waitlistRole) return;

  const earlyAccessCount = earlyAccessRole.members.size;

  // Only promote if EA is not full
  if (earlyAccessCount < config.limits.EARLY_ACCESS_MAX) {
    await member.roles.add(earlyAccessRole);
    await member.roles.remove(waitlistRole);

    logAction('PROMOTION', `${member.user.tag} promoted to Early Access via XP (${userXP} XP)`);

    try {
      await member.send({
        embeds: [new EmbedBuilder()
          .setTitle('🎉 Promotion to Early Access!')
          .setDescription(`Congratulations! You've reached ${userXP} XP and have been promoted to **Early Access**!`)
          .setColor(0x00FF00)
        ]
      });
    } catch {}
  }
}

/**
 * Anti-scam protection
 */
async function checkForScams(message) {
  const content = message.content.toLowerCase();
  const suspiciousPatterns = [
    'private key',
    'seed phrase',
    'send me',
    'dm me',
    'click here',
    'free money',
    'giveaway',
    'airdrop'
  ];

  const hasSuspiciousContent = suspiciousPatterns.some(pattern => content.includes(pattern));

  // Check for external links (except Twitter in #engage)
  const linkPattern = /https?:\/\/[^\s]+/g;
  const links = message.content.match(linkPattern) || [];
  const hasUnauthorizedLinks = links.some(link => {
    if (message.channel.id === config.channels.ENGAGE) {
      return !config.linkRegex.test(link);
    }
    return true; // No links allowed outside #engage
  });

  if (hasSuspiciousContent || hasUnauthorizedLinks) {
    await message.delete().catch(() => {});
    
    // Timeout user
    try {
      await message.member.timeout(60 * 60 * 1000, 'Suspicious content detected'); // 1 hour timeout
    } catch {}

    logAction('SECURITY', `Suspicious content deleted from ${message.author.tag} in ${message.channel.name}`);

    // Log to reports channel
    const reportsChannel = await message.guild.channels.fetch(config.channels.REPORTS).catch(() => null);
    if (reportsChannel) {
      await reportsChannel.send({
        embeds: [new EmbedBuilder()
          .setTitle('⚠️ Suspicious Content Detected')
          .setDescription(`**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Content:** ${message.content.substring(0, 500)}`)
          .setColor(0xFF0000)
          .setTimestamp()
        ]
      }).catch(() => {});
    }
  }
}

/**
 * Setup verification button in #verify channel
 */
async function setupVerificationChannel() {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  const verifyChannel = await guild.channels.fetch(config.channels.VERIFY).catch(() => null);
  if (!verifyChannel) {
    console.warn('⚠️  Verify channel not found');
    return;
  }

  // Check if message already exists
  const messages = await verifyChannel.messages.fetch({ limit: 10 });
  const existingMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);

  if (existingMessage) {
    console.log('✅ Verification message already exists');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🔐 Verification Required')
    .setDescription(`
Click the button below to verify your account.

**Requirements:**
• Account must be at least 7 days old
• No alt accounts allowed

After verification, you'll be able to submit the access form.
    `)
    .setColor(0x5865F2)
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('verify_button')
        .setLabel('Verify Me')
        .setStyle(ButtonStyle.Success)
    );

  await verifyChannel.send({ embeds: [embed], components: [row] });
  console.log('✅ Verification channel setup complete');
}

/**
 * Setup form submission button in #submit-access-form channel
 */
async function setupFormChannel() {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  const formChannel = await guild.channels.fetch(config.channels.SUBMIT_FORM).catch(() => null);
  if (!formChannel) return;

  // Check if message already exists
  const messages = await formChannel.messages.fetch({ limit: 10 });
  const existingMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);

  if (existingMessage) {
    console.log('✅ Form submission message already exists');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📝 Access Form Submission')
    .setDescription(`
Click the button below to submit your access form.

**Required Information:**
• Wallet Address
• Email Address
• Twitter Handle (@username)
• Telegram Handle (@username)
• Confirmation checkbox

**Note:** Only one submission per user is allowed.
    `)
    .setColor(0x5865F2)
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('submit_form_button')
        .setLabel('Open Form')
        .setStyle(ButtonStyle.Primary)
    );

  await formChannel.send({ embeds: [embed], components: [row] });
  console.log('✅ Form channel setup complete');
}

/**
 * Log actions to #logs channel
 */
async function logAction(action, details) {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  const logsChannel = await guild.channels.fetch(config.channels.LOGS).catch(() => null);
  if (!logsChannel) return;

  const embed = new EmbedBuilder()
    .setTitle(`📊 ${action}`)
    .setDescription(details)
    .setColor(0x5865F2)
    .setTimestamp();

  await logsChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Log form submissions to #form-logs channel
 */
async function logFormSubmission(user, data) {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  const formLogsChannel = await guild.channels.fetch(config.channels.FORM_LOGS).catch(() => null);
  if (!formLogsChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('📝 Form Submission')
    .setFields([
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Wallet', value: data.wallet.substring(0, 20) + '...', inline: true },
      { name: 'Email', value: data.email, inline: true },
      { name: 'Twitter', value: data.twitter, inline: true },
      { name: 'Telegram', value: data.telegram, inline: true }
    ])
    .setColor(0x00FF00)
    .setTimestamp();

  await formLogsChannel.send({ embeds: [embed] }).catch(() => {});
}

// Simple HTTP server for Render port detection (Web Service requirement)
import http from 'http';

// Setup channels when bot is ready
client.once('clientReady', async () => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  await setupVerificationChannel();
  await setupFormChannel();
});

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('THE SYSTEM Bot is running!');
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// Login bot
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN not found in .env file');
  process.exit(1);
}

client.login(token);
