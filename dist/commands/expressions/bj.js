"use strict";
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'blowjob',
    aliases: ['bjob'],
    description: 'NSFW: Give a blowjob to another user (18+) additions: bjob',
    usage: 'blowjob @user',
    async execute(message, args) {
        if (!message.channel.nsfw) {
            return message.reply('🚫 This command can only be used in NSFW-marked channels.');
        }
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('👉 Mention someone to give a blowjob.');
        }
        try {
            const res = await axios.get('https://api.purrbot.site/v2/img/nsfw/blowjob/gif');
            const imageUrl = res.data.link;
            const embed = new EmbedBuilder()
                .setTitle('🔞 NSFW Action: Blowjob')
                .setDescription(`${message.author} is giving ${user} a blowjob 😳`)
                .setImage(imageUrl)
                .setColor('Purple');
            message.channel.send({ embeds: [embed] });
        }
        catch (err) {
            console.error(err);
            message.reply("❌ Couldn't get the GIF.");
        }
    },
};
