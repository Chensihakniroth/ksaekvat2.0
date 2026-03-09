/**
 * ENVIRONMENT VALIDATION (Professional Zod Shield)
 * This file ensures all your secrets are present and correct before the bot even starts!
 * (｡♥‿♥｡) Industry Standard: Failing fast with clear errors.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Discord Configuration
  DISCORD_TOKEN: z.string().min(50, 'Sweetie, your DISCORD_TOKEN looks too short! (｡•́︿•̀｡)'),
  CLIENT_ID: z.string().default('1399459454889754805'),
  GUILD_ID: z.string().default('1240627007340150785'),

  // Database (Handling multiple possible names)
  MONGODB_URI: z.string().url('Sweetie, your MONGODB_URI must be a valid URL!').optional(),
  MONGODB_URL: z.string().url().optional(),
  MONGO_URI: z.string().url().optional(),
  MONGO_URL: z.string().url().optional(),

  // API Keys (Optional but must be strings if present)
  GHIPHY_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  SEA_LION_API_KEY: z.string().optional(),
  TENOR_API_KEY: z.string().optional(),

  // Other Settings
  PORT: z.string().default('8080'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Run validation
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ (｡•́︿•̀｡) OH NO, SWEETIE! YOUR .ENV IS BROKEN!');
  console.error('══════════════════════════════════════════════════');
  parsed.error.issues.forEach((err) => {
    console.error(`  • ${err.path.join('.')}: ${err.message}`);
  });
  console.error('══════════════════════════════════════════════════\n');
  process.exit(1);
}

// Export the validated, type-safe environment
export const env = parsed.data;

/**
 * Industry Standard Utility: Get the first available MongoDB URI.
 */
export const getMongoURI = (): string => {
  return (
    env.MONGODB_URI ||
    env.MONGODB_URL ||
    env.MONGO_URI ||
    env.MONGO_URL ||
    'mongodb://127.0.0.1:27017/ksae_bot'
  );
};
