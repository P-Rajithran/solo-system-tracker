const mongoose = require('mongoose');

const dailyQuestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  date: { type: Date, default: Date.now },
  tasks: {
    workoutCompleted: { type: Boolean, default: false },
    meditationCompleted: { type: Boolean, default: false },
    macrosTracked: { type: Boolean, default: false }
  },
  customTasks: [
    {
      id: mongoose.Schema.Types.Mixed,
      label: String,
      completed: { type: Boolean, default: false },
      xp: { type: Number, default: 20 },
      type: { type: String, enum: ['daily', 'today'], default: 'daily' }
    }
  ],
  nutrition: {
    currentWeight: { type: Number, default: 0 },
    caloriesConsumed: { type: Number, default: 0 },
    proteinGrams: { type: Number, default: 0 }
  },
  lifeMetrics: {
    deepWorkHours: { type: Number, default: 0 },
    sleepHours: { type: Number, default: 0 },
    focusRating: { type: Number, default: 5 }
  },
  dungeonClearsCount: { type: Number, default: 0 },
  dailyXpEarned: { type: Number, default: 0 },
  dailyGoldEarned: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  isPenaltyActive: { type: Boolean, default: false }
}, { timestamps: true });

dailyQuestSchema.index({ userId: 1, date: -1 });
dailyQuestSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('DailyQuest', dailyQuestSchema);