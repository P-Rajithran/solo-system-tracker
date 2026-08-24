import { API_BASE_URL, API_ROOT } from './utils/apiConfig';
import { useState, useEffect } from 'react';
import ProfileHeader from './components/ProfileHeader';
import StatsPanel from './components/StatsPanel';
import QuestPanel from './components/QuestPanel';
import ProgressTracker from './components/ProgressTracker';

const StatusWindow = () => {
  const [player, setPlayer] = useState(null);
  const [quest, setQuest] = useState(null);
  const [weight, setWeight] = useState(100);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const [playerRes, questRes] = await Promise.all([
          fetch(`${API_BASE_URL}/player/status`),
          fetch(`${API_BASE_URL}/quests/today`)
        ]);

        const playerData = await playerRes.json();
        const questData = await questRes.json();

        setPlayer(playerData);
        setQuest(questData);
        if (questData.nutrition) {
          setWeight(questData.nutrition.currentWeight || 100);
          setCalories(questData.nutrition.caloriesConsumed || 0);
          setProtein(questData.nutrition.proteinGrams || 0);
        }
      } catch (err) {
        console.error('[SYSTEM ERROR]: Failed to fetch system data:', err);
      }
    };

    fetchSystemData();
  }, []);

  const handleToggleTask = async (taskName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/quests/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName })
      });
      const data = await res.json();
      setQuest(data.quest);
      setPlayer(data.player);
    } catch (err) {
      console.error('[SYSTEM ERROR]: Failed to update task status:', err);
    }
  };

  const handleAllocateStat = async (statName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/player/allocate-stat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statName })
      });
      const updatedPlayer = await res.json();
      setPlayer(updatedPlayer);
    } catch (err) {
      console.error('[SYSTEM ERROR]: Failed to allocate stat point:', err);
    }
  };

  const handleSaveNutrition = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/quests/nutrition`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentWeight: weight, caloriesConsumed: calories, proteinGrams: protein })
      });
      const data = await res.json();
      const updatedQuest = data.quest || data;
      const updatedPlayer = data.player;
      setQuest(updatedQuest);
      if (updatedPlayer) {
        setPlayer(updatedPlayer);
      }
      alert('[SYSTEM ALARM]: Weight & Nutrition Log Saved to Database!');
    } catch (err) {
      console.error('[SYSTEM ERROR]: Failed to save nutrition details:', err);
    }
  };

  const handleClearPenalty = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/quests/clear-penalty`, { method: 'POST' });
      const data = await res.json();
      setQuest(data.quest);
      setPlayer(data.player);
    } catch (err) {
      console.error('[SYSTEM ERROR]: Failed to clear penalty:', err);
    }
  };

  if (!player || !quest) {
    return (
      <div className="min-h-screen bg-[#020306] text-[var(--glow)] font-mono flex items-center justify-center">
        <h1 className="text-xl md:text-2xl animate-pulse tracking-widest drop-shadow-[0_0_12px_rgba(45,212,255,0.8)] font-['Orbitron']">
          [ INITIALIZING SYSTEM INTERFACE... ]
        </h1>
      </div>
    );
  }

  const startWeight = player?.startWeight || 100;
  const goalWeight = player?.targetWeight || 75;
  const currentWeightVal = parseFloat(weight) || player?.currentWeight || startWeight;
  const goalType = player?.goalType || 'lose';

  const totalDiff = Math.abs(startWeight - goalWeight);
  const progressVal = goalType === 'gain' ? (currentWeightVal - startWeight) : (startWeight - currentWeightVal);
  const goalProgress = totalDiff > 0 ? Math.min(100, Math.max(0, Math.round((progressVal / totalDiff) * 100))) : 100;

  return (
    <div className="min-h-screen bg-[#040711] text-[#dbe9ff] p-4 font-['Rajdhani'] flex items-center justify-center relative">
      
      {/* PENALTY OVERLAY */}
      {(quest.isPenaltyActive || player.hp === 0) && (
        <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full border-2 border-red-600 bg-black p-6 shadow-[0_0_30px_rgba(220,38,38,0.8)] text-center animate-pulse">
            <h1 className="text-3xl font-black text-red-500 tracking-widest mb-2 border-b border-red-900 pb-2 font-['Orbitron']">
              [ PENALTY QUEST ACTIVATED ]
            </h1>
            <p className="text-sm text-red-300 mb-4 font-['Share_Tech_Mono']">
              Failure to complete daily objectives has damaged system health.
            </p>

            <div className="border border-red-800 bg-red-950/40 p-4 text-left mb-6 space-y-2 text-sm text-red-200 font-['Share_Tech_Mono']">
              <p className="font-bold text-red-400 underline font-['Orbitron']">PENALTY OBJECTIVE:</p>
              <p>• Complete 100 Push-ups</p>
              <p>• Complete 100 Sit-ups</p>
              <p>• Complete 100 Squats</p>
              <p>• Run 10 Kilometers</p>
            </div>

            <button
              onClick={handleClearPenalty}
              className="w-full bg-red-600 hover:bg-red-500 text-black font-bold py-3 text-sm tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.8)] font-['Orbitron'] cursor-pointer"
            >
              Complete Penalty & Restore HP
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTAINER */}
      <div className="w-full max-w-3xl border-2 border-[var(--glow)] bg-[#070d19]/95 p-6 shadow-[0_0_35px_rgba(45,212,255,0.3)] relative space-y-5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-center border-b border-[var(--line)] pb-3 text-[var(--glow)] drop-shadow-[0_0_12px_rgba(45,212,255,0.8)] font-['Orbitron'] uppercase">
          [ SYSTEM STATUS INTERFACE ]
        </h1>

        <ProfileHeader player={player} />
        <StatsPanel player={player} onAllocateStat={handleAllocateStat} />
        <QuestPanel quest={quest} onToggleTask={handleToggleTask} />

        {/* PROGRESS TRACKER & HISTORICAL ANALYTICS */}
        <div>
          <ProgressTracker player={player} />
        </div>

        {/* NUTRITION & WEIGHT PANEL */}
        <div className="system-card space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--line)] pb-2 gap-1">
            <h2 className="text-sm font-bold text-[var(--glow)] font-['Orbitron'] uppercase tracking-wider">
              {goalType === 'gain' ? 'MUSCLE BULK' : 'FAT LOSS'} GOAL ({startWeight}kg → {goalWeight}kg)
            </h2>
            <span className="text-xs text-[var(--gold)] font-bold font-['Share_Tech_Mono']">{goalProgress}% COMPLETED</span>
          </div>

          <div className="w-full bg-[#0a0f1c] border border-[var(--line)] h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--glow-dim)] to-[var(--glow)] h-full shadow-[0_0_10px_rgba(45,212,255,0.8)] transition-all duration-700" style={{ width: `${goalProgress}%` }}></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-['Orbitron'] text-[var(--glow)] mb-1 uppercase">WEIGHT (KG)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] px-3 py-2 text-white font-['Share_Tech_Mono'] text-sm outline-none focus:border-[var(--glow)]"
              />
            </div>
            <div>
              <label className="block text-xs font-['Orbitron'] text-amber-400 mb-1 uppercase">CALORIES</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] px-3 py-2 text-white font-['Share_Tech_Mono'] text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-['Orbitron'] text-rose-400 mb-1 uppercase">PROTEIN (G)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[var(--line)] px-3 py-2 text-white font-['Share_Tech_Mono'] text-sm outline-none focus:border-rose-400"
              />
            </div>
          </div>

          <button
            onClick={handleSaveNutrition}
            className="w-full bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs py-3 transition-all uppercase tracking-[2px] shadow-[0_0_15px_rgba(45,212,255,0.4)] cursor-pointer"
          >
            [ SAVE WEIGHT & NUTRITION DATA ]
          </button>
        </div>

      </div>
    </div>
  );
};

export default StatusWindow;