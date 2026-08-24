import { useState } from 'react';
import { playSystemSound } from '../utils/hunterUtils';
import {
  SHADOW_ARMY_ROSTER,
  calculateArmyPower
} from '../utils/systemMechanics';

const GATE_CHALLENGES = [
  {
    gateId: 'goblin_cavern',
    rank: 'E-RANK',
    title: 'GOBLIN CAVERN GATE',
    objective: 'Log 2+ hours of Deep Work or Focused Study today',
    lootText: '+150 XP | 🪙 +100 GOLD COINS',
    rewardXp: 150,
    rewardGold: 100,
    targetValue: 2.0,
    unit: 'Hours Deep Work',
    getCurrentProgress: (player, quest) => quest?.lifeMetrics?.deepWorkHours || 0,
    color: 'border-blue-500/80 bg-[#070e1c] text-blue-400'
  },
  {
    gateId: 'cerberus_den',
    rank: 'D-RANK',
    title: 'CERBERUS DEN GATE',
    objective: 'Hit daily protein target (140g+) for 3 consecutive days',
    lootText: '+300 XP | 🪙 +250 GOLD COINS',
    rewardXp: 300,
    rewardGold: 250,
    targetValue: 3,
    unit: 'Days Streak',
    getCurrentProgress: (player, quest) => player?.streakCount || (quest?.isCompleted ? 1 : 0),
    color: 'border-amber-500/80 bg-[#120d04] text-amber-400'
  },
  {
    gateId: 'red_gate_survival',
    rank: 'C-RANK',
    title: 'RED GATE SURVIVAL',
    objective: 'Log physical & discipline metrics for 5 consecutive days',
    lootText: '+500 XP | 🪙 +500 GOLD COINS',
    rewardXp: 500,
    rewardGold: 500,
    targetValue: 5,
    unit: 'Days Streak',
    getCurrentProgress: (player, quest) => player?.streakCount || (quest?.isCompleted ? 1 : 0),
    color: 'border-red-500/80 bg-[#170508] text-red-400'
  }
];

