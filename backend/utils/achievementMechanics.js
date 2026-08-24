const SYSTEM_ACHIEVEMENTS = [
  {
    id: 'first_gate_cleared',
    name: 'First Gate Cleared',
    description: 'Clear your first Rank Gate Dungeon and claim its rewards',
    icon: '⚔️',
    hint: '🔒 Clear your first Rank Gate Dungeon',
    check: (player) => Boolean(player.isOnboarded && (player.dungeonClears || 0) >= 1)
  },
  {
    id: 'streak_7_days',
    name: '7-Day Streak',
    description: 'Maintain a 7-day daily quest completion streak',
    icon: '🔥',
    hint: '🔒 Reach a 7-day completion streak',
    check: (player, streak) => Boolean(player.isOnboarded && (streak || 0) >= 7)
  },
  {
    id: 'streak_30_days',
    name: '30-Day Streak',
    description: 'Maintain a 30-day daily quest completion streak',
    icon: '👑',
    hint: '🔒 Reach a 30-day completion streak',
    check: (player, streak) => Boolean(player.isOnboarded && (streak || 0) >= 30)
  },
  {
    id: 'first_5kg_lost',
    name: 'First 5kg Lost',
    description: 'Lose at least 5kg from your starting weight',
    icon: '⚖️',
    hint: '🔒 Lose 5kg from starting weight',
    check: (player) => {
      if (!player.isOnboarded || !player.isSetupComplete) return false;
      const start = Number(player.startWeight) || 0;
      const current = Number(player.currentWeight) || start;
      const goal = player.goalType || player.primaryGoal || 'lose';
      if (goal === 'gain') return false;
      return start > 0 && (start - current) >= 5;
    }
  },
  {
    id: 'halfway_there',
    name: 'Halfway There',
    description: 'Achieve 50% or more of your total weight loss/gain goal',
    icon: '🎯',
    hint: '🔒 Reach 50% of your target weight goal',
    check: (player) => {
      if (!player.isOnboarded || !player.isSetupComplete) return false;
      const start = Number(player.startWeight) || 0;
      const current = Number(player.currentWeight) || start;
      const target = Number(player.targetWeight) || start;
      const goal = player.goalType || player.primaryGoal || 'lose';

      if (!start || !target || start === target) return false;
      const totalDiff = Math.abs(start - target);
      if (totalDiff === 0) return false;

      let achieved = 0;
      if (goal === 'gain') {
        achieved = current - start;
      } else {
        achieved = start - current;
      }

      if (achieved <= 0) return false;
      return (achieved / totalDiff) >= 0.5;
    }
  },
  {
    id: 'level_10_hunter',
    name: 'Level 10 Hunter',
    description: 'Reach Hunter Level 10 and ascend to D-Rank',
    icon: '⚡',
    hint: '🔒 Reach Hunter Level 10',
    check: (player) => Boolean(player.isOnboarded && (player.level || 1) >= 10)
  },
  {
    id: 's_rank_ascension',
    name: 'S-Rank Ascension',
    description: 'Reach Hunter Level 30 and awaken as an S-Rank Iron Sovereign',
    icon: '🌌',
    hint: '🔒 Reach Hunter Level 30',
    check: (player) => Boolean(player.isOnboarded && (player.level || 1) >= 30)
  }
];

const checkAndUnlockAchievements = (player, streakCount = 1) => {
  if (!player || !player.isOnboarded || !player.isSetupComplete) return [];
  player.unlockedAchievements = player.unlockedAchievements || [];
  const newlyUnlocked = [];

  for (const ach of SYSTEM_ACHIEVEMENTS) {
    const isAlreadyUnlocked = player.unlockedAchievements.includes(ach.id);
    if (!isAlreadyUnlocked && ach.check(player, streakCount)) {
      player.unlockedAchievements.push(ach.id);
      newlyUnlocked.push({
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon
      });
    }
  }

  return newlyUnlocked;
};

module.exports = {
  SYSTEM_ACHIEVEMENTS,
  checkAndUnlockAchievements
};
