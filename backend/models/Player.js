const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, default: 'Hunter' }, // Generic default
  age: { type: Number, default: 22 },
  heightCm: { type: Number, default: 170 },
  startWeight: { type: Number, default: 70 },
  currentWeight: { type: Number, default: 70 },
  targetWeight: { type: Number, default: 65 },
  goalType: { type: String, enum: ['lose', 'gain', 'endurance'], default: 'lose' },
  primaryGoal: { type: String, enum: ['lose', 'gain', 'endurance'], default: 'lose' },
  activityLevel: { type: String, default: 'moderate' },
  dietaryPreference: { type: String, default: 'balanced' },
  dailyCalorieTarget: { type: Number, default: 2000 },
  dailyProteinTarget: { type: Number, default: 140 },
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  hp: { type: Number, default: 100 },
  availableStatPoints: { type: Number, default: 0 },
  stats: {
    STR: { type: Number, default: 10 },
    VIT: { type: Number, default: 10 },
    MEN: { type: Number, default: 10 },
    DIS: { type: Number, default: 10 }
  },
  avatarUrl: { type: String, default: '' },
  isSetupComplete: { type: Boolean, default: false },
  isOnboarded: { type: Boolean, default: false },
  goldCoins: { type: Number, default: 250 },
  dungeonClears: { type: Number, default: 0 },
  clearedGates: [{
    gateId: { type: String, required: true },
    clearedAt: { type: Date, default: Date.now }
  }],
  unlockedAchievements: [{ type: String }],
  actionHistory: [{
    actionType: { type: String, required: true },
    xpAwarded: { type: Number, default: 0 },
    goldAwarded: { type: Number, default: 0 },
    statChanged: { type: String, default: null },
    relatedTaskId: { type: String, default: null },
    timestamp: { type: Date, default: Date.now }
  }],
  weightHistory: [{
    date: { type: Date, default: Date.now },
    weight: { type: Number, required: true }
  }],
  inventory: [{
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: 'consumable' },
    purchasedAt: { type: Date, default: Date.now }
  }],
  dataAnomalyDetected: { type: Boolean, default: false },
  lastAnomalyDetectedAt: { type: Date, default: null },
  anomalyDetails: {
    divergenceKg: { type: Number, default: 0 },
    expectedLossKg: { type: Number, default: 0 },
    actualLossKg: { type: Number, default: 0 },
    message: { type: String, default: '' }
  },
  lastShadowTrainingAt: { type: Date, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);