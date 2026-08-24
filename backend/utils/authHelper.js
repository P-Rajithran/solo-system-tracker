const jwt = require('jsonwebtoken');
const Player = require('../models/Player');

const JWT_SECRET = process.env.JWT_SECRET || 'solo_system_monarch_secret_key_2026';

const getUserIdFromReq = (req) => {
  if (!req || !req.headers) return null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.userId) {
        return decoded.userId;
      }
    } catch {
      return null;
    }
  }
  return null;
};

const getScopedPlayer = async (req) => {
  const userId = getUserIdFromReq(req);
  if (userId) {
    let player = await Player.findOne({ userId });
    if (player) return player;
  }
  let player = await Player.findOne();
  if (!player) {
    player = new Player({ name: 'Hunter' });
    await player.save();
  }
  return player;
};

module.exports = {
  JWT_SECRET,
  getUserIdFromReq,
  getScopedPlayer
};
