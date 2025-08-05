# KsaekVat Discord Bot

## Overview

KsaekVat is a Discord bot built with Discord.js v14 that provides economy, gambling, animal collection, and social interaction features. The bot uses a JSON-based file system for data persistence and includes multiple command categories with various interaction mechanics.

## Setup Instructions

### Prerequisites
- Node.js v16 or higher
- A Discord bot account with appropriate permissions
- API keys for external services (optional but recommended)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```

3. For local development, create a `.env` file in the root directory based on the `.env.example` template:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file and add your:
   - Discord bot token
   - Client ID
   - Guild ID (for testing slash commands)
   - API keys for external services (Google/Tenor)

5. Update the `config/config.js` file with your preferred settings if needed

### Environment Variables

For security, the bot uses environment variables for sensitive information. You can set these in:
- A `.env` file for local development
- Your hosting platform's environment variable settings (e.g., Railway, Heroku, etc.)

The required environment variables are:
- `DISCORD_TOKEN` - Your Discord bot token
- `CLIENT_ID` - Your Discord bot client ID
- `GOOGLE_API_KEY` - Your Google API key (for Tenor GIFs)
- `GUILD_ID` - Your Discord guild ID (optional, for testing slash commands)
- `ADMIN_ID_1` through `ADMIN_ID_4` - Discord user IDs for bot administrators (optional)

### Running the Bot

To start the bot, run:
```
npm start
```

Or directly with Node.js:
```
node index.js
```

### Deploying Slash Commands

To register slash commands with Discord, run:
```
node deploy-commands.js
```

Note: Slash commands may take up to an hour to propagate globally. For immediate testing, use guild-specific commands by setting the `GUILD_ID` in your environment variables.

## Deployment to Railway

If you're deploying to Railway:

1. Push your code to your repository
2. Connect your repository to Railway
3. In the Railway dashboard, go to your project settings
4. Add environment variables in the "Variables" section:
   - `DISCORD_TOKEN` - Your Discord bot token
   - `CLIENT_ID` - Your Discord bot client ID
   - `GUILD_ID` - Your Discord guild ID (optional, for testing)
   - `GOOGLE_API_KEY` - Your Google API key (for Tenor GIFs)
   - Any other required variables from the `.env.example` file

Railway will automatically deploy your bot when you push changes to your repository.

### Running Slash Command Deployment on Railway

To deploy slash commands on Railway:

1. Open the Railway console for your project
2. Run the deployment script:
   ```
   node deploy-commands.js
   ```

## Features

- Economy system with currency, daily/weekly rewards, and work commands
- Gambling games (coinflip, slots, dice)
- Animal hunting and collection system
- Social interaction commands (kiss, hug, slap, etc.)
- Battle system with dueling and fighting
- Profile system with levels and experience
- Admin commands for bot management

## Configuration

The bot can be configured through:
1. Environment variables (recommended for sensitive data)
2. The `config/config.js` file for general settings

## Data Storage

The bot uses JSON files for data persistence:
- `data/users.json` - User data (balances, levels, animals, etc.)
- `data/animals.json` - Animal definitions
- `logs/` - Log files for debugging and monitoring

## Support

For issues or questions, please check the existing documentation or open an issue on the repository.
