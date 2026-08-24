import { playSystemSound } from '../utils/hunterUtils';

const AchievementUnlockedModal = ({ achievement, onClose }) => {
  if (!achievement) return null;

  const handleClose = () => {
    playSystemSound('click');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#070b14] border-2 border-[var(--gold)] p-6 shadow-[0_0_40px_rgba(251,191,36,0.5)] text-center space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar box-border">
        
        {/* TOP SYSTEM TAG */}
        <div className="font-['Orbitron'] text-[11px] tracking-[3px] text-[var(--gold)] uppercase flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-[var(--gold)] rounded-full animate-ping"></span>
          [ SYSTEM FEAT UNLOCKED ]
        </div>

        {/* TITLE */}
        <div className="font-['Orbitron'] text-2xl font-black text-white tracking-widest drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]">
          ACHIEVEMENT UNLOCKED!
        </div>

        <div className="h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent w-full my-2"></div>

        {/* ACHIEVEMENT ICON & DISPLAY */}
        <div className="py-3 flex flex-col items-center justify-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-amber-950/60 border-2 border-[var(--gold)] flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce">
            {achievement.icon || '🏆'}
          </div>
          <div className="font-['Orbitron'] text-xl font-extrabold text-[var(--gold)] tracking-wide">
            {achievement.name}
          </div>
          <div className="text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] max-w-xs leading-relaxed">
            {achievement.description}
          </div>
        </div>

        {/* REWARDS SUMMARY */}
        <div className="bg-[#0a0f1c] border border-amber-500/40 p-3 text-center font-['Share_Tech_Mono'] text-xs text-amber-300 rounded-sm">
          🏆 PERMANENT SYSTEM TROPHY ADDED TO HUNTER RECORD
        </div>

        {/* CLOSE BUTTON */}
        <button
          onClick={handleClose}
          className="w-full bg-[var(--gold)] hover:bg-amber-400 text-[#04141c] font-['Orbitron'] font-extrabold text-xs tracking-[2px] py-3 uppercase transition-all shadow-[0_0_15px_rgba(251,191,36,0.6)] cursor-pointer mt-2"
        >
          [ CLAIM TROPHY & CONTINUE ]
        </button>
      </div>
    </div>
  );
};

export default AchievementUnlockedModal;
