import { useState, useEffect } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

const MICRO_QUEST_POOL = [
  {
    id: 'pushups',
    title: '10 Push-ups',
    category: 'Physical',
    icon: '💪',
    duration: '< 1 minute',
    description: 'Drop down and perform 10 clean, focused push-ups to wake up your body and boost circulation.'
  },
  {
    id: 'box_breathing',
    title: '60 Seconds of Box Breathing',
    category: 'Mindfulness',
    icon: '🧘',
    duration: '1 minute',
    description: 'Follow the 4-4-4-4 rhythm below: Inhale (4s), Hold (4s), Exhale (4s), Hold (4s) to reset your nervous system.'
  },
  {
    id: 'gratitude',
    title: "Write One Thing You're Grateful For",
    category: 'Mindset',
    icon: '📝',
    duration: '< 1 minute',
    description: 'Reflect briefly and record a simple positive thought or thing you appreciate right now.'
  },
  {
    id: 'water',
    title: 'Drink a Glass of Water',
    category: 'Hydration',
    icon: '💧',
    duration: '< 30 seconds',
    description: 'Stand up, pour a cool glass of fresh water, and hydrate yourself before resuming.'
  },
  {
    id: 'squats',
    title: '20 Squats',
    category: 'Physical',
    icon: '🦵',
    duration: '< 1 minute',
    description: 'Stand tall, engage your core, and execute 20 steady bodyweight squats.'
  },
  {
    id: 'stretch',
    title: '2-Minute Walk / Stretch',
    category: 'Mobility',
    icon: '🚶',
    duration: '2 minutes',
    description: 'Step away from your desk, stretch your neck and hamstrings, or walk around the room.'
  }
];

