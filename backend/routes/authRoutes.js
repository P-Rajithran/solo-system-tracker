const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Player = require('../models/Player');

const { JWT_SECRET } = require('../utils/authHelper');

// Helper to generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register - Register new Hunter User
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Hunter account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || 'Hunter'
    });

    await user.save();

    // Create linked Player profile explicitly marked as un-onboarded
    const player = new Player({
      name: user.name,
      userId: user._id,
      isSetupComplete: false,
      isOnboarded: false
    });
    await player.save();

    user.player = player._id;
    await user.save();

    const token = generateToken(user._id, user.email);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      player
    });
  } catch (err) {
    console.error('[AUTH REGISTER ERROR]:', err);
    res.status(500).json({ error: 'Failed to register hunter' });
  }
});

// POST /api/auth/login - Login existing Hunter
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid Hunter email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid Hunter email or password' });
    }

    let player = await Player.findOne({ userId: user._id });
    if (!player) {
      player = await Player.findOne({ email: user.email });
      if (!player) {
        player = new Player({
          name: user.name,
          userId: user._id,
          isSetupComplete: false,
          isOnboarded: false
        });
      } else {
        player.userId = user._id;
      }
      await player.save();
    }

    const token = generateToken(user._id, user.email);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      player
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]:', err);
    res.status(500).json({ error: 'Failed to authenticate hunter' });
  }
});

// POST /api/auth/google - Connect / Login with Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, avatarUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google email is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      user = new User({
        email: email.toLowerCase().trim(),
        name: name || 'Player',
        googleId: googleId || `google_${Date.now()}`,
        avatarUrl: avatarUrl || ''
      });
      await user.save();
    } else {
      if (googleId) user.googleId = googleId;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    }

    let player = await Player.findOne({ userId: user._id });
    if (!player) {
      player = new Player({ name: user.name, userId: user._id, isSetupComplete: false, isOnboarded: false });
      await player.save();
    }

    const token = generateToken(user._id, user.email);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      player
    });
  } catch (err) {
    console.error('[GOOGLE AUTH ERROR]:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// GET /api/auth/me - Verify session token & fetch profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    let player = await Player.findOne({ userId: user._id });
    if (!player) {
      player = await Player.findOne({ email: user.email });
      if (!player) {
        player = new Player({ name: user.name, userId: user._id, isSetupComplete: false, isOnboarded: false });
        await player.save();
      }
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      player
    });
  } catch (err) {
    console.error('[VERIFY TOKEN ERROR]:', err);
    res.status(401).json({ error: 'Invalid or expired authorization token' });
  }
});

module.exports = router;
