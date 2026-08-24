import { useState, useEffect } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

const SHOP_ITEMS = [
  {
    itemId: 'cheat_meal_pass',
    name: 'Cheat Meal Pass',
    price: 1000,
    category: 'pass',
    icon: '🍔',
    description: 'Allows users to log a fast-food meal without breaking daily streak penalties.'
  },
  {
    itemId: 'rest_day_pass',
    name: 'Rest Day Pass',
    price: 500,
    category: 'pass',
    icon: '🛌',
    description: 'Waives daily workout objectives for 24h while preserving system health.'
  },
  {
    itemId: 'shadow_monarch_aura',
    name: 'Iron Sovereign Aura Theme',
    price: 2500,
    category: 'theme',
    icon: '⚡',
    description: 'Unlocks legendary violet shadow energy particle aura across the System UI.'
  }
];

const ShopPage = ({ player, onPlayerUpdate }) => {
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('hunter_theme') || 'cyan');

  const goldCoins = player?.goldCoins || 0;
  const inventory = player?.inventory || [];

  useEffect(() => {
    if (activeTheme === 'shadow') {
      document.body.classList.add('theme-shadow');
    } else {
      document.body.classList.remove('theme-shadow');
    }
  }, [activeTheme]);

  const handleToggleTheme = (themeName) => {
    playSystemSound('click');
    const newTheme = activeTheme === themeName ? 'cyan' : themeName;
    setActiveTheme(newTheme);
    localStorage.setItem('hunter_theme', newTheme);
    if (newTheme === 'shadow') {
      document.body.classList.add('theme-shadow');
    } else {
      document.body.classList.remove('theme-shadow');
    }
  };

  const handleBuyItem = async (item) => {
    if (goldCoins < item.price) {
      playSystemSound('penalty');
      setErrorMessage(`Insufficient Gold Coins! Needed: ${item.price} Gold, Available: ${goldCoins} Gold.`);
      setMessage('');
      return;
    }

    playSystemSound('click');
    setLoadingItemId(item.itemId);
    setErrorMessage('');
    setMessage('');

    try {
      const token = localStorage.getItem('hunter_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch('http://localhost:5000/api/player/shop/buy', {
        method: 'POST',
        headers,
        body: JSON.stringify({ itemId: item.itemId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to acquire item');
      }

      playSystemSound('levelUp');
      setMessage(data.message || `Successfully acquired ${item.name}!`);

      if (item.itemId === 'shadow_monarch_aura') {
        setActiveTheme('shadow');
        localStorage.setItem('hunter_theme', 'shadow');
        document.body.classList.add('theme-shadow');
      }

      if (onPlayerUpdate) {
        onPlayerUpdate();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Transaction failed');
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="space-y-[14px]">
      {/* SHOP HEADER */}
      <div className="system-card border-2 border-[var(--gold)] bg-gradient-to-r from-[#0d0a04] via-[#07090e] to-[#0e0a04] p-5 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="font-['Orbitron'] text-[11px] tracking-[3px] text-[var(--gold)] uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--gold)] rounded-full animate-ping"></span>
              [ SYSTEM ITEM SHOP & MARKETPLACE ]
            </div>
            <div className="font-['Orbitron'] text-2xl font-black text-white tracking-wider mt-1">
              DIMENSIONAL EXCHANGE STORE
            </div>
            <p className="text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] mt-0.5">
              Spend accumulated Gold Coins earned from daily nutrition & discipline logs.
            </p>
          </div>

          {/* GOLD COINS BALANCE BADGE */}
          <div className="bg-[#120d04] border-2 border-[var(--gold)] p-3 px-5 text-right shadow-[0_0_15px_rgba(251,191,36,0.4)] rounded-sm shrink-0">
            <div className="text-[10px] font-['Orbitron'] text-[var(--gold)] uppercase tracking-widest">
              AVAILABLE BALANCE
            </div>
            <div className="text-2xl font-black text-amber-300 font-['Share_Tech_Mono'] drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
              🪙 {goldCoins.toLocaleString()} GOLD
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      {message && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-['Orbitron'] text-xs tracking-wider animate-fade-in flex items-center justify-between">
          <span>[ SYSTEM ALARM ]: {message}</span>
          <span className="text-emerald-400 font-mono">TRANSACTION SUCCESS</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-500 text-red-300 font-['Orbitron'] text-xs tracking-wider animate-pulse">
          [ SYSTEM ERROR ]: {errorMessage}
        </div>
      )}

      {/* CATALOG GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SHOP_ITEMS.map((item) => {
          const ownedCount = inventory.filter((inv) => inv.itemId === item.itemId).length;
          const canAfford = goldCoins >= item.price;
          const isThemeActive = item.itemId === 'shadow_monarch_aura' && activeTheme === 'shadow';

          return (
            <div
              key={item.itemId}
              className={`system-card flex flex-col justify-between p-5 border-2 transition-all relative ${
                canAfford
                  ? 'border-amber-500/60 hover:border-amber-400 bg-[#080d19]/90 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                  : 'border-slate-800 bg-[#050810]/80 opacity-90'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-['Orbitron'] text-[10px] bg-amber-950/60 border border-amber-500/60 text-amber-300 px-2 py-0.5 rounded-sm font-bold uppercase">
                    {item.category}
                  </span>
                </div>

                <div className="font-['Orbitron'] text-base font-bold text-white tracking-wide">
                  {item.name}
                </div>

                <p className="text-xs text-[var(--text-dim)] font-['Rajdhani'] my-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--line)] space-y-3">
                <div className="flex justify-between items-center text-xs font-['Share_Tech_Mono']">
                  <span className="text-[var(--text-dim)]">PRICE:</span>
                  <span className="text-amber-300 font-bold text-sm drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                    🪙 {item.price} GOLD
                  </span>
                </div>

                {ownedCount > 0 && (
                  <div className="text-[10px] font-['Orbitron'] text-emerald-400 font-bold text-right uppercase">
                    OWNED IN INVENTORY: x{ownedCount}
                  </div>
                )}

                {item.itemId === 'shadow_monarch_aura' && ownedCount > 0 ? (
                  <button
                    onClick={() => handleToggleTheme('shadow')}
                    className={`w-full font-['Orbitron'] font-extrabold text-xs py-2.5 uppercase tracking-wider transition-all cursor-pointer border ${
                      isThemeActive
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isThemeActive ? '[ ⚡ SHADOW THEME ACTIVE ]' : '[ ACTIVATE SHADOW THEME ]'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuyItem(item)}
                    disabled={loadingItemId === item.itemId}
                    className={`w-full font-['Orbitron'] font-extrabold text-xs py-2.5 uppercase tracking-wider transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-amber-500/20 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'bg-slate-900 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {loadingItemId === item.itemId ? '[ PURCHASING... ]' : canAfford ? '[ 🪙 PURCHASE ITEM ]' : '[ INSUFFICIENT GOLD ]'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* HUNTER INVENTORY LIST */}
      <div className="system-card border-t-4 border-t-[var(--glow)]">
        <div className="font-['Orbitron'] text-xs tracking-[2px] text-[var(--glow)] mb-3 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span>🎒</span> HUNTER INVENTORY ARCHIVE ({inventory.length} ITEMS)
          </span>
          <span className="text-[var(--text-dim)] font-mono text-[10px]">OWNED ASSETS</span>
        </div>

        {inventory.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] border border-dashed border-[var(--line)]">
            [ NO ITEMS IN INVENTORY ] Purchase items from the System Shop above to equip or use them.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inventory.map((inv, idx) => (
              <div key={idx} className="bg-[#0a0f1c] border border-[var(--line)] p-3 text-xs flex justify-between items-center font-['Share_Tech_Mono']">
                <div>
                  <div className="font-['Orbitron'] text-xs font-bold text-white">{inv.name}</div>
                  <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
                    Purchased: {new Date(inv.purchasedAt).toLocaleDateString()}
                  </div>
                </div>
                {inv.itemId === 'shadow_monarch_aura' ? (
                  <button
                    onClick={() => handleToggleTheme('shadow')}
                    className="text-[10px] font-['Orbitron'] text-purple-400 border border-purple-500/60 hover:bg-purple-950 px-2 py-0.5 rounded-sm cursor-pointer"
                  >
                    {activeTheme === 'shadow' ? 'ACTIVE' : 'EQUIP'}
                  </button>
                ) : (
                  <span className="text-[10px] font-['Orbitron'] text-emerald-400 border border-emerald-500/60 px-2 py-0.5 rounded-sm">
                    READY
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
