/**
 * Server Redesign Script
 * ======================
 * Reorganizes a Discord server into a clean, minimal layout.
 *
 * Usage:
 *   npx ts-node --skip-project scripts/redesign_server.ts
 *
 * Prerequisites:
 *   - Bot token in .env as DISCORD_TOKEN
 *   - Bot must have MANAGE_CHANNELS, MANAGE_ROLES, MANAGE_GUILD permissions
 *   - Set TARGET_GUILD_ID in .env or pass as argument
 */

import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, Guild } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─── Configuration ────────────────────────────────────────────────────────────

const TARGET_GUILD_ID = process.env.TARGET_GUILD_ID || process.argv[2];
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN not found in .env');
  process.exit(1);
}

if (!TARGET_GUILD_ID) {
  console.error('❌ TARGET_GUILD_ID not found. Set it in .env or pass as argument.');
  console.error('   Usage: npx ts-node scripts/redesign_server.ts <GUILD_ID>');
  process.exit(1);
}

// ─── Desired Layout ──────────────────────────────────────────────────────────

interface ChannelDef {
  name: string;
  type: ChannelType;
  topic?: string;
  category?: string;
  position?: number;
}

interface CategoryDef {
  name: string;
  position: number;
}

const CATEGORIES: CategoryDef[] = [
  { name: '📋 INFORMATION', position: 0 },
  { name: '💬 CHAT', position: 1 },
  { name: '⚙️ TECHNICAL', position: 2 },
  { name: '🎮 GAMING', position: 3 },
  { name: '🎤 VOICE', position: 4 },
];

const CHANNELS: ChannelDef[] = [
  // ── INFORMATION ──
  {
    name: 'welcome',
    type: ChannelType.GuildText,
    topic: '👋 Welcome! Read the rules and introduce yourself.',
    category: '📋 INFORMATION',
    position: 0,
  },
  {
    name: 'announcements',
    type: ChannelType.GuildText,
    topic: '📢 Server announcements and important updates.',
    category: '📋 INFORMATION',
    position: 1,
  },

  // ── CHAT ──
  {
    name: 'general',
    type: ChannelType.GuildText,
    topic: '💬 Main conversation channel. Keep it friendly.',
    category: '💬 CHAT',
    position: 2,
  },
  {
    name: 'media',
    type: ChannelType.GuildText,
    topic: '🖼️ Share images, clips, memes, and other media.',
    category: '💬 CHAT',
    position: 3,
  },

  // ── TECHNICAL ──
  {
    name: 'tech-talk',
    type: ChannelType.GuildText,
    topic: '⚙️ Development discussions, debugging, and technical topics.',
    category: '⚙️ TECHNICAL',
    position: 4,
  },
  {
    name: 'resources',
    type: ChannelType.GuildText,
    topic: '📚 Useful links, documentation, and references.',
    category: '⚙️ TECHNICAL',
    position: 5,
  },

  // ── GAMING ──
  {
    name: 'gambling',
    type: ChannelType.GuildText,
    topic: '🎰 Place your bets and try your luck.',
    category: '🎮 GAMING',
    position: 6,
  },
  {
    name: 'hunting',
    type: ChannelType.GuildText,
    topic: '🏹 Hunt creatures, track prey, and claim your rewards.',
    category: '🎮 GAMING',
    position: 7,
  },
  {
    name: 'wishing',
    type: ChannelType.GuildText,
    topic: '🌟 Make a wish — who knows what fortune awaits.',
    category: '🎮 GAMING',
    position: 8,
  },
  {
    name: 'battle-room',
    type: ChannelType.GuildText,
    topic: '⚔️ Challenge opponents and prove your strength.',
    category: '🎮 GAMING',
    position: 9,
  },

  // ── VOICE ──
  {
    name: '🔊 General',
    type: ChannelType.GuildVoice,
    category: '🎤 VOICE',
    position: 10,
  },
  {
    name: '🔊 AFK',
    type: ChannelType.GuildVoice,
    category: '🎤 VOICE',
    position: 11,
  },
];

// ─── Helper: Find or create category ─────────────────────────────────────────

async function findOrCreateCategory(
  guild: Guild,
  name: string,
  position: number
): Promise<{ id: string }> {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === name
  );
  if (existing) {
    console.log(`  📁 Category "${name}" already exists — reusing.`);
    return { id: existing.id };
  }

  const cat = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    position,
  });
  console.log(`  📁 Created category: ${name}`);
  return { id: cat.id };
}

// ─── Helper: Find or create channel ──────────────────────────────────────────