const ShadowTrainingModal = ({ player, onClose, onCompleteTraining }) => {
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [gratitudeText, setGratitudeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Box Breathing Guide States
  const [breathPhase, setBreathPhase] = useState('INHALE'); // INHALE, HOLD_IN, EXHALE, HOLD_OUT
  const [breathTimer, setBreathTimer] = useState(60);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Pick initial random quest
  useEffect(() => {
    pickRandomQuest();
  }, []);

  // Check cooldown on mount and tick countdown
  useEffect(() => {
    const checkCooldown = () => {
      if (player?.lastShadowTrainingAt) {
        const COOLDOWN_MS = 15 * 60 * 1000;
        const elapsed = Date.now() - new Date(player.lastShadowTrainingAt).getTime();
        if (elapsed < COOLDOWN_MS) {
          setCooldownRemaining(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
        } else {
          setCooldownRemaining(0);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [player?.lastShadowTrainingAt]);

  // Box Breathing Animation Loop
  useEffect(() => {
    let breathInterval;
    if (selectedQuest?.id === 'box_breathing' && isBreathingActive && breathTimer > 0) {
      breathInterval = setInterval(() => {
        setBreathTimer((prev) => Math.max(0, prev - 1));

        // 16s full cycle (4s each phase)
        const cycleSecond = (60 - breathTimer + 1) % 16;
        if (cycleSecond < 4) setBreathPhase('INHALE');
        else if (cycleSecond < 8) setBreathPhase('HOLD_IN');
        else if (cycleSecond < 12) setBreathPhase('EXHALE');
        else setBreathPhase('HOLD_OUT');
      }, 1000);
    }

    return () => clearInterval(breathInterval);
  }, [selectedQuest?.id, isBreathingActive, breathTimer]);

  const pickRandomQuest = () => {
    playSystemSound('click');
    const randomIndex = Math.floor(Math.random() * MICRO_QUEST_POOL.length);
    setSelectedQuest(MICRO_QUEST_POOL[randomIndex]);
    setGratitudeText('');
    setBreathTimer(60);
    setIsBreathingActive(false);
  };

  const handleComplete = async () => {
    if (isSubmitting || cooldownRemaining > 0) return;
    setIsSubmitting(true);
    playSystemSound('complete');

    await onCompleteTraining({
      taskLabel: selectedQuest?.title,
      notes: selectedQuest?.id === 'gratitude' ? gratitudeText : null
    });

    setIsSubmitting(false);
    onClose();
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Share_Tech_Mono']">
      <div className="system-card max-w-lg w-full border-2 border-purple-500 bg-gradient-to-b from-[#0b0717] via-[#080512] to-[#04020a] p-6 shadow-[0_0_35px_rgba(168,85,247,0.3)] space-y-6 relative overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-center border-b border-purple-500/40 pb-4">
          <div>
            <h2 className="font-['Orbitron'] text-base sm:text-lg font-bold text-purple-300 tracking-wider flex items-center gap-2 uppercase">
              <span>⚔️</span> SHADOW TRAINING GROUNDS
            </h2>
            <p className="text-xs text-slate-400 font-['Share_Tech_Mono'] mt-0.5">
              Low-stakes micro-actions to reset focus & revitalize energy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono text-sm px-2 py-0.5 border border-slate-700 hover:border-purple-400 transition-colors rounded-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* COOLDOWN ACTIVE NOTICE */}
        {cooldownRemaining > 0 ? (
          <div className="p-4 bg-purple-950/80 border-2 border-purple-500/60 rounded-xs text-center space-y-2">
            <div className="font-['Orbitron'] text-xs text-purple-300 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <span>⏳</span> [ SYSTEM COOLDOWN ACTIVE ]
            </div>
            <p className="text-xs text-slate-300">
              Shadow Training Grounds will open again in:
            </p>
            <div className="text-xl font-bold font-['Orbitron'] text-purple-400 tracking-widest">
              {formatTime(cooldownRemaining)}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Rest your body and mind before embarking on another micro-session.
            </p>
          </div>
        ) : (
          /* ACTIVE MICRO QUEST DISPLAY */
          selectedQuest && (
            <div className="space-y-5">
              
              {/* QUEST CARD */}
              <div className="p-5 bg-[#0e0920] border border-purple-500/50 rounded-xs space-y-3 relative">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl shrink-0">{selectedQuest.icon}</span>
                    <div>
                      <div className="text-[10px] text-purple-400 uppercase font-bold tracking-widest">
                        [{selectedQuest.category}] • {selectedQuest.duration}
                      </div>
                      <h3 className="font-['Orbitron'] text-base font-bold text-white tracking-wide mt-0.5">
                        {selectedQuest.title}
                      </h3>
                    </div>
                  </div>
                  
                  <button
                    onClick={pickRandomQuest}
                    className="text-[10px] text-purple-300 border border-purple-500/40 px-2 py-1 hover:bg-purple-950/60 transition-all rounded-2xs font-bold uppercase cursor-pointer"
                    title="Pick another random micro-action"
                  >
                    🎲 SWAP
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-['Rajdhani'] font-medium">
                  {selectedQuest.description}
                </p>

                {/* SPECIAL VARIANT: BOX BREATHING VISUAL GUIDE */}
                {selectedQuest.id === 'box_breathing' && (
                  <div className="mt-4 p-4 bg-black/60 border border-cyan-500/40 rounded-xs flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div 
                        className={`w-24 h-24 rounded-full border-4 border-cyan-400 transition-all duration-1000 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,255,0.4)] ${
                          breathPhase === 'INHALE' ? 'scale-110 bg-cyan-500/20' :
                          breathPhase === 'HOLD_IN' ? 'scale-110 bg-cyan-400/30' :
                          breathPhase === 'EXHALE' ? 'scale-90 bg-cyan-950/40' : 'scale-90 bg-black'
                        }`}
                      >
                        <span className="font-['Orbitron'] text-xs font-bold text-cyan-300 tracking-wider text-center px-1">
                          {breathPhase === 'INHALE' ? 'INHALE' :
                           breathPhase === 'HOLD_IN' ? 'HOLD' :
                           breathPhase === 'EXHALE' ? 'EXHALE' : 'HOLD EMPTY'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsBreathingActive(!isBreathingActive)}
                        className="px-3 py-1 bg-cyan-950 border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors font-['Orbitron'] text-xs font-bold rounded-2xs cursor-pointer"
                      >
                        {isBreathingActive ? '⏸ PAUSE' : '▶ START BREATHING GUIDE'}
                      </button>
                      <span className="text-xs text-cyan-400 font-bold font-['Orbitron']">
                        {formatTime(breathTimer)}
                      </span>
                    </div>
                  </div>
                )}

                {/* SPECIAL VARIANT: GRATITUDE TEXT INPUT */}
                {selectedQuest.id === 'gratitude' && (
                  <div className="mt-3 space-y-1.5">
                    <label className="text-[11px] text-purple-300 font-bold uppercase tracking-wider block">
                      WHAT ARE YOU GRATEFUL FOR RIGHT NOW?
                    </label>
                    <input
                      type="text"
                      value={gratitudeText}
                      onChange={(e) => setGratitudeText(e.target.value)}
                      placeholder="e.g. A warm cup of coffee, a fresh breeze..."
                      className="w-full bg-black/80 border border-purple-500/60 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 rounded-2xs"
                    />
                  </div>
                )}
              </div>

              {/* REWARD CALLOUT & FOOTER */}
              <div className="flex justify-between items-center pt-2 flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-purple-300">REWARD:</span>
                  <span className="bg-purple-950/80 border border-purple-500/60 px-2 py-0.5 rounded-2xs text-cyan-300">
                    +10 XP
                  </span>
                  <span className="bg-amber-950/80 border border-amber-500/60 px-2 py-0.5 rounded-2xs text-amber-300">
                    +5 GOLD
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white text-xs font-['Orbitron'] font-bold rounded-2xs uppercase cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-['Orbitron'] text-xs font-bold tracking-wider rounded-2xs uppercase shadow-[0_0_15px_rgba(168,85,247,0.5)] cursor-pointer transition-all"
                  >
                    [ COMPLETE ]
                  </button>
                </div>
              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
};

export default ShadowTrainingModal;
