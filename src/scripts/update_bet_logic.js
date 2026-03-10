const fs = require('fs');
const path = require('path');

const commands = [
    { file: 'commands/gambling/coinflip.js', game: 'coinflip' },
    { file: 'commands/gambling/slots.js', game: 'slots' },
    { file: 'commands/gambling/rps.js', game: 'rps' },
    { file: 'commands/gambling/blackjack.js', game: 'blackjack' }
];

commands.forEach(cmd => {
    const fullPath = path.join(__dirname, '../', cmd.file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Make sure EconomyService is imported
    if (!content.includes('EconomyService')) {
        content = content.replace(
            /const config = require\('\.\.\/\.\.\/config\/config\.js'\);/g,
            `const config = require('../../config/config.js');\nconst EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService.js');`
        );
    }

    // Replace the manual bet parsing block
    let betPattern = '';
    if (cmd.game === 'coinflip') {
        betPattern = /let betAmount;\s*let isAllBet = false;([\s\S]*?)if \(!\(await database\.hasBalance/g;
    } else if (cmd.game === 'slots') {
        betPattern = /const \{ minBet, maxBet \} = config\.gambling\.slots;([\s\S]*?)if \(!\(await database\.hasBalance/g;
    } else if (cmd.game === 'rps') {
        betPattern = /let betAmount;([\s\S]*?)if \(!\(await database\.hasBalance/g;
    } else if (cmd.game === 'blackjack') {
        betPattern = /let betAmount;([\s\S]*?)if \(!\(await database\.hasBalance/g;
    }

    const replacement = `const userData = await database.getUser(message.author.id, message.author.username);
    const { minBet, maxBet } = config.gambling.${cmd.game};
    const betAmount = EconomyService.parseBet(args[0], userData.balance, minBet, maxBet);

    let isAllBet = args[0]?.toLowerCase() === 'all';

    if (betAmount <= 0) {
      if (args[0]?.toLowerCase() === 'all' && userData.balance <= 0) {
        return message.reply({ embeds: [{ color: colors.error, title: '💸 No funds found!', description: \`You don't have any money to play right now, sweetie. (◕‿◕✿)\`}] });
      }
      return message.reply({ embeds: [{ color: colors.error, title: '❌ Invalid amount', description: 'Please use a proper number, sweetie. (｡•́︿•̀｡)'}] });
    }

    if (betAmount < minBet) {
      return message.reply({ embeds: [{ color: colors.warning, title: '💸 Bet too low', description: \`You need at least **\${minBet.toLocaleString()}** \${config.economy.currency} to play. (｡♥‿♥｡)\`}] });
    }

    if (!(await database.hasBalance`;

    content = content.replace(betPattern, replacement);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${cmd.file}`);
});