async function findOrCreateChannel(
  guild: Guild,
  def: ChannelDef,
  categoryId: string | null
): Promise<void> {
  const existing = guild.channels.cache.find(
    (c) => c.name === def.name && c.type === def.type && !c.isThread()
  );

  if (existing) {
    // Update existing channel's parent and topic
    const updateData: Record<string, unknown> = {};
    if (categoryId && existing.parentId !== categoryId) {
      updateData.parent = categoryId;
    }
    if (def.topic && 'topic' in existing && existing.topic !== def.topic) {
      updateData.topic = def.topic;
    }
    if (Object.keys(updateData).length > 0) {
      await existing.edit(updateData);
      console.log(`  ✏️  Updated channel: ${def.name}`);
    } else {
      console.log(`  ✅ Channel "${def.name}" already correct — skipping.`);
    }
    return;
  }

  const createData: Record<string, unknown> = {
    name: def.name,
    type: def.type,
  };
  if (categoryId) createData.parent = categoryId;
  if (def.topic) createData.topic = def.topic;

  await guild.channels.create(createData as any);
  console.log(`  ➕ Created channel: ${def.name}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

  client.once('ready', async () => {
    console.log(`\n🤖 Logged in as ${client.user?.tag}`);
    console.log(`🎯 Target guild: ${TARGET_GUILD_ID}\n`);

    const guild = client.guilds.cache.get(TARGET_GUILD_ID);
    if (!guild) {
      console.error(`❌ Guild "${TARGET_GUILD_ID}" not found. Is the bot in this server?`);
      client.destroy();
      process.exit(1);
    }

    console.log(`📡 Connected to server: ${guild.name} (${guild.id})`);
    console.log(`   Members: ${guild.memberCount}\n`);

    // Check bot permissions
    const botMember = guild.members.cache.get(client.user!.id);
    if (botMember) {
      const perms = botMember.permissions;
      if (!perms.has(PermissionFlagsBits.ManageChannels)) {
        console.error('❌ Bot lacks MANAGE_CHANNELS permission!');
        console.error('   Go to Server Settings → Roles → Bot Role → Enable "Manage Channels"');
        client.destroy();
        process.exit(1);
      }
      if (!perms.has(PermissionFlagsBits.ManageGuild)) {
        console.error('❌ Bot lacks MANAGE_GUILD permission (needed for channel positions).');
        client.destroy();
        process.exit(1);
      }
      console.log('✅ Bot permissions verified.\n');
    }

    // ── Step 1: Create categories ──
    console.log('── Step 1: Creating Categories ──');
    const categoryMap: Record<string, string> = {};
    for (const cat of CATEGORIES) {
      const { id } = await findOrCreateCategory(guild, cat.name, cat.position);
      categoryMap[cat.name] = id;
    }

    // ── Step 2: Create/update channels ──
    console.log('\n── Step 2: Creating Channels ──');
    for (const ch of CHANNELS) {
      const catId = ch.category ? categoryMap[ch.category] || null : null;
      await findOrCreateChannel(guild, ch, catId);
    }

    // ── Step 3: Set positions ──
    console.log('\n── Step 3: Setting Channel Positions ──');
    for (const ch of CHANNELS) {
      const channel = guild.channels.cache.find(
        (c) => c.name === ch.name && c.type === ch.type && !c.isThread()
      );
      if (channel && ch.position !== undefined) {
        try {
          await (channel as any).setPosition(ch.position);
        } catch {
          // Position setting can fail if hierarchy is wrong — non-critical
        }
      }
    }

    // ── Step 4: Set announcement channel permissions ──
    console.log('\n── Step 4: Setting Permissions ──');
    const announcements = guild.channels.cache.find(
      (c) => c.name === 'announcements' && c.type === ChannelType.GuildText
    );
    if (announcements && announcements.type === ChannelType.GuildText) {
      try {
        // @everyone can read but not send; admins can send
        await (announcements as any).permissionOverwrites.edit(
          guild.roles.everyone,
          { SendMessages: false, ViewChannel: true }
        );
        console.log('  🔒 #announcements: @everyone can read only.');
      } catch (e) {
        console.log('  ⚠️  Could not set #announcements permissions (may need higher role).');
      }
    }

    // ── Summary ──
    console.log('\n═══════════════════════════════════════');
    console.log('  ✅ Server redesign complete!');
    console.log('═══════════════════════════════════════');
    console.log(`
  📋 INFORMATION
     #welcome       — Rules & introductions
     #announcements — Admin-only announcements

  💬 CHAT
     #general       — Main conversation
     #media         — Images, clips, memes

  ⚙️ TECHNICAL
     #tech-talk     — Dev & debugging
     #resources     — Links & docs

  🎮 GAMING
     #gambling      — 🎰 Place your bets and try your luck
     #hunting       — 🏹 Hunt creatures and claim rewards
     #wishing       — 🌟 Make a wish for fortune
     #battle-room   — ⚔️ Challenge opponents and prove your strength

  🎤 VOICE
     🔊 General      — Casual voice
     🔊 AFK          — Idle/away
    `);

    console.log('💡 Tip: Old channels were preserved. Delete them manually in Discord if no longer needed.\n');

    client.destroy();
    process.exit(0);
  });

  client.on('error', (err) => {
    console.error('Discord client error:', err);
    process.exit(1);
  });

  await client.login(TOKEN);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
