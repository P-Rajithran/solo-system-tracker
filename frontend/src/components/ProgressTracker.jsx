import { API_BASE_URL, API_ROOT } from '../utils/apiConfig';
import { useState, useEffect } from 'react';
import { getHunterRank, playSystemSound } from '../utils/hunterUtils';

const ProgressTracker = ({ player }) => {
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly', 'monthly', 'all-time'
  const [activeTab, setActiveTab] = useState('weight'); // 'weight', 'quests', 'nutrition', 'discipline'
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentLevel = player?.level || 1;
  const rankInfo = getHunterRank(currentLevel);

  useEffect(() => {
    let ignore = false;
    const fetchProgressData = async () => {
      setIsLoading(true);
      try {
        let param = '7';
        if (timeframe === 'monthly') param = '30';
        if (timeframe === 'all-time') param = 'all';

        const token = localStorage.getItem('hunter_token');
        const res = await fetch(`${API_BASE_URL}/quests/analytics?range=${param}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        if (!ignore) {
          setAnalytics(data);
        }
      } catch (err) {
        console.error('[PROGRESS TRACKER FETCH ERROR]:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchProgressData();
    return () => { ignore = true; };
  }, [timeframe]);

  const handleTimeframeChange = (tf) => {
    playSystemSound('click');
    setTimeframe(tf);
  };

  const handleTabChange = (tb) => {
    playSystemSound('click');
    setActiveTab(tb);
  };

  if (isLoading) {
    return (
      <div className="system-card border-2 border-[var(--glow-dim)] p-6 text-center animate-pulse font-['Orbitron'] text-xs text-[var(--glow)]">
        [ COMPUTING SYSTEM ANALYTICS & TIMELINE... ]
      </div>
    );
  }

  const rawTimeline = analytics?.timeline || [];
  const summary = analytics?.summary || {};

  const defaultWeight = player?.currentWeight || player?.startWeight || 105;

  // Ensure timeline always has valid data matching user's real weight
  const timeline = (rawTimeline.length > 0 ? rawTimeline : [
    { date: 'Day 1', weight: defaultWeight, calories: 0, protein: 0, deepWorkHours: 0, sleepHours: 7, completionPct: 0 }
  ]).map((t) => {
    let w = Number(t.weight);
    if (!w || isNaN(w) || w <= 0) {
      w = defaultWeight;
    }
    return { ...t, weight: w };
  });

  const avgW = summary.avgWeight && summary.avgWeight > 0 ? summary.avgWeight : defaultWeight;
  const wChange = summary.weightChange || 0;
  const questRate = summary.avgCompletionRate || 0;
  const questsCompleted = summary.totalQuestsCompleted || 0;
  const avgCal = summary.avgCalories || 0;
  const avgProt = summary.avgProtein || 0;
  const deepWorkHrs = summary.totalDeepWork || 0;
  const avgSleep = summary.avgSleep || 0;
  const dungeonClears = summary.totalDungeonClears || 0;

  // Compute weight scale bounds cleanly
  const loggedWeights = timeline.map((t) => t.weight).filter((w) => w > 0);
  const minW = loggedWeights.length > 0 ? Math.min(...loggedWeights) - 1 : Math.max(0, defaultWeight - 5);
  const maxW = loggedWeights.length > 0 ? Math.max(...loggedWeights) + 1 : defaultWeight + 5;
  const wRange = maxW - minW || 1;

  // Compute nutrition scale bounds
  const maxCal = Math.max(...timeline.map((t) => t.calories), player?.dailyCalorieTarget || 2200, 1000);

  return (
    <div className="system-card border-2 border-[var(--glow-dim)] space-y-4">
      {/* HEADER & TIMEFRAME TOGGLE BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] flex items-center gap-2 before:content-['◆'] before:text-[10px]">
            PROGRESS TRACKER & HISTORICAL ANALYTICS
          </div>
          <div className="font-['Share_Tech_Mono'] text-[11px] text-[var(--text-dim)]">
            TIMEFRAME PROGRESS: {timeframe.toUpperCase()} TRACKING
          </div>
        </div>

        {/* UI TOGGLE BUTTONS FOR WEEKLY, MONTHLY & ALL-TIME */}
        <div className="flex items-center gap-1 bg-[#0a0f1c] border border-[var(--line)] p-1 rounded-sm flex-wrap">
          <button
            onClick={() => handleTimeframeChange('weekly')}
            className={`font-['Orbitron'] text-[10px] tracking-wider px-3 py-1 uppercase transition-all cursor-pointer ${
              timeframe === 'weekly'
                ? 'bg-[var(--glow)] text-[#04141c] font-bold shadow-[0_0_10px_rgba(45,212,255,0.5)]'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            WEEKLY (7D)
          </button>

          <button
            onClick={() => handleTimeframeChange('monthly')}
            className={`font-['Orbitron'] text-[10px] tracking-wider px-3 py-1 uppercase transition-all cursor-pointer ${
              timeframe === 'monthly'
                ? 'bg-[var(--gold)] text-[#04141c] font-bold shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            MONTHLY (30D)
          </button>

          <button
            onClick={() => handleTimeframeChange('all-time')}
            className={`font-['Orbitron'] text-[10px] tracking-wider px-3 py-1 uppercase transition-all cursor-pointer ${
              timeframe === 'all-time'
                ? 'bg-[var(--purple)] text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            ALL-TIME
          </button>
        </div>
      </div>

      {/* SUMMARY METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-['Share_Tech_Mono'] text-xs">
        {/* WEIGHT METRIC */}
        <div className="p-3 bg-[var(--panel-2)] border border-[var(--line)] rounded-sm">
          <div className="text-[10px] text-[var(--text-dim)] font-['Orbitron'] uppercase">AVG WEIGHT</div>
          <div className="text-lg font-bold text-[var(--glow)] font-['Orbitron'] mt-0.5">
            {avgW} kg
          </div>
          <div className={`text-[10px] ${wChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {wChange > 0 ? `+${wChange}` : wChange} kg ({timeframe === 'weekly' ? '7d' : timeframe === 'monthly' ? '30d' : 'all'})
          </div>
        </div>

        {/* QUEST CLEAR RATE */}
        <div className="p-3 bg-[var(--panel-2)] border border-[var(--line)] rounded-sm">
          <div className="text-[10px] text-[var(--text-dim)] font-['Orbitron'] uppercase">QUEST RATE</div>
          <div className="text-lg font-bold text-emerald-400 font-['Orbitron'] mt-0.5">
            {questRate}%
          </div>
          <div className="text-[10px] text-[var(--text-dim)]">
            {questsCompleted} / {timeline.length} Days Cleared
          </div>
        </div>

        {/* NUTRITION AVERAGE */}
        <div className="p-3 bg-[var(--panel-2)] border border-[var(--line)] rounded-sm">
          <div className="text-[10px] text-[var(--text-dim)] font-['Orbitron'] uppercase">AVG INTAKE</div>
          <div className="text-lg font-bold text-amber-300 font-['Orbitron'] mt-0.5">
            {avgCal} kcal
          </div>
          <div className="text-[10px] text-rose-300">
            {avgProt}g Protein
          </div>
        </div>

        {/* DISCIPLINE & GATES STAT */}
        <div className="p-3 bg-[var(--panel-2)] border border-[var(--line)] rounded-sm">
          <div className="text-[10px] text-[var(--text-dim)] font-['Orbitron'] uppercase">DISCIPLINE & GATES</div>
          <div className="text-lg font-bold text-[var(--purple)] font-['Orbitron'] mt-0.5">
            {deepWorkHrs} hrs
          </div>
          <div className="text-[10px] text-cyan-300">
            Sleep: {avgSleep}h • Gates: {dungeonClears}
          </div>
        </div>
      </div>

      {/* CHART TABS */}
      <div className="flex gap-2 border-b border-[var(--line)] pb-2 overflow-x-auto">
        {[
          { id: 'weight', label: '⚖️ WEIGHT TREND' },
          { id: 'quests', label: '⚔️ QUEST CLEARANCE' },
          { id: 'nutrition', label: '🍖 NUTRITION METRICS' },
          { id: 'discipline', label: '⚡ DEEP WORK & SLEEP' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`font-['Orbitron'] text-[10px] tracking-wider px-3 py-1.5 whitespace-nowrap cursor-pointer transition-all border ${
              activeTab === tab.id
                ? 'border-[var(--glow)] bg-[rgba(45,212,255,0.12)] text-[var(--glow)] font-bold'
                : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text-dim)] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CHART DISPLAY AREA */}
      <div className="p-3 bg-[#050811] border border-[var(--line)] rounded-sm font-['Share_Tech_Mono']">
        {/* VIEW 1: WEIGHT TREND CHART */}
        {activeTab === 'weight' && (
          <div>
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="font-['Orbitron'] text-[11px] text-[var(--glow)]">WEIGHT PROGRESSION ({timeframe.toUpperCase()} LOG)</span>
              <span className="text-[var(--text-dim)] text-[10px]">MIN: {minW.toFixed(1)}kg • MAX: {maxW.toFixed(1)}kg</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 gap-1 sm:gap-2">
              {timeline.map((item, idx) => {
                const w = item.weight || defaultWeight;
                const hPct = Math.max(15, Math.round(((w - minW) / wRange) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-7 bg-black border border-[var(--glow)] text-[9px] text-[var(--glow)] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_0_8px_rgba(45,212,255,0.6)]">
                      {item.date}: {w}kg
                    </div>
                    <span className="text-[9px] text-cyan-300 mb-1 font-bold group-hover:text-white hidden sm:block">
                      {w}
                    </span>
                    <div
                      style={{ height: `${hPct}%` }}
                      className="w-full transition-all duration-300 rounded-t border-t bg-gradient-to-t from-[rgba(45,212,255,0.2)] to-[var(--glow)] border-[var(--glow)] shadow-[0_0_8px_rgba(45,212,255,0.4)]"
                    ></div>
                    <span className="text-[8px] sm:text-[9px] text-[var(--text-dim)] mt-1 truncate max-w-full">
                      {timeframe === 'weekly' ? item.date : (idx % 3 === 0 ? item.date : '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: QUEST CLEARANCE */}
        {activeTab === 'quests' && (
          <div>
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="font-['Orbitron'] text-[11px] text-emerald-400">DAILY QUEST COMPLETION PERCENTAGE</span>
              <span className="text-[var(--text-dim)] text-[10px]">SUCCESS THRESHOLD: 100%</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 gap-1 sm:gap-2">
              {timeline.map((item, idx) => {
                const pct = item.completionPct || 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-7 bg-black border border-emerald-400 text-[9px] text-emerald-400 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                      {item.date}: {pct}% ({item.completedTasks}/{item.totalTasks})
                    </div>
                    <span className="text-[9px] text-emerald-300 mb-1 font-bold group-hover:text-white hidden sm:block">
                      {pct}%
                    </span>
                    <div
                      style={{ height: `${Math.max(8, pct)}%` }}
                      className={`w-full transition-all duration-300 rounded-t border-t ${
                        pct >= 100
                          ? 'bg-gradient-to-t from-emerald-950 to-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                          : pct > 0
                          ? 'bg-gradient-to-t from-cyan-950 to-cyan-400 border-cyan-400'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                    ></div>
                    <span className="text-[8px] sm:text-[9px] text-[var(--text-dim)] mt-1 truncate max-w-full">
                      {timeframe === 'weekly' ? item.date : (idx % 3 === 0 ? item.date : '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: NUTRITION INTAKE (CALORIES & PROTEIN) */}
        {activeTab === 'nutrition' && (
          <div>
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="font-['Orbitron'] text-[11px] text-amber-300">CALORIES & PROTEIN CONSUMPTION</span>
              <span className="text-[var(--text-dim)] text-[10px]">TARGET: {player?.dailyCalorieTarget || 2200} kcal</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 gap-1 sm:gap-2">
              {timeline.map((item, idx) => {
                const cal = item.calories || 0;
                const calPct = Math.min(100, Math.max(5, Math.round((cal / maxCal) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-7 bg-black border border-amber-400 text-[9px] text-amber-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                      {item.date}: {cal} kcal • {item.protein || 0}g Prot
                    </div>
                    <span className="text-[9px] text-amber-300 mb-1 font-bold group-hover:text-white hidden sm:block">
                      {cal > 0 ? cal : '0'}
                    </span>
                    <div
                      style={{ height: `${calPct}%` }}
                      className="w-full transition-all duration-300 rounded-t border-t bg-gradient-to-t from-amber-950/40 to-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                    ></div>
                    <span className="text-[8px] sm:text-[9px] text-[var(--text-dim)] mt-1 truncate max-w-full">
                      {timeframe === 'weekly' ? item.date : (idx % 3 === 0 ? item.date : '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: DISCIPLINE (DEEP WORK & SLEEP) */}
        {activeTab === 'discipline' && (
          <div>
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="font-['Orbitron'] text-[11px] text-[var(--purple)]">DEEP WORK FOCUS HOURS</span>
              <span className="text-[var(--text-dim)] text-[10px]">DAILY TARGET: 4+ HOURS</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 gap-1 sm:gap-2">
              {timeline.map((item, idx) => {
                const hours = item.deepWorkHours || 0;
                const hPct = Math.min(100, Math.max(8, Math.round((hours / 10) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-7 bg-black border border-[var(--purple)] text-[9px] text-purple-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                      {item.date}: {hours} hrs Deep Work • {item.sleepHours || 0}h Sleep
                    </div>
                    <span className="text-[9px] text-purple-300 mb-1 font-bold group-hover:text-white hidden sm:block">
                      {hours}h
                    </span>
                    <div
                      style={{ height: `${hPct}%` }}
                      className="w-full transition-all duration-300 rounded-t border-t bg-gradient-to-t from-purple-950/40 to-purple-400 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                    ></div>
                    <span className="text-[8px] sm:text-[9px] text-[var(--text-dim)] mt-1 truncate max-w-full">
                      {timeframe === 'weekly' ? item.date : (idx % 3 === 0 ? item.date : '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
