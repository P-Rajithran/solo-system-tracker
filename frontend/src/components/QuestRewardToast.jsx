import { useEffect } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

const QuestRewardToast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      playSystemSound(toast.type === 'revert' ? 'click' : 'complete');
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="pointer-events-auto w-full animate-fade-in">
      <div 
        className="relative bg-gradient-to-r from-[#051424] via-[#092238] to-[#051424] border-2 border-[var(--glow)] p-3.5 shadow-[0_0_30px_rgba(45,212,255,0.6)] text-left flex items-center justify-between gap-3"
        style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#07162b] border border-[var(--glow)] rounded-xs flex items-center justify-center text-xl shrink-0 shadow-[0_0_10px_rgba(45,212,255,0.3)]">
            {toast.icon || '⚡'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-['Orbitron'] text-[10px] tracking-[2px] text-[var(--glow)] uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[var(--glow)] rounded-full animate-ping"></span>
              [ SYSTEM ACQUISITION ]
            </div>

            <div className="font-['Orbitron'] text-xs font-bold text-white tracking-wider truncate uppercase">
              {toast.title}
            </div>

            <div className="font-['Share_Tech_Mono'] text-xs text-[var(--gold)] font-extrabold tracking-wide flex items-center gap-1 mt-0.5">
              <span>EARNED:</span>
              <span className="text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 border border-emerald-500/40 rounded-2xs">
                {toast.earnedText}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white font-mono text-xs p-1 shrink-0 cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default QuestRewardToast;
