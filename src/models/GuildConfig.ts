import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGuildConfig extends Document {
  guildId: string;
  guildName: string;
  prefix: string;
  welcomeEnabled: boolean;
  welcomeChannel: string | null;
  welcomeMessage: string | null;
  loggingEnabled: boolean;
  logChannel: string | null;
  modules: {
    rpg: boolean;
    economy: boolean;
    gacha: boolean;
    hunting: boolean;
    aiChat: boolean;
  };
  updatedBy: string | null;
  updatedAt: Date;
}

const GuildConfigSchema: Schema = new Schema({
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
GuildConfigSchema.pre('save', function (this: any, next: any) {
  this.updatedAt = new Date();
  next();
});

const GuildConfig: Model<IGuildConfig> = mongoose.model<IGuildConfig>('GuildConfig', GuildConfigSchema);
export default GuildConfig;
