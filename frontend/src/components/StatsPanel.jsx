import { playSystemSound } from '../utils/hunterUtils';

const StatsPanel = ({ player, onAllocateStat }) => {
  const availablePoints = player?.availableStatPoints || 0;

  const statsList = [
    { key: 'STR', label: 'STR (Workout & Strength)', desc: 'Increases physical power and boss attack damage' },
    { key: 'VIT', label: 'VIT (Fat Loss & Health)', desc: 'Boosts max HP and metabolism efficiency' },
    { key: 'MEN', label: 'MEN (Meditation & Mentality)', desc: 'Sharpens focus rating and AI coach accuracy' },
    { key: 'DIS', label: 'DIS (Tracking & Discipline)', desc: 'Unlocks streak bonuses and daily gold multipliers' }
  ];

  const handleStatClick = (statKey) => {
    if (availablePoints > 0 && onAllocateStat) {
      playSystemSound('statUp');
      onAllocateStat(statKey);
    }
  };

  return (
    <div className="system-card space-y-4 border-2 border-[var(--line)] bg-[var(--panel)]">
      {/* HEADER WITH BADGE */}
      <div className="flex justify-between items-center border-b border-[var(--line)] pb-3 flex-wrap gap-2">
        <h2 className="text-xs font-bold text-[var(--glow)] font-['Orbitron'] tracking-[2px] uppercase flex items-center gap-2">
          <span className="text-[10px]">◆</span> HUNTER BASE ATTRIBUTE STATS
        </h2>
        {availablePoints > 0 ? (
          <span className="text-xs font-['Orbitron'] bg-amber-950/80 text-amber-300 border border-amber-500/80 px-2.5 py-1 animate-pulse font-bold tracking-wider rounded-xs shadow-[0_0_10px_rgba(251,191,36,0.4)]">
            ⚡ {availablePoints} UNALLOCATED {availablePoints === 1 ? 'POINT' : 'POINTS'} AVAILABLE
          </span>
        ) : (
          <span className="text-[10px] font-['Share_Tech_Mono'] text-[var(--text-dim)]">
            [ STAT POINTS BALANCED ]
          </span>
        )}
      </div>

      {/* ALLOCATE STAT POINTS PROMPT BANNER WHEN POINTS > 0 */}
      {availablePoints > 0 && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/60 rounded-xs text-xs font-['Share_Tech_Mono'] text-amber-200 flex justify-between items-center flex-wrap gap-2 animate-fade-in">
          <span>⚡ <strong>ALLOCATE STAT POINTS:</strong> Click <strong>[ +1 ]</strong> on any stat to spend 1 available point live!</span>
          <span className="font-['Orbitron'] text-[10px] text-amber-400 font-bold">BALANCE: {availablePoints} PTS</span>
        </div>
      )}

      {/* STAT STEPPERS LIST */}
      <div className="space-y-2.5 font-['Share_Tech_Mono'] text-xs">
        {statsList.map((s) => {
          const currentVal = player?.stats?.[s.key] ?? 10;

          return (
            <div 
              key={s.key} 
              className={`flex justify-between items-center p-3 border rounded-sm transition-all ${
                availablePoints > 0
                  ? 'bg-[#091224] border-[var(--glow-dim)] hover:border-[var(--glow)] shadow-[0_0_10px_rgba(45,212,255,0.1)]'
                  : 'bg-[#0a0f1c] border-[var(--line)]'
              }`}
            >
              <div>
                <div className="font-bold text-white tracking-wider flex items-center gap-2">
                  <span>{s.label}</span>
                </div>
                <div className="text-[10px] text-[var(--text-dim)] mt-0.5">{s.desc}</div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-['Orbitron'] text-base font-bold text-[var(--glow)]">
                  {currentVal}
                </span>

                {availablePoints > 0 && (
                  <button
                    onClick={() => handleStatClick(s.key)}
                    className="bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs px-3 py-1 rounded-xs transition-all cursor-pointer shadow-[0_0_12px_rgba(45,212,255,0.5)] active:scale-95 flex items-center gap-1"
                    title={`Spend 1 point to increase ${s.key}`}
                  >
                    <span>+1</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsPanel;