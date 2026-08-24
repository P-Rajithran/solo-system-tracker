import { API_BASE_URL, API_ROOT } from '../utils/apiConfig';
import { useState } from 'react';
import { playSystemSound } from '../utils/hunterUtils';
import ProgressAnalytics from '../components/ProgressAnalytics';
import AINutritionAnalyzer from '../components/AINutritionAnalyzer';

const NutritionPage = ({
  player,
  weight,
  setWeight,
  calories,
  setCalories,
  protein,
  setProtein,
  onSaveNutrition,
  onTriggerRewardToast,
  onTriggerSavedToast,
  analyticsData,
  onFetchAnalytics
}) => {
  const [deepWork, setDeepWork] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [focusRating, setFocusRating] = useState(8);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const calorieTarget = player?.dailyCalorieTarget || 2200;
  const proteinTarget = player?.dailyProteinTarget || 150;
  const targetWeight = player?.targetWeight || 65;
  const startWeight = player?.startWeight || player?.currentWeight || parseFloat(weight) || 0;
  const currentWeightVal = parseFloat(weight) || player?.currentWeight || startWeight;
  const goalType = player?.goalType || 'lose';

  // Mission Progress Percentage
  const totalToProgress = Math.abs(startWeight - targetWeight);
  const currentProgress = goalType === 'gain' ? (currentWeightVal - startWeight) : (startWeight - currentWeightVal);
  const progressPct = totalToProgress > 0 
    ? Math.min(100, Math.max(0, (currentProgress / totalToProgress) * 100)) 
    : 100;

  const remainingWeight = Math.abs(currentWeightVal - targetWeight);

  const handleSaveLifeMetrics = async () => {
    playSystemSound('click');
    if (onTriggerRewardToast) {
      onTriggerRewardToast({
        title: 'DISCIPLINE & LIFE METRICS SYNCED!',
        earnedText: '+20 XP, +1 INT, +50 GOLD',
        icon: '🧠'
      });
    }
    if (onTriggerSavedToast) {
      onTriggerSavedToast({
        message: 'Discipline & Recovery metrics persisted to System'
      });
    }
    try {
      const token = localStorage.getItem('hunter_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE_URL}/quests/life-metrics`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          deepWorkHours: Number(deepWork),
          sleepHours: Number(sleepHours),
          focusRating: Number(focusRating)
        })
      });

      const data = await res.json();
      playSystemSound('complete');
      triggerToast('SYSTEM METRICS SYNCED: +50 Gold Coins Received & Life Metrics Recorded!');
      if (data.player && onSaveNutrition) {
        onSaveNutrition({ ...data.player });
      }
    } catch (err) {
      console.error('[SYSTEM ERROR]: Failed to log life metrics', err);
    }
  };

  const handleTransmitPhysicalMetrics = async () => {
    playSystemSound('click');
    const weightNum = Number(weight);

    try {
      const token = localStorage.getItem('hunter_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      await fetch(`${API_BASE_URL}/player/weight`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ weight: weightNum })
      });
    } catch (err) {
      console.error('[WEIGHT LOG ERROR]:', err);
    }

    if (onSaveNutrition) {
      await onSaveNutrition({
        currentWeight: weightNum,
        caloriesConsumed: Number(calories),
        proteinGrams: Number(protein)
      });
    }
    triggerToast(`SYSTEM METRICS SYNCED: +50 Gold Coins & Current Weight ${weightNum}kg (${remainingWeight.toFixed(1)}kg Remaining) Saved!`);
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE_URL}/quests/export`, '_blank');
  };

  return (
    <div className="space-y-[14px]">
      
      {/* SYSTEM TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="p-3.5 bg-gradient-to-r from-[#051525] via-[#092238] to-[#051525] border-2 border-[var(--glow)] text-[var(--glow)] font-['Orbitron'] text-xs tracking-wider shadow-[0_0_25px_rgba(45,212,255,0.4)] animate-fade-in flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[var(--glow)] rounded-full animate-ping"></span>
            {toastMessage}
          </span>
          <span className="text-[var(--gold)] font-mono text-[10px]">🪙 +50 GOLD REWARD</span>
        </div>
      )}

      {/* EMPTY STATE ADVISORY FOR BRAND NEW ACCOUNTS */}
      {(!weight || weight === '' || !player?.weightHistory || player?.weightHistory?.length === 0) && (
        <div className="p-4 bg-[#070e1c] border-2 border-cyan-500/60 rounded-sm font-['Share_Tech_Mono'] text-xs text-slate-300 space-y-2 shadow-[0_0_20px_rgba(45,212,255,0.15)]">
          <div className="font-['Orbitron'] text-xs text-cyan-300 font-bold tracking-wider flex items-center gap-2">
            <span>⚖️</span> [ SYSTEM NOTICE ]: WEIGHT & NUTRITION JOURNAL INITIALIZED
          </div>
          <p className="leading-relaxed text-slate-300">
            Welcome to your Physical Metrics System. Log your current body weight in kilograms and transmit daily calorie & protein intake below to visualize your transformation progress graphs.
          </p>
        </div>
      )}

      {/* SECTION 1: LIFE & DISCIPLINE TRACKER */}
      <div className="system-card border-l-4 border-l-cyan-400">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] mb-[14px] flex justify-between items-center">
          <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
            DISCIPLINE & LIFE METRICS (WITH FRICTIONLESS STEPPERS)
          </span>
          <span className="font-['Share_Tech_Mono'] text-[11px] text-[var(--gold)]">
            [ INTELLECT & RECOVERY ]
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* DEEP WORK STEPPER */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-cyan-400 mb-1 uppercase">
              DEEP WORK / CODING (HRS)
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setDeepWork((prev) => Math.max(0, Number((Number(prev) - 0.5).toFixed(1)))); }}
                className="bg-[#0a1120] border border-cyan-800 hover:border-cyan-400 text-cyan-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                step="0.5"
                value={deepWork}
                onChange={(e) => setDeepWork(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-center text-base font-bold font-['Share_Tech_Mono'] outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setDeepWork((prev) => Number((Number(prev) + 0.5).toFixed(1))); }}
                className="bg-[#0a1120] border border-cyan-800 hover:border-cyan-400 text-cyan-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* SLEEP HOURS STEPPER */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-purple-400 mb-1 uppercase">
              RECOVERY / SLEEP (HRS)
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setSleepHours((prev) => Math.max(0, Number((Number(prev) - 0.5).toFixed(1)))); }}
                className="bg-[#0a1120] border border-purple-800 hover:border-purple-400 text-purple-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-center text-base font-bold font-['Share_Tech_Mono'] outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setSleepHours((prev) => Number((Number(prev) + 0.5).toFixed(1))); }}
                className="bg-[#0a1120] border border-purple-800 hover:border-purple-400 text-purple-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* FOCUS RATING STEPPER */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-emerald-400 mb-1 uppercase">
              FOCUS INDEX (1-10)
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setFocusRating((prev) => Math.max(1, Number(prev) - 1)); }}
                className="bg-[#0a1120] border border-emerald-800 hover:border-emerald-400 text-emerald-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={focusRating}
                onChange={(e) => setFocusRating(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-center text-base font-bold font-['Share_Tech_Mono'] outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setFocusRating((prev) => Math.min(10, Number(prev) + 1)); }}
                className="bg-[#0a1120] border border-emerald-800 hover:border-emerald-400 text-emerald-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveLifeMetrics}
          className="w-full bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-400 border border-cyan-500/60 font-['Orbitron'] font-bold text-xs tracking-[2px] py-3 uppercase transition-all shadow-[0_0_15px_rgba(45,212,255,0.3)] cursor-pointer"
        >
          [ TRANSMIT LIFE METRICS TO SYSTEM (+50 GOLD) ]
        </button>
      </div>

      {/* SECTION 2: PHYSICAL & NUTRITION LOG */}
      <div className="system-card">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] mb-[14px] flex justify-between items-center flex-wrap gap-2">
          <div>
            <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
              PHYSICAL BODY & NUTRITION
            </span>
            <div className="text-[11px] text-[var(--text-dim)] font-['Share_Tech_Mono'] mt-0.5">
              Current Plan: <strong className="text-purple-300">{player?.dietaryPreference || 'High-Protein Balanced'}</strong> • Goal: <strong className="text-[var(--gold)]">{goalType === 'gain' ? 'Muscle Bulk' : 'Fat Cut'} ({Math.round(progressPct)}% Complete)</strong>
            </div>
          </div>
          <span className="font-['Share_Tech_Mono'] text-[11px] text-[var(--gold)] bg-[var(--panel-2)] border border-[var(--line)] px-2.5 py-1 rounded-sm">
            [ TARGET: {calorieTarget} kcal / {proteinTarget}g Protein ]
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* CURRENT WEIGHT STEPPER */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-[var(--glow)] mb-1 uppercase">
              CURRENT WEIGHT (KG)
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setWeight((prev) => Math.max(0, Number((Number(prev) - 0.1).toFixed(1)))); }}
                className="bg-[#0a1120] border border-cyan-800 hover:border-cyan-400 text-cyan-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-center text-base font-bold font-['Share_Tech_Mono'] outline-none focus:border-[var(--glow)]"
              />
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setWeight((prev) => Number((Number(prev) + 0.1).toFixed(1))); }}
                className="bg-[#0a1120] border border-cyan-800 hover:border-cyan-400 text-cyan-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* CALORIES STEPPER */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-amber-400 mb-1 uppercase">
              CALORIES (TARGET: {calorieTarget})
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setCalories((prev) => Math.max(0, Number(prev) - 50)); }}
                className="bg-[#0a1120] border border-amber-800 hover:border-amber-400 text-amber-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-center text-base font-bold font-['Share_Tech_Mono'] outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setCalories((prev) => Number(prev) + 50); }}
                className="bg-[#0a1120] border border-amber-800 hover:border-amber-400 text-amber-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* PROTEIN STEPPER */}
          <div>
            <label className="block text-xs font-['Orbitron'] text-rose-400 mb-1 uppercase">
              PROTEIN G (TARGET: {proteinTarget}G)
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setProtein((prev) => Math.max(0, Number(prev) - 5)); }}
                className="bg-[#0a1120] border border-rose-800 hover:border-rose-400 text-rose-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-center text-base font-bold font-['Share_Tech_Mono'] outline-none focus:border-rose-400"
              />
              <button
                type="button"
                onClick={() => { playSystemSound('click'); setProtein((prev) => Number(prev) + 5); }}
                className="bg-[#0a1120] border border-rose-800 hover:border-rose-400 text-rose-300 font-bold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleTransmitPhysicalMetrics}
          className="w-full bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/60 font-['Orbitron'] font-bold text-xs tracking-[2px] py-3 uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
        >
          [ TRANSMIT PHYSICAL METRICS (+50 GOLD) ]
        </button>
      </div>

      {/* AI SMART FOOD & MACRO ANALYZER */}
      <AINutritionAnalyzer
        currentCalories={calories}
        currentProtein={protein}
        onApplyMacros={async ({ caloriesConsumed, proteinGrams }) => {
          setCalories(caloriesConsumed);
          setProtein(proteinGrams);
          if (onSaveNutrition) {
            await onSaveNutrition({
              currentWeight: weight,
              caloriesConsumed,
              proteinGrams
            });
          }
          triggerToast(`SYSTEM METRICS SYNCED: Logged +${caloriesConsumed - calories} kcal & +${proteinGrams - protein}g protein!`);
        }}
      />

      {/* WEEKLY & MONTHLY PROGRESS TRACKING ANALYTICS */}
      <ProgressAnalytics player={player} analyticsData={analyticsData} onFetchAnalytics={onFetchAnalytics} />

      {/* SECTION 3: SYSTEM EXPORT */}
      <div className="system-card flex justify-between items-center">
        <div>
          <div className="font-['Orbitron'] text-xs text-slate-300">SYSTEM DATA ARCHIVE</div>
          <div className="font-['Share_Tech_Mono'] text-[11px] text-[var(--text-dim)]">
            Export all physical and discipline records.
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="font-['Orbitron'] text-[10px] bg-slate-900 border border-[var(--gold)] text-[var(--gold)] px-3 py-2 hover:bg-amber-950/40 uppercase tracking-[2px] transition-colors cursor-pointer"
        >
          [ DOWNLOAD LOGS (.CSV) ]
        </button>
      </div>

    </div>
  );
};

export default NutritionPage;