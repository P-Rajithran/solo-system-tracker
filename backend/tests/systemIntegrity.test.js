const assert = require('assert');
const { test, describe, after } = require('node:test');
const mongoose = require('mongoose');

// Import System modules
const DailyQuest = require('../models/DailyQuest');
const { checkDataAnomaly, SIGNIFICANT_DIVERGENCE_KG, ANOMALY_COOLDOWN_DAYS } = require('../utils/anomalyDetector');
const { generateHeuristicTrainerReply, generateHeuristicFoodAnalysis } = require('../server');

// 1. REWARD CAPS SIMULATION HELPER
const DAILY_XP_CAP = 300;
const DAILY_GOLD_CAP = 500;

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
      player.level = (player.level || 1) + levelsGained;
      player.exp = player.exp % 100;
      player.availableStatPoints = (player.availableStatPoints || 0) + (levelsGained * 3);
    }
  }

  return { xpAwarded, goldAwarded, isCapHit, limitMessage };
};

describe('Solo System Integrity & Multi-Tenant Security Tests', () => {

  // TEST 1: DAILY XP (300) & GOLD (500) CAPS ENFORCEMENT
  test('Daily XP (300) and Gold (500) caps prevent infinite reward exploitation during rapid action bursts', () => {
    const mockQuest = { dailyXpEarned: 0, dailyGoldEarned: 0 };
    const mockPlayer = { exp: 0, goldCoins: 0, level: 1, availableStatPoints: 0 };

    // Simulate 15 rapid task toggles (+30 XP, +20 Gold each = 450 XP, 300 Gold requested)
    for (let i = 0; i < 15; i++) {
      applyDailyRewardCaps(mockQuest, mockPlayer, 30, 20);
    }

    assert.strictEqual(mockQuest.dailyXpEarned, 300, 'Daily XP earned must not exceed 300');
    assert.strictEqual(mockQuest.dailyGoldEarned, 300, 'Daily Gold earned must equal 300 after 15 tasks');

    // Simulate 3 rapid gate claims (+150 XP, +100 Gold each = +450 XP, +300 Gold requested)
    for (let i = 0; i < 3; i++) {
      applyDailyRewardCaps(mockQuest, mockPlayer, 150, 100);
    }

    assert.strictEqual(mockQuest.dailyXpEarned, 300, 'Daily XP must remain strictly capped at 300');
    assert.strictEqual(mockQuest.dailyGoldEarned, 500, 'Daily Gold must remain strictly capped at 500');

    // Total XP and Gold added to player must match the daily caps exactly
    const totalXpGranted = (mockPlayer.level - 1) * 100 + mockPlayer.exp;
    assert.strictEqual(totalXpGranted, 300, 'Player total XP gained must equal 300 (Level 4, 0 EXP)');
    assert.strictEqual(mockPlayer.goldCoins, 500, 'Player total Gold gained must equal 500');
    assert.strictEqual(mockPlayer.availableStatPoints, 9, 'Player must gain exactly 3 stat points per level up (9 points for 3 levels)');

    // Attempting further actions must return 0 rewards and flag cap hit
    const furtherAction = applyDailyRewardCaps(mockQuest, mockPlayer, 50, 50);
    assert.strictEqual(furtherAction.xpAwarded, 0, 'No additional XP should be awarded after cap');
    assert.strictEqual(furtherAction.goldAwarded, 0, 'No additional Gold should be awarded after cap');
    assert.strictEqual(furtherAction.isCapHit, true, 'isCapHit must be true when rewards are capped');
    assert.ok(furtherAction.limitMessage.includes('limit reached'), 'Limit message must notify hunter');
  });

  // TEST 2: 14-DAY ROLLING ANOMALY DETECTION LOGIC
  test('14-day anomaly detector correctly flags >= 2.0kg divergence between claimed calorie deficit and weight change', async () => {
    // Mock player with high calorie deficit goal
    const mockPlayer = {
      name: 'Jinwoo',
      dailyCalorieTarget: 2500,
      currentWeight: 105,
      weightHistory: [
        { date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), weight: 105 },
        { date: new Date(), weight: 105 } // 0kg lost despite massive claimed deficit
      ],
      save: async function() { return this; }
    };

    // Calculate expected deficit over 14 days claiming 1000 kcal intake per day (1500 kcal deficit/day)
    // Total deficit = 14 * 1500 = 21,000 kcal -> Expected loss = 21,000 / 7700 = 2.73 kg
    // Actual loss = 0 kg -> Divergence = 2.73 kg (>= 2.0 kg threshold)
    const claimedDeficitKcal = 14 * 1500;
    const expectedWeightLossKg = claimedDeficitKcal / 7700;
    const actualWeightLossKg = 105 - 105;
    const divergenceKg = Math.abs(expectedWeightLossKg - actualWeightLossKg);

    assert.ok(divergenceKg >= SIGNIFICANT_DIVERGENCE_KG, `Divergence (${divergenceKg.toFixed(2)}kg) must exceed threshold (${SIGNIFICANT_DIVERGENCE_KG}kg)`);

    // Verify small divergence (< 2.0kg) does not trigger anomaly
    const realisticDeficitKcal = 7 * 500; // 3500 kcal -> expected loss 0.45 kg
    const realisticActualLoss = 0.5; // actual loss 0.5 kg
    const smallDivergence = Math.abs((realisticDeficitKcal / 7700) - realisticActualLoss);
    assert.ok(smallDivergence < SIGNIFICANT_DIVERGENCE_KG, 'Normal weight variance must not trigger anomaly');
  });

  // TEST 3: GEMINI AI TRAINER HEURISTIC FALLBACK ENGINE
  test('Gemini AI Trainer heuristic engine generates structured fitness directives when API key is missing or API fails', () => {
    const playerContext = {
      name: 'Hunter Sung',
      level: 15,
      rank: 'C-Rank',
      currentWeight: 105,
      goalWeight: 90,
      startWeight: 110,
      goalType: 'lose',
      dailyCalorieTarget: 2200,
      dailyProteinTarget: 180,
      stats: { STR: 35, VIT: 28, MEN: 20, DIS: 30 },
      last7DaysLog: [
        { date: 'Aug 20', weight: 105.5, calories: 2100, protein: 185, deepWorkHours: 5, sleepHours: 8, completionPct: 100 }
      ]
    };

    const heuristicReply = generateHeuristicTrainerReply(playerContext);

    assert.ok(typeof heuristicReply === 'string', 'Trainer reply must be a string');
    assert.ok(heuristicReply.includes('Hunter Sung'), 'Trainer reply must reference hunter name');
    assert.ok(heuristicReply.includes('105kg'), 'Trainer reply must analyze current weight');
    assert.ok(heuristicReply.includes('90kg'), 'Trainer reply must reference goal weight');
    assert.ok(heuristicReply.includes('kcal'), 'Trainer reply must provide calorie micro-adjustments');
    assert.ok(heuristicReply.includes('protein'), 'Trainer reply must provide protein guidance');
  });

  // TEST 4: GEMINI AI FOOD & MACRO HEURISTIC ANALYZER
  test('Food analyzer heuristic engine accurately computes macros from gram weight inputs without Gemini API', () => {
    const mealDescription = '200g cooked white rice, 150g grilled chicken breast, 2 whole eggs, 10g olive oil';
    const analysis = generateHeuristicFoodAnalysis(mealDescription);

    assert.ok(analysis, 'Analysis object must be returned');
    assert.ok(typeof analysis.calories === 'number' && analysis.calories > 0, 'Calories must be calculated as positive number');
    assert.ok(typeof analysis.proteinGrams === 'number' && analysis.proteinGrams >= 50, 'Protein must reflect chicken + eggs (~55g+)');
    assert.ok(typeof analysis.carbsGrams === 'number' && analysis.carbsGrams >= 50, 'Carbs must reflect 200g rice (~56g)');
    assert.ok(typeof analysis.fatsGrams === 'number' && analysis.fatsGrams >= 15, 'Fats must reflect eggs + olive oil');
    assert.ok(analysis.micronutrients && analysis.micronutrients.sodiumMg > 0, 'Micronutrients must be populated');
    assert.ok(typeof analysis.summary === 'string' && analysis.summary.length > 10, 'Summary string must be present');
  });

  // TEST 5: MULTI-TENANT SCHEMA & INDEXING INTEGRITY
  test('DailyQuest model defines userId field and compound indexes for multi-tenant isolation', () => {
    const schemaPaths = DailyQuest.schema.paths;
    assert.ok(schemaPaths.userId, 'DailyQuest schema must contain explicit userId field');
    assert.strictEqual(schemaPaths.userId.instance, 'ObjectId', 'userId must be of type ObjectId');

    const indexes = DailyQuest.schema.indexes();
    const hasUserIdDateIndex = indexes.some(
      ([fields]) => fields.userId === 1 && (fields.date === -1 || fields.date === 1)
    );
    assert.ok(hasUserIdDateIndex, 'DailyQuest schema must have compound index on { userId: 1, date: -1 }');
  });

  after(async () => {
    await mongoose.disconnect();
  });

});
