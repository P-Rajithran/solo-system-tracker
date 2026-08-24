const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const DailyQuest = require('../models/DailyQuest');
const { checkAndUnlockAchievements } = require('../utils/achievementMechanics');
const { getScopedPlayer, getUserIdFromReq } = require('../utils/authHelper');
const { checkDataAnomaly } = require('../utils/anomalyDetector');

// Helper to get today's midnight range
const getTodayRange = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

// Profile Update Core Business Logic Handler Function
const handleProfileUpdate = async (req, res) => {
  try {
    const {
      name,
      age,
      heightCm,
      currentWeight,
      startWeight,
      targetWeight,
      goalType,
      primaryGoal,
      activityLevel,
      dietaryPreference
    } = req.body;

    let player = await getScopedPlayer(req);
    const userId = getUserIdFromReq(req);
    if (userId && !player.userId) {
      player.userId = userId;
    }

    const weightNum = (currentWeight !== undefined && currentWeight !== null && !isNaN(Number(currentWeight)) && Number(currentWeight) > 0)
      ? Number(currentWeight)
      : (player.currentWeight || 70);

    const targetNum = (targetWeight !== undefined && targetWeight !== null && !isNaN(Number(targetWeight)) && Number(targetWeight) > 0)
      ? Number(targetWeight)
      : (player.targetWeight || 65);

    const heightNum = Number(heightCm) || player.heightCm || 170;
    const ageNum = Number(age) || player.age || 22;

    let startWeightNum = player.startWeight;
    if (startWeight !== undefined && startWeight !== null && !isNaN(Number(startWeight)) && Number(startWeight) > 0) {
      startWeightNum = Number(startWeight);
    } else if (!startWeightNum || startWeightNum === 0) {
      startWeightNum = weightNum;
    }

    const goal = primaryGoal || goalType || player.goalType || 'lose';
    const act = activityLevel || player.activityLevel || 'moderate';
    const diet = dietaryPreference || player.dietaryPreference || 'High-Protein Balanced';

    // Revised Mifflin-St Jeor BMR calculation formula
    const bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very: 1.725,
      extreme: 1.9
    };
    const multiplier = activityMultipliers[act] || 1.55;
    const tdee = Math.round(bmr * multiplier);

    let calculatedCalories = tdee;
    if (goal === 'lose') {
      calculatedCalories = Math.max(1200, tdee - 500);
    } else if (goal === 'gain') {
      calculatedCalories = tdee + 350;
    } else if (goal === 'endurance') {
      calculatedCalories = tdee;
    }

    let proteinMultiplier = 2.0;
    const lowerDiet = String(diet).toLowerCase();
    if (lowerDiet.includes('high-protein') || lowerDiet === 'high-protein' || goal === 'gain') {
      proteinMultiplier = 2.2;
    } else if (lowerDiet.includes('keto')) {
      proteinMultiplier = 2.2;
    } else if (lowerDiet.includes('vegan') || lowerDiet.includes('vegetarian')) {
      proteinMultiplier = 1.8;
    }
    const calculatedProtein = Math.round(weightNum * proteinMultiplier);

    if (name) player.name = name;
    player.age = ageNum;
    player.heightCm = heightNum;
    player.startWeight = startWeightNum;
    player.currentWeight = weightNum;
    player.targetWeight = targetNum;
    player.goalType = goal;
    player.primaryGoal = goal;
    player.activityLevel = act;
    player.dietaryPreference = diet;
    player.dailyCalorieTarget = calculatedCalories;
    player.dailyProteinTarget = calculatedProtein;
    player.isSetupComplete = true;
    player.isOnboarded = true;

    // Push new timestamped entry to weightHistory
    player.weightHistory = player.weightHistory || [];
    player.weightHistory.push({ date: new Date(), weight: weightNum });

    const newlyUnlocked = checkAndUnlockAchievements(player);
    await checkDataAnomaly(player);
    await player.save();
    return res.json({ player, newlyUnlocked });
  } catch (err) {
    console.error('[PROFILE UPDATE ERROR]:', err);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
};

