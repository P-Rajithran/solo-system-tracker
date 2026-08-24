import { API_BASE_URL, API_ROOT } from '../utils/apiConfig';
import { useState, useEffect } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

const LogWeightModal = ({ isOpen, currentWeight, onClose, onSaveWeight }) => {
  const [weightVal, setWeightVal] = useState(currentWeight || '');

  useEffect(() => {
    if (currentWeight) {
      queueMicrotask(() => {
        setWeightVal(currentWeight);
      });
    }
  }, [currentWeight]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(weightVal);
    if (isNaN(parsed) || parsed <= 0) return;
    playSystemSound('complete');

    try {
      const token = localStorage.getItem('hunter_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      await fetch(`${API_BASE_URL}/player/weight`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ weight: parsed })
      });
    } catch (err) {
      console.error('[LOG WEIGHT ERROR]:', err);
    }

    onSaveWeight(parsed);
    onClose();
  };

  const adjustWeight = (delta) => {
    playSystemSound('click');
    setWeightVal((prev) => {
      const num = parseFloat(prev) || parseFloat(currentWeight) || 0;
      return Number((num + delta).toFixed(1));
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#070d19] border-2 border-[var(--glow)] p-6 shadow-[0_0_35px_rgba(45,212,255,0.4)] text-left space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
        style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
      >
        <div className="flex justify-between items-center border-b border-[var(--line)] pb-2">
          <div className="font-['Orbitron'] text-xs tracking-[2px] text-[var(--glow)] uppercase">
            [ SYSTEM LOG: DAILY WEIGHT ]
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-white font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="text-center py-2">
          <div className="font-['Orbitron'] text-xl font-bold text-white tracking-wider">
            LOG TODAY'S WEIGHT
          </div>
          <div className="text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] mt-1">
            Update your body metrics to compute daily progress toward goal.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center items-center gap-3">
            <button
              type="button"
              onClick={() => adjustWeight(-0.5)}
              className="bg-[var(--panel-2)] border border-[var(--line)] hover:border-[var(--glow)] text-[var(--glow)] font-['Orbitron'] font-bold text-xs px-3 py-2.5 rounded-sm transition-all cursor-pointer"
            >
              -0.5
            </button>

            <div className="relative flex-1 max-w-[160px]">
              <input
                type="number"
                step="0.1"
                required
                autoFocus
                value={weightVal}
                onChange={(e) => setWeightVal(e.target.value)}
                className="w-full bg-[#0a0f1c] border-2 border-[var(--glow-dim)] text-center text-2xl font-bold text-white py-2 px-3 font-['Share_Tech_Mono'] outline-none focus:border-[var(--glow)] focus:shadow-[0_0_15px_rgba(45,212,255,0.4)]"
              />
              <span className="absolute right-3 top-3 text-xs text-[var(--text-dim)] font-['Share_Tech_Mono']">
                KG
              </span>
            </div>

            <button
              type="button"
              onClick={() => adjustWeight(0.5)}
              className="bg-[var(--panel-2)] border border-[var(--line)] hover:border-[var(--glow)] text-[var(--glow)] font-['Orbitron'] font-bold text-xs px-3 py-2.5 rounded-sm transition-all cursor-pointer"
            >
              +0.5
            </button>
          </div>

          <div className="flex justify-center gap-2">
            {[-1.0, -0.1, 0.1, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => adjustWeight(val)}
                className="bg-[var(--panel-2)] border border-[var(--line)] hover:border-[var(--glow-dim)] text-[var(--text-dim)] hover:text-white font-['Share_Tech_Mono'] text-[11px] px-2 py-1 transition-colors cursor-pointer"
              >
                {val > 0 ? `+${val}` : val}
              </button>
            ))}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-['Orbitron'] text-xs py-3 uppercase transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs py-3 uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(45,212,255,0.5)] cursor-pointer"
            >
              [ LOG ENTRY ]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogWeightModal;
