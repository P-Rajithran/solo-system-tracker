const ACHIEVEMENTS_CATALOG = [
  {
    id: 'first_gate_cleared',
    name: 'First Gate Cleared',
    description: 'Clear your first Rank Gate Dungeon and claim its rewards',
    icon: '⚔️',
    hint: '🔒 Clear your first Rank Gate Dungeon'
  },
  {
    id: 'streak_7_days',
    name: '7-Day Streak',
    description: 'Maintain a 7-day daily quest completion streak',
    icon: '🔥',
    hint: '🔒 Reach a 7-day completion streak'
  },
  {
    id: 'streak_30_days',
    name: '30-Day Streak',
    description: 'Maintain a 30-day daily quest completion streak',
    icon: '👑',
    hint: '🔒 Reach a 30-day completion streak'
  },
  {
    id: 'first_5kg_lost',
    name: 'First 5kg Lost',
    description: 'Lose at least 5kg from your baseline starting weight',
    icon: '⚖️',
    hint: '🔒 Lose 5kg from starting weight'
  },
  {
    id: 'halfway_there',
    name: 'Halfway There',
    description: 'Achieve 50% or more of your total weight loss/gain goal',
    icon: '🎯',
    hint: '🔒 Reach 50% of your target weight goal'
  },
  {
    id: 'level_10_hunter',
    name: 'Level 10 Hunter',
    description: 'Reach Hunter Level 10 and ascend to D-Rank',
    icon: '⚡',
    hint: '🔒 Reach Hunter Level 10'
  },
  {
    id: 's_rank_ascension',
    name: 'S-Rank Ascension',
    description: 'Reach Hunter Level 30 and awaken as an S-Rank Iron Sovereign',
    icon: '🌌',
    hint: '🔒 Reach Hunter Level 30'
  }
];

const AchievementsPage = ({ player }) => {
  const unlockedIds = player?.unlockedAchievements || [];
  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS_CATALOG.length;
  const completionPct = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full box-border relative z-0">
      
      {/* HEADER CARD */}
      <div className="system-card border-2 border-[var(--gold)] bg-gradient-to-b from-[#120e06] to-[#07090e] p-5 sm:p-6 shadow-[0_0_25px_rgba(251,191,36,0.2)]">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-amber-500/40 pb-4">
          <div>
            <h1 className="font-['Orbitron'] text-lg sm:text-xl font-extrabold text-[var(--gold)] tracking-wider uppercase flex items-center gap-2">
              <span>🏆</span> SYSTEM ACHIEVEMENTS & TROPHIES
            </h1>
            <p className="text-xs text-slate-300 font-['Share_Tech_Mono'] mt-1">
              Complete real-life habits, gates, and level milestones to earn system titles and badges.
            </p>
          </div>

          <div className="font-['Orbitron'] text-right bg-black/60 p-3 border border-amber-500/60 rounded-sm shrink-0">
            <div className="text-[10px] text-amber-400 tracking-widest uppercase font-bold">UNLOCKED FEATS</div>
            <div className="text-xl font-black text-white mt-0.5">
              {unlockedCount} / {totalCount} <span className="text-xs text-[var(--gold)]">({completionPct}%)</span>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4 space-y-1.5 font-['Share_Tech_Mono']">
          <div className="flex justify-between text-xs text-slate-300">
            <span>TOTAL SYSTEM ASCENSION PROGRESS</span>
            <span className="font-bold text-[var(--gold)]">{completionPct}% COMPLETE</span>
          </div>
          <div className="w-full bg-black h-3 border border-amber-500/40 rounded-xs overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-[var(--gold)] transition-all duration-700 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
              style={{ width: `${completionPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* EMPTY STATE ADVISORY FOR NEW ACCOUNTS */}
      {unlockedCount === 0 && (
        <div className="p-4 bg-[#0a0f1d] border-2 border-amber-500/50 rounded-sm font-['Share_Tech_Mono'] text-xs text-slate-300 space-y-2 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
          <div className="font-['Orbitron'] text-xs text-amber-300 font-bold tracking-wider flex items-center gap-2">
            <span>🛡️</span> [ SYSTEM NOTICE ]: NO SYSTEM ACHIEVEMENTS UNLOCKED YET
          </div>
          <p className="leading-relaxed text-slate-300">
            Welcome, Hunter! All trophies and system titles are currently locked. Complete daily workouts, log physical metrics, maintain quest streaks, and clear rank gate dungeons to unlock your first achievements below.
          </p>
        </div>
      )}

      {/* ACHIEVEMENTS BADGES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-['Share_Tech_Mono']">
        {ACHIEVEMENTS_CATALOG.map((ach) => {
          const isUnlocked = unlockedIds.includes(ach.id);

          return (
            <div
              key={ach.id}
              className={`p-4 border-2 rounded-sm space-y-3 transition-all relative overflow-hidden flex flex-col justify-between ${
                isUnlocked
                  ? 'border-[var(--gold)] bg-gradient-to-b from-[#140f06] to-[#07090e] shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                  : 'border-slate-800 bg-[#050810]/80 opacity-60 grayscale hover:opacity-80'
              }`}
            >
              <div className="space-y-3">
                {/* ICON & TITLE HEADER */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-sm border flex items-center justify-center text-2xl shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-950/60 border-[var(--gold)] text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}>
                    {ach.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-['Orbitron'] text-sm font-bold text-white tracking-wide truncate">
                      {ach.name}
                    </div>
                    <div className={`text-[10px] font-['Orbitron'] font-bold uppercase mt-0.5 ${
                      isUnlocked ? 'text-[var(--gold)]' : 'text-slate-500'
                    }`}>
                      {isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                    </div>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="text-xs text-slate-300 font-['Rajdhani'] font-medium leading-snug">
                  {ach.description}
                </div>
              </div>

              {/* UNLOCK CONDITION / HINT FOOTER */}
              <div className="pt-3 border-t border-current/20 text-[11px]">
                {isUnlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ✓ ACHIEVEMENT COMPLETED
                  </span>
                ) : (
                  <span className="text-amber-400/90 font-semibold italic">
                    {ach.hint}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default AchievementsPage;
