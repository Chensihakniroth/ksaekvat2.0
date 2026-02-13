const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'kbd',
    aliases: ['bsd', 'beksloydance', 'kbsd'],
    description: 'Sends a random beksloy dance GIF from a curated list',
    usage: 'kbd',
    category: 'meme',
    
    async execute(message, args) {
        const gifLinks = [
            'https://media.giphy.com/media/G1buvsEj2bbW4PyVWw/giphy.gif',
            'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2txbmFvdjkxZDB6Mmljb2V0YXp1Mm5remN5amptdzU4ZHpuYWFkYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PdXLYmXTRY5UYSDXkt/giphy.gif',
            'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmcwMmxtcGUxaXVkbmYyeWpkZm1xcGg5bzl5NXc2bGVjcmd6Z2FxciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SZ8xKTzDCPyintuW65/giphy.gif',
            'https://media.giphy.com/media/dYpdPgg5jamEdYj8Cd/giphy.gif',
            'https://media.giphy.com/media/aeBxVaAD6Us7SZZJxX/giphy.gif',
            'https://media.giphy.com/media/fBzIRcxPWS4chHVUhx/giphy.gif',
            'https://media.giphy.com/media/agWKYHXSq5HzaTNVbZ/giphy.gif',
            'https://media.giphy.com/media/3OUIG1MrsMw2N9tlNU/giphy.gif',
            'https://media.giphy.com/media/UQyt1lpILxQYoheUA3/giphy.gif',
            'https://media.giphy.com/media/P0pEeYEri43VdV6ScQ/giphy.gif',
            'https://media.giphy.com/media/qXcQSZJ6Ljm3dAcE4r/giphy.gif',
            'https://media.giphy.com/media/Ap5ztbZZvCK9BawPX4/giphy.gif',
            'https://media.giphy.com/media/bEgKvOtbIvbRXZ4VOf/giphy.gif',
            'https://media.giphy.com/media/ZyaTZLqOE7X3SPLIQa/giphy.gif'
        ];

        try {
            const randomGif = gifLinks[Math.floor(Math.random() * gifLinks.length)];

            const embed = new EmbedBuilder()
                .setImage(randomGif);

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error in beksloy dance GIF command:', error);
        }
    }
};