// PUT & POST routes for Profile Setup & Updates
router.post('/setup', handleProfileUpdate);
router.put('/profile', handleProfileUpdate);
router.post('/profile', handleProfileUpdate);

// POST /api/player/weight - Push timestamped entry to weightHistory and update currentWeight
router.post('/weight', async (req, res) => {
  const { weight } = req.body;
  const weightNum = Number(weight);

  if (!weightNum || isNaN(weightNum)) {
    return res.status(400).json({ error: 'Invalid weight value' });
  }

  try {
    let player = await getScopedPlayer(req);

    player.currentWeight = weightNum;
    if (!player.startWeight || player.startWeight === 0) {
      player.startWeight = weightNum;
    }

    player.weightHistory = player.weightHistory || [];
    player.weightHistory.push({ date: new Date(), weight: weightNum });

    const newlyUnlocked = checkAndUnlockAchievements(player);
    const anomalyResult = await checkDataAnomaly(player);
    await player.save();
    res.json({ player, newlyUnlocked, anomalyResult });
  } catch (err) {
    console.error('[LOG WEIGHT ERROR]:', err);
    res.status(500).json({ error: 'Failed to update weight history' });
  }
});

// POST /api/player/dismiss-anomaly - Clear dataAnomalyDetected flag & set cooldown timestamp
router.post('/dismiss-anomaly', async (req, res) => {
  try {
    let player = await getScopedPlayer(req);
    if (player) {
      player.dataAnomalyDetected = false;
      player.lastAnomalyDetectedAt = new Date();
      await player.save();
    }
    res.json({ player, message: 'Anomaly advisory dismissed.' });
  } catch (err) {
    console.error('[DISMISS ANOMALY ERROR]:', err);
    res.status(500).json({ error: 'Failed to dismiss anomaly message' });
  }
});

const calculateStreak = async () => {
  try {
    const quests = await DailyQuest.find({}).sort({ date: -1 });
    let streak = 0;
    for (const q of quests) {
      if (q.isCompleted) streak++;
      else break;
    }
    return Math.max(1, streak);
  } catch {
    return 1;
  }
};

