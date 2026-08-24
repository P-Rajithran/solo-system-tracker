const express = require('express');
const router = express.Router();
const DailyQuest = require('../models/DailyQuest');
const { checkAndUnlockAchievements } = require('../utils/achievementMechanics');
const { getScopedPlayer, getUserIdFromReq } = require('../utils/authHelper');

// CONFIGURABLE DAILY REWARD CAPS (TUNABLE DEFAULTS)
const DAILY_XP_CAP = 300;
const DAILY_GOLD_CAP = 500;

// Helper to apply daily reward caps
const applyDailyRewardCaps = (quest, player, targetXp = 0, targetGold = 0) => {
  const currentDailyXp = quest.dailyXpEarned || 0;
  const currentDailyGold = quest.dailyGoldEarned || 0;

  const remainingXpCap = Math.max(0, DAILY_XP_CAP - currentDailyXp);
  const remainingGoldCap = Math.max(0, DAILY_GOLD_CAP - currentDailyGold);

  const xpAwarded = Math.min(targetXp, remainingXpCap);
  const goldAwarded = Math.min(targetGold, remainingGoldCap);

  const isCapHit = (targetXp > 0 && xpAwarded < targetXp) || (targetGold > 0 && goldAwarded < targetGold);
  const limitMessage = isCapHit ? "[SYSTEM]: Daily clearance limit reached. Rewards diminished." : null;

  quest.dailyXpEarned = currentDailyXp + xpAwarded;
  quest.dailyGoldEarned = currentDailyGold + goldAwarded;

  if (player) {
    player.exp = (player.exp || 0) + xpAwarded;
    player.goldCoins = (player.goldCoins || 0) + goldAwarded;

    if (player.exp >= 100) {
      const levelsGained = Math.floor(player.exp / 100);
      player.level += levelsGained;
      player.exp = player.exp % 100;
      player.availableStatPoints = (player.availableStatPoints || 0) + (levelsGained * 3);
    }
  }

  return { xpAwarded, goldAwarded, isCapHit, limitMessage };
};

// Helper to get today's midnight range
const getTodayRange = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

// Helper to push entry to Player actionHistory
const pushActionLog = (player, logEntry) => {
  player.actionHistory = player.actionHistory || [];
  player.actionHistory.push({
    actionType: logEntry.actionType,
    xpAwarded: logEntry.xpAwarded || 0,
    goldAwarded: logEntry.goldAwarded || 0,
    statChanged: logEntry.statChanged || null,
    relatedTaskId: String(logEntry.relatedTaskId || ''),
    timestamp: new Date()
  });
  if (player.actionHistory.length > 25) {
    player.actionHistory = player.actionHistory.slice(-25);
  }
};

// Central helper to retrieve or initialize today's scoped DailyQuest
const getTodayQuestForReq = async (req) => {
  const { startOfDay, endOfDay } = getTodayRange();
  const player = await getScopedPlayer(req);
  const userId = getUserIdFromReq(req) || player?.userId;
  const playerWeight = player?.currentWeight || player?.startWeight || 0;

  let query = { date: { $gte: startOfDay, $lte: endOfDay } };
  if (userId) query.userId = userId;

  let quest = await DailyQuest.findOne(query);

  if (!quest) {
    // Find previous quest for this user to copy over recurring DAILY routines only
    let prevQuery = userId ? { userId } : {};
    const previousQuest = await DailyQuest.findOne(prevQuery).sort({ date: -1 });

    const carriedOverRoutines = (previousQuest?.customTasks || [])
      .filter((task) => task.type === 'daily' && !task.label?.startsWith('[MICRO-QUEST]') && !task.label?.startsWith('GATE CLEAR:'))
      .map((task) => ({
        id: Date.now() + Math.random(),
        label: task.label,
        xp: task.xp || 20,
        type: 'daily',
        completed: false
      }));

    quest = await DailyQuest.create({
      ...(userId ? { userId } : {}),
      date: new Date(),
      tasks: { workoutCompleted: false, meditationCompleted: false, macrosTracked: false },
      customTasks: carriedOverRoutines,
      nutrition: {
        currentWeight: playerWeight > 0 ? playerWeight : (previousQuest?.nutrition?.currentWeight || 0),
        caloriesConsumed: 0,
        proteinGrams: 0
      },
      isCompleted: false,
      dailyXpEarned: 0,
      dailyGoldEarned: 0
    });
  } else {
    if (userId && !quest.userId) {
      quest.userId = userId;
      await quest.save();
    }
    if ((!quest.nutrition?.currentWeight || quest.nutrition?.currentWeight === 70 || quest.nutrition?.currentWeight === 0) && playerWeight > 0) {
      quest.nutrition = quest.nutrition || {};
      quest.nutrition.currentWeight = playerWeight;
      await quest.save();
    }
  }

  return { quest, player, userId, playerWeight };
};

