import { API_BASE_URL, API_ROOT } from '../utils/apiConfig';
import { useState } from 'react';
import BossRaidCard from '../components/BossRaidCard';
import { playSystemSound } from '../utils/hunterUtils';

const QuestPage = ({ player, quest, onToggleTask, onTriggerPenalty, onAddTask, onPlayerUpdate, onNavigateTab, workoutStreak }) => {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskXp, setNewTaskXp] = useState(20);
  const [taskType, setTaskType] = useState('daily');
  const [undoToast, setUndoToast] = useState('');
  const [isUndoing, setIsUndoing] = useState(false);

  // Standard daily tasks
  const tasksList = [
    { key: 'workoutCompleted', label: 'Complete a Workout', desc: '+1 STR / +1 AGI', xp: 30, icon: '💪' },
    { key: 'meditationCompleted', label: 'Daily Meditation', desc: '+1 INT', xp: 20, icon: '🧘' },
    { key: 'macrosTracked', label: 'Track Daily Macros', desc: '+1 VIT (Fat Loss)', xp: 15, icon: '🥗' }
  ];

  const handleTaskClick = (key) => {
    const isCurrentlyDone = quest?.tasks?.[key];
    if (!isCurrentlyDone) {
      playSystemSound('complete');
    } else {
      playSystemSound('click');
    }
    onToggleTask(key);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    if (onAddTask) {
      onAddTask(newTaskName.trim(), Number(newTaskXp), taskType);
    }
    setNewTaskName('');
    setNewTaskXp(20);
  };

  const handleUndoLastAction = async () => {
    const confirmUndo = window.confirm(
      "Are you sure you want to UNDO your most recent logged action?\n\nThis will revert XP, Gold Coins, Stat Points, and Task Completion status."
    );

    if (!confirmUndo) return;

    setIsUndoing(true);
    playSystemSound('click');

    try {
      const token = localStorage.getItem('hunter_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE_URL}/quests/undo-last`, {
        method: 'POST',
        headers
      });

      const data = await res.json();

      if (!res.ok) {
        playSystemSound('penalty');
        setUndoToast(data.error || data.message || '[ NOTICE ]: No recent action to undo.');
        setTimeout(() => setUndoToast(''), 4000);
        return;
      }

      playSystemSound('levelup');
      setUndoToast(data.message || '[ ACTION UNDONE ]: Successfully reverted most recent system action!');
      setTimeout(() => setUndoToast(''), 4500);

      if (onPlayerUpdate) {
        onPlayerUpdate();
      }
    } catch (err) {
      console.error('[UNDO ACTION ERROR]:', err);
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full box-border relative z-0">
      
      {/* FATIGUE RECOVERY SYSTEM ADVISORY BANNER */}
      {workoutStreak >= 3 && (
        <div className="p-3 bg-amber-950/85 border-2 border-amber-500/80 text-amber-300 font-['Orbitron'] text-xs tracking-wider animate-pulse flex items-center justify-between flex-wrap gap-2 rounded-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <div className="flex items-center gap-2.5">
            <span className="text-lg shrink-0">🛌</span>
            <span>[ SYSTEM ]: Fatigue detected. Consider a recovery day.</span>
          </div>
          <span className="font-['Share_Tech_Mono'] text-[10px] text-amber-400 border border-amber-500/60 bg-amber-950 px-2 py-0.5 rounded-2xs font-bold">
            {workoutStreak} CONSECUTIVE WORKOUT DAYS
          </span>
        </div>
      )}

      {/* UNDO TOAST NOTIFICATION BANNER */}
      {undoToast && (
        <div className="p-3 bg-amber-950/90 border border-amber-500 text-amber-300 font-['Orbitron'] text-xs tracking-wider animate-fade-in flex items-center justify-between flex-wrap gap-2 box-border">
          <span className="min-w-0 flex-1 break-words">{undoToast}</span>
          <span className="text-amber-400 font-mono text-[10px] shrink-0">REVERTED</span>
        </div>
      )}

      {/* DAILY DUNGEON BOSS RAID CARD */}
      <BossRaidCard quest={quest} player={player} onNavigateTab={onNavigateTab} onPlayerUpdate={onPlayerUpdate} />

      {/* ADD NEW CUSTOM QUEST CARD WITH TYPE SELECTOR */}
      <div className="system-card w-full max-w-full box-border relative z-0">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] mb-[14px] flex items-center gap-2 before:content-['◆'] before:text-[10px]">
          CREATE CUSTOM DAILY QUEST
        </div>
        <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="e.g., Read 15 pages, 100 Pushups, Cold Shower"
            className="flex-1 bg-[#0a0f1c] border border-[var(--line)] text-[var(--text)] p-[9px_10px] text-[14px] outline-none focus:border-[var(--glow-dim)] font-['Rajdhani']"
          />
          <input
            type="number"
            value={newTaskXp}
            onChange={(e) => setNewTaskXp(e.target.value)}
            placeholder="XP"
            className="w-20 bg-[#0a0f1c] border border-[var(--line)] text-[var(--text)] p-[9px_10px] text-[14px] outline-none focus:border-[var(--glow-dim)] font-['Share_Tech_Mono']"
          />

          {/* TYPE SELECTOR DROPDOWN */}
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="bg-[#0a0f1c] border border-[var(--line)] text-[var(--gold)] p-[9px_10px] text-[12px] outline-none font-['Orbitron'] cursor-pointer"
          >
            <option value="daily">🔁 DAILY ROUTINE</option>
            <option value="today">⏳ TODAY ONLY</option>
          </select>

          <button type="submit" className="btn-primary whitespace-nowrap cursor-pointer">
            + ADD QUEST
          </button>
        </form>
      </div>

      {/* SYSTEM QUEST LIST CARD WITH UNDO BUTTON */}
      <div className="system-card w-full max-w-full box-border relative z-0">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] mb-[14px] flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
              ACTIVE DAILY OBJECTIVES
            </span>
            <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/50 px-2 py-0.5 rounded-2xs font-['Share_Tech_Mono']">
              ⚡ XP TODAY: {quest?.dailyXpEarned || 0} / {quest?.DAILY_XP_CAP || 300}
            </span>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/50 px-2 py-0.5 rounded-2xs font-['Share_Tech_Mono']">
              🪙 GOLD TODAY: {quest?.dailyGoldEarned || 0} / {quest?.DAILY_GOLD_CAP || 500}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUndoLastAction}
              disabled={isUndoing}
              className="text-[10px] font-['Orbitron'] px-2.5 py-1 border border-amber-500/60 text-amber-300 hover:bg-amber-950/60 transition-colors uppercase rounded-xs cursor-pointer font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
              title="Undo most recent action (reverts XP, Gold, stats, and task completion)"
            >
              <span>↩ UNDO LAST</span>
            </button>
            <span className={quest?.isCompleted ? "text-[var(--success)] font-bold tracking-widest" : "text-[var(--gold)] tracking-widest"}>
              {quest?.isCompleted ? "[ CLEARED ]" : "[ IN PROGRESS ]"}
            </span>
          </div>
        </div>

        {/* DAILY CAP DIMINISHED REWARDS BANNER */}
        {((quest?.dailyXpEarned || 0) >= (quest?.DAILY_XP_CAP || 300) || (quest?.dailyGoldEarned || 0) >= (quest?.DAILY_GOLD_CAP || 500)) && (
          <div className="mb-3 p-2.5 bg-amber-950/90 border border-amber-500/80 text-amber-300 font-['Orbitron'] text-[11px] tracking-wider animate-pulse flex items-center justify-between flex-wrap gap-2 rounded-xs shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>[SYSTEM]: Daily clearance limit reached. Rewards diminished.</span>
            </div>
            <span className="font-['Share_Tech_Mono'] text-[10px] text-amber-400 font-bold">
              TASKS STILL COUNT TOWARDS STREAKS & GATES
            </span>
          </div>
        )}

        <div className="space-y-[8px]">
          {/* Default System Tasks */}
          {tasksList.map((t) => {
            const isDone = quest?.tasks?.[t.key];
            return (
              <div
                key={t.key}
                onClick={() => handleTaskClick(t.key)}
                className={`flex items-center gap-[12px] p-[12px_14px] bg-[var(--panel-2)] border border-[var(--line)] cursor-pointer transition-all duration-200 ${
                  isDone 
                    ? 'border-l-[3px] border-l-[var(--success)] opacity-55 bg-[rgba(52,211,153,0.05)]' 
                    : 'border-l-[3px] border-l-[var(--glow-dim)] hover:bg-[rgba(45,212,255,0.05)]'
                }`}
              >
                <div className="flex-1">
                  <div className="font-semibold tracking-[0.5px] text-[var(--text)] flex items-center gap-2">
                    <span className="text-base shrink-0">{t.icon}</span>
                    <span>{t.label} {isDone && '✓'}</span>
                  </div>
                  <div className="text-[12px] text-[var(--text-dim)] mt-[2px]">{t.desc}</div>
                </div>
                <div className="font-['Share_Tech_Mono'] text-[var(--gold)] text-[13px] whitespace-nowrap">
                  +{t.xp} XP
                </div>
              </div>
            );
          })}

          {/* Custom Player-Created Tasks */}
          {quest?.customTasks?.map((ct) => (
            <div
              key={ct.id}
              onClick={() => handleTaskClick(ct.id)}
              className={`flex items-center gap-[12px] p-[12px_14px] bg-[var(--panel-2)] border border-[var(--line)] cursor-pointer transition-all duration-200 ${
                ct.completed 
                  ? 'border-l-[3px] border-l-[var(--success)] opacity-55 bg-[rgba(52,211,153,0.05)]' 
                  : 'border-l-[3px] border-l-[var(--purple)] hover:bg-[rgba(139,92,246,0.05)]'
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold tracking-[0.5px] text-[var(--text)] flex items-center gap-2">
                  <span className="text-base shrink-0">{ct.type === 'daily' ? '🔁' : (ct.type === 'today' ? '⏳' : '🎯')}</span>
                  <span>{ct.label} {ct.completed && '✓'}</span>
                </div>
                <div className="text-[10px] text-[var(--purple)] mt-[2px] font-['Orbitron'] flex items-center gap-1">
                  <span>{ct.type === 'daily' ? '🔁 RECURRING DAILY ROUTINE' : '⏳ TODAY ONLY OBJECTIVE'}</span>
                </div>
              </div>
              <div className="font-['Share_Tech_Mono'] text-[var(--gold)] text-[13px] whitespace-nowrap">
                +{ct.xp} XP
              </div>
            </div>
          ))}
        </div>

        <div className="text-[12px] text-[var(--text-faint)] mt-[12px]">
          Quests reset daily at midnight. Complete tasks to gain XP and prevent penalty quests.
        </div>

        <div className="mt-[14px] pt-[14px] border-t border-[var(--line)] flex justify-end">
          <button
            onClick={onTriggerPenalty}
            className="font-['Orbitron'] text-[9px] bg-transparent border border-[var(--text-faint)] text-[var(--text-faint)] px-[8px] py-[4px] hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors uppercase tracking-[2px] cursor-pointer"
          >
            Simulate Missed Day
          </button>
        </div>
      </div>

    </div>
  );
};

export default QuestPage;