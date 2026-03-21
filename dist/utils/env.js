"use strict";
/**
 * ENVIRONMENT VALIDATION (Professional Zod Shield)
 * This file ensures all your secrets are present and correct before the bot even starts!
 * (｡♥‿♥｡) Industry Standard: Failing fast with clear errors.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoURI = exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    // Discord Configuration
    DISCORD_TOKEN: zod_1.z.string().min(1, 'Discord token is required'),
    CLIENT_ID: zod_1.z.string().default('1399459454889754805'),
    GUILD_ID: zod_1.z.string().default('1240627007340150785'),
    DISCORD_CLIENT_SECRET: zod_1.z.string().optional(),
    DISCORD_REDIRECT_URI: zod_1.z.string().default('https://ksaekvat.up.railway.app/api/auth/discord/callback'),
    JWT_SECRET: zod_1.z.string().default('ksaekvat-super-secret-jwt-key-change-me-in-prod-pls'),
    // Database (Handling multiple possible names)
    MONGODB_URI: zod_1.z.string().url('Sweetie, your MONGODB_URI must be a valid URL!').optional(),
    MONGODB_URL: zod_1.z.string().url().optional(),
    MONGO_URI: zod_1.z.string().url().optional(),
    MONGO_URL: zod_1.z.string().url().optional(),
    // API Keys (Optional but must be strings if present)
    GHIPHY_API_KEY: zod_1.z.string().optional(),
    GOOGLE_API_KEY: zod_1.z.string().optional(),
    SEA_LION_API_KEY: zod_1.z.string().optional(),
    TENOR_API_KEY: zod_1.z.string().optional(),
    // Other Settings
    PORT: zod_1.z.string().default('8080'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
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
exports.env = parsed.data;
/**
 * Industry Standard Utility: Get the first available MongoDB URI.
 */
const getMongoURI = () => {
    return (exports.env.MONGODB_URI ||
        exports.env.MONGODB_URL ||
        exports.env.MONGO_URI ||
        exports.env.MONGO_URL ||
        'mongodb://127.0.0.1:27017/kohi_bot');
};
exports.getMongoURI = getMongoURI;
