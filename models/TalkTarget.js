const mongoose = require('mongoose');

const TalkTargetSchema = new mongoose.Schema({
    adminId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    serverId: { type: String, default: 'DM' },
    setAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TalkTarget', TalkTargetSchema);