// GET TODAY'S QUEST (Auto-creates new day & carries over DAILY ROUTINES only)
router.get('/today', async (req, res) => {
  try {
    const { quest } = await getTodayQuestForReq(req);
    const questObj = quest.toObject();
    questObj.DAILY_XP_CAP = DAILY_XP_CAP;
    questObj.DAILY_GOLD_CAP = DAILY_GOLD_CAP;

    res.json(questObj);
  } catch (err) {
    console.error('[GET TODAY ERROR]:', err);
    res.status(500).json({ error: 'Failed to fetch daily quest' });
  }
});

// ADD CUSTOM TASK WITH TYPE ('today' vs 'daily')
router.post('/custom-task', async (req, res) => {
  try {
    const { label, xp, type, isGateClear } = req.body;
    const { quest } = await getTodayQuestForReq(req);

    const newTask = {
      id: Date.now(),
      label,
      xp: Number(xp) || 20,
      type: isGateClear ? 'today' : (type || 'daily'),
      completed: isGateClear ? true : false
    };

    quest.customTasks.push(newTask);
    if (isGateClear) {
      quest.dungeonClearsCount = (quest.dungeonClearsCount || 0) + 1;
    }
    await quest.save();

    res.json({ quest });
  } catch (err) {
    console.error('[ADD CUSTOM TASK ERROR]:', err);
    res.status(500).json({ error: 'Failed to add custom task' });
  }
});

