import { useState } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

const DEFAULT_SEEDS = [
  { id: 'iron_sovereign', name: 'Iron Sovereign', seed: 'Iron_Sovereign' },
  { id: 'commander_igris', name: 'Commander Igris', seed: 'Commander_Igris' },
  { id: 'ant_king_beru', name: 'Ant King Beru', seed: 'Ant_King_Beru' },
  { id: 'tusk_high_orc', name: 'Tusk High Orc', seed: 'Tusk_High_Orc' },
  { id: 'iron_knight', name: 'Iron Knight', seed: 'Iron_Knight' },
  { id: 'tank_bear', name: 'Tank Bear', seed: 'Tank_Bear' },
  { id: 'elite_hunter', name: 'Elite Hunter', seed: 'Elite_Hunter' },
  { id: 'system_ai', name: 'System AI Core', seed: 'System_AI_Core' },
  { id: 'monarch_raid', name: 'Monarch Raid', seed: 'Monarch_Raid' },
  { id: 'kaisel_dragon', name: 'Kaisel Wyvern', seed: 'Kaisel_Wyvern' },
  { id: 'shadow_greed', name: 'Shadow Greed', seed: 'Shadow_Greed' },
  { id: 'ascended_monarch', name: 'Ascended Monarch', seed: 'Ascended_Monarch' }
];

const getDiceBearUrl = (seed) => {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
};

const AvatarSelectorModal = ({ currentAvatar, onSelectAvatar, onClose }) => {
  const [seedsList, setSeedsList] = useState(DEFAULT_SEEDS);
  const [customSeedInput, setCustomSeedInput] = useState('');

  const handleSelect = (url) => {
    playSystemSound('click');
    onSelectAvatar(url);
    onClose();
  };

  const handleReRoll = () => {
    playSystemSound('click');
    const randomWords = ['Vortex', 'Cyber', 'Neon', 'Spectre', 'Phantom', 'Matrix', 'Apex', 'Omega', 'Titan', 'Aegis', 'Hyperion', 'Zero'];
    const newSeeds = DEFAULT_SEEDS.map((item, idx) => {
      const randSeed = `${randomWords[idx]}_${Math.floor(Math.random() * 9000 + 1000)}`;
      return {
        id: `random_${idx}_${Date.now()}`,
        name: `${randomWords[idx]} Unit`,
        seed: randSeed
      };
    });
    setSeedsList(newSeeds);
  };

  const handleAddCustomSeed = (e) => {
    e.preventDefault();
    if (!customSeedInput.trim()) return;
    const cleanSeed = customSeedInput.trim();
    const customUrl = getDiceBearUrl(cleanSeed);
    handleSelect(customUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div 
        className="max-w-lg w-full border-2 border-[var(--glow)] bg-[#070d19] p-5 shadow-[0_0_35px_rgba(45,212,255,0.4)] relative max-h-[92vh] overflow-y-auto custom-scrollbar space-y-4"
        style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-[var(--line)] pb-2.5 font-['Orbitron']">
          <div className="text-xs font-bold tracking-[2px] text-[var(--glow)] uppercase flex items-center gap-2">
            <span>🤖 HUNTER SYSTEM AVATAR GENERATOR</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-dim)] font-['Share_Tech_Mono'] leading-relaxed bg-[#0a0f1c] p-2.5 border border-[var(--line)] rounded-sm">
          [ SYSTEM NOTICE ]: Select a generated System Bot avatar powered by DiceBear API, generate a custom seed avatar, or upload a custom image.
        </p>

        {/* CONTROLS: REROLL & CUSTOM SEED INPUT */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            onClick={handleReRoll}
            className="w-full sm:w-auto text-xs font-['Orbitron'] font-bold tracking-wider px-3 py-2 uppercase border border-cyan-500/60 text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 hover:border-cyan-400 hover:text-white transition-all rounded-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(45,212,255,0.2)]"
          >
            <span>⚡</span>
            <span>[ RE-ROLL ALL SEEDS ]</span>
          </button>

          <form onSubmit={handleAddCustomSeed} className="w-full sm:w-auto flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Custom seed name..."
              value={customSeedInput}
              onChange={(e) => setCustomSeedInput(e.target.value)}
              className="bg-[#0a0f1c] border border-[var(--line)] text-white text-xs px-2.5 py-1.5 outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono'] w-full sm:w-36 rounded-xs"
            />
            <button
              type="submit"
              className="text-xs font-['Orbitron'] font-bold px-2.5 py-1.5 bg-purple-950/60 border border-purple-500/60 text-purple-300 hover:bg-purple-900 hover:text-white rounded-xs cursor-pointer whitespace-nowrap"
            >
              CREATE
            </button>
          </form>
        </div>

        {/* DICEBEAR GENERATED AVATARS GRID */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 my-2">
          {seedsList.map((item) => {
            const avatarUrl = getDiceBearUrl(item.seed);
            const isSelected = currentAvatar === avatarUrl;
            return (
              <div
                key={item.id}
                onClick={() => handleSelect(avatarUrl)}
                className={`p-2 border bg-[#0a1120] cursor-pointer transition-all hover:scale-105 flex flex-col items-center gap-1.5 group rounded-xs relative ${
                  isSelected 
                    ? 'border-[var(--glow)] bg-cyan-950/40 shadow-[0_0_15px_rgba(45,212,255,0.5)]' 
                    : 'border-[var(--line)] hover:border-[var(--glow-dim)]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1 right-1 text-[10px] text-cyan-400 bg-black/80 px-1 rounded-2xs font-mono font-bold">
                    ✓
                  </span>
                )}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 border border-[var(--glow-dim)] rounded-sm overflow-hidden bg-[#040812] flex items-center justify-center">
                  <img 
                    src={avatarUrl} 
                    alt={item.name} 
                    className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="font-['Orbitron'] text-[9px] sm:text-[10px] text-center text-[var(--text)] tracking-wider truncate w-full">
                  {item.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* CUSTOM IMAGE UPLOAD OPTION */}
        <div className="pt-3 border-t border-[var(--line)]">
          <label className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 font-['Orbitron'] text-center tracking-[1.5px] text-xs font-bold uppercase cursor-pointer block rounded-xs transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            📁 UPLOAD CUSTOM IMAGE FILE (PNG / JPG / WEBP)
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    handleSelect(reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectorModal;