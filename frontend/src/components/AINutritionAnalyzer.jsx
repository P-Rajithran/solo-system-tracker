import { useState } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

const AINutritionAnalyzer = ({ currentCalories = 0, currentProtein = 0, onApplyMacros }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please enter food items with exact weight scale measurements in grams.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    playSystemSound('click');

    try {
      const res = await fetch('http://localhost:5000/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textDescription: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze meal macros');
      }

      playSystemSound('add');
      setAnalysisResult(data);
    } catch (err) {
      setErrorMessage(err.message || 'System AI could not analyze meal macros.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToTodayLog = () => {
    if (!analysisResult) return;
    playSystemSound('complete');

    const addedCalories = Number(analysisResult.calories) || 0;
    const addedProtein = Number(analysisResult.proteinGrams) || 0;

    const newCaloriesTotal = Number(currentCalories) + addedCalories;
    const newProteinTotal = Number(currentProtein) + addedProtein;

    onApplyMacros({
      caloriesConsumed: newCaloriesTotal,
      proteinGrams: newProteinTotal
    });
  };

  return (
    <div className="system-card border-2 border-[var(--glow-dim)] bg-[#070d19]/90 backdrop-blur-md p-5 space-y-4 shadow-[0_0_25px_rgba(45,212,255,0.2)]">
      {/* HEADER */}
      <div className="font-['Orbitron'] text-xs tracking-[2px] text-[var(--glow)] border-b border-[var(--line)] pb-2 flex justify-between items-center">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[var(--glow)] rounded-full animate-ping"></span>
          [ 🤖 AI SMART FOOD & MACRO ANALYZER ]
        </span>
        <span className="text-[var(--gold)] font-mono text-[10px]">S-RANK MACRO ANALYZER</span>
      </div>

      <p className="text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] leading-relaxed">
        Enter exact food items and weight scale measurements in grams (or standard counts) for maximum precision.
      </p>

      {/* FORM INPUTS */}
      <form onSubmit={handleAnalyze} className="space-y-3 font-['Rajdhani']">
        <div>
          <label className="block text-xs font-['Orbitron'] text-cyan-300 mb-1 uppercase">
            EXACT INGREDIENTS & GRAM WEIGHTS (G):
          </label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., 200g cooked white rice, 150g grilled chicken breast, 2 whole eggs, 10g olive oil..."
            className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono'] custom-scrollbar"
          />
        </div>

        {errorMessage && (
          <div className="p-2 bg-red-950/80 border border-red-500 text-red-300 font-['Orbitron'] text-xs tracking-wider">
            [ ERROR ]: {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs tracking-[2px] py-3 uppercase transition-all shadow-[0_0_20px_rgba(45,212,255,0.4)] cursor-pointer"
        >
          {loading ? '[ SYSTEM COMPUTING GRAM MACROS... ]' : '[ ⚡ COMPUTE EXACT GRAM MACROS WITH AI ]'}
        </button>
      </form>

      {/* ANALYSIS RESULTS PANEL */}
      {analysisResult && (
        <div className="mt-4 border-2 border-[var(--glow)] bg-[#050b16] p-4 space-y-3 animate-fade-in text-left">
          <div className="font-['Orbitron'] text-xs font-bold text-[var(--glow)] border-b border-[var(--line)] pb-1 flex justify-between">
            <span>[ MEAL ANALYSIS: {analysisResult.mealName?.toUpperCase()} ]</span>
            <span className="text-emerald-400">{analysisResult.calories} KCAL</span>
          </div>

          {/* MACROS GRID */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#0a1120] border border-cyan-800 p-2">
              <div className="text-[10px] font-['Orbitron'] text-cyan-400">CALORIES</div>
              <div className="text-sm font-bold text-white font-mono">{analysisResult.calories}</div>
            </div>
            <div className="bg-[#0a1120] border border-emerald-800 p-2">
              <div className="text-[10px] font-['Orbitron'] text-emerald-400">PROTEIN</div>
              <div className="text-sm font-bold text-white font-mono">{analysisResult.proteinGrams}g</div>
            </div>
            <div className="bg-[#0a1120] border border-amber-800 p-2">
              <div className="text-[10px] font-['Orbitron'] text-amber-400">CARBS</div>
              <div className="text-sm font-bold text-white font-mono">{analysisResult.carbsGrams || 0}g</div>
            </div>
            <div className="bg-[#0a1120] border border-rose-800 p-2">
              <div className="text-[10px] font-['Orbitron'] text-rose-400">FATS</div>
              <div className="text-sm font-bold text-white font-mono">{analysisResult.fatsGrams || 0}g</div>
            </div>
          </div>

          {/* ESSENTIAL MICRONUTRIENTS */}
          {analysisResult.micronutrients && (
            <div className="border border-[var(--line)] bg-[#080e1c] p-2.5 text-xs space-y-1 font-['Share_Tech_Mono']">
              <div className="font-['Orbitron'] text-[10px] text-[var(--gold)] uppercase mb-1">
                ESSENTIAL MICRONUTRIENTS DETECTED:
              </div>
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>• Calcium: <strong className="text-white">{analysisResult.micronutrients.calciumMg || 0} mg</strong></span>
                <span>• Iron: <strong className="text-white">{analysisResult.micronutrients.ironMg || 0} mg</strong></span>
                <span>• Sodium: <strong className="text-white">{analysisResult.micronutrients.sodiumMg || 0} mg</strong></span>
              </div>
            </div>
          )}

          {analysisResult.summary && (
            <p className="text-xs text-[var(--text-dim)] font-['Rajdhani'] italic">
              "{analysisResult.summary}"
            </p>
          )}

          {/* APPLY BUTTON */}
          <button
            onClick={handleApplyToTodayLog}
            className="w-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500 font-['Orbitron'] font-bold text-xs tracking-[2px] py-3 uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            [ 📥 APPLY TO TODAY'S LOG (+{analysisResult.calories} kcal / +{analysisResult.proteinGrams}g protein) ]
          </button>
        </div>
      )}
    </div>
  );
};

export default AINutritionAnalyzer;
