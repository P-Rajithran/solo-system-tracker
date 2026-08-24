export const getHunterRank = (level = 1) => {
  if (level >= 50) {
    const prestigeTier = Math.floor((level - 50) / 10) + 1;
    const nextMilestoneLevel = 50 + prestigeTier * 10;
    const isNationalRank = level >= 100;
    const rankTitle = isNationalRank 
      ? `NATIONAL LEVEL MONARCH (PRESTIGE TIER ${prestigeTier})`
      : `S-RANK IRON SOVEREIGN (PRESTIGE TIER ${prestigeTier})`;

    return { 
      rank: isNationalRank ? 'NATIONAL-RANK' : 'S-RANK', 
      title: rankTitle, 
      color: 'text-purple-400 border-purple-500 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
      buffPct: `+${Math.min(50, 25 + (prestigeTier - 1) * 5)}%`, 
      buffDescription: `+${Math.min(50, 25 + (prestigeTier - 1) * 5)}% EXP Boost & Infinite Monarch Ascension`,
      nextLevelReq: nextMilestoneLevel,
      nextRank: isNationalRank ? `PRESTIGE TIER ${prestigeTier + 1}` : (nextMilestoneLevel >= 100 ? 'NATIONAL-RANK' : `PRESTIGE TIER ${prestigeTier + 1}`),
      minLevel: 50 + (prestigeTier - 1) * 10
    };
  }
  if (level >= 35) {
    return { 
      rank: 'A-RANK', 
      title: 'A-RANK HIGH HUNTER', 
      color: 'text-red-400 border-red-500 bg-red-950/40',
      buffPct: '+15%', 
      buffDescription: '+15% EXP Boost & Dungeon Raid Dominance',
      nextLevelReq: 50,
      nextRank: 'S-RANK',
      minLevel: 35
    };
  }
  if (level >= 20) {
    return { 
      rank: 'B-RANK', 
      title: 'B-RANK ELITE HUNTER', 
      color: 'text-amber-400 border-amber-500 bg-amber-950/40',
      buffPct: '+10%', 
      buffDescription: '+10% EXP Boost & Gate Key Multiplier',
      nextLevelReq: 35,
      nextRank: 'A-RANK',
      minLevel: 20
    };
  }
  if (level >= 10) {
    return { 
      rank: 'C-RANK', 
      title: 'C-RANK STRIKER', 
      color: 'text-emerald-400 border-emerald-500 bg-emerald-950/40',
      buffPct: '+5%', 
      buffDescription: '+5% EXP Boost & Consistent Discipline Buff',
      nextLevelReq: 20,
      nextRank: 'B-RANK',
      minLevel: 10
    };
  }
  if (level >= 5) {
    return { 
      rank: 'D-RANK', 
      title: 'D-RANK VETERAN', 
      color: 'text-cyan-400 border-cyan-500 bg-cyan-950/40',
      buffPct: '+2%', 
      buffDescription: '+2% EXP Boost & Daily Quest Reward Bonus',
      nextLevelReq: 10,
      nextRank: 'C-RANK',
      minLevel: 5
    };
  }
  return { 
    rank: 'E-RANK', 
    title: 'E-RANK NOVICE', 
    color: 'text-slate-400 border-slate-600 bg-slate-900/60',
    buffPct: '+0%', 
    buffDescription: 'Base System Training Active (+0% XP)',
    nextLevelReq: 5,
    nextRank: 'D-RANK',
    minLevel: 1
  };
};

export const playSystemSound = (type) => {
  const isMuted = localStorage.getItem('hunter_sound_muted') === 'true';
  if (isMuted) return;

  const soundMap = {
    click: '/sounds/sound.mp3',
    complete: '/sounds/quest_done.mp3',
    quest_done: '/sounds/quest_done.mp3',
    questdone: '/sounds/quest_done.mp3',
    add: '/sounds/sound.mp3',
    levelup: '/sounds/level_up.mp3',
    level_up: '/sounds/level_up.mp3',
    penalty: '/sounds/penalty.mp3'
  };

  try {
    const rawKey = String(type || '').trim();
    const normalizedKey = rawKey.toLowerCase().replace(/[-_]/g, '');
    let soundFile = soundMap[rawKey] || soundMap[normalizedKey] || soundMap[rawKey.toLowerCase()];

    if (!soundFile) {
      if (normalizedKey.includes('level')) soundFile = '/sounds/level_up.mp3';
      else if (normalizedKey.includes('quest') || normalizedKey.includes('done') || normalizedKey.includes('complete')) soundFile = '/sounds/quest_done.mp3';
      else if (normalizedKey.includes('penalty')) soundFile = '/sounds/penalty.mp3';
      else soundFile = '/sounds/sound.mp3';
    }

    const audio = new Audio(soundFile);
    audio.volume = 0.6;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Silently ignore browser autoplay restrictions
      });
    }
  } catch {
    // Silently ignore audio error
  }
};