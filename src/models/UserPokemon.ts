import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * USER POKEMON INTERFACE
 * Each trained Pokémon gets its own document with individual Level & XP.
 * Separate from the Zoo count system — training consumes 1 from your Zoo! (✧ω✧)
 */
export interface IUserPokemon extends Document {
  ownerId: string;
  speciesKey: string;
  nickname?: string;
  level: number;
  exp: number;
  caughtAt: Date;
}

const UserPokemonSchema: Schema = new Schema({
  ownerId: { type: String, required: true, index: true },
  speciesKey: { type: String, required: true },
  nickname: { type: String, default: null },
  level: { type: Number, default: 1, min: 1, max: 100 },
  exp: { type: Number, default: 0 },
  caughtAt: { type: Date, default: Date.now },
});

// Fast lookup: all trained Pokémon for a user
UserPokemonSchema.index({ ownerId: 1, speciesKey: 1 });

const UserPokemon: Model<IUserPokemon> = mongoose.model<IUserPokemon>(
  'UserPokemon',
  UserPokemonSchema
);
export default UserPokemon;
