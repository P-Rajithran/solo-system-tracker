import { useState } from 'react';
import BossRaidCard from '../components/BossRaidCard';
import { playSystemSound } from '../utils/hunterUtils';

const QuestPanel = ({ quest, onToggleTask, onTriggerPenalty, onAddTask }) => {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskXp, setNewTaskXp] = useState(20);

  // Standard daily tasks
  const tasksList = [
    { key: 'workoutCompleted', label: 'Complete Daily Workout', desc: '+1 STR / +1 AGI', xp: 30, icon: '💪' },
    { key: 'meditationCompleted', label: 'Daily Meditation', desc: '+1 INT', xp: 20, icon: '🧘' },
    { key: 'macrosTracked', label: 'Track Daily Macros', desc: '+1 VIT (Fat Loss)', xp: 15, icon: '🥗' }
  ];

  const handleTaskClick = (key) => {
    const isCurrentlyDone = quest?.tasks?.[key] || quest?.customTasks?.find(t => t.id === key)?.completed;
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
      onAddTask(newTaskName.trim(), Number(newTaskXp));
    }
    setNewTaskName('');
    setNewTaskXp(20);
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full box-border relative z-0">
      
      {/* DAILY DUNGEON BOSS RAID */}
      <BossRaidCard quest={quest} />

      {/* CREATE CUSTOM DAILY QUEST CARD */}
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
          <button type="submit" className="btn-primary whitespace-nowrap cursor-pointer">
            + ADD QUEST
          </button>
        </form>
      </div>

      {/* SYSTEM QUEST LIST CARD */}
      <div className="system-card w-full max-w-full box-border relative z-0">
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] mb-[14px] flex justify-between items-center">
          <span className="flex items-center gap-2 before:content-['◆'] before:text-[10px]">
            ACTIVE DAILY OBJECTIVES
          </span>
          <span className={quest?.isCompleted ? "text-[var(--success)] font-bold tracking-widest" : "text-[var(--gold)] tracking-widest"}>
            {quest?.isCompleted ? "[ QUEST CLEARED ]" : "[ IN PROGRESS ]"}
          </span>
        </div>

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
                    ? 'border-l-[4px] border-l-[var(--success)] bg-[rgba(52,211,153,0.08)]' 
                    : 'border-l-[4px] border-l-[var(--glow-dim)] hover:bg-[rgba(45,212,255,0.05)]'
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
                  ? 'border-l-[4px] border-l-[var(--success)] bg-[rgba(52,211,153,0.08)]' 
                  : 'border-l-[4px] border-l-[var(--purple)] hover:bg-[rgba(139,92,246,0.05)]'
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold tracking-[0.5px] text-[var(--text)] flex items-center gap-2">
                  <span className="text-base shrink-0">{ct.type === 'daily' ? '🔁' : '🎯'}</span>
                  <span>{ct.label} {ct.completed && '✓'}</span>
                </div>
                <div className="text-[12px] text-[var(--purple)] mt-[2px]">CUSTOM OBJECTIVE</div>
              </div>
              <div className="font-['Share_Tech_Mono'] text-[var(--gold)] text-[13px] whitespace-nowrap">
                +{ct.xp} XP
              </div>
            </div>
          ))}
        </div>

        <div className="text-[12px] text-[var(--text-faint)] mt-[12px]">
          Quests reset daily at midnight. Completing tasks reduces Dungeon Boss HP and earns XP.
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

export default QuestPanel;