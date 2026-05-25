"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const GuildConfigSchema = new mongoose_1.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    guildName: { type: String, required: true },
    prefix: { type: String, default: 'k' },
    welcomeEnabled: { type: Boolean, default: false },
    welcomeChannel: { type: String, default: null },
    welcomeMessage: { type: String, default: 'Welcome {user} to the server!' },
    loggingEnabled: { type: Boolean, default: false },
    logChannel: { type: String, default: null },
    modules: {
        rpg: { type: Boolean, default: true },
        economy: { type: Boolean, default: true },
        gacha: { type: Boolean, default: true },
        hunting: { type: Boolean, default: true },
        aiChat: { type: Boolean, default: true },
    },
    updatedBy: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
});
// Update the updatedAt timestamp on save
GuildConfigSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
const GuildConfig = mongoose_1.default.model('GuildConfig', GuildConfigSchema);
exports.default = GuildConfig;
