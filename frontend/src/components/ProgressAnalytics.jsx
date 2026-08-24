import { useState, useEffect } from 'react';
import { getHunterRank, playSystemSound } from '../utils/hunterUtils';

const ProgressAnalytics = ({ player, analyticsData, onFetchAnalytics }) => {
  const [range, setRange] = useState('7'); // '7' for Weekly, '30' for Monthly
  const [activeTab, setActiveTab] = useState('weight'); // 'weight', 'quests', 'nutrition', 'discipline'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentLevel = player?.level || 1;
  const rankInfo = getHunterRank(currentLevel);

  const cachedAnalytics = analyticsData?.[range];

  useEffect(() => {
    if (!cachedAnalytics && onFetchAnalytics) {
      setIsRefreshing(true);
      onFetchAnalytics(range, false).finally(() => setIsRefreshing(false));
    }
  }, [range, cachedAnalytics, onFetchAnalytics]);

  const handleRangeChange = (newRange) => {
    playSystemSound('click');
    setRange(newRange);
    if (!analyticsData?.[newRange] && onFetchAnalytics) {
      setIsRefreshing(true);
      onFetchAnalytics(newRange, false).finally(() => setIsRefreshing(false));
    }
  };

  const handleTabChange = (newTab) => {
    playSystemSound('click');
    setActiveTab(newTab);
  };

  if (!cachedAnalytics && isRefreshing) {
    return (
      <div className="system-card border-2 border-[var(--glow-dim)] p-6 text-center animate-pulse font-['Orbitron'] text-xs text-[var(--glow)]">
        [ INITIALIZING SYSTEM PROGRESS DATA... ]
      </div>
    );
  }

  const analytics = cachedAnalytics || {};
  const rawTimeline = analytics?.timeline || [];
  const summary = analytics?.summary || {};
  const isMonthly = range === '30';

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

  // Compute weight scale bounds accurately
  const loggedWeights = timeline.map((t) => t.weight).filter((w) => w > 0);
  const minW = loggedWeights.length > 0 ? Math.min(...loggedWeights) - 1 : Math.max(0, defaultWeight - 5);
  const maxW = loggedWeights.length > 0 ? Math.max(...loggedWeights) + 1 : defaultWeight + 5;
  const wRange = maxW - minW || 1;

  // Compute nutrition scale bounds
  const maxCal = Math.max(...timeline.map((t) => t.calories), player?.dailyCalorieTarget || 2200, 1000);

  return (
    <div className="system-card border-2 border-[var(--glow-dim)] space-y-4">
      {/* HEADER & RANGE TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] flex items-center gap-2 before:content-['◆'] before:text-[10px]">
            HUNTER PROGRESS TRACKER
          </div>
          <div className="font-['Share_Tech_Mono'] text-[11px] text-[var(--text-dim)]">
            TIMESTAMPTED ANALYTICS & STATISTICAL AGGREGATION
          </div>
        </div>

        {/* WEEKLY vs MONTHLY TOGGLE BUTTONS */}
        <div className="flex items-center gap-1.5 bg-[#0a0f1c] border border-[var(--line)] p-1 rounded-sm">
          <button
            onClick={() => handleRangeChange('7')}
            className={`font-['Orbitron'] text-[10px] tracking-wider px-3 py-1 uppercase transition-all cursor-pointer ${
              !isMonthly
                ? 'bg-[var(--glow)] text-[#04141c] font-bold shadow-[0_0_10px_rgba(45,212,255,0.5)]'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            [ 7 DAYS (WEEKLY) ]
          </button>
          <button
            onClick={() => handleRangeChange('30')}
            className={`font-['Orbitron'] text-[10px] tracking-wider px-3 py-1 uppercase transition-all cursor-pointer ${
              isMonthly
                ? 'bg-[var(--gold)] text-[#04141c] font-bold shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            [ 30 DAYS (MONTHLY) ]
          </button>
        </div>
      </div>

      {/* EMPTY STATE ADVISORY FOR JOURNAL ANALYTICS */}
      {rawTimeline.length === 0 && (
        <div className="p-3 bg-[#070e1c] border border-cyan-500/40 rounded-xs font-['Share_Tech_Mono'] text-xs text-slate-300 space-y-1">
          <div className="font-['Orbitron'] text-[11px] text-cyan-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
            <span>📊</span> [ SYSTEM JOURNAL INITIALIZED ]: NO LOGGED DATA YET
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            Your historical progress journal is currently empty. Complete your daily quests, log physical weight, and record nutrition metrics to generate interactive progression graphs here over time.
          </p>
        </div>
      )}

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-['Share_Tech_Mono'] text-xs">
        {/* WEIGHT STAT */}
        <div className="p-3 bg-[var(--panel-2)] border border-[var(--line)] rounded-sm">
          <div className="text-[10px] text-[var(--text-dim)] font-['Orbitron'] uppercase">AVG WEIGHT</div>
          <div className="text-lg font-bold text-white font-['Orbitron'] mt-0.5">
            {avgW} kg
          </div>
          <div className={`text-[10px] font-bold ${wChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {wChange > 0 ? `+${wChange} kg` : `${wChange} kg`} ({isMonthly ? '30d' : '7d'})
          </div>
        </div>

        {/* QUEST CLEAR STAT */}
        <div className="p-3 bg-[var(--panel-2)] border border-[var(--line)] rounded-sm">
          <div className="text-[10px] text-[var(--text-dim)] font-['Orbitron'] uppercase">QUEST RATE</div>
          <div className="text-lg font-bold text-[var(--glow)] font-['Orbitron'] mt-0.5">
            {questRate}%
          </div>
          <div className="text-[10px] text-[var(--gold)]">
            {questsCompleted} / {rawTimeline.length} Days Cleared
          </div>
        </div>

        {/* NUTRITION STAT */}
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
              <span className="font-['Orbitron'] text-[11px] text-[var(--glow)]">WEIGHT PROGRESSION ({isMonthly ? '30-DAY MONTHLY LOG' : '7-DAY WEEKLY LOG'})</span>
              <span className="text-[var(--text-dim)] text-[10px]">MIN: {minW.toFixed(1)}kg • MAX: {maxW.toFixed(1)}kg</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 gap-1 sm:gap-2">
              {timeline.map((item, idx) => {
                const w = item.weight || defaultWeight;
                const hPct = Math.max(15, Math.round(((w - minW) / wRange) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-7 bg-black border border-[var(--glow)] text-[9px] text-[var(--glow)] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_0_8px_rgba(45,212,255,0.6)]">
                      {item.date}: {w > 0 ? `${w}kg` : `${defaultWeight}kg`}
                    </div>
                    <span className="text-[9px] text-cyan-300 mb-1 font-bold group-hover:text-white hidden sm:block">
                      {w}
                    </span>
                    <div
                      style={{ height: `${hPct}%` }}
                      className="w-full transition-all duration-300 rounded-t border-t bg-gradient-to-t from-[rgba(45,212,255,0.2)] to-[var(--glow)] border-[var(--glow)] shadow-[0_0_8px_rgba(45,212,255,0.4)]"
                    ></div>
                    <span className="text-[8px] sm:text-[9px] text-[var(--text-dim)] mt-1 truncate max-w-full">
                      {isMonthly ? (idx % 3 === 0 ? item.date : '') : item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: QUEST CLEARANCE CHART */}
        {activeTab === 'quests' && (
          <div>
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="font-['Orbitron'] text-[11px] text-cyan-400">DAILY QUEST & TASK COMPLETION RATE (%)</span>
              <span className="text-[var(--glow)] text-[10px]">AVG CLEARANCE: {questRate}%</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 gap-1 sm:gap-2">
              {timeline.map((item, idx) => {
                const pct = item.completionPct || 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-7 bg-black border border-[var(--glow)] text-[9px] text-cyan-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_0_8px_rgba(45,212,255,0.6)]">
                      {item.date}: {pct}% ({item.completedTasks || 0}/{item.totalTasks || 3} Tasks)
                    </div>
                    <span className="text-[9px] text-cyan-300 mb-1 font-bold hidden sm:block">
                      {pct}%
                    </span>
                    <div
                      style={{ height: `${Math.max(6, pct)}%` }}
                      className="w-full transition-all duration-300 rounded-t border-t bg-gradient-to-t from-[#092638] to-[var(--glow)] border-[var(--glow)] shadow-[0_0_10px_rgba(45,212,255,0.6)]"
                    ></div>
                    <span className="text-[8px] sm:text-[9px] text-[var(--text-dim)] mt-1 truncate max-w-full">
                      {isMonthly ? (idx % 3 === 0 ? item.date : '') : item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: NUTRITION METRICS CHART */}
        {activeTab === 'nutrition' && (
          <div>
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="font-['Orbitron'] text-[11px] text-cyan-300">CALORIE INTAKE TRACKER (KCAL)</span>
              <span className="text-cyan-400 text-[10px]">TARGET: {player?.dailyCalorieTarget || 2200} KCAL</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 gap-1 sm:gap-2">
              {timeline.map((item, idx) => {
                const cal = item.calories || 0;
                const calPct = Math.min(100, Math.round((cal / maxCal) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-7 bg-black border border-[var(--glow)] text-[9px] text-cyan-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_0_8px_rgba(45,212,255,0.6)]">
                      {item.date}: {cal} kcal | {item.protein || 0}g Protein
                    </div>
                    <span className="text-[9px] text-cyan-300 mb-1 font-bold hidden sm:block">
                      {cal}
                    </span>
                    <div
                      style={{ height: `${Math.max(6, calPct)}%` }}
                      className="w-full transition-all duration-300 rounded-t border-t bg-gradient-to-t from-[#0a2033] to-[var(--glow)] border-[var(--glow)] shadow-[0_0_8px_rgba(45,212,255,0.5)]"
                    ></div>
                    <span className="text-[8px] sm:text-[9px] text-[var(--text-dim)] mt-1 truncate max-w-full">
                      {isMonthly ? (idx % 3 === 0 ? item.date : '') : item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: DISCIPLINE & SLEEP RECOVERY */}
        {activeTab === 'discipline' && (
          <div>
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="font-['Orbitron'] text-[11px] text-cyan-400">DEEP WORK & SLEEP RECOVERY</span>
              <span className="text-[var(--glow)] text-[10px]">TOTAL DEEP WORK: {deepWorkHrs} HRS</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 gap-1 sm:gap-2">
              {timeline.map((item, idx) => {
                const dw = item.deepWorkHours || 0;
                const slp = item.sleepHours || 0;
                const dwPct = Math.min(100, Math.round((dw / 12) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-7 bg-black border border-[var(--glow)] text-[9px] text-cyan-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-[0_0_8px_rgba(45,212,255,0.6)]">
                      {item.date}: Work {dw}h | Sleep {slp}h
                    </div>
                    <span className="text-[9px] text-cyan-300 mb-1 font-bold hidden sm:block">
                      {dw}h
                    </span>
                    <div
                      style={{ height: `${Math.max(6, dwPct)}%` }}
                      className="w-full transition-all duration-300 rounded-t border-t bg-gradient-to-t from-[#071f30] to-[var(--glow)] border-[var(--glow)] shadow-[0_0_8px_rgba(45,212,255,0.5)]"
                    ></div>
                    <span className="text-[8px] sm:text-[9px] text-[var(--text-dim)] mt-1 truncate max-w-full">
                      {isMonthly ? (idx % 3 === 0 ? item.date : '') : item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* NEXT RANK MILESTONE VISUAL */}
      {rankInfo.nextLevelReq && (
        <div className="p-3 bg-[#0a1120] border border-[var(--glow-dim)] rounded-sm font-['Share_Tech_Mono'] text-xs space-y-2 mt-3">
          <div className="font-['Orbitron'] text-[11px] text-[var(--glow)] tracking-wider uppercase flex justify-between items-center">
            <span>[ 🏆 NEXT RANK MILESTONE: {rankInfo.nextRank} ]</span>
            <span className="text-[var(--gold)] font-bold">LVL {currentLevel} → LVL {rankInfo.nextLevelReq}</span>
          </div>

          <div className="w-full bg-[#050914] h-2.5 rounded-full overflow-hidden border border-[var(--line)]">
            <div 
              className="bg-gradient-to-r from-[var(--glow-dim)] to-[var(--glow)] h-full shadow-[0_0_10px_rgba(45,212,255,0.8)] transition-all duration-700" 
              style={{ width: `${Math.min(100, Math.max(0, Math.round(((currentLevel - rankInfo.minLevel) / (rankInfo.nextLevelReq - rankInfo.minLevel)) * 100)))}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-[var(--text-dim)]">
            <span>⚡ {rankInfo.nextLevelReq - currentLevel} Level(s) Remaining (~{rankInfo.nextLevelReq - currentLevel} Days of Daily Quests)</span>
            <span className="text-emerald-400 font-bold">REWARD: {rankInfo.nextRank} UNLOCK</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProgressAnalytics;
