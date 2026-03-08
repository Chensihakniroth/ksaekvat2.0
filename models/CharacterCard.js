const mongoose = require('mongoose');

const CharacterCardSchema = new mongoose.Schema({
    id: { type: String, default: 'default', unique: true },
    name: { type: String, required: true },
    style: { type: String, default: 'Modern Anime' },
    personality: { type: String, default: 'Mommy' },
    rules: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CharacterCard', CharacterCardSchema);
