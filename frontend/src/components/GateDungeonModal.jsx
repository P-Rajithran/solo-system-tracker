import { API_BASE_URL, API_ROOT } from '../utils/apiConfig';
import { useState } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

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

const GateDungeonModal = ({ isOpen, player, quest, onClose, onClaimSuccess, onNavigateTab }) => {
  const [clearedGates, setClearedGates] = useState(() => {
    const saved = localStorage.getItem('hunter_cleared_gates');
    return saved ? JSON.parse(saved) : [];
  });
  const [isClaiming, setIsClaiming] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  if (!isOpen) return null;

  const handleGoToLogMetrics = () => {
    playSystemSound('click');
    onClose();
    if (onNavigateTab) {
      onNavigateTab('/nutrition');
    } else {
      window.location.hash = '#/nutrition';
    }
  };

  const handleClaimReward = async (gate) => {
    setIsClaiming(true);
    playSystemSound('levelup');

    try {
      const token = localStorage.getItem('hunter_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE_URL}/quests/claim-gate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          gateId: gate.title,
          rewardGold: gate.rewardGold,
          rewardXp: gate.rewardXp
        })
      });

      const data = await res.json();
      const updatedCleared = [...clearedGates, gate.gateId];
      setClearedGates(updatedCleared);
      localStorage.setItem('hunter_cleared_gates', JSON.stringify(updatedCleared));

      setToastMsg(data.message || `[ GATE CLEARED ]: 🪙 +${gate.rewardGold} GOLD COINS & +${gate.rewardXp} XP added to your System Wallet!`);

      if (onClaimSuccess && data.player) {
        onClaimSuccess(data.player);
      }
    } catch (err) {
      console.error('[GATE CLAIM ERROR]:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div 
        className="relative w-full max-w-xl border-2 border-[var(--glow)] bg-[#070b14] p-4 sm:p-6 pb-6 sm:pb-8 shadow-[0_0_40px_rgba(45,212,255,0.4)] text-left space-y-4 h-auto min-h-fit max-h-[92vh] overflow-y-auto custom-scrollbar box-border z-50"
        style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
      >
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-[var(--line)] pb-2 font-['Orbitron'] flex-wrap gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] tracking-[3px] text-[var(--glow)] uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--glow)] rounded-full animate-ping shrink-0"></span>
              <span className="truncate">[ SYSTEM RANK GATE DUNGEONS ]</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-white tracking-wider mt-0.5 truncate">
              ACTIONABLE HABIT GATE CHALLENGES
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm shrink-0 cursor-pointer">✕</button>
        </div>

        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-['Orbitron'] text-xs tracking-wider animate-fade-in flex items-center justify-between flex-wrap gap-2 box-border">
            <span className="min-w-0 flex-1 break-words">{toastMsg}</span>
            <span className="text-emerald-400 font-mono text-[10px] shrink-0">WALLETS SYNCED</span>
          </div>
        )}

        {/* GATE CARDS CONTAINER WITH POLISHED SPACING, H-AUTO, MIN-H-FIT, AND PB-6 */}
        <div className="flex flex-col font-['Share_Tech_Mono'] w-full max-w-full box-border pb-6 sm:pb-8 h-auto min-h-fit">
          {GATE_CHALLENGES.map((gate) => {
            const currentProg = gate.getCurrentProgress(player, quest);
            const isCompleted = currentProg >= gate.targetValue;
            const isAlreadyCleared = clearedGates.includes(gate.gateId);
            const progPct = Math.min(100, Math.round((currentProg / gate.targetValue) * 100));

            return (
              <div
                key={gate.gateId}
                className={`p-3.5 sm:p-4 border-2 rounded-sm space-y-3 transition-all w-full max-w-full box-border h-auto min-h-fit mt-4 first:mt-0 ${
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
                    {isAlreadyCleared ? '[ 🔒 GATE CLOSED ]' : isCompleted ? '[ 🏆 OBJECTIVE MET! ]' : '[ ⚔️ IN PROGRESS ]'}
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
                      onClick={() => handleClaimReward(gate)}
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
        </div>

        {/* CLOSE BUTTON */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-['Orbitron'] text-xs py-2.5 uppercase cursor-pointer box-border"
          >
            [ CLOSE DUNGEON GATE WINDOW ]
          </button>
        </div>

      </div>
    </div>
  );
};

export default GateDungeonModal;