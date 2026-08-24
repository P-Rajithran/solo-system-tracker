import { useEffect } from 'react';
import { playSystemSound, getHunterRank } from '../utils/hunterUtils';

const QuestCompleteOverlay = ({ isOpen, player, expGained = 30, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      playSystemSound('levelup');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rankObj = getHunterRank(player?.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 animate-fade-in select-none">
      <div 
        className="relative max-w-lg w-full bg-gradient-to-b from-[#081226] via-[#050b16] to-[#0a0714] border-2 border-[var(--glow)] p-8 shadow-[0_0_60px_rgba(45,212,255,0.7)] text-center space-y-5"
        style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
      >
        {/* CORNER ACCENTS */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[var(--glow)]"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[var(--glow)]"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[var(--glow)]"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[var(--glow)]"></div>

        {/* HEADER SYSTEM ALERT */}
        <div className="font-['Orbitron'] text-xs tracking-[4px] text-[var(--glow)] uppercase animate-pulse">
          [ SYSTEM NOTIFICATION: QUEST CLEARED ]
        </div>

        {/* GLOWING TITLE */}
        <div className="font-['Orbitron'] text-3xl sm:text-4xl font-black text-white tracking-[4px] drop-shadow-[0_0_20px_rgba(45,212,255,0.9)] uppercase">
          DAILY QUEST COMPLETE!
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--glow)] to-transparent w-full my-2"></div>

        {/* REWARDS BREAKDOWN */}
        <div className="bg-[#050e1f] border border-cyan-800 p-4 space-y-3 font-['Share_Tech_Mono'] text-left">
          <div className="text-xs font-['Orbitron'] text-[var(--gold)] uppercase tracking-wider border-b border-cyan-900 pb-1">
            REWARDS & SYSTEM ACQUISITIONS:
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#0a152d] p-2.5 border border-cyan-900 flex justify-between items-center">
              <span className="text-cyan-300">⚡ EXP GAINED:</span>
              <strong className="text-white font-mono text-base">+{expGained} XP</strong>
            </div>

            <div className="bg-[#0a152d] p-2.5 border border-amber-900 flex justify-between items-center">
              <span className="text-amber-300">🪙 GOLD COINS:</span>
              <strong className="text-amber-300 font-mono text-base">+50 GOLD</strong>
            </div>

            <div className="bg-[#0a152d] p-2.5 border border-red-900 flex justify-between items-center">
              <span className="text-red-400">❤️ HP RESTORED:</span>
              <strong className="text-red-400 font-mono text-base">+20 HP</strong>
            </div>

            <div className="bg-[#0a152d] p-2.5 border border-purple-900 flex justify-between items-center">
              <span className="text-purple-300">👑 HUNTER RANK:</span>
              <strong className={`font-mono text-sm px-1.5 py-0.5 border rounded-xs ${rankObj.color}`}>
                {rankObj.title}
              </strong>
            </div>
          </div>
        </div>

        {/* LEVEL STATUS BAR */}
        <div className="space-y-1 text-left font-['Share_Tech_Mono'] text-xs">
          <div className="flex justify-between">
            <span className="text-cyan-300 font-['Orbitron']">HUNTER LEVEL: LV. {player?.level || 1}</span>
            <span className="text-[var(--text-dim)]">{player?.exp || 0} / 100 EXP</span>
          </div>
          <div className="w-full bg-[#0a1120] h-3 border border-cyan-800 rounded-xs overflow-hidden">
            <div
              className="bg-gradient-to-r from-[var(--glow-dim)] to-[var(--glow)] h-full shadow-[0_0_12px_rgba(45,212,255,0.8)] transition-all duration-700"
              style={{ width: `${Math.min(100, player?.exp || 0)}%` }}
            ></div>
          </div>
        </div>

        {/* DISMISS BUTTON */}
        <button
          onClick={onClose}
          className="w-full bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-black text-xs tracking-[3px] py-3.5 uppercase transition-all shadow-[0_0_25px_rgba(45,212,255,0.6)] cursor-pointer"
        >
          [ CONTINUE LEVELING UP ]
        </button>
      </div>
    </div>
  );
};

export default QuestCompleteOverlay;
