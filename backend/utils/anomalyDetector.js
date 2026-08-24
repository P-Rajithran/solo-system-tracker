const DailyQuest = require('../models/DailyQuest');

// CONFIGURABLE ANOMALY EVALUATION THRESHOLDS & CONSTANTS
const ANOMALY_EVALUATION_DAYS = 14;
const KCAL_PER_KG_WEIGHT = 7700;
const SIGNIFICANT_DIVERGENCE_KG = 2.0; // 2.0 kg divergence threshold
const ANOMALY_COOLDOWN_DAYS = 3; // 3 days cooldown before re-checking

/**
 * Checks for physical metric vs logged calorie deficit anomalies over a 14-day window.
 * @param {Object} player - The Mongoose player object
 * @returns {Promise<Object>} Object with anomaly status, details, and evaluation metadata
 */
const checkDataAnomaly = async (player) => {
  if (!player) return { anomalyDetected: false };

  // Check cooldown: Don't re-check if an anomaly was detected within the cooldown period
  if (player.lastAnomalyDetectedAt) {
    const timeSinceLastCheck = Date.now() - new Date(player.lastAnomalyDetectedAt).getTime();
    const cooldownMs = ANOMALY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    if (timeSinceLastCheck < cooldownMs) {
      return {
        anomalyDetected: player.dataAnomalyDetected || false,
        inCooldown: true,
        cooldownRemainingMs: cooldownMs - timeSinceLastCheck
      };
    }
  }

  // 1. Fetch the last 14 days of quest/nutrition records
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - ANOMALY_EVALUATION_DAYS + 1);
  startDate.setHours(0, 0, 0, 0);

  const questLogs = await DailyQuest.find({
    date: { $gte: startDate }
  }).sort({ date: 1 });

  // If insufficient data logged (less than 3 days of nutrition entries), skip evaluation
  const validNutritionLogs = questLogs.filter((q) => q.nutrition && q.nutrition.caloriesConsumed > 0);
  if (validNutritionLogs.length < 3) {
    return { anomalyDetected: false, reason: 'Insufficient nutrition data for 14-day audit' };
  }

  // 2. Sum claimed calorie deficit over the period
  const dailyTarget = player.dailyCalorieTarget || 2000;
  let totalClaimedDeficitKcal = 0;

  validNutritionLogs.forEach((q) => {
    const consumed = q.nutrition.caloriesConsumed;
    if (consumed > 0) {
      totalClaimedDeficitKcal += (dailyTarget - consumed);
    }
  });

  const expectedWeightLossKg = totalClaimedDeficitKcal / KCAL_PER_KG_WEIGHT;

  // 3. Calculate actual weight change over the 14-day window
  const weightHistory = player.weightHistory || [];
  let actualWeightLossKg = 0;

  if (weightHistory.length >= 2) {
    const recentWeights = weightHistory
      .filter((w) => new Date(w.date) >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (recentWeights.length >= 2) {
      const initialWeight = recentWeights[0].weight;
      const latestWeight = recentWeights[recentWeights.length - 1].weight;
      actualWeightLossKg = initialWeight - latestWeight; // Positive if weight lost
    } else if (weightHistory.length >= 2) {
      const initialWeight = weightHistory[0].weight;
      const latestWeight = player.currentWeight || weightHistory[weightHistory.length - 1].weight;
      actualWeightLossKg = initialWeight - latestWeight;
    }
  }

  // 4. Calculate divergence between expected loss and actual weight change
  const divergenceKg = Math.abs(expectedWeightLossKg - actualWeightLossKg);
  const isAnomaly = divergenceKg >= SIGNIFICANT_DIVERGENCE_KG;

  if (isAnomaly) {
    player.dataAnomalyDetected = true;
    player.lastAnomalyDetectedAt = new Date();
    player.anomalyDetails = {
      divergenceKg: Number(divergenceKg.toFixed(2)),
      expectedLossKg: Number(expectedWeightLossKg.toFixed(2)),
      actualLossKg: Number(actualWeightLossKg.toFixed(2)),
      message: '[SYSTEM]: Anomaly detected between logged metrics and measured outcome. Recommend reviewing recent entries for accuracy.'
    };
    await player.save();
  }

  return {
    anomalyDetected: isAnomaly,
    divergenceKg: Number(divergenceKg.toFixed(2)),
    expectedLossKg: Number(expectedWeightLossKg.toFixed(2)),
    actualLossKg: Number(actualWeightLossKg.toFixed(2)),
    message: isAnomaly ? player.anomalyDetails.message : null
  };
};

module.exports = {
  ANOMALY_EVALUATION_DAYS,
  KCAL_PER_KG_WEIGHT,
  SIGNIFICANT_DIVERGENCE_KG,
  ANOMALY_COOLDOWN_DAYS,
  checkDataAnomaly
};
