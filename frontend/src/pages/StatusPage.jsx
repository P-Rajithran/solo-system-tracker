import { useState, useEffect } from 'react';
import DungeonClearHistory from '../components/DungeonClearHistory';
import LogWeightModal from '../components/LogWeightModal';
import {
  EQUIPMENT_ITEMS,
  SHADOW_ARMY_ROSTER,
  calculateEffectiveStats,
  calculateArmyPower
} from '../utils/systemMechanics';

import ProgressAnalytics from '../components/ProgressAnalytics';

import { getHunterRank } from '../utils/hunterUtils';

const StatusPage = ({ player, weight, onAllocateStat, quest, onSaveNutrition, analyticsData, onFetchAnalytics, workoutStreak, onDismissAnomaly }) => {
  const [isLogWeightOpen, setIsLogWeightOpen] = useState(false);

  // DYNAMIC PROFILE & WEIGHT READ
  const currentWeightVal = player?.currentWeight || quest?.nutrition?.currentWeight || (parseFloat(weight) > 0 ? parseFloat(weight) : 0) || player?.startWeight || 70;
  const startWeight = player?.startWeight || currentWeightVal;
  const goalWeight = player?.targetWeight || 65.0;
  const goalType = player?.goalType || 'lose'; // 'lose' or 'gain'

  // DYNAMIC PROGRESS & REMAINING LOGIC
  const totalDifference = Math.abs(startWeight - goalWeight);
  let remainingKg;
  let weightPct;

  if (goalType === 'gain') {
    // Muscle Gain (Bulk)
    const gained = currentWeightVal - startWeight;
    remainingKg = Math.max(0, goalWeight - currentWeightVal);
    weightPct = totalDifference > 0 
      ? Math.max(0, Math.min(100, (gained / totalDifference) * 100)) 
      : 100;
  } else {
    // Fat Loss (Cut)
    const lost = startWeight - currentWeightVal;
    remainingKg = Math.max(0, currentWeightVal - goalWeight);
    weightPct = totalDifference > 0 
      ? Math.max(0, Math.min(100, (lost / totalDifference) * 100)) 
      : 100;
  }

  const currentLevel = player?.level || 1;
  const needXp = 100 + (currentLevel - 1) * 50;
  const currentXp = player?.exp || 0;
  const xpPct = Math.min(100, (currentXp / needXp) * 100);

  const circumference = 402;
  const strokeOffset = circumference - (circumference * weightPct) / 100;

  // Equipment Persistence State
  const [equippedItems, setEquippedItems] = useState(() => {
    const saved = localStorage.getItem('hunter_equipped');
    return saved ? JSON.parse(saved) : ['dagger_1'];
  });

  useEffect(() => {
    localStorage.setItem('hunter_equipped', JSON.stringify(equippedItems));
  }, [equippedItems]);

  const toggleEquip = (itemId, reqLvl) => {
    if (currentLevel < reqLvl) return;
    setEquippedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Compute Base + Gear Boosted Stats
  const baseStats = player?.stats || { STR: 10, VIT: 10, MEN: 10, DIS: 10 };
  const effectiveStats = calculateEffectiveStats(baseStats, equippedItems);
  const totalArmyPower = calculateArmyPower(currentLevel);
  const availablePoints = player?.statPoints || 0;
  const maxStatCap = 100;

  const statBars = [
    { key: 'STR', label: 'STR — Strength (Workouts)', base: baseStats.STR, effective: effectiveStats.STR, colorClass: 'from-red-600 to-red-400' },
    { key: 'VIT', label: 'VIT — Vitality (Health Metrics)', base: baseStats.VIT, effective: effectiveStats.VIT, colorClass: 'from-emerald-600 to-emerald-400' },
    { key: 'MEN', label: 'MEN — Mentality (Focus/Mind)', base: baseStats.MEN, effective: effectiveStats.MEN, colorClass: 'from-purple-600 to-purple-400' },
    { key: 'DIS', label: 'DIS — Discipline (Consistency)', base: baseStats.DIS, effective: effectiveStats.DIS, colorClass: 'from-amber-500 to-amber-300' },
  ];

  return (
    <div className="space-y-[14px]">
      
      {/* ACTIVE TITLE & BUFF BANNER */}
      <div className="p-3 bg-[var(--panel-2)] border border-[var(--gold)] text-[var(--gold)] font-['Share_Tech_Mono'] text-xs flex justify-between items-center flex-wrap gap-2">
        <div>
          <span className="font-['Orbitron'] font-bold text-white uppercase mr-2">
            [{getHunterRank(currentLevel).title}]
          </span>
          <span className="text-[var(--text-dim)]">{getHunterRank(currentLevel).buffDescription}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/50 px-2 py-0.5 rounded-2xs font-['Share_Tech_Mono']">
            ⚡ DAILY XP: {quest?.dailyXpEarned || 0} / {quest?.DAILY_XP_CAP || 300}
          </span>
          <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/50 px-2 py-0.5 rounded-2xs font-['Share_Tech_Mono']">
            🪙 DAILY GOLD: {quest?.dailyGoldEarned || 0} / {quest?.DAILY_GOLD_CAP || 500}
          </span>
          <span className="font-['Orbitron'] text-[10px] bg-[rgba(251,191,36,0.15)] px-2.5 py-1 rounded-sm border border-[var(--gold)] font-bold tracking-wider">
            BUFF: {getHunterRank(currentLevel).buffPct}
          </span>
        </div>
      </div>

      {/* FATIGUE RECOVERY SYSTEM ADVISORY BANNER */}
      {workoutStreak >= 3 && (
        <div className="p-3 bg-amber-950/85 border-2 border-amber-500/80 text-amber-300 font-['Orbitron'] text-xs tracking-wider animate-pulse flex items-center justify-between flex-wrap gap-2 rounded-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <div className="flex items-center gap-2.5">
            <span className="text-lg shrink-0">🛌</span>
            <span>[ SYSTEM ]: Fatigue detected. Consider a recovery day.</span>
          </div>
          <span className="font-['Share_Tech_Mono'] text-[10px] text-amber-400 border border-amber-500/60 bg-amber-950 px-2 py-0.5 rounded-2xs font-bold">
            {workoutStreak} CONSECUTIVE WORKOUT DAYS
          </span>
        </div>
      )}

      {/* DATA ANOMALY SYSTEM ADVISORY BANNER */}
      {player?.dataAnomalyDetected && (
        <div className="p-3.5 bg-gradient-to-r from-amber-950/90 via-amber-900/90 to-amber-950/90 border-2 border-amber-500 text-amber-300 font-['Orbitron'] text-xs tracking-wider flex items-center justify-between flex-wrap gap-3 rounded-xs shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-lg shrink-0">🔍</span>
            <span className="leading-snug">
              {player?.anomalyDetails?.message || '[SYSTEM]: Anomaly detected between logged metrics and measured outcome. Recommend reviewing recent entries for accuracy.'}
            </span>
          </div>
          <button
            onClick={onDismissAnomaly}
            className="px-3 py-1 bg-amber-950 border border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-black transition-colors font-['Orbitron'] text-[10px] font-bold tracking-widest uppercase rounded-xs cursor-pointer shrink-0"
          >
            [ DISMISS ]
          </button>
        </div>
      )}

      {/* LEVEL UP NOTIFICATION BANNER */}
      {availablePoints > 0 && (
        <div className="p-3 bg-[rgba(139,92,246,0.15)] border border-[var(--purple)] text-[var(--purple)] font-['Orbitron'] text-xs tracking-wider flex justify-between items-center animate-pulse">
          <span>[ SYSTEM ALARM ]: {availablePoints} UNALLOCATED STAT POINT(S) AVAILABLE!</span>
        </div>
      )}

      {/* EXPERIENCE CARD */}
      <div className="system-card">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] mb-[14px] flex justify-between items-center">
          <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
            EXPERIENCE
          </span>
          <span className="font-['Share_Tech_Mono'] text-[12px] text-[var(--text-dim)]">
            LEVEL {currentLevel}
          </span>
        </div>
        <div>
          <div className="flex justify-between text-[13px] mb-[5px]">
            <span className="tracking-[1px] text-[var(--text)] font-semibold">XP TO NEXT LEVEL</span>
            <span className="font-['Share_Tech_Mono'] text-[var(--text-dim)]">{currentXp} / {needXp}</span>
          </div>
          <div className="h-[9px] bg-[#0a0f1c] border border-[var(--line)] relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[var(--glow-dim)] to-[var(--glow)] transition-all duration-700 ease-out relative" 
              style={{ width: `${xpPct}%` }}
            >
              <div className="absolute inset-0 w-[40px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.35)] to-transparent animate-shine"></div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC WEIGHT & BODY MISSION CARD */}
      <div className="system-card">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] mb-[14px] flex justify-between items-center">
          <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
            WEIGHT & BODY MISSION
          </span>
          <span className="font-['Share_Tech_Mono'] text-[11px] text-[var(--gold)]">
            [{goalType === 'gain' ? 'MUSCLE BULK' : 'FAT CUT'}]
          </span>
        </div>

        <div className="flex items-center gap-[22px] flex-wrap justify-center">
          <div className="relative w-[150px] h-[150px] shrink-0">
            <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-90">
              <circle cx="75" cy="75" r="64" fill="none" stroke="#0f1a2e" strokeWidth="10"></circle>
              <circle 
                cx="75" 
                cy="75" 
                r="64" 
                fill="none" 
                stroke="var(--glow)" 
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-1000 ease-out drop-shadow-[0_0_6px_rgba(45,212,255,0.7)]"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-['Orbitron'] text-[26px] text-white">{Math.round(weightPct)}%</div>
              <div className="text-[11px] text-[var(--text-dim)] tracking-[1px]">TO GOAL</div>
            </div>
          </div>

          <div className="flex-1 min-w-[180px]">
            <div className="flex justify-between text-[13px] py-[6px] border-b border-dashed border-[var(--line)]">
              <span className="text-[var(--text-dim)] tracking-[0.5px]">Start Weight</span>
              <span className="font-['Share_Tech_Mono'] text-[var(--text)]">{startWeight.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-[13px] py-[6px] border-b border-dashed border-[var(--line)]">
              <span className="text-[var(--text-dim)] tracking-[0.5px]">Current Weight</span>
              <span className="font-['Share_Tech_Mono'] text-[var(--glow)] font-bold">{currentWeightVal.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-[13px] py-[6px] border-b border-dashed border-[var(--line)]">
              <span className="text-[var(--text-dim)] tracking-[0.5px]">Goal Weight</span>
              <span className="font-['Share_Tech_Mono'] text-[var(--gold)] font-bold">{goalWeight.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-[13px] py-[6px]">
              <span className="text-[var(--text-dim)] tracking-[0.5px]">Remaining</span>
              <span className="font-['Share_Tech_Mono'] text-emerald-400 font-bold">{remainingKg.toFixed(1)} kg</span>
            </div>

            <button
              onClick={() => setIsLogWeightOpen(true)}
              className="w-full mt-3 bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-bold text-xs py-2 tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(45,212,255,0.4)] cursor-pointer"
            >
              [ ⚖️ LOG TODAY'S WEIGHT ]
            </button>
          </div>
        </div>

        {/* LOG WEIGHT MODAL */}
        <LogWeightModal
          isOpen={isLogWeightOpen}
          currentWeight={currentWeightVal}
          onClose={() => setIsLogWeightOpen(false)}
          onSaveWeight={(newW) => onSaveNutrition && onSaveNutrition({ currentWeight: newW })}
        />
      </div>

      {/* DYNAMIC HUNTER STATS CARD */}
      <div className="system-card">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] mb-[14px] flex items-center gap-2 before:content-['◆'] before:text-[10px]">
          HUNTER STATS (INCLUDES GEAR BUFFS)
        </div>

        <div className="space-y-[14px]">
          {statBars.map((stat) => {
            const barWidthPct = Math.min(100, Math.max(2, (stat.effective / maxStatCap) * 100));
            const bonus = stat.effective - stat.base;

            return (
              <div key={stat.key} className="space-y-[5px]">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="tracking-[1px] text-[var(--text)] font-semibold">{stat.label}</span>
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono']">
                    <span className="text-white font-bold">{stat.effective}</span>
                    {bonus > 0 && <span className="text-[var(--gold)] text-xs">(+{bonus} Gear)</span>}
                    {availablePoints > 0 && (
                      <button
                        onClick={() => onAllocateStat(stat.key)}
                        className="px-2 py-0.5 bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] text-[10px] font-bold font-['Orbitron'] rounded-sm transition-colors cursor-pointer"
                      >
                        +1
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-[9px] bg-[#0a0f1c] border border-[var(--line)] relative overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stat.colorClass} transition-all duration-500`}
                    style={{ width: `${barWidthPct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SYSTEM EQUIPMENT & INVENTORY */}
      <div className="system-card">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--gold)] mb-[14px] flex justify-between items-center">
          <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
            EQUIPMENT & INVENTORY
          </span>
          <span className="font-['Share_Tech_Mono'] text-xs text-[var(--gold)]">
            {equippedItems.length} / {EQUIPMENT_ITEMS.length} EQUIPPED
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EQUIPMENT_ITEMS.map((eq) => {
            const isUnlocked = currentLevel >= eq.reqLvl;
            const isEquipped = equippedItems.includes(eq.id);

            return (
              <div
                key={eq.id}
                onClick={() => toggleEquip(eq.id, eq.reqLvl)}
                className={`p-3 border rounded-sm flex items-center gap-3 font-['Share_Tech_Mono'] text-xs cursor-pointer transition-all ${
                  !isUnlocked
                    ? 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text-faint)] opacity-40 cursor-not-allowed'
                    : isEquipped
                    ? 'border-[var(--gold)] bg-[rgba(251,191,36,0.08)] text-white shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                    : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text-dim)] hover:border-[var(--glow-dim)]'
                }`}
              >
                <div className="text-2xl">{eq.icon}</div>
                <div className="flex-1">
                  <div className="font-['Orbitron'] font-bold text-xs tracking-wider uppercase">
                    {eq.name}
                  </div>
                  <div className="text-[10px] text-[var(--gold)]">{Object.entries(eq.statBonus).map(([k, v]) => `+${v} ${k}`).join(' ')} • [{eq.slot}]</div>
                  <div className="text-[9px] text-[var(--text-dim)] mt-0.5">{eq.description}</div>
                </div>
                <div className="font-bold text-[10px] uppercase tracking-widest">
                  {!isUnlocked ? (
                    <span className="text-[var(--text-faint)]">[ LV. {eq.reqLvl} ]</span>
                  ) : isEquipped ? (
                    <span className="text-[var(--gold)]">[ EQUIPPED ]</span>
                  ) : (
                    <span className="text-[var(--text-dim)]">[ EQUIP ]</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SHADOW ARMY EXTRACTION ROSTER */}
      <div className="system-card">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--purple)] mb-[14px] flex justify-between items-center">
          <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
            SHADOW ARMY ROSTER
          </span>
          <span className="font-['Share_Tech_Mono'] text-xs text-[var(--purple)] font-bold">
            ARMY POWER: {totalArmyPower} PWR
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHADOW_ARMY_ROSTER.map((s) => {
            const isExtracted = currentLevel >= s.reqLvl;
            return (
              <div
                key={s.id}
                className={`p-3 border rounded-sm flex items-center gap-3 font-['Share_Tech_Mono'] text-xs transition-all ${
                  isExtracted
                    ? 'border-[var(--purple)] bg-[rgba(139,92,246,0.1)] text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                    : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text-faint)] opacity-40'
                }`}
              >
                <div className="text-2xl">{s.icon}</div>
                <div className="flex-1">
                  <div className="font-['Orbitron'] font-bold text-xs tracking-wider uppercase">
                    {s.name}
                  </div>
                  <div className="text-[10px] text-[var(--purple)]">{s.rank} (+{s.bonusPower} PWR)</div>
                  <div className="text-[9px] text-[var(--text-dim)] mt-0.5">{s.passiveBuff}</div>
                </div>
                <div className="font-bold text-[10px] uppercase tracking-widest text-right">
                  {isExtracted ? (
                    <span className="text-[var(--purple)]">[ EXTRACTED ]</span>
                  ) : (
                    <span>[ REQ: LV. {s.reqLvl} ]</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WEEKLY & MONTHLY PROGRESS TRACKING ANALYTICS */}
      <ProgressAnalytics player={player} analyticsData={analyticsData} onFetchAnalytics={onFetchAnalytics} />

      {/* DUNGEON CLEAR HISTORY */}
      <DungeonClearHistory player={player} quest={quest} />

    </div>
  );
};

export default StatusPage;