// GET /api/quests/history
router.get('/history', async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const range = req.query.range || req.query.filter || req.query.timeframe;
    let query = {};
    if (userId) query.userId = userId;

    let limit = 0;

    if (range === 'week' || range === 'weekly' || req.query.days === '7') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      query.date = { $gte: startDate };
    } else if (range === 'month' || range === 'monthly' || req.query.days === '30') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      query.date = { $gte: startDate };
    } else if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
    } else if (range === 'all' || range === 'all-time') {
      // all for this user
    } else {
      const daysCount = parseInt(req.query.days || req.query.limit || 14, 10);
      limit = daysCount;
    }

    let historyQuery = DailyQuest.find(query).sort({ date: -1 });
    if (limit > 0) {
      historyQuery = historyQuery.limit(limit);
    }

    const history = await historyQuery;
    res.json(history.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper for analytics calculation with range support (week, month, all-time)
const fetchAnalyticsData = async (req, rangeParam) => {
  let daysCount = 7;
  let isAllTime = false;

  const player = await getScopedPlayer(req);
  const userId = getUserIdFromReq(req) || player?.userId;
  const playerWeight = player?.currentWeight || player?.startWeight || 0;

  if (rangeParam === 'monthly' || rangeParam === 'month' || parseInt(rangeParam, 10) === 30) {
    daysCount = 30;
  } else if (rangeParam === 'all' || rangeParam === 'all-time') {
    isAllTime = true;
    let earliestQuery = userId ? { userId } : {};
    const earliest = await DailyQuest.findOne(earliestQuery).sort({ date: 1 });
    if (earliest && earliest.date) {
      const diffMs = new Date().getTime() - new Date(earliest.date).getTime();
      daysCount = Math.max(7, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      daysCount = 30;
    }
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysCount + 1);
  startDate.setHours(0, 0, 0, 0);

  let histQuery = { date: { $gte: startDate } };
  if (userId) histQuery.userId = userId;

  const history = await DailyQuest.find(histQuery).sort({ date: 1 });

  const dailyData = [];
  const now = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const endD = new Date(d);
    endD.setHours(23, 59, 59, 999);

    const found = history.find(
      (q) => new Date(q.date) >= d && new Date(q.date) <= endD
    );

    const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (found) {
      const completedTasksCount =
        (found.tasks?.workoutCompleted ? 1 : 0) +
        (found.tasks?.meditationCompleted ? 1 : 0) +
        (found.tasks?.macrosTracked ? 1 : 0) +
        (found.customTasks || []).filter((ct) => ct.completed).length;

      const totalTasksCount = 3 + (found.customTasks || []).length;
      const completionPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

      let foundW = found.nutrition?.currentWeight;
      if (!foundW || foundW === 70 || foundW === 0) {
        foundW = playerWeight > 0 ? playerWeight : 0;
      }

      dailyData.push({
        date: dayLabel,
        fullDate: d.toISOString().split('T')[0],
        weight: foundW,
        calories: found.nutrition?.caloriesConsumed || 0,
        protein: found.nutrition?.proteinGrams || 0,
        completedTasks: completedTasksCount,
        totalTasks: totalTasksCount,
        completionPct,
        isCompleted: found.isCompleted || false,
        workoutCompleted: Boolean(found.tasks?.workoutCompleted),
        meditationCompleted: Boolean(found.tasks?.meditationCompleted),
        macrosTracked: Boolean(found.tasks?.macrosTracked),
        deepWorkHours: found.lifeMetrics?.deepWorkHours || 0,
        sleepHours: found.lifeMetrics?.sleepHours || 0,
        dungeonClears: found.dungeonClearsCount || 0
      });
    } else {
      dailyData.push({
        date: dayLabel,
        fullDate: d.toISOString().split('T')[0],
        weight: playerWeight > 0 ? playerWeight : 0,
        calories: 0,
        protein: 0,
        completedTasks: 0,
        totalTasks: 3,
        completionPct: 0,
        isCompleted: false,
        workoutCompleted: false,
        meditationCompleted: false,
        macrosTracked: false,
        deepWorkHours: 0,
        sleepHours: 0,
        dungeonClears: 0
      });
    }
  }

  const loggedWeights = dailyData.map((d) => d.weight).filter((w) => w > 0);
  const avgWeight = loggedWeights.length > 0
    ? Number((loggedWeights.reduce((a, b) => a + b, 0) / loggedWeights.length).toFixed(1))
    : (playerWeight || 0);

  const startWeight = loggedWeights[0] || player?.startWeight || playerWeight || 0;
  const latestWeight = loggedWeights[loggedWeights.length - 1] || playerWeight || 0;
  const weightChange = (latestWeight && startWeight) ? Number((latestWeight - startWeight).toFixed(1)) : 0;

  const totalQuestsCompleted = dailyData.filter((d) => d.isCompleted).length;
  const avgCompletionRate = Math.round(
    dailyData.reduce((acc, curr) => acc + curr.completionPct, 0) / (dailyData.length || 1)
  );

  const loggedCalories = dailyData.map((d) => d.calories).filter((c) => c > 0);
  const avgCalories = loggedCalories.length > 0
    ? Math.round(loggedCalories.reduce((a, b) => a + b, 0) / loggedCalories.length)
    : 0;

  const loggedProtein = dailyData.map((d) => d.protein).filter((p) => p > 0);
  const avgProtein = loggedProtein.length > 0
    ? Math.round(loggedProtein.reduce((a, b) => a + b, 0) / loggedProtein.length)
    : 0;

  const totalDeepWork = dailyData.reduce((acc, curr) => acc + curr.deepWorkHours, 0);
  const avgSleep = Number((dailyData.reduce((acc, curr) => acc + curr.sleepHours, 0) / (dailyData.length || 1)).toFixed(1));
  const totalDungeonClears = dailyData.reduce((acc, curr) => acc + curr.dungeonClears, 0);

  return {
    range: isAllTime ? 'all-time' : (daysCount === 30 ? 'monthly' : 'weekly'),
    daysCount,
    summary: {
      avgWeight,
      weightChange,
      totalQuestsCompleted,
      avgCompletionRate,
      avgCalories,
      avgProtein,
      totalDeepWork,
      avgSleep,
      totalDungeonClears
    },
    timeline: dailyData
  };
};

// GET /api/quests/analytics
router.get(['/analytics', '/progress'], async (req, res) => {
  try {
    const data = await fetchAnalyticsData(req, req.query.range || req.query.days);
    res.json(data);
  } catch (err) {
    console.error('[ANALYTICS ERROR]:', err);
    res.status(500).json({ error: 'Failed to fetch progress analytics' });
  }
});

// GET convenience routes for weekly and monthly analytics
router.get('/progress/weekly', async (req, res) => {
  try {
    const data = await fetchAnalyticsData(req, '7');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/progress/monthly', async (req, res) => {
  try {
    const data = await fetchAnalyticsData(req, '30');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/quests/toggle - Toggle task completion & check achievements
router.put('/toggle', async (req, res) => {
  const { taskName } = req.body;

  try {
    const { quest, player } = await getTodayQuestForReq(req);
    const wasCompletedBefore = quest.isCompleted;
    let isTaskNowCompleted = false;
    let xpGainedForTask = 15;

    // Standard task toggle
    if (quest.tasks && quest.tasks[taskName] !== undefined) {
      quest.tasks[taskName] = !quest.tasks[taskName];
      isTaskNowCompleted = quest.tasks[taskName];
      xpGainedForTask = taskName === 'workoutCompleted' ? 30 : (taskName === 'meditationCompleted' ? 20 : 15);
    } else if (quest.customTasks) {
      const customTask = quest.customTasks.find((t) => String(t.id) === String(taskName));
      if (customTask) {
        customTask.completed = !customTask.completed;
        isTaskNowCompleted = customTask.completed;
        xpGainedForTask = customTask.xp || 20;
      }
    }

    const defaultDone = Object.values(quest.tasks || {}).every((status) => status === true);
    const customDone = (quest.customTasks || []).every((ct) => ct.completed === true);
    const allDone = defaultDone && customDone;

    quest.isCompleted = allDone;
    if (allDone) quest.isPenaltyActive = false;

    await quest.save();

    let xpAwarded = 0;
    let goldAwarded = 0;
    let limitMessage = null;

    if (isTaskNowCompleted) {
      const targetXp = xpGainedForTask + (allDone && !wasCompletedBefore ? 30 : 0);
      const targetGold = 20;

      const capsResult = applyDailyRewardCaps(quest, player, targetXp, targetGold);
      xpAwarded = capsResult.xpAwarded;
      goldAwarded = capsResult.goldAwarded;
      limitMessage = capsResult.limitMessage;

      if (allDone && !wasCompletedBefore) {
        player.hp = Math.min(100, player.hp + 20);
      }

      pushActionLog(player, {
        actionType: 'task_toggle',
        xpAwarded,
        goldAwarded,
        relatedTaskId: taskName
      });
    }

    const newlyUnlocked = checkAndUnlockAchievements(player);
    await player.save();
    await quest.save();

    const questObj = quest.toObject();
    questObj.DAILY_XP_CAP = DAILY_XP_CAP;
    questObj.DAILY_GOLD_CAP = DAILY_GOLD_CAP;

    res.json({ quest: questObj, player, newlyUnlocked, limitMessage, xpAwarded, goldAwarded, DAILY_XP_CAP, DAILY_GOLD_CAP });
  } catch (err) {
    console.error('[TOGGLE TASK ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/quests/nutrition - Log current weight & nutrition and check achievements
router.put('/nutrition', async (req, res) => {
  const { currentWeight, caloriesConsumed, proteinGrams } = req.body;

  try {
    const { quest, player } = await getTodayQuestForReq(req);

    if (currentWeight !== undefined && currentWeight !== '') quest.nutrition.currentWeight = Number(currentWeight);
    if (caloriesConsumed !== undefined && caloriesConsumed !== '') quest.nutrition.caloriesConsumed = Number(caloriesConsumed);
    if (proteinGrams !== undefined && proteinGrams !== '') quest.nutrition.proteinGrams = Number(proteinGrams);

    await quest.save();

    if (currentWeight !== undefined && currentWeight !== '') {
      player.currentWeight = Number(currentWeight);
      if (!player.startWeight || player.startWeight === 0) {
        player.startWeight = Number(currentWeight);
      }
    }

    // Award +50 Gold Coins for logging physical metrics (subject to daily gold cap)
    const targetGold = 50;
    const { goldAwarded, limitMessage } = applyDailyRewardCaps(quest, player, 0, targetGold);

    pushActionLog(player, {
      actionType: 'nutrition_log',
      xpAwarded: 0,
      goldAwarded,
      relatedTaskId: 'nutrition'
    });

    const newlyUnlocked = checkAndUnlockAchievements(player);
    await player.save();
    await quest.save();

    const questObj = quest.toObject();
    questObj.DAILY_XP_CAP = DAILY_XP_CAP;
    questObj.DAILY_GOLD_CAP = DAILY_GOLD_CAP;

    res.json({ quest: questObj, player, newlyUnlocked, limitMessage, goldAwarded, DAILY_XP_CAP, DAILY_GOLD_CAP });
  } catch (err) {
    console.error('[NUTRITION LOG ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quests/trigger-penalty
router.post('/trigger-penalty', async (req, res) => {
  try {
    const { quest, player } = await getTodayQuestForReq(req);

    if (player) {
      player.hp = Math.max(0, player.hp - 25);
      await player.save();
    }

    if (quest) {
      quest.isPenaltyActive = true;
      await quest.save();
    }

    res.json({ quest, player });
  } catch (err) {
    console.error('[TRIGGER PENALTY ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quests/clear-penalty
router.post('/clear-penalty', async (req, res) => {
  try {
    const { quest, player } = await getTodayQuestForReq(req);

    if (player) {
      player.hp = 100;
      await player.save();
    }

    if (quest) {
      quest.isPenaltyActive = false;
      await quest.save();
    }

    res.json({ quest, player });
  } catch (err) {
    console.error('[CLEAR PENALTY ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/quests/export - Download database as CSV for authenticated user
router.get('/export', async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const query = userId ? { userId } : {};
    const history = await DailyQuest.find(query).sort({ date: -1 });
    let csv = 'Date,Weight (kg),Calories,Protein (g),Workout Completed,Meditation Completed,Macros Tracked,Penalty Status,Deep Work (hrs),Sleep (hrs)\n';
    
    history.forEach((q) => {
      const dateStr = new Date(q.date).toLocaleDateString();
      csv += `${dateStr},${q.nutrition?.currentWeight || 100},${q.nutrition?.caloriesConsumed || 0},${q.nutrition?.proteinGrams || 0},${q.tasks?.workoutCompleted || false},${q.tasks?.meditationCompleted || false},${q.tasks?.macrosTracked || false},${q.isPenaltyActive || false},${q.lifeMetrics?.deepWorkHours || 0},${q.lifeMetrics?.sleepHours || 0}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('hunter_system_log.csv');
    return res.send(csv);
  } catch (err) {
    console.error('[EXPORT CSV ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/quests/life-metrics
router.put('/life-metrics', async (req, res) => {
  try {
    const { deepWorkHours, sleepHours, focusRating } = req.body;
    const { quest, player } = await getTodayQuestForReq(req);

    quest.lifeMetrics = {
      deepWorkHours: parseFloat(deepWorkHours) || 0,
      sleepHours: parseFloat(sleepHours) || 0,
      focusRating: parseInt(focusRating, 10) || 5
    };

    await quest.save();

    let newlyUnlocked = [];
    let limitMessage = null;

    if (player) {
      const isHighEffort = (parseFloat(deepWorkHours) >= 7 || parseFloat(sleepHours) >= 7);
      const targetCoins = isHighEffort ? 100 : 50;

      const capsResult = applyDailyRewardCaps(quest, player, 0, targetCoins);
      const goldAwarded = capsResult.goldAwarded;
      limitMessage = capsResult.limitMessage;

      pushActionLog(player, {
        actionType: 'life_metrics',
        xpAwarded: 0,
        goldAwarded,
        relatedTaskId: 'life_metrics'
      });

      newlyUnlocked = checkAndUnlockAchievements(player);
      await player.save();
    }

    const questObj = quest.toObject();
    questObj.DAILY_XP_CAP = DAILY_XP_CAP;
    questObj.DAILY_GOLD_CAP = DAILY_GOLD_CAP;

    res.json({ quest: questObj, player, newlyUnlocked, limitMessage, DAILY_XP_CAP, DAILY_GOLD_CAP });
  } catch (err) {
    console.error('[LIFE METRICS ERROR]:', err);
    res.status(500).json({ error: 'Failed to update life metrics' });
  }
});

// POST /api/quests/claim-gate - Claim gate clearance loot & check achievements
router.post('/claim-gate', async (req, res) => {
  try {
    const { gateId, rewardGold, rewardXp } = req.body;
    if (!gateId) {
      return res.status(400).json({ error: 'gateId is required to claim rewards' });
    }

    const targetGold = Number(rewardGold) || 100;
    const targetXp = Number(rewardXp) || 150;

    const { quest, player } = await getTodayQuestForReq(req);

    player.clearedGates = player.clearedGates || [];
    
    const isAlreadyClaimed = player.clearedGates.some(
      (g) => (typeof g === 'object' ? g.gateId === gateId : g === gateId) || g.gateId === gateId
    );

    if (isAlreadyClaimed) {
      return res.status(400).json({
        error: `[ NOTICE ]: Rewards for "${gateId}" have already been claimed!`,
        message: `[ NOTICE ]: Rewards for "${gateId}" have already been claimed!`,
        player
      });
    }

    const capsResult = applyDailyRewardCaps(quest, player, targetXp, targetGold);
    const xpAwarded = capsResult.xpAwarded;
    const goldAwarded = capsResult.goldAwarded;
    const limitMessage = capsResult.limitMessage;

    player.clearedGates.push({
      gateId: String(gateId),
      clearedAt: new Date()
    });
    player.dungeonClears = (player.dungeonClears || 0) + 1;

    pushActionLog(player, {
      actionType: 'gate_claim',
      xpAwarded,
      goldAwarded,
      relatedTaskId: gateId
    });

    const newlyUnlocked = checkAndUnlockAchievements(player);
    await player.save();

    if (quest) {
      quest.customTasks = quest.customTasks || [];
      quest.customTasks.push({
        id: `gate_${Date.now()}`,
        label: `Gate Cleared: ${gateId}`,
        xp: xpAwarded,
        completed: true
      });
      await quest.save();
    }

    const questObj = quest ? quest.toObject() : {};
    questObj.DAILY_XP_CAP = DAILY_XP_CAP;
    questObj.DAILY_GOLD_CAP = DAILY_GOLD_CAP;

    res.json({
      player,
      quest: questObj,
      newlyUnlocked,
      limitMessage,
      xpAwarded,
      goldAwarded,
      DAILY_XP_CAP,
      DAILY_GOLD_CAP,
      message: limitMessage || `[ GATE CLEARED ]: 🪙 +${goldAwarded} GOLD COINS & +${xpAwarded} XP added to your System Wallet!`
    });
  } catch (err) {
    console.error('[CLAIM GATE ERROR]:', err);
    res.status(500).json({ error: 'Failed to claim gate rewards' });
  }
});

// POST /api/quests/undo-last - Reverse the most recent logged action
router.post('/undo-last', async (req, res) => {
  try {
    const { quest, player } = await getTodayQuestForReq(req);
    if (!player) return res.status(404).json({ error: 'Player profile not found.' });

    player.actionHistory = player.actionHistory || [];
    if (player.actionHistory.length === 0) {
      return res.status(400).json({ error: 'No recent logged actions available to undo.' });
    }

    const lastAction = player.actionHistory.pop();
    const { actionType, xpAwarded, goldAwarded, statChanged, relatedTaskId } = lastAction;

    // 1. Revert Gold Coins
    if (goldAwarded > 0) {
      player.goldCoins = Math.max(0, (player.goldCoins || 0) - goldAwarded);
    }

    // 2. Revert XP & Recalculate Level
    if (xpAwarded > 0) {
      let totalXp = (player.level - 1) * 100 + player.exp - xpAwarded;
      if (totalXp < 0) totalXp = 0;
      player.level = Math.max(1, Math.floor(totalXp / 100) + 1);
      player.exp = totalXp % 100;
    }

    // 3. Revert Stat Allocation
    if (statChanged && player.stats && player.stats[statChanged] !== undefined) {
      player.stats[statChanged] = Math.max(10, player.stats[statChanged] - 1);
      player.availableStatPoints = (player.availableStatPoints || 0) + 1;
    }

    // 4. Revert Gate Clearance
    if (actionType === 'gate_claim' && relatedTaskId) {
      player.clearedGates = (player.clearedGates || []).filter(
        (g) => (typeof g === 'object' ? (g.gateId !== relatedTaskId && g.gateId !== `Gate Cleared: ${relatedTaskId}`) : g !== relatedTaskId)
      );
      player.dungeonClears = Math.max(0, (player.dungeonClears || 0) - 1);
    }

    await player.save();

    // 5. Revert DailyQuest Task/Custom Task completion
    if (quest) {
      if (xpAwarded > 0) quest.dailyXpEarned = Math.max(0, (quest.dailyXpEarned || 0) - xpAwarded);
      if (goldAwarded > 0) quest.dailyGoldEarned = Math.max(0, (quest.dailyGoldEarned || 0) - goldAwarded);

      if (actionType === 'task_toggle' && relatedTaskId) {
        if (quest.tasks && quest.tasks[relatedTaskId] !== undefined) {
          quest.tasks[relatedTaskId] = false;
        } else if (quest.customTasks) {
          const ct = quest.customTasks.find((t) => String(t.id) === String(relatedTaskId) || t.label === relatedTaskId);
          if (ct) ct.completed = false;
        }
        quest.isCompleted = false;
        await quest.save();
      } else if (actionType === 'gate_claim' && relatedTaskId) {
        quest.customTasks = (quest.customTasks || []).filter((ct) => !ct.label?.includes(relatedTaskId));
        await quest.save();
      }
    }

    return res.json({
      player,
      quest,
      undoneAction: lastAction,
      message: `[ ACTION UNDONE ]: Successfully reverted ${actionType} (-${xpAwarded} XP, -${goldAwarded} Gold)!`
    });
  } catch (err) {
    console.error('[UNDO LAST ACTION ERROR]:', err);
    res.status(500).json({ error: 'Failed to undo last action' });
  }
});

// POST /api/quests/shadow-training - Micro-quest completion & separate small reward pool
router.post('/shadow-training', async (req, res) => {
  try {
    const { taskLabel, notes } = req.body;
    const { quest, player } = await getTodayQuestForReq(req);
    if (!player) return res.status(404).json({ error: 'Player profile not found.' });

    // 15-minute soft cooldown
    const COOLDOWN_MS = 15 * 60 * 1000;
    if (player.lastShadowTrainingAt) {
      const elapsed = Date.now() - new Date(player.lastShadowTrainingAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return res.status(400).json({
          error: `[ COOLDOWN ACTIVE ]: Shadow Training Grounds can be entered again in ${remainingMinutes} minute(s).`,
          cooldownRemainingMs: remainingMs
        });
      }
    }

    // Award flat small micro-quest rewards subject to daily caps (+10 XP, +5 Gold)
    const targetXp = 10;
    const targetGold = 5;
    const { xpAwarded, goldAwarded, limitMessage } = applyDailyRewardCaps(quest, player, targetXp, targetGold);

    player.lastShadowTrainingAt = new Date();

    pushActionLog(player, {
      actionType: 'micro_quest',
      xpAwarded,
      goldAwarded,
      relatedTaskId: taskLabel || 'Shadow Training Micro-Quest'
    });

    const newlyUnlocked = checkAndUnlockAchievements(player);
    await player.save();

    // Log entry to today's DailyQuest customTasks
    if (quest) {
      quest.customTasks = quest.customTasks || [];
      quest.customTasks.push({
        id: `micro_${Date.now()}`,
        label: `[MICRO-QUEST]: ${taskLabel || 'Shadow Micro-Training'}${notes ? ` - "${notes}"` : ''}`,
        xp: xpAwarded,
        completed: true
      });
      await quest.save();
    }

    res.json({
      player,
      quest: quest ? quest.toObject() : null,
      newlyUnlocked,
      xpAwarded,
      goldAwarded,
      limitMessage,
      message: limitMessage || `[ TRAINING GROUNDS CLEARED ]: +${xpAwarded} XP & +${goldAwarded} Gold Coins earned!`
    });
  } catch (err) {
    console.error('[SHADOW TRAINING ERROR]:', err);
    res.status(500).json({ error: 'Failed to record shadow training micro-quest' });
  }
});

module.exports = router;