// GET /api/player/status - Fetch or initialize player stats & evaluate achievements
router.get('/status', async (req, res) => {
  try {
    let player = await getScopedPlayer(req);
    const streakCount = await calculateStreak();
    const newlyUnlocked = checkAndUnlockAchievements(player, streakCount);
    await checkDataAnomaly(player);
    if (newlyUnlocked.length > 0 || player.isModified()) {
      await player.save();
    }
    res.json({ ...player.toObject(), streakCount, newlyUnlocked });
  } catch (err) {
    console.error('[GET PLAYER STATUS ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/player/allocate-stat - Spend an available stat point
router.post('/allocate-stat', async (req, res) => {
  const { statName, statKey } = req.body;
  const targetStat = statName || statKey;

  try {
    let player = await getScopedPlayer(req);

    const map = {
      str: 'STR',
      vit: 'VIT',
      agi: 'DIS',
      int: 'MEN',
      men: 'MEN',
      dis: 'DIS',
      sense: 'DIS',
      STR: 'STR',
      VIT: 'VIT',
      MEN: 'MEN',
      DIS: 'DIS'
    };

    const keyToUpdate = map[targetStat] || map[String(targetStat).toLowerCase()] || null;

    if (player.availableStatPoints > 0 && keyToUpdate) {
      player.stats = player.stats || { STR: 10, VIT: 10, MEN: 10, DIS: 10 };
      player.stats[keyToUpdate] = (player.stats[keyToUpdate] || 10) + 1;
      player.availableStatPoints -= 1;

      // Log action for undo capability
      player.actionHistory = player.actionHistory || [];
      player.actionHistory.push({
        actionType: 'allocate_stat',
        xpAwarded: 0,
        goldAwarded: 0,
        statChanged: keyToUpdate,
        relatedTaskId: 'stat_alloc',
        timestamp: new Date()
      });

      await player.save();
      return res.json(player);
    }

    if (player.availableStatPoints <= 0) {
      return res.status(400).json({ error: 'No available stat points remaining.', player });
    }

    return res.status(400).json({ error: 'Invalid stat name provided.', player });
  } catch (err) {
    console.error('[ALLOCATE STAT ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/player/reset - Reset progress back to Level 1
router.post('/reset', async (req, res) => {
  try {
    let player = await getScopedPlayer(req);
    if (player) {
      player.level = 1;
      player.exp = 0;
      player.hp = 100;
      player.availableStatPoints = 0;
      player.stats = { STR: 10, VIT: 10, MEN: 10, DIS: 10 };
      player.actionHistory = [];
      player.unlockedAchievements = [];
      await player.save();
    }

    const { startOfDay, endOfDay } = getTodayRange();
    let quest = await DailyQuest.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });
    if (quest) {
      quest.tasks = { workoutCompleted: false, meditationCompleted: false, macrosTracked: false };
      quest.customTasks = [];
      quest.isCompleted = false;
      quest.isPenaltyActive = false;
      await quest.save();
    }

    res.json({ player, quest });
  } catch (err) {
    console.error('[RESET PLAYER ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/player/history - Fetch timestamped player stats, weight, and history over date range
router.get('/history', async (req, res) => {
  try {
    const range = req.query.range || req.query.filter || 'week';
    let query = {};

    if (range === 'month' || range === 'monthly' || req.query.days === '30') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      query.date = { $gte: startDate };
    } else if (range === 'all' || range === 'all-time') {
      query = {};
    } else {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      query.date = { $gte: startDate };
    }

    const player = await getScopedPlayer(req);
    const historyLogs = await DailyQuest.find(query).sort({ date: 1 });

    res.json({
      player,
      range,
      historyLogs
    });
  } catch (err) {
    console.error('[PLAYER HISTORY ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// SHOP ITEMS DEFINITION CATALOG
const SYSTEM_SHOP_CATALOG = [
  {
    itemId: 'cheat_meal_pass',
    name: 'Cheat Meal Pass',
    price: 1000,
    category: 'pass',
    icon: '🍔',
    description: 'Allows users to log a fast-food meal without breaking daily streak penalties.'
  },
  {
    itemId: 'rest_day_pass',
    name: 'Rest Day Pass',
    price: 500,
    category: 'pass',
    icon: '🛌',
    description: 'Waives daily workout objectives for 24h while preserving system health.'
  },
  {
    itemId: 'shadow_monarch_aura',
    name: 'Iron Sovereign Aura Theme',
    price: 2500,
    category: 'theme',
    icon: '⚡',
    description: 'Unlocks legendary violet shadow energy particle aura across the System UI.'
  }
];

// GET /api/player/shop/items - Fetch catalog of system shop items
router.get('/shop/items', (req, res) => {
  res.json(SYSTEM_SHOP_CATALOG);
});

// POST /api/player/shop/buy - Deduct gold and add item to inventory
router.post('/shop/buy', async (req, res) => {
  const { itemId } = req.body;

  try {
    const item = SYSTEM_SHOP_CATALOG.find((i) => i.itemId === itemId);
    if (!item) {
      return res.status(404).json({ error: 'System item not found in catalog.' });
    }

    let player = await getScopedPlayer(req);

    if ((player.goldCoins || 0) < item.price) {
      return res.status(400).json({ error: `Insufficient Gold Coins. Needed: ${item.price} Gold, Available: ${player.goldCoins || 0} Gold.` });
    }

    // Deduct Gold Coins
    player.goldCoins = (player.goldCoins || 0) - item.price;

    // Add to Inventory
    player.inventory = player.inventory || [];
    player.inventory.push({
      itemId: item.itemId,
      name: item.name,
      category: item.category,
      purchasedAt: new Date()
    });

    await player.save();
    res.json({ player, purchasedItem: item, message: `Successfully acquired ${item.name}!` });
  } catch (err) {
    console.error('[SHOP PURCHASE ERROR]:', err);
    res.status(500).json({ error: 'System purchase transaction failed' });
  }
});

module.exports = router;