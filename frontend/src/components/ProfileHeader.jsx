import { getHunterRank } from '../utils/hunterUtils';
import profilePic from '../assets/default-avatar.svg';

const ProfileHeader = ({ player }) => {
  const rankInfo = getHunterRank(player?.level || 1);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center border-b border-[var(--line)] pb-6">
      
      {/* Avatar Section */}
      <div className="relative shrink-0">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-sm border-2 border-[var(--glow)] overflow-hidden shadow-[0_0_20px_rgba(45,212,255,0.5)] group bg-[#0a1120]">
          <img 
            src={player?.avatarUrl || profilePic} 
            alt="Hunter Avatar" 
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
          />
        </div>
        <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-0.5 text-[10px] font-['Orbitron'] font-bold border bg-black whitespace-nowrap ${rankInfo.color} shadow-[0_0_10px_rgba(0,0,0,0.8)]`}>
          LVL {player?.level || 1}
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="flex-1 w-full space-y-3 font-['Share_Tech_Mono'] text-xs sm:text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#050914] p-3 border border-[var(--line)] rounded-sm">
          <div><span className="text-[var(--text-dim)] font-['Orbitron']">NAME:</span> <span className="font-bold text-white tracking-wider">{player?.name || 'Player'}</span></div>
          <div><span className="text-[var(--text-dim)] font-['Orbitron']">CLASS:</span> <span className="text-[var(--glow)] font-bold">Iron Sovereign</span></div>
          <div className="col-span-1 md:col-span-2">
            <span className="text-[var(--text-dim)] font-['Orbitron']">TITLE:</span>{' '}
            <span className="text-[var(--gold)] font-bold tracking-widest uppercase">{rankInfo.title}</span>
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-between">
            <span className="text-[var(--text-dim)] font-['Orbitron']">HUNTER EXP:</span> 
            <span className="text-cyan-300 font-bold">{player?.exp || 0} / 100 EXP</span>
          </div>
        </div>

        {/* HP Consistency Bar */}
        <div className="w-full">
          <div className="flex justify-between mb-1 text-xs font-bold font-['Orbitron']">
            <span className="text-red-400 flex items-center gap-1">❤️ HEALTH POINTS (CONSISTENCY)</span>
            <span className="text-red-400">{player?.hp || 100}/100 HP</span>
          </div>
          <div className="w-full bg-[#0a1120] h-3 rounded-xs overflow-hidden border border-red-900/80">
            <div 
              className="bg-gradient-to-r from-red-800 to-red-500 h-full shadow-[0_0_12px_rgba(239,68,68,0.8)] transition-all duration-700" 
              style={{ width: `${Math.min(100, Math.max(0, player?.hp || 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProfileHeader;