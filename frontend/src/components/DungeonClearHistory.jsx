import { playSystemSound } from '../utils/hunterUtils';

const DungeonClearHistory = ({ player, quest }) => {
  const streakDays = player?.streakCount || (quest?.isCompleted ? 1 : 0);
  const targetDays = 5;
  const isGateCleared = streakDays >= targetDays;
  const progressPct = Math.min(100, Math.round((streakDays / targetDays) * 100));

  const historyLogs = [
    { date: 'Current Gate Mission', dungeon: 'S-Rank Red Gate (5-Day Challenge)', status: isGateCleared ? 'CLEARED' : 'IN PROGRESS', xp: '+100 XP / 🪙 +500 Gold' },
    { date: 'Previous Dungeon', dungeon: 'Goblin Nest Raid', status: 'CLEARED', xp: '+80 XP / 🪙 +250 Gold' },
    { date: 'Instant Dungeon', dungeon: 'Subway Penalty Zone', status: 'CLEARED', xp: '+50 XP / 🪙 +100 Gold' },
  ];

  const handleClaimReward = async () => {
    if (!isGateCleared) return;
    playSystemSound('levelup');
    try {
      const token = localStorage.getItem('hunter_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      await fetch('http://localhost:5000/api/player/allocate-stat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ statKey: 'STR' })
      });
    } catch {
      // Handle gracefully
    }
  };

  return (
    <div className="system-card border border-[var(--line)] bg-[var(--panel-2)] p-4 font-['Share_Tech_Mono'] space-y-3">
      {/* HEADER */}
      <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] border-b border-[var(--line)] pb-2 flex justify-between items-center flex-wrap gap-2">
        <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
          WEEKLY DUNGEON GATE CHALLENGE (5-DAY LOGGING MISSION)
        </span>
        <span className="text-xs text-[var(--gold)] font-bold">
          GATE CLEARS: {player?.dungeonClears || Math.floor(streakDays / 5)} CLEARED
        </span>
      </div>

      {/* 5-DAY CONSECUTIVE LOGGING CHALLENGE CARD */}
      <div className="p-3 bg-[#070e1c] border border-[var(--glow-dim)] rounded-sm space-y-2">
        <div className="font-['Orbitron'] text-xs text-cyan-300 font-bold flex justify-between items-center">
          <span>[ ⚔️ WEEKLY RED GATE SURVIVAL ]</span>
          <span className={isGateCleared ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isGateCleared ? '[ 🏆 GATE CLEARED! ]' : `${streakDays} / ${targetDays} CONSECUTIVE DAYS`}
          </span>
        </div>

        {/* SPECIFIC TARGET REQUIREMENT BEFORE STARTING */}
        <div className="p-2.5 bg-black/60 border border-cyan-500/40 rounded-2xs space-y-1 text-xs text-slate-300">
          <div className="font-['Orbitron'] text-[10px] text-amber-300 font-bold uppercase tracking-wider">
            📋 SPECIFIC ENTRY TARGET REQUIREMENT
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold">• TARGET GOAL:</span>
            <span className="text-cyan-300 font-bold underline font-['Orbitron']">5 CONSECUTIVE DAYS LOGGING</span>
          </div>
          <p className="text-[11px] text-slate-300">Log physical & discipline metrics daily for 5 consecutive days to breach the Red Gate.</p>
        </div>

        <div className="w-full bg-[#050914] h-3 rounded-full overflow-hidden border border-[var(--line)]">
          <div 
            className="bg-gradient-to-r from-[var(--glow-dim)] to-[var(--glow)] h-full shadow-[0_0_12px_rgba(45,212,255,0.8)] transition-all duration-700" 
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-[11px] text-[var(--text-dim)] flex-wrap gap-2">
          <span>Log physical/life metrics for 5 consecutive days to clear the Red Gate.</span>
          {isGateCleared ? (
            <button
              onClick={handleClaimReward}
              className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 font-['Orbitron'] font-bold text-[10px] px-3 py-1 uppercase rounded-sm cursor-pointer shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            >
              [ CLAIM GATE REWARD (+500 GOLD) ]
            </button>
          ) : (
            <span className="text-[var(--gold)] font-bold">REWARD: 🪙 +500 GOLD & +100 EXP</span>
          )}
        </div>
      </div>

      {/* HISTORY LOGS */}
      <div className="space-y-2">
        {historyLogs.map((log, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-2.5 bg-[#0a0f1c] border border-[var(--line)] text-xs rounded-sm"
          >
            <div>
              <div className="font-['Orbitron'] text-[11px] text-white font-bold">{log.dungeon}</div>
              <div className="text-[10px] text-[var(--text-dim)]">{log.date}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[var(--gold)]">{log.xp}</span>
              <span className={`px-2 py-0.5 text-[9px] font-['Orbitron'] font-bold border ${
                log.status === 'CLEARED' 
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30' 
                  : 'border-amber-500 text-amber-400 bg-amber-950/30'
              }`}>
                [{log.status}]
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DungeonClearHistory;
