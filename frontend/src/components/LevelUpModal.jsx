import { playSystemSound } from '../utils/hunterUtils';

const LevelUpModal = ({ level, player, onAllocateStat, onClose }) => {
  const availablePoints = player?.availableStatPoints || 3;

  const statsList = [
    { key: 'STR', label: 'STR (Strength & Boss ATK)' },
    { key: 'VIT', label: 'VIT (Health & Fat Loss)' },
    { key: 'MEN', label: 'MEN (Mentality & Focus)' },
    { key: 'DIS', label: 'DIS (Discipline & Streaks)' }
  ];

  const handleStatClick = (statKey) => {
    if (availablePoints > 0 && onAllocateStat) {
      playSystemSound('statUp');
      onAllocateStat(statKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#070b14] border-2 border-[var(--glow)] p-5 sm:p-6 shadow-[0_0_40px_rgba(45,212,255,0.4)] text-center space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar box-border">
        
        {/* TOP SYSTEM TAG */}
        <div className="font-['Orbitron'] text-[11px] tracking-[3px] text-[var(--glow)] uppercase flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-[var(--glow)] rounded-full animate-ping"></span>
          [ SYSTEM LEVEL UP ALARM ]
        </div>

        {/* LEVEL UP TITLE */}
        <div className="font-['Orbitron'] text-3xl font-black text-white tracking-widest drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
          LEVEL UP!
        </div>

        <div className="h-[2px] bg-gradient-to-r from-transparent via-[var(--glow)] to-transparent w-full my-2"></div>

        {/* LEVEL NUMBER DISPLAY */}
        <div className="py-1">
          <div className="text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] uppercase tracking-wider">
            Current Hunter Level
          </div>
          <div className="font-['Orbitron'] text-5xl font-extrabold text-[var(--gold)] mt-1 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
            LV. {level}
          </div>
        </div>

        {/* REWARDS GRANTED SUMMARY */}
        <div className="bg-[#0a0f1c] border border-[var(--line)] p-3 text-left font-['Share_Tech_Mono'] text-xs space-y-1 rounded-sm">
          <div className="text-[var(--glow)] font-bold mb-1 font-['Orbitron']">REWARDS GRANTED:</div>
          <div className="text-emerald-400">✓ HP Fully Restored (100 / 100 HP)</div>
          <div className="text-amber-300 font-bold">✓ +3 Unallocated Stat Points Awarded</div>
        </div>

        {/* INTERACTIVE STAT ALLOCATION SECTION */}
        <div className="bg-[#070e1c] border border-amber-500/60 p-3 text-left space-y-2.5 rounded-sm">
          <div className="flex justify-between items-center font-['Orbitron'] border-b border-amber-500/30 pb-2">
            <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
              ⚡ ALLOCATE STAT POINTS NOW
            </span>
            <span className="text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500 px-2 py-0.5 animate-pulse rounded-xs">
              {availablePoints} PTS AVAILABLE
            </span>
          </div>

          <div className="space-y-2 font-['Share_Tech_Mono'] text-xs">
            {statsList.map((s) => {
              const currentVal = player?.stats?.[s.key] ?? 10;
              return (
                <div key={s.key} className="flex justify-between items-center bg-black/60 p-2 border border-slate-800 rounded-xs">
                  <span className="text-slate-200">{s.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-['Orbitron'] text-sm font-bold text-white">{currentVal}</span>
                    {availablePoints > 0 && (
                      <button
                        onClick={() => handleStatClick(s.key)}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-['Orbitron'] font-black text-xs px-2.5 py-0.5 rounded-xs transition-all cursor-pointer shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                        title={`Increase ${s.key}`}
                      >
                        +1
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONFIRM BUTTON */}
        <button
          onClick={onClose}
          className="w-full bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs tracking-[2px] py-3 uppercase transition-all shadow-[0_0_15px_rgba(45,212,255,0.5)] cursor-pointer mt-2"
        >
          [ ACCEPT REWARDS & CONTINUE ]
        </button>
      </div>
    </div>
  );
};

export default LevelUpModal;