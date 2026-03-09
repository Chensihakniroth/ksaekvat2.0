const mongoose = require('mongoose');

const ListenerSchema = new mongoose.Schema({
  adminId: { type: String, required: true, unique: true },
  targetUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Listener', ListenerSchema);
