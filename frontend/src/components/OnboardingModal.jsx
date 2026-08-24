import { API_BASE_URL, API_ROOT } from '../utils/apiConfig';
import { useState } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

// API_BASE_URL imported from apiConfig

const computeLocalOnboardingTargets = (data) => {
  const currentW = parseFloat(data.currentWeight) || 70;
  const targetW = parseFloat(data.targetWeight) || 65;
  const height = parseFloat(data.heightCm) || 170;
  const age = parseFloat(data.age) || 22;
  const goal = data.primaryGoal || data.goalType || 'lose';
  const activity = data.activityLevel || 'moderate';

  // Mifflin-St Jeor BMR
  let bmr = 10 * currentW + 6.25 * height - 5 * age + 5;
  
  let multiplier = 1.375;
  if (activity === 'sedentary') multiplier = 1.2;
  if (activity === 'light') multiplier = 1.375;
  if (activity === 'moderate') multiplier = 1.55;
  if (activity === 'active') multiplier = 1.725;
  if (activity === 'extreme') multiplier = 1.9;

  let tdee = Math.round(bmr * multiplier);
  let dailyCalorieTarget = tdee;

  if (goal === 'lose') dailyCalorieTarget = Math.max(1200, Math.round(tdee - 500));
  if (goal === 'gain') dailyCalorieTarget = Math.round(tdee + 400);

  let dailyProteinTarget = Math.round(currentW * 2.0);

  return {
    ...data,
    name: data.name || 'Hunter',
    age,
    heightCm: height,
    startWeight: currentW,
    currentWeight: currentW,
    targetWeight: targetW,
    dailyCalorieTarget,
    dailyProteinTarget,
    level: 1,
    exp: 0,
    hp: 100,
    availableStatPoints: 5,
    stats: { STR: 10, VIT: 10, MEN: 10, DIS: 10 },
    isSetupComplete: true,
    isOnboarded: true
  };
};

const getActivityLabel = (level) => {
  switch (level) {
    case 'sedentary': return 'SEDENTARY (DESK / MINIMAL)';
    case 'light': return 'LIGHT (1-3 DAYS/WK)';
    case 'moderate': return 'MODERATE (3-5 DAYS/WK)';
    case 'active': return 'HIGH (6-7 DAYS INTENSE)';
    case 'extreme': return 'EXTREME (ATHLETE)';
    default: return level?.toUpperCase() || '';
  }
};

const getGoalLabel = (goal) => {
  switch (goal) {
    case 'lose': return 'FAT LOSS CUT (-500 KCAL DEFICIT)';
    case 'gain': return 'MUSCLE BULK (+350 KCAL SURPLUS)';
    case 'endurance': return 'ENDURANCE & RECOMP (MAINTENANCE)';
    default: return goal?.toUpperCase() || '';
  }
};

