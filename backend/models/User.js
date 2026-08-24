const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  name: { type: String, default: 'Hunter' },
  googleId: { type: String },
  avatarUrl: { type: String, default: '' },
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
