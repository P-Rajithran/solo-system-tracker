import { API_BASE_URL, API_ROOT } from '../utils/apiConfig';
import { useState, useEffect } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

const EditProfileModal = ({ isOpen, player, onClose, onSaveProfile }) => {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    heightCm: player?.heightCm || 170,
    startWeight: player?.startWeight || player?.currentWeight || 70,
    currentWeight: player?.currentWeight || player?.startWeight || 70,
    targetWeight: player?.targetWeight || 65,
    activityLevel: player?.activityLevel || 'moderate',
    dietaryPreference: player?.dietaryPreference || 'High-Protein Balanced',
    primaryGoal: player?.primaryGoal || player?.goalType || 'lose'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (player) {
      queueMicrotask(() => {
        setFormData({
          name: player.name || '',
          heightCm: player.heightCm || 170,
          startWeight: player.startWeight || player.currentWeight || 70,
          currentWeight: player.currentWeight || player.startWeight || 70,
          targetWeight: player.targetWeight || 65,
          activityLevel: player.activityLevel || 'moderate',
          dietaryPreference: player.dietaryPreference || 'High-Protein Balanced',
          primaryGoal: player.primaryGoal || player.goalType || 'lose'
        });
      });
    }
  }, [player]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    playSystemSound('levelUp');

    const payload = {
      name: formData.name.trim() || 'Hunter',
      heightCm: Number(formData.heightCm) || 170,
      startWeight: Number(formData.startWeight) || Number(formData.currentWeight) || 70,
      currentWeight: Number(formData.currentWeight) || 70,
      targetWeight: Number(formData.targetWeight) || 65,
      activityLevel: formData.activityLevel,
      dietaryPreference: formData.dietaryPreference,
      primaryGoal: formData.primaryGoal,
      goalType: formData.primaryGoal
    };

    try {
      const token = localStorage.getItem('hunter_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Update backend via PUT /api/user/profile
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const savedPlayer = data.player || data;
        localStorage.setItem('hunter_onboarding_profile', JSON.stringify(savedPlayer));
        onSaveProfile(savedPlayer);
      } else {
        // Fallback for offline mode
        const localUpdated = { ...player, ...payload };
        localStorage.setItem('hunter_onboarding_profile', JSON.stringify(localUpdated));
        onSaveProfile(localUpdated);
      }
    } catch {
      const localUpdated = { ...player, ...payload };
      localStorage.setItem('hunter_onboarding_profile', JSON.stringify(localUpdated));
      onSaveProfile(localUpdated);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-[#070b14] border-2 border-[var(--glow)] p-6 shadow-[0_0_35px_rgba(45,212,255,0.4)] text-left space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
        style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
      >
        <div className="flex justify-between items-center border-b border-[var(--line)] pb-2 font-['Orbitron']">
          <div className="text-sm font-bold tracking-[2px] text-[var(--glow)] uppercase flex items-center gap-2">
            <span>⚙️ HUNTER SYSTEM MASTER PROFILE SETTINGS</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm">✕</button>
        </div>

        <p className="text-[11px] text-[var(--text-dim)] font-['Share_Tech_Mono'] leading-relaxed bg-[#0a0f1c] p-2.5 border border-[var(--line)] rounded-sm">
          [ BASELINE PROFILE METRICS ]: Modifying metrics here updates your baseline starting profile and recalculates your daily BMR/TDEE targets based on your goal deficit. Use "Log Today's Weight" on the dashboard for daily progress tracking.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 font-['Rajdhani']">
          {/* CODENAME / NAME */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-[var(--glow)] mb-1 uppercase">
              HUNTER CODENAME / NAME:
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono'] rounded-sm"
            />
          </div>

          {/* HEIGHT & START WEIGHT & CURRENT WEIGHT & TARGET GOAL WEIGHT ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-['Orbitron'] text-[var(--text-dim)] mb-1 uppercase">
                HEIGHT (CM):
              </label>
              <input
                type="number"
                required
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2 text-xs outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono'] rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-['Orbitron'] text-amber-400 mb-1 uppercase">
                START WEIGHT (KG):
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.startWeight}
                onChange={(e) => setFormData({ ...formData, startWeight: e.target.value })}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2 text-xs outline-none focus:border-amber-400 font-['Share_Tech_Mono'] rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-['Orbitron'] text-cyan-400 mb-1 uppercase">
                CURRENT WEIGHT (KG):
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.currentWeight}
                onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2 text-xs outline-none focus:border-cyan-400 font-['Share_Tech_Mono'] rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-['Orbitron'] text-emerald-400 mb-1 uppercase">
                TARGET GOAL (KG):
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.targetWeight}
                onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2 text-xs outline-none focus:border-emerald-400 font-['Share_Tech_Mono'] rounded-sm"
              />
            </div>
          </div>

          {/* ACTIVITY LEVEL */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-cyan-400 mb-1 uppercase">
              ACTIVITY LEVEL MULTIPLIER:
            </label>
            <select
              value={formData.activityLevel}
              onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
              className="w-full bg-[#0a0f1c] border border-[var(--line)] text-cyan-300 p-2 text-xs outline-none font-['Orbitron'] rounded-sm cursor-pointer"
            >
              <option value="sedentary">🛋️ SEDENTARY (LITTLE / NO EXERCISE)</option>
              <option value="light">🚶 LIGHTLY ACTIVE (1-3 DAYS/WK)</option>
              <option value="moderate">🏋️ MODERATELY ACTIVE (3-5 DAYS/WK)</option>
              <option value="active">🔥 VERY ACTIVE (6-7 DAYS/WK INTENSE)</option>
              <option value="extreme">⚡ EXTREME HUNTER (DAILY ATHLETIC)</option>
            </select>
          </div>

          {/* DIETARY PREFERENCE */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-purple-400 mb-1 uppercase">
              DIETARY PREFERENCE PLAN:
            </label>
            <select
              value={formData.dietaryPreference}
              onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value })}
              className="w-full bg-[#0a0f1c] border border-[var(--line)] text-purple-300 p-2 text-xs outline-none font-['Orbitron'] rounded-sm cursor-pointer"
            >
              <option value="High-Protein Balanced">🍗 HIGH-PROTEIN BALANCED</option>
              <option value="Keto / Low-Carb">🥑 KETO / LOW-CARB</option>
              <option value="Vegetarian / Vegan">🥗 VEGETARIAN / VEGAN</option>
              <option value="Flexible Macro Tracking">📊 FLEXIBLE MACRO TRACKING</option>
            </select>
          </div>

          {/* PRIMARY GOAL MISSION */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-[var(--gold)] mb-1 uppercase">
              PRIMARY GOAL MISSION:
            </label>
            <select
              value={formData.primaryGoal}
              onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
              className="w-full bg-[#0a0f1c] border border-[var(--line)] text-[var(--gold)] p-2 text-xs outline-none font-['Orbitron'] rounded-sm cursor-pointer"
            >
              <option value="lose">📉 FAT LOSS CUT (-500 KCAL DEFICIT)</option>
              <option value="gain">📈 MUSCLE BULK (+350 KCAL SURPLUS)</option>
              <option value="endurance">🏃 ENDURANCE & RECOMP (MAINTENANCE)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-['Orbitron'] font-bold text-xs py-2.5 uppercase tracking-wider"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs py-2.5 uppercase tracking-wider shadow-[0_0_15px_rgba(45,212,255,0.4)] cursor-pointer"
            >
              {loading ? '[ COMPUTING BMR & SAVING... ]' : '[ SAVE & RECALCULATE MACROS ]'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
