/**
 * Delete TECHNICAL Category
 * ==========================
 * Deletes the "⚙️ TECHNICAL" category and all its child channels.
 *
 * Usage:
 *   npx ts-node --skip-project scripts/delete_technical.ts
 */

import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TARGET_GUILD_ID = process.env.TARGET_GUILD_ID || process.argv[2];
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN not found in .env');
  process.exit(1);
}

if (!TARGET_GUILD_ID) {
  console.error('❌ TARGET_GUILD_ID not found. Set it in .env or pass as argument.');
  process.exit(1);
}

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

    // Check permissions
    const botMember = guild.members.cache.get(client.user!.id);
    if (botMember) {
      const perms = botMember.permissions;
      if (!perms.has(PermissionFlagsBits.ManageChannels)) {
        console.error('❌ Bot lacks MANAGE_CHANNELS permission!');
        client.destroy();
        process.exit(1);
      }
      console.log('✅ Bot permissions verified.\n');
    }

    // Find the TECHNICAL category
    const technicalCat = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === '⚙️ TECHNICAL'
    );

    if (!technicalCat) {
      console.log('ℹ️  No "⚙️ TECHNICAL" category found — nothing to delete.');
      client.destroy();
      process.exit(0);
    }

    // Find all child channels in this category
    const childChannels = guild.channels.cache.filter(
      (c) => c.parentId === technicalCat.id && !c.isThread()
    );

    console.log(`── Deleting TECHNICAL Category ──`);
    console.log(`  📁 Category: ${technicalCat.name}`);
    console.log(`  📝 Child channels: ${childChannels.size}\n`);

    // Delete child channels first
    for (const [, channel] of childChannels) {
      try {
        await channel.delete();
        console.log(`  🗑️  Deleted channel: #${channel.name}`);
      } catch (e: any) {
        console.error(`  ❌ Failed to delete #${channel.name}: ${e.message}`);
      }
    }

    // Delete the category itself
    try {
      await technicalCat.delete();
      console.log(`\n  🗑️  Deleted category: ${technicalCat.name}`);
    } catch (e: any) {
      console.error(`\n  ❌ Failed to delete category: ${e.message}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  ✅ TECHNICAL section deleted!');
    console.log('═══════════════════════════════════════\n');

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