const OnboardingModal = ({ isOpen, initialData, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: initialData?.name && initialData?.name !== 'Player' ? initialData.name : '',
    heightCm: initialData?.heightCm || 170,
    currentWeight: initialData?.currentWeight || 70,
    targetWeight: initialData?.targetWeight || 65,
    goalType: initialData?.goalType || initialData?.primaryGoal || 'lose',
    primaryGoal: initialData?.primaryGoal || initialData?.goalType || 'lose',
    activityLevel: initialData?.activityLevel || 'moderate'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStepOneSubmit = (e) => {
    e.preventDefault();
    playSystemSound('click');
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    playSystemSound('levelUp');

    const token = localStorage.getItem('hunter_token');
    const payload = {
      name: formData.name.trim() || 'Hunter',
      heightCm: Number(formData.heightCm) || 170,
      currentWeight: Number(formData.currentWeight) || 70,
      startWeight: Number(formData.currentWeight) || 70,
      targetWeight: Number(formData.targetWeight) || 65,
      activityLevel: formData.activityLevel,
      primaryGoal: formData.primaryGoal,
      goalType: formData.primaryGoal,
      dietaryPreference: 'High-Protein Balanced'
    };

    try {
      const res = await fetch(`${API_BASE_URL}/player/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        const updatedPlayer = data.player || data;
        if (res.ok) {
          localStorage.setItem('isOnboarded', 'true');
          localStorage.setItem('hunter_is_onboarded', 'true');
          localStorage.setItem('hunter_onboarding_profile', JSON.stringify({ ...updatedPlayer, isOnboarded: true, isSetupComplete: true }));
          onComplete({ ...updatedPlayer, isOnboarded: true, isSetupComplete: true });
          return;
        }
      }
      throw new Error('Server returned non-JSON response');
    } catch (err) {
      console.warn('[ONBOARDING NOTICE]: Backend setup unavailable. Computing onboarding targets locally.', err.message);
      const localPlayer = computeLocalOnboardingTargets(payload);
      localStorage.setItem('isOnboarded', 'true');
      localStorage.setItem('hunter_is_onboarded', 'true');
      localStorage.setItem('hunter_onboarding_profile', JSON.stringify({ ...localPlayer, isOnboarded: true, isSetupComplete: true }));
      onComplete({ ...localPlayer, isOnboarded: true, isSetupComplete: true });
    } finally {
      setLoading(false);
    }
  };

  const previewTargets = computeLocalOnboardingTargets(formData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 animate-fade-in select-none">
      <div 
        className="relative w-full max-w-md bg-[#070b14] border-2 border-[var(--glow)] p-6 shadow-[0_0_40px_rgba(45,212,255,0.4)] text-left space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar"
        style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
      >
        {/* TOP SYSTEM TAG */}
        <div className="font-['Orbitron'] text-[10px] tracking-[3px] text-[var(--glow)] uppercase flex justify-between items-center">
          <span>[ SYSTEM AWAKENING PROTOCOL ]</span>
          <span className="text-[var(--gold)]">
            {step === 1 ? 'STEP 1: REGISTRATION' : 'STEP 2: CONFIRMATION'}
          </span>
        </div>

        {step === 1 ? (
          <>
            <div className="font-['Orbitron'] text-xl font-black text-white tracking-wider uppercase">
              QUICK HUNTER ONBOARDING
            </div>

            <blockquote className="p-2.5 bg-[#0a0f1c] border-l-2 border-[var(--glow)] text-xs font-['Rajdhani'] text-cyan-200/90 leading-relaxed italic">
              "The Monarch rises through daily effort and relentless discipline."
            </blockquote>

            <p className="text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] leading-relaxed">
              Set your baseline physical metrics to initialize your System parameters and compute daily macro targets.
            </p>

            <form onSubmit={handleStepOneSubmit} className="space-y-3.5 font-['Rajdhani']">
              
              {/* HUNTER NAME */}
              <div>
                <label className="block text-xs font-['Orbitron'] text-[var(--glow)] mb-1 uppercase">
                  HUNTER CODENAME / NAME:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter hunter name..."
                  className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono'] rounded-sm"
                />
              </div>

              {/* HEIGHT, CURRENT WEIGHT & TARGET GOAL ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-['Orbitron'] text-[var(--text-dim)] mb-1 uppercase">
                    HEIGHT (CM):
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono'] rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Orbitron'] text-cyan-400 mb-1 uppercase">
                    CURRENT (KG):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.currentWeight}
                    onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                    className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2 text-sm outline-none focus:border-cyan-400 font-['Share_Tech_Mono'] rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Orbitron'] text-emerald-400 mb-1 uppercase">
                    TARGET (KG):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.targetWeight}
                    onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                    className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2 text-sm outline-none focus:border-emerald-400 font-['Share_Tech_Mono'] rounded-sm"
                  />
                </div>
              </div>

              {/* ACTIVITY LEVEL */}
              <div>
                <label className="block text-xs font-['Orbitron'] text-cyan-400 mb-1 uppercase">
                  ACTIVITY LEVEL:
                </label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                  className="w-full bg-[#0a0f1c] border border-[var(--line)] text-cyan-300 p-2 text-xs outline-none font-['Orbitron'] rounded-sm cursor-pointer"
                >
                  <option value="sedentary">🛋️ SEDENTARY (DESK / MINIMAL)</option>
                  <option value="light">🚶 LIGHT (1-3 DAYS/WK)</option>
                  <option value="moderate">🏋️ MODERATE (3-5 DAYS/WK)</option>
                  <option value="active">⚡ HIGH (6-7 DAYS INTENSE)</option>
                  <option value="extreme">🔥 EXTREME (ATHLETE)</option>
                </select>
              </div>

              {/* PRIMARY GOAL MISSION */}
              <div>
                <label className="block text-xs font-['Orbitron'] text-[var(--gold)] mb-1 uppercase">
                  PRIMARY GOAL MISSION:
                </label>
                <select
                  value={formData.primaryGoal}
                  onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value, goalType: e.target.value })}
                  className="w-full bg-[#0a0f1c] border border-[var(--line)] text-[var(--gold)] p-2 text-xs outline-none font-['Orbitron'] rounded-sm cursor-pointer"
                >
                  <option value="lose">📉 FAT LOSS CUT (-500 KCAL DEFICIT)</option>
                  <option value="gain">📈 MUSCLE BULK (+350 KCAL SURPLUS)</option>
                  <option value="endurance">🏃 ENDURANCE & RECOMP (MAINTENANCE)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-3 bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs tracking-[2px] py-3 uppercase transition-all shadow-[0_0_20px_rgba(45,212,255,0.5)] cursor-pointer"
              >
                [ REVIEW & CONFIRM DETAILS ]
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="font-['Orbitron'] text-xl font-black text-white tracking-wider uppercase">
              CONFIRM PROFILE SUMMARY
            </div>

            <p className="text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] leading-relaxed">
              Verify your registered parameters below before committing changes to the System backend.
            </p>

            {/* SUMMARY CARD */}
            <div className="bg-[#0a0f1c] border border-[var(--line)] p-4 rounded-sm space-y-3 font-['Rajdhani']">
              <div className="flex justify-between items-center border-b border-[var(--line)]/50 pb-2">
                <span className="text-xs font-['Orbitron'] text-[var(--text-dim)] uppercase">HUNTER CODENAME:</span>
                <span className="text-sm font-['Share_Tech_Mono'] text-white font-bold">{formData.name.trim() || 'Hunter'}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-[var(--line)]/50 pb-2">
                <div>
                  <span className="block text-[10px] font-['Orbitron'] text-[var(--text-dim)] uppercase">HEIGHT:</span>
                  <span className="text-xs font-['Share_Tech_Mono'] text-white font-semibold">{formData.heightCm} CM</span>
                </div>
                <div>
                  <span className="block text-[10px] font-['Orbitron'] text-cyan-400 uppercase">CURRENT WEIGHT:</span>
                  <span className="text-xs font-['Share_Tech_Mono'] text-cyan-300 font-bold">{formData.currentWeight} KG</span>
                </div>
                <div>
                  <span className="block text-[10px] font-['Orbitron'] text-emerald-400 uppercase">TARGET WEIGHT:</span>
                  <span className="text-xs font-['Share_Tech_Mono'] text-emerald-300 font-bold">{formData.targetWeight} KG</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-b border-[var(--line)]/50 pb-2">
                <span className="text-xs font-['Orbitron'] text-cyan-400 uppercase">ACTIVITY LEVEL:</span>
                <span className="text-xs font-['Orbitron'] text-cyan-200">{getActivityLabel(formData.activityLevel)}</span>
              </div>

              <div className="flex justify-between items-center pb-1">
                <span className="text-xs font-['Orbitron'] text-[var(--gold)] uppercase">PRIMARY GOAL:</span>
                <span className="text-xs font-['Orbitron'] text-amber-300">{getGoalLabel(formData.primaryGoal)}</span>
              </div>
            </div>

            {/* ESTIMATED SYSTEM TARGETS PREVIEW */}
            <div className="bg-[#05131a] border border-[var(--glow)]/40 p-3 rounded-sm">
              <div className="text-[10px] font-['Orbitron'] text-[var(--glow)] tracking-wider uppercase mb-2 flex items-center justify-between">
                <span>[ INITIAL TARGET COMPUTATION ]</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#070b14] p-2 border border-[var(--line)]">
                  <span className="block text-[10px] font-['Orbitron'] text-[var(--text-dim)] uppercase">DAILY CALORIES</span>
                  <span className="text-base font-['Orbitron'] font-extrabold text-cyan-400">{previewTargets.dailyCalorieTarget} <span className="text-[10px]">KCAL</span></span>
                </div>
                <div className="bg-[#070b14] p-2 border border-[var(--line)]">
                  <span className="block text-[10px] font-['Orbitron'] text-[var(--text-dim)] uppercase">DAILY PROTEIN</span>
                  <span className="text-base font-['Orbitron'] font-extrabold text-emerald-400">{previewTargets.dailyProteinTarget} <span className="text-[10px]">G</span></span>
                </div>
              </div>
            </div>

            {/* CHOICE BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 bg-[#0a0f1c] hover:bg-[#12192c] border border-[var(--line)] text-slate-300 font-['Orbitron'] font-bold text-xs tracking-[1px] py-3 uppercase transition-all cursor-pointer"
              >
                [ GO BACK ]
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1 bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs tracking-[1px] py-3 uppercase transition-all shadow-[0_0_20px_rgba(45,212,255,0.5)] cursor-pointer"
              >
                {loading ? '[ TRANSMITTING METRICS... ]' : '[ CONFIRM & BEGIN ]'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OnboardingModal;