const BossRaidCard = ({ quest, player, onNavigateTab, onPlayerUpdate }) => {
  const defaultBossHp = 100;
  const currentLevel = player?.level || 1;
  const [viewMode, setViewMode] = useState('raid'); // 'raid' or 'gates'
  const [raidFeedback, setRaidFeedback] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [localCleared, setLocalCleared] = useState(() => {
    const saved = localStorage.getItem('hunter_cleared_gates');
    return saved ? JSON.parse(saved) : [];
  });

  // Retrieve equipped gear from localStorage
  const equippedIds = JSON.parse(localStorage.getItem('hunter_equipped') || '["dagger_1"]');

  // Calculate Equipment Attack Bonus (+10 HP damage per weapon/gear equipped)
  const gearAtkBonus = equippedIds.length * 10;

  // Calculate Army Power Bonus (+5% extra boss damage per active shadow)
  const totalArmyPower = calculateArmyPower(currentLevel);
  const activeShadowsCount = SHADOW_ARMY_ROSTER.filter(s => currentLevel >= s.reqLvl).length;
  const shadowMultiplier = 1 + activeShadowsCount * 0.05;

  // Calculate base task completion damage
  const defaultKeys = ['workoutCompleted', 'meditationCompleted', 'macrosTracked'];
  const totalDefault = defaultKeys.length;
  const completedDefault = defaultKeys.filter(k => quest?.tasks?.[k]).length;

  const customTasks = quest?.customTasks || [];
  const totalCustom = customTasks.length;
  const completedCustom = customTasks.filter(t => t.completed).length;

  const totalTasks = totalDefault + totalCustom;
  const completedTasks = completedDefault + completedCustom;

  // Calculate final damage dealt with gear + shadow army buffs
  const baseRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const boostedDamageRatio = Math.min(1, baseRatio * shadowMultiplier + (completedTasks > 0 ? gearAtkBonus / defaultBossHp : 0));
  
  const currentBossHp = Math.max(0, Math.round(defaultBossHp * (1 - boostedDamageRatio)));
  const isDefeated = currentBossHp === 0;

  const isGateAlreadyCleared = (gate) => {
    const localCheck = localCleared.includes(gate.gateId) || localCleared.includes(gate.title);
    const serverCheck = (player?.clearedGates || []).some(
      (g) => (typeof g === 'object' ? (g.gateId === gate.gateId || g.gateId === gate.title) : (g === gate.gateId || g === gate.title))
    );
    return localCheck || serverCheck;
  };

  const handleChallengeGateClick = () => {
    playSystemSound('click');
    const reqPower = 20 + currentLevel * 5;
    const currentTotalPower = totalArmyPower + gearAtkBonus;

    if (currentTotalPower >= reqPower || isDefeated) {
      playSystemSound('levelup');
      setRaidFeedback(`[ RAID EVALUATION ]: Hunter Power (${currentTotalPower} PWR) satisfies Gate Raid requirement (${reqPower} PWR)! Unlocking Rank Gate Challenges...`);
    } else {
      playSystemSound('penalty');
      setRaidFeedback(`[ RAID NOTICE ]: Golem active! Current Power: ${currentTotalPower} PWR (Required: ${reqPower} PWR). Complete daily tasks to increase damage!`);
    }

    setTimeout(() => setRaidFeedback(''), 4500);
    setViewMode('gates');
  };

  const handleGoToLogMetrics = () => {
    playSystemSound('click');
    if (onNavigateTab) {
      onNavigateTab('/nutrition');
    } else {
      window.location.hash = '#/nutrition';
    }
  };

  const handleClaimGateReward = async (gate) => {
    if (isGateAlreadyCleared(gate)) {
      playSystemSound('penalty');
      setRaidFeedback(`[ NOTICE ]: Rewards for "${gate.title}" have already been claimed!`);
      return;
    }

    setIsClaiming(true);
    playSystemSound('levelup');

    try {
      const token = localStorage.getItem('hunter_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch('http://localhost:5000/api/quests/claim-gate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          gateId: gate.title,
          rewardGold: gate.rewardGold,
          rewardXp: gate.rewardXp
        })
      });

      const data = await res.json();

      if (!res.ok) {
        playSystemSound('penalty');
        setRaidFeedback(data.error || data.message || `[ NOTICE ]: Gate reward has already been claimed!`);
        return;
      }

      const updatedCleared = [...localCleared, gate.gateId, gate.title];
      setLocalCleared(updatedCleared);
      localStorage.setItem('hunter_cleared_gates', JSON.stringify(updatedCleared));

      setRaidFeedback(data.message || `[ GATE CLEARED ]: 🪙 +${gate.rewardGold} GOLD COINS & +${gate.rewardXp} XP added to your System Wallet!`);

      if (onPlayerUpdate) {
        onPlayerUpdate();
      }
    } catch (err) {
      console.error('[GATE CLAIM ERROR]:', err);
      setRaidFeedback('[ ERROR ]: Failed to connect to system server to claim reward.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="system-card border-2 border-purple-900/80 bg-gradient-to-b from-[#0e071a] to-[#07090e] p-4 sm:p-5 pb-6 sm:pb-8 shadow-[0_0_20px_rgba(139,92,246,0.2)] w-full max-w-full box-border h-auto min-h-fit mb-8 relative z-0">
      
      {/* TOGGLE TAB NAVIGATION HEADER */}
      <div className="font-['Orbitron'] text-[11px] tracking-[1.5px] border-b border-purple-900/60 pb-3 mb-4 flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => { playSystemSound('click'); setViewMode('raid'); }}
            className={`px-3 py-1.5 uppercase font-bold transition-all rounded-xs cursor-pointer border ${
              viewMode === 'raid'
                ? 'bg-purple-900/80 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/30 border-purple-900/40 text-purple-400 hover:text-purple-200'
            }`}
          >
            ☠ DAILY DUNGEON BOSS RAID
          </button>
          <button
            onClick={() => { playSystemSound('click'); setViewMode('gates'); }}
            className={`px-3 py-1.5 uppercase font-bold transition-all rounded-xs cursor-pointer border ${
              viewMode === 'gates'
                ? 'bg-purple-900/80 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/30 border-purple-900/40 text-purple-400 hover:text-purple-200'
            }`}
          >
            ⚔️ RANK GATE CHALLENGES
          </button>
        </div>

        <span className="text-purple-400 font-mono text-[11px] shrink-0">
          {viewMode === 'raid' ? (isDefeated ? "[ RAID CLEARED ]" : "[ ACTIVE BOSS RAID ]") : "[ RANK GATES OPEN ]"}
        </span>
      </div>

      {/* RAID FEEDBACK TOAST BANNER */}
      {raidFeedback && (
        <div className="mb-4 p-3 bg-purple-950/90 border border-purple-500 text-purple-300 font-['Orbitron'] text-xs tracking-wider animate-fade-in flex items-center justify-between flex-wrap gap-2 box-border">
          <span className="min-w-0 flex-1 break-words">{raidFeedback}</span>
          <span className="text-purple-400 font-mono text-[10px] shrink-0">SYSTEM SYNCED</span>
        </div>
      )}

      {/* CONDITION 1: DAILY DUNGEON BOSS RAID VIEW */}
      {viewMode === 'raid' ? (
        <div className="space-y-4 w-full max-w-full box-border">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-full box-border">
            {/* Boss Visual Icon */}
            <div className="relative w-16 h-16 rounded-sm bg-purple-950/40 border border-purple-600/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
              <span className="text-3xl select-none">
                {isDefeated ? '🗡️' : '👹'}
              </span>
            </div>

            {/* Boss HP Bar & Multipliers */}
            <div className="flex-1 min-w-0 w-full space-y-2 box-border">
              <div className="flex justify-between items-center text-xs font-['Orbitron'] flex-wrap gap-2 min-w-0">
                <span className="font-bold text-white tracking-wider truncate">
                  {isDefeated ? "DUNGEON BOSS DEFEATED" : "IRON COLOSSUS"}
                </span>
                <span className="font-['Share_Tech_Mono'] text-purple-300 shrink-0">
                  HP: {currentBossHp} / {defaultBossHp}
                </span>
              </div>

              <div className="h-3 bg-[#0a0f1c] border border-purple-900/60 relative overflow-hidden rounded-xs w-full max-w-full box-border">
                <div 
                  className={`h-full transition-all duration-700 ${
                    isDefeated 
                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]' 
                      : 'bg-gradient-to-r from-purple-800 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                  }`}
                  style={{ width: `${100 - (currentBossHp / defaultBossHp) * 100}%` }}
                ></div>
              </div>

              {/* ACTIVE RAID BUFFS DISPLAY */}
              <div className="flex items-center gap-4 text-[10px] font-['Share_Tech_Mono'] text-[var(--gold)] pt-1 flex-wrap">
                <span>🗡️ GEAR BONUS: +{gearAtkBonus} DMG</span>
                <span>👑 ARMY BUFF: +{Math.round((shadowMultiplier - 1) * 100)}% ATK ({totalArmyPower} PWR)</span>
              </div>
            </div>
          </div>

          {/* CLEAR ENTRY REQUIREMENTS BOX (BEFORE STARTING) */}
          <div className="p-3 bg-purple-950/70 border border-purple-500/60 rounded-xs space-y-1 text-xs font-['Share_Tech_Mono'] box-border">
            <div className="font-['Orbitron'] text-[11px] text-purple-300 font-bold tracking-wider flex items-center gap-1.5 uppercase">
              <span>📋 SPECIFIC ENTRY REQUIREMENTS & TARGETS</span>
            </div>
            <div className="text-slate-300 space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">• REQUIRED COMBAT POWER:</span>
                <span className="text-purple-300 font-bold font-['Orbitron']">{20 + currentLevel * 5} PWR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">• TARGET BOSS HP DAMAGE:</span>
                <span className="text-amber-300 font-bold font-['Orbitron']">{defaultBossHp} HP</span>
              </div>
              <div className="text-slate-300">
                • <span className="text-white font-semibold">CLEARANCE OBJECTIVE:</span> Complete 3 Daily Tasks (<span className="text-cyan-300 font-bold">💪 Workout</span>, <span className="text-cyan-300 font-bold">🧘 Meditation</span>, <span className="text-cyan-300 font-bold">🥗 Nutrition</span>) to deal 100% Golem damage.
              </div>
            </div>
          </div>

          {/* CHALLENGE GATE BUTTON */}
          <button
            onClick={handleChallengeGateClick}
            className="w-full max-w-full mt-2 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-600/60 font-['Orbitron'] text-[10px] tracking-[2px] py-2.5 uppercase transition-all shadow-[0_0_10px_rgba(139,92,246,0.2)] cursor-pointer box-border"
          >
            [ CHALLENGE RANK GATE DUNGEONS → ]
          </button>
        </div>
      ) : (
        /* CONDITION 2: RANK GATE CHALLENGES FULL-WIDTH UNCLIPPED LIST VIEW */
        <div className="w-full flex flex-col gap-4 font-['Share_Tech_Mono'] box-border h-auto min-h-fit overflow-visible">
          {GATE_CHALLENGES.map((gate) => {
            const currentProg = gate.getCurrentProgress(player, quest);
            const isCompleted = currentProg >= gate.targetValue;
            const isAlreadyCleared = isGateAlreadyCleared(gate);
            const progPct = Math.min(100, Math.round((currentProg / gate.targetValue) * 100));

            return (
              <div
                key={gate.gateId}
                className={`p-4 border-2 rounded-sm space-y-3 transition-all w-full max-w-full box-border h-auto min-h-fit ${
                  isAlreadyCleared
                    ? 'border-slate-800 bg-[#050810]/70 opacity-60 grayscale'
                    : gate.color
                }`}
              >
                {/* GATE TITLE & RANK */}
                <div className="flex justify-between items-center font-['Orbitron'] flex-wrap gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white tracking-wider truncate block">
                      [{gate.rank}] {gate.title}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold shrink-0 ${
                    isAlreadyCleared
                      ? 'border border-slate-700 text-slate-500 bg-slate-900'
                      : isCompleted
                      ? 'border border-emerald-500 text-emerald-400 bg-emerald-950/60 animate-pulse'
                      : 'border border-amber-500 text-amber-400 bg-amber-950/60'
                  }`}>
                    {isAlreadyCleared ? '[ 🔒 GATE CLOSED / CLAIMED ]' : isCompleted ? '[ 🏆 OBJECTIVE MET! ]' : '[ ⚔️ IN PROGRESS ]'}
                  </span>
                </div>

                {/* SPECIFIC ENTRY REQUIREMENTS & TARGET NUMBERS (BEFORE STARTING) */}
                <div className="p-3 bg-black/75 border border-current/40 rounded-xs space-y-1 text-xs font-['Share_Tech_Mono']">
                  <div className="font-['Orbitron'] text-[10px] text-amber-300 font-bold tracking-wider flex items-center gap-1.5 uppercase">
                    <span>📋 SPECIFIC TARGET REQUIREMENT</span>
                  </div>
                  <div className="text-white font-bold text-xs flex items-center gap-2 flex-wrap">
                    <span className="text-amber-400">🎯 REQUIRED TARGET:</span>
                    <span className="text-cyan-300 font-extrabold font-['Orbitron'] underline decoration-amber-500/60">
                      {gate.targetValue} {gate.unit}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    • Objective Details: <span className="text-white font-medium">{gate.objective}</span>
                  </div>
                </div>

                {/* CLEARANCE REWARDS BLOCK */}
                <div className="p-2.5 bg-black/60 border border-current/30 text-xs text-[var(--gold)] font-bold flex justify-between items-center flex-wrap gap-2 box-border">
                  <span className="shrink-0">CLEARANCE REWARDS:</span>
                  <span className="font-['Orbitron'] text-xs drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] shrink-0">
                    {gate.lootText}
                  </span>
                </div>

                {/* VISUAL PROGRESS BAR */}
                <div className="space-y-1.5 min-w-0 w-full box-border">
                  <div className="flex justify-between text-[11px] text-slate-300 flex-wrap gap-2">
                    <span className="truncate">PROGRESS: {currentProg} / {gate.targetValue} {gate.unit}</span>
                    <span className="shrink-0 font-bold">{progPct}%</span>
                  </div>
                  <div className="w-full max-w-full bg-black h-2.5 rounded-full overflow-hidden border border-current/30 box-border">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        isAlreadyCleared ? 'bg-slate-600' : 'bg-gradient-to-r from-[var(--glow-dim)] to-[var(--glow)] shadow-[0_0_8px_rgba(45,212,255,0.8)]'
                      }`}
                      style={{ width: `${progPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="w-full box-border">
                  {isAlreadyCleared ? (
                    <button
                      disabled
                      className="w-full max-w-full bg-slate-900 border border-slate-800 text-slate-500 font-['Orbitron'] text-xs py-2 uppercase cursor-not-allowed opacity-80 box-border"
                    >
                      [ 🔒 GATE CLOSED / LOOT CLAIMED ]
                    </button>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaimGateReward(gate)}
                      disabled={isClaiming}
                      className="w-full max-w-full bg-emerald-950 hover:bg-emerald-900 border-2 border-emerald-500 text-emerald-300 font-['Orbitron'] font-extrabold text-xs py-2.5 uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(52,211,153,0.6)] cursor-pointer animate-pulse box-border"
                    >
                      {isClaiming ? '[ CLAIMING LOOT... ]' : `[ 🏆 CLAIM CLEARANCE REWARD (+${gate.rewardGold} GOLD) ]`}
                    </button>
                  ) : (
                    <button
                      onClick={handleGoToLogMetrics}
                      className="w-full max-w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-['Orbitron'] font-bold text-xs py-2.5 uppercase tracking-wider cursor-pointer box-border flex items-center justify-center gap-2"
                    >
                      <span>[ ⚔️ LOG METRICS TO PROGRESS ({currentProg} / {gate.targetValue} {gate.unit}) → ]</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <button
              onClick={() => { playSystemSound('click'); setViewMode('raid'); }}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-['Orbitron'] text-xs py-2.5 uppercase cursor-pointer box-border"
            >
              [ ↩ RETURN TO DAILY BOSS RAID ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BossRaidCard;