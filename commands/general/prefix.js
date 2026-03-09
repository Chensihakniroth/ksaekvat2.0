const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

const FORBIDDEN_PREFIXES = ['@', '#', '/', '\\', '`'];
const MAX_PREFIX_LEN = 5;

module.exports = {
    name: 'prefix',
    aliases: ['setprefix', 'myprefix', 'changeprefix'],
    description: "Change your personal command prefix! Only affects you, sweetie~ (｡♥‿♥｡)",
    usage: 'prefix',
    async execute(message, args, client) {
        const userId = message.author.id;
        const userData = await database.getUser(userId, message.author.username);

        const currentMain = userData.customPrefix || config.prefix[1]; // default 'K'
        const currentSub = userData.customSubPrefix || '(uses global shortcuts)';

        // ── Step 1: Ask WHICH prefix to change ──────────────────────────────────
        const stepEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`(◕‿◕✿) Your Personal Prefix Settings`)
            .setDescription([
                `Mommy can set a custom prefix just for you! Here are your current settings, sweetie~`,
                ``,
                `**Main Prefix:** \`${currentMain}\``,
                `**Sub prefix:** \`${currentSub}\``,
                ``,
                `Which one would you like to change? (｡♥‿♥｡)`,
            ].join('\n'))
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: 'This only affects YOU, darling! Other users keep their own prefixes. (っ˘ω˘ς)' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('prefix_change_main')
                .setLabel('🔧 Change Main Prefix')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('prefix_change_sub')
                .setLabel('⚡ Change Sub Prefix')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('prefix_reset')
                .setLabel('♻️ Reset to Default')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('prefix_cancel')
                .setLabel('✖ Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        const prompt = await message.reply({ embeds: [stepEmbed], components: [row] });

        const collector = prompt.createMessageComponentCollector({
            filter: (i) => i.user.id === userId,
            time: 60000,
            max: 1,
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prefix_cancel') {
                await interaction.update({
                    embeds: [stepEmbed.setDescription('✖ Cancelled! Your prefix was not changed. (っ˘ω˘ς)')],
                    components: [],
                });
                return;
            }

            if (interaction.customId === 'prefix_reset') {
                userData.customPrefix = null;
                userData.customSubPrefix = null;
                await database.saveUser(userData);
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(colors.success)
                            .setTitle('♻️ Prefix Reset!')
                            .setDescription(`Your prefix has been reset to the default \`${config.prefix[1]}\`, darling! Everything is back to normal~ ヽ(>∀<☆)ノ`)
                    ],
                    components: [],
                });
                return;
            }

            // ── Step 2: Ask user to type their new prefix ──────────────────────────
            const isMain = interaction.customId === 'prefix_change_main';
            const typeLabel = isMain ? 'Main Prefix' : 'Sub Prefix';
            const currentVal = isMain ? currentMain : currentSub;

            const askEmbed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`✏️ Set Your ${typeLabel}`)
                .setDescription([
                    `Current **${typeLabel}**: \`${currentVal}\``,
                    ``,
                    `Please type your new **${typeLabel}** in chat now!`,
                    isMain
                        ? `> ⚠️ Max **${MAX_PREFIX_LEN}** characters. Cannot use: ${FORBIDDEN_PREFIXES.map(p => `\`${p}\``).join(' ')}`
                        : `> ⚠️ Max **${MAX_PREFIX_LEN}** characters. This replaces your personal shortcut prefix character.`,
                    ``,
                    `*Type \`cancel\` to abort.*`,
                ].join('\n'))
                .setFooter({ text: 'You have 30 seconds to type your new prefix, sweetie~ (｡♥‿♥｡)' });

            await interaction.update({ embeds: [askEmbed], components: [] });

            // Collect the user's text input
            const msgFilter = (m) => m.author.id === userId;
            let collected;
            try {
                collected = await message.channel.awaitMessages({ filter: msgFilter, max: 1, time: 30000, errors: ['time'] });
            } catch {
                await prompt.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(colors.error)
                            .setTitle('⏰ Timed out!')
                            .setDescription(`Oh no, darling! You took too long. Mommy had to cancel. (｡•́︿•̀｡)`)
                    ],
                    components: [],
                });
                return;
            }

            const input = collected.first()?.content?.trim();
            // Try to delete user's message for cleanliness
            collected.first()?.delete().catch(() => { });

            if (!input || input.toLowerCase() === 'cancel') {
                await prompt.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(colors.secondary)
                            .setTitle('✖ Cancelled')
                            .setDescription(`No changes were made, sweetie~ (っ˘ω˘ς)`)
                    ],
                    components: [],
                });
                return;
            }

            // ── Validate ──
            if (input.length > MAX_PREFIX_LEN) {
                await prompt.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(colors.error)
                            .setTitle('❌ Too long, darling!')
                            .setDescription(`Your prefix must be **${MAX_PREFIX_LEN} characters or fewer**. Please try again with \`${config.prefix[1]}prefix\`! (｡•́︿•̀｡)`)
                    ],
                    components: [],
                });
                return;
            }

            if (FORBIDDEN_PREFIXES.some(fp => input.includes(fp))) {
                await prompt.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(colors.error)
                            .setTitle('❌ Forbidden character!')
                            .setDescription(`That prefix contains a forbidden character: ${FORBIDDEN_PREFIXES.map(p => `\`${p}\``).join(' ')}\nPlease try again! (｡•́︿•̀｡)`)
                    ],
                    components: [],
                });
                return;
            }

            // ── Step 3: Confirm ──────────────────────────────────────────────────
            const confirmEmbed = new EmbedBuilder()
                .setColor(colors.warning)
                .setTitle(`✅ Confirm Your New ${typeLabel}`)
                .setDescription([
                    `**Old:** \`${currentVal}\``,
                    `**New:** \`${input}\``,
                    ``,
                    `Are you sure you want to set your **${typeLabel}** to \`${input}\`, sweetie? (｡♥‿♥｡)`,
                    isMain ? `> You will use \`${input}help\`, \`${input}balance\`, etc.` : `> Your shortcut prefix will use \`${input}\`.`,
                ].join('\n'));

            const confirmRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prefix_confirm_yes')
                    .setLabel('✅ Yes, change it!')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('prefix_confirm_no')
                    .setLabel('✖ No, cancel')
                    .setStyle(ButtonStyle.Danger)
            );

            await prompt.edit({ embeds: [confirmEmbed], components: [confirmRow] });

            const confirmCollector = prompt.createMessageComponentCollector({
                filter: (i) => i.user.id === userId,
                time: 30000,
                max: 1,
            });

            confirmCollector.on('collect', async (ci) => {
                if (ci.customId === 'prefix_confirm_no') {
                    await ci.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(colors.secondary)
                                .setTitle('✖ Cancelled')
                                .setDescription(`No problem, darling! Your prefix was not changed. (っ˘ω˘ς)`)
                        ],
                        components: [],
                    });
                    return;
                }

                // Save to DB
                if (isMain) {
                    userData.customPrefix = input;
                } else {
                    userData.customSubPrefix = input;
                }
                await database.saveUser(userData);

                await ci.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(colors.success)
                            .setTitle('🎉 Prefix Changed!')
                            .setDescription([
                                `Your **${typeLabel}** has been updated successfully! ヽ(>∀<☆)ノ`,
                                ``,
                                isMain
                                    ? `✨ From now on, use \`${input}help\`, \`${input}balance\`, \`${input}gacha\`, etc.!`
                                    : `✨ Your sub prefix is now \`${input}\`!`,
                                ``,
                                `*(Only you see commands with this prefix, darling~ Each person has their own! ｡♥‿♥｡)*`,
                            ].join('\n'))
                            .setFooter({ text: 'Use Kprefix anytime to see or change your prefix again! (◕‿◕✿)' })
                    ],
                    components: [],
                });
            });

            confirmCollector.on('end', (collected) => {
                if (collected.size === 0) {
                    prompt.edit({ components: [] }).catch(() => { });
                }
            });
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                prompt.edit({ components: [] }).catch(() => { });
            }
        });
    },
};
