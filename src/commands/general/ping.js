const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');

module.exports = {
  name: 'ping',
  aliases: ['latency'],
  description: 'Shows bot latency and response time',
  usage: 'ping',
  execute(message, args, client) {
    const sent = Date.now();

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('🏓 Pong!')
      .setDescription('Calculating ping...');

    message
      .reply({ embeds: [embed] })
      .then((sentMessage) => {
        const timeDiff = Date.now() - sent;
        const apiLatency = Math.round(client.ws.ping);

        // Determine color based on latency
        let latencyColor = colors.success; // Green for good ping
        if (apiLatency > 200) latencyColor = colors.warning; // Yellow for medium ping
        if (apiLatency > 500) latencyColor = colors.error; // Red for bad ping

        const updatedEmbed = new EmbedBuilder()
          .setColor(latencyColor)
          .setTitle('🏓 Pong!')
          .addFields(
            {
              name: '📡 API Latency',
              value: `${apiLatency}ms`,
              inline: true,
            },
            {
              name: '💬 Message Latency',
              value: `${timeDiff}ms`,
              inline: true,
            },
            {
              name: '📊 Status',
              value: apiLatency < 200 ? '🟢 Excellent' : apiLatency < 500 ? '🟡 Good' : '🔴 Poor',
              inline: true,
            }
          );

        sentMessage.edit({ embeds: [updatedEmbed] });
      })
      .catch((error) => {
        console.error('Error updating ping message:', error);
      });
  },
};
