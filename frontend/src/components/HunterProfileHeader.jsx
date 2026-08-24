import { useState, useRef } from 'react';
import { getHunterRank, playSystemSound } from '../utils/hunterUtils';
import defaultAvatar from '../assets/default-avatar.svg';
import EditProfileModal from './EditProfileModal';

const HunterProfileHeader = ({ player, onLogout, onUpdateAvatar, onSaveProfile, onOpenShadowTraining }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('hunter_sound_muted') === 'true';
  });
  const fileInputRef = useRef(null);
  const level = player?.level || 1;
  const rankInfo = getHunterRank(level);

  const toggleSoundMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('hunter_sound_muted', nextMuted ? 'true' : 'false');
    if (!nextMuted) {
      playSystemSound('click');
    }
  };

  const handleAvatarClick = () => {
    playSystemSound('click');
    if (onUpdateAvatar) {
      onUpdateAvatar();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result;
      playSystemSound('levelUp');
      localStorage.setItem('hunter_avatar', base64Url);
      if (onUpdateAvatar) {
        onUpdateAvatar(base64Url);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentAvatar = player?.avatarUrl || defaultAvatar;

  return (
    <>
      <div className="system-card border-2 border-[var(--glow)] bg-[#070d19]/95 p-3.5 sm:p-4 shadow-[0_0_35px_rgba(45,212,255,0.3)] mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* LEFT & MIDDLE: AVATAR + NAME & RANK */}
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            {/* CIRCULAR PROFILE AVATAR WITH UPLOAD */}
            <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick} title="Click to change avatar">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[var(--glow)] overflow-hidden shadow-[0_0_20px_rgba(45,212,255,0.5)] bg-[#0a1120] relative">
                <img 
                  src={currentAvatar} 
                  alt="Hunter Profile" 
                  className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-110 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-['Orbitron'] text-[var(--glow)] font-bold transition-opacity">
                  [ EDIT ]
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] font-['Orbitron'] font-bold border bg-black whitespace-nowrap rounded-xs ${rankInfo.color}`}>
                LVL {level}
              </div>
            </div>

            {/* DYNAMIC PLAYER NAME, EDIT ICON & RANK */}
            <div className="space-y-0.5 text-left font-['Share_Tech_Mono']">
              <div className="font-['Orbitron'] text-base sm:text-lg font-black text-white tracking-wider uppercase flex items-center gap-2">
                <span>{player?.name || 'Hunter'}</span>
                <button
                  onClick={() => { playSystemSound('click'); setIsEditOpen(true); }}
                  className="text-xs text-[var(--glow)] hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Edit Core System Profile"
                >
                  ⚙️
                </button>
                <span className="text-xs text-[var(--glow)] font-normal font-mono">[{rankInfo.rank}]</span>
              </div>
              <div className="text-xs text-[var(--gold)] font-bold uppercase tracking-widest flex items-center gap-2">
                <span>◆ {rankInfo.title}</span>
                <span className="text-[10px] bg-[rgba(251,191,36,0.15)] px-1.5 py-0.5 rounded-sm border border-[var(--gold)]">
                  BUFF: {rankInfo.buffPct}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-dim)] flex items-center gap-3">
                <span>CLASS: <strong className="text-[var(--glow)]">Iron Sovereign</strong></span>
                <span>HP: <strong className="text-red-400">{player?.hp || 100}/100</strong></span>
              </div>
            </div>
          </div>

          {/* RIGHT: GOLD COINS & SYSTEM CONTROL BUTTONS (AVATAR & LOGOUT) */}
          <div className="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
            <div className="text-right font-['Share_Tech_Mono']">
              <div className="text-[10px] text-[var(--text-dim)] uppercase">GOLD COINS</div>
              <div className="text-sm font-bold text-[var(--gold)]">
                🪙 {player?.goldCoins || 0}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSoundMute}
                className={`text-[10px] sm:text-xs font-['Orbitron'] font-bold tracking-wider px-2 py-1 uppercase border transition-all rounded-sm cursor-pointer flex items-center gap-1 ${
                  isMuted
                    ? 'border-slate-700 text-slate-500 bg-slate-950/60 hover:border-slate-500 hover:text-slate-300'
                    : 'border-cyan-500/60 text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/60 hover:border-cyan-400 hover:text-white shadow-[0_0_10px_rgba(45,212,255,0.2)]'
                }`}
                title={isMuted ? 'Unmute System Sound Effects' : 'Mute System Sound Effects'}
              >
                <span>{isMuted ? '🔇' : '🔊'}</span>
                <span>{isMuted ? '[ SFX: OFF ]' : '[ SFX: ON ]'}</span>
              </button>

              <button
                onClick={() => { playSystemSound('click'); onOpenShadowTraining && onOpenShadowTraining(); }}
                className="text-[10px] sm:text-xs font-['Orbitron'] font-bold tracking-wider px-2 py-1 uppercase border border-purple-500/80 text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 hover:border-purple-400 hover:text-white transition-all rounded-sm cursor-pointer flex items-center gap-1 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                title="Enter Shadow Training Grounds Micro-Quests"
              >
                <span>⚔️</span>
                <span>[ TRAINING ]</span>
              </button>

              <button
                onClick={() => { playSystemSound('click'); onUpdateAvatar && onUpdateAvatar(); }}
                className="text-[10px] sm:text-xs font-['Orbitron'] font-bold tracking-wider px-2 py-1 uppercase border border-cyan-500/60 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400 hover:text-white transition-all rounded-sm cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(45,212,255,0.2)]"
                title="Customize Hunter Avatar Image"
              >
                <span>🖼️</span>
                <span>[ AVATAR ]</span>
              </button>

              <button
                onClick={onLogout}
                className="text-[10px] sm:text-xs font-['Orbitron'] font-bold tracking-wider px-2.5 py-1 uppercase border border-red-900/60 text-red-400 hover:bg-red-950/60 hover:border-red-500 hover:text-white transition-all opacity-80 hover:opacity-100 rounded-sm cursor-pointer"
              >
                [ LOGOUT ]
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <EditProfileModal
        isOpen={isEditOpen}
        player={player}
        onClose={() => setIsEditOpen(false)}
        onSaveProfile={(updated) => onSaveProfile && onSaveProfile(updated)}
      />
    </>
  );
};

export default HunterProfileHeader;
