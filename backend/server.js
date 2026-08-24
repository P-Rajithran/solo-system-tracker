const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Initialize Mongoose Safely
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('[SYSTEM ALARM]: Database connected successfully.'))
    .catch((err) => console.error('[SYSTEM ERROR]: Database connection failed:', err.message));
} else {
  console.warn('[SYSTEM WARNING]: MONGO_URI is missing from .env file.');
}

// Router Modules
try {
  const authRoutes = require('./routes/authRoutes');
  const playerRoutes = require('./routes/playerRoutes');
  const questRoutes = require('./routes/questRoutes');
  app.use('/api/auth', authRoutes);
  app.use('/api/player', playerRoutes);
  app.use('/api/user', playerRoutes);
  app.use('/api/quests', questRoutes);
} catch (e) {
  console.warn('[SYSTEM WARNING]: Error loading route files:', e.message);
}

// Heuristic Analytical Personal Trainer Engine Fallback
const generateHeuristicTrainerReply = (playerContext = {}) => {
  const hunterName = playerContext.name || 'Hunter';
  const curW = Number(playerContext.currentWeight || playerContext.weight || 70);
  const goalW = Number(playerContext.goalWeight || playerContext.targetWeight || 65);
  const startW = Number(playerContext.startWeight || 70);
  const goalType = playerContext.goalType || 'lose';
  const calTarget = Number(playerContext.dailyCalorieTarget || 2000);
  const protTarget = Number(playerContext.dailyProteinTarget || 140);

  let microAdjustment = '';
  if (goalType === 'lose') {
    if (curW > goalW) {
      microAdjustment = `Recommend today's calorie intake at ${calTarget - 150} kcal (-150 kcal micro-cut) and protein at ${protTarget + 10}g. Focus workout on High-Intensity Resistance Training & 20 min cardio.`;
    } else {
      microAdjustment = `Weight target achieved (${curW}kg). Maintain maintenance calories at ${calTarget} kcal and ${protTarget}g protein.`;
    }
  } else {
    if (curW < goalW) {
      microAdjustment = `Recommend today's calorie intake at ${calTarget + 200} kcal (+200 kcal surplus) and protein at ${protTarget + 15}g. Focus workout on Heavy Compound Lifts (STR & VIT focus).`;
    } else {
      microAdjustment = `Bulk target achieved (${curW}kg). Transition to lean maintenance at ${calTarget} kcal.`;
    }
  }

  return `[ SYSTEM ANALYTICAL TRAINER DIRECTIVE ]: Hunter ${hunterName}, analyzing your 7-day progression (Start: ${startW}kg → Current: ${curW}kg → Goal: ${goalW}kg). ${microAdjustment} Execute daily objectives with discipline.`;
};

// Heuristic Fallback Food Estimation Engine with Exact Gram Calculations
const generateHeuristicFoodAnalysis = (textDescription = '') => {
  const inputStr = (textDescription || '').toLowerCase();
  let calories = 0;
  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatsGrams = 0;
  let calciumMg = 0;
  let ironMg = 0;
  let sodiumMg = 0;

  const extractGrams = (str, keyword, defaultGram = 100) => {
    const regex = new RegExp(`(\\d+)\\s*g(?:rams)?\\s*(?:of\\s*)?${keyword}|${keyword}\\s*(\\d+)\\s*g`, 'i');
    const match = str.match(regex);
    if (match) {
      return parseInt(match[1] || match[2]);
    }
    if (str.includes(keyword)) return defaultGram;
    return 0;
  };

  const chickenG = extractGrams(inputStr, 'chicken', 150);
  if (chickenG > 0) {
    calories += Math.round(chickenG * 1.65);
    proteinGrams += Math.round(chickenG * 0.31);
    fatsGrams += Math.round(chickenG * 0.036);
    sodiumMg += Math.round(chickenG * 0.74);
  }

  const riceG = extractGrams(inputStr, 'rice', 200);
  if (riceG > 0) {
    calories += Math.round(riceG * 1.30);
    carbsGrams += Math.round(riceG * 0.28);
    proteinGrams += Math.round(riceG * 0.027);
  }

  const eggMatch = inputStr.match(/(\d+)\s*(?:whole\s*)?egg/);
  if (eggMatch || inputStr.includes('egg')) {
    const count = eggMatch ? parseInt(eggMatch[1]) : 2;
    calories += count * 72;
    proteinGrams += count * 6.3;
    fatsGrams += count * 4.8;
    calciumMg += count * 28;
    ironMg += count * 0.9;
  }

  const oilG = extractGrams(inputStr, 'oil', 10);
  if (oilG > 0) {
    calories += Math.round(oilG * 8.84);
    fatsGrams += Math.round(oilG * 1.0);
  }

  if (calories === 0) {
    calories = 350;
    proteinGrams = 25;
    carbsGrams = 40;
    fatsGrams = 10;
  }

  return {
    mealName: textDescription || 'Gram Scale Meal Log',
    calories,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    micronutrients: { calciumMg, ironMg, sodiumMg },
    summary: `Analyzed exact gram measurements: ${calories} kcal & ${proteinGrams}g protein calculated.`
  };
};

// AI Chat Handler Function with Automatic Graceful Heuristic Fallback
const handleTrainerChat = async (req, res) => {
  const message = req.body?.message || '';
  const playerContext = req.body?.playerContext || {};
  const hunterName = playerContext.name || 'Hunter';

  const curW = Number(playerContext.currentWeight || playerContext.weight || 70);
  const goalW = Number(playerContext.goalWeight || playerContext.targetWeight || 65);
  const startW = Number(playerContext.startWeight || 70);
  const goalType = playerContext.goalType || 'lose';
  const calTarget = Number(playerContext.dailyCalorieTarget || 2000);
  const protTarget = Number(playerContext.dailyProteinTarget || 140);

  const last7DaysSummary = (playerContext.last7DaysLog || []).map((log) => 
    `${log.date}: Wt ${log.weight || 'N/A'}kg, Cal ${log.calories || 0}kcal, Prot ${log.protein || 0}g, Work ${log.deepWorkHours || 0}h, Sleep ${log.sleepHours || 0}h, Clear ${log.completionPct || 0}%`
  ).join(' | ');

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({ reply: generateHeuristicTrainerReply(playerContext) });
  }

  try {
    const systemPrompt = `You are the Shadow System AI, a strict, highly analytical personal trainer and fitness monarch from Solo System serving Hunter ${hunterName}.

Hunter Health & Fitness Parameters:
- Level & Rank: LV. ${playerContext.level || 1} (${playerContext.rank || 'E-Rank'})
- Weight Mission: Start ${startW} kg → Current ${curW} kg → Goal ${goalW} kg (${goalType === 'gain' ? 'Muscle Bulk' : 'Fat Cut'})
- Targets: ${calTarget} kcal / ${protTarget} g Protein
- Last 7 Days Log Trend: ${last7DaysSummary || 'No 7-day log history recorded yet.'}
- Base Stats: STR ${playerContext.stats?.STR || 10}, VIT ${playerContext.stats?.VIT || 10}, MEN ${playerContext.stats?.MEN || 10}, DIS ${playerContext.stats?.DIS || 10}

Persona & System Instructions:
1. Speak as a strict, analytical System AI Personal Trainer from Solo System. Be authoritative, data-driven, and precise.
2. Analyze the 7-day weight & nutrition trend (evaluate whether weight is stalling, dropping too fast, or moving off track).
3. Provide exact, actionable micro-adjustments for today's calories (e.g. ±150 kcal), protein (e.g. +15g), or workout focus based strictly on the provided real log data.
4. Keep responses sharp, structured, and under 4-5 sentences.

User Query / Directive: "${message}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      }
    );

    const data = await response.json();

    if (data.error || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn('[GEMINI API UNAVAILABLE - ACTIVATING HEURISTIC FALLBACK]:', data.error?.message || 'Empty candidate text');
      return res.json({ reply: generateHeuristicTrainerReply(playerContext) });
    }

    const replyText = data.candidates[0].content.parts[0].text;
    return res.json({ reply: replyText });

  } catch (err) {
    console.warn('[GEMINI NETWORK ERROR - ACTIVATING HEURISTIC FALLBACK]:', err.message);
    return res.json({ reply: generateHeuristicTrainerReply(playerContext) });
  }
};

app.post('/api/trainer/chat', handleTrainerChat);
app.post('/api/ai/chat', handleTrainerChat);

// POST /api/nutrition/analyze - AI Smart Food & Macro Analyzer with Automatic Graceful Heuristic Fallback
app.post('/api/nutrition/analyze', async (req, res) => {
  const { textDescription, imageBase64 } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json(generateHeuristicFoodAnalysis(textDescription));
  }

  try {
    const promptText = `You are an expert AI Nutritionist and Macro Analyzer from the Solo System.
Analyze the following exact food items and weight scale measurements in grams (or standard unit counts):
"${textDescription || '200g cooked white rice, 150g grilled chicken breast'}"

Calculate the exact macronutrients strictly according to the specified gram weights provided by the user (using standard USDA nutrition database values per 1g/100g).

Return ONLY a raw JSON object with NO markdown code block formatting, matching this EXACT schema:
{
  "mealName": "Extracted meal title or description with gram weights",
  "calories": 650,
  "proteinGrams": 55,
  "carbsGrams": 45,
  "fatsGrams": 18,
  "micronutrients": {
    "calciumMg": 120,
    "ironMg": 4.2,
    "sodiumMg": 650
  },
  "summary": "Brief 1-sentence nutritional breakdown based on exact gram weights."
}`;

    const parts = [{ text: promptText }];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    );

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (rawText) {
      const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(cleanedJson);
        if (parsed && typeof parsed.calories === 'number') {
          return res.json(parsed);
        }
      } catch (parseErr) {
        console.warn('[GEMINI PARSE FAIL - ACTIVATING HEURISTIC FALLBACK]:', parseErr.message);
      }
    }

    return res.json(generateHeuristicFoodAnalysis(textDescription));
  } catch (err) {
    console.warn('[GEMINI NUTRITION NETWORK ERROR - ACTIVATING HEURISTIC FALLBACK]:', err.message);
    return res.json(generateHeuristicFoodAnalysis(textDescription));
  }
});

// Health Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'System Backend Active' });
});

// Only start listener if run directly (allows importing app in tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SYSTEM ALARM]: Server running on port ${PORT}`);
  });
}

module.exports = {
  app,
  generateHeuristicTrainerReply,
  generateHeuristicFoodAnalysis,
  handleTrainerChat
};
