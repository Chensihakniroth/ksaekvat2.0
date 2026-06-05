"use strict";
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'fuck',
    aliases: ['f'],
    description: 'NSFW: Have sex with another user (18+)',
    usage: 'fuck @user',
    async execute(message, args) {
        if (!message.channel.nsfw) {
            return message.reply('🚫 dak ban tah 18+ room teh ah pov.');
        }
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('👉 you got no hoe (you need to mention s1 idiot).');
        }
        try {
            const res = await axios.get('https://api.purrbot.site/v2/img/nsfw/fuck/gif');
            const imageUrl = res.data.link;
            const embed = new EmbedBuilder()
                .setTitle('🔞 NSFW Action: Fuck')
                .setDescription(`${message.author} ចុយ ${user} 🔥`)
                .setImage(imageUrl)
                .setColor('DarkRed');
            message.channel.send({ embeds: [embed] });
        }
        catch (err) {
            console.error(err);
            message.reply("❌ Couldn't get the GIF.");
        }
    },
};
