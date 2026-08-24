import { useState, useEffect } from 'react';

const BootScreen = ({ player, onComplete }) => {
  // Sequence stages: 'welcome' -> 'prompt' -> 'door_opening' -> 'awakening_quote'
  const [stage, setStage] = useState('welcome');

  const hunterName = player?.name || 'Player';

  // Play audio helper with fallback policy handling
  const playAudio = (soundFile) => {
    try {
      const audio = new Audio(soundFile);
      audio.volume = 0.6;
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    // Mount complete
  }, []);

  const handleNextStage = () => {
    playAudio('/sounds/sound.mp3');
    setStage('prompt');
  };

  const handleAccept = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    playAudio('/sounds/sound.mp3');
    setStage('door_opening');
    
    // Stage 3: Slide doors open (2 seconds)
    setTimeout(() => {
      setStage('awakening_quote');
    }, 2000);

    // Stage 4: Hold Awakening Quote screen for 4.5 seconds so it feels impactful before completing boot
    setTimeout(() => {
      localStorage.setItem('hasSeenIntro', 'true');
      onComplete();
    }, 6500);
  };

  const handleDecline = () => {
    playAudio('/sounds/penalty.mp3');
    alert('[SYSTEM WARNING]: A Player cannot refuse the System\'s calling.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020306] flex flex-col items-center justify-center p-4 overflow-hidden select-none font-['Cinzel',_serif]">
      
      {/* STAGE 1: SYSTEM WELCOME ALERT NOTIFICATION */}
      {stage === 'welcome' && (
        <div 
          onClick={handleNextStage}
          className="relative max-w-lg w-full bg-[#050b14]/95 border-2 border-cyan-400 p-8 shadow-[0_0_45px_rgba(45,212,255,0.5)] text-center cursor-pointer animate-bounce-short group"
        >
          {/* Decorative Corner Accents */}
          <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300"></div>
          <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300"></div>
          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-300"></div>
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-300"></div>

          {/* Notification Header */}
          <div className="font-['Orbitron'] text-cyan-300 text-sm tracking-[4px] uppercase mb-2 flex items-center justify-center gap-2 animate-pulse">
            <span className="text-cyan-400"></span> SYSTEM NOTIFICATION  <span className="text-cyan-400"></span>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-full my-4"></div>

          <div className="font-['Share_Tech_Mono'] text-xl sm:text-2xl text-white tracking-widest my-6">
            [ Welcome, <span className="text-lime-400 font-bold">{hunterName}</span>. ]
          </div>

          <div className="text-[10px] text-cyan-400/80 font-mono tracking-[2px] uppercase mt-6 group-hover:text-cyan-300 transition-colors">
             CLICK TO ACKNOWLEDGE NOTIFICATION 
          </div>
        </div>
      )}

      {/* STAGE 2: PLAYER QUALIFICATIONS PROMPT */}
      {stage === 'prompt' && (
        <div className="relative max-w-xl w-full bg-[#030712]/95 border border-cyan-500/80 p-8 sm:p-10 shadow-[0_0_50px_rgba(45,212,255,0.6)] text-center animate-fade-in">
          
          <div className="font-['Share_Tech_Mono'] text-lg sm:text-2xl text-cyan-100 tracking-wider leading-relaxed my-4">
            You have acquired the qualifications to be a <span className="font-bold italic text-cyan-300 drop-shadow-[0_0_10px_rgba(45,212,255,0.9)]">Player</span>. Will you accept?
          </div>

          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={handleAccept}
              className="bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400 text-cyan-300 font-['Orbitron'] font-bold px-8 py-3 text-sm tracking-[3px] uppercase transition-all shadow-[0_0_20px_rgba(45,212,255,0.7)] cursor-pointer hover:scale-105"
            >
              [ YES ]
            </button>

            <button
              onClick={handleDecline}
              className="bg-slate-950 hover:bg-red-950/40 border border-slate-700 hover:border-red-600 text-slate-400 hover:text-red-400 font-['Orbitron'] font-bold px-8 py-3 text-sm tracking-[3px] uppercase transition-all cursor-pointer"
            >
              [ NO ]
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: GATE DOOR OPENING SCENE */}
      {stage === 'door_opening' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden z-50">
          {/* Left Sliding Door */}
          <div className="w-1/2 h-full bg-[#050a14] border-r-2 border-cyan-500/80 shadow-[15px_0_35px_rgba(45,212,255,0.6)] animate-slideLeft flex items-center justify-end pr-8">
            <div className="text-cyan-500/30 text-7xl font-['Orbitron']">❖</div>
          </div>

          {/* Right Sliding Door */}
          <div className="w-1/2 h-full bg-[#050a14] border-l-2 border-cyan-500/80 shadow-[-15px_0_35px_rgba(45,212,255,0.6)] animate-slideRight flex items-center justify-start pl-8">
            <div className="text-cyan-500/30 text-7xl font-['Orbitron']">❖</div>
          </div>

          {/* Center Glowing Energy Light */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 rounded-full bg-cyan-400/50 blur-3xl animate-ping"></div>
          </div>
        </div>
      )}

      {/* STAGE 4: SYSTEM AWAKENING SCREEN WITH QUOTE (HELD FOR 4.5s) */}
      {stage === 'awakening_quote' && (
        <div className="text-center space-y-6 animate-fade-in font-['Share_Tech_Mono'] max-w-2xl px-4">
          <div className="font-['Orbitron'] text-xs tracking-[6px] text-cyan-400 uppercase animate-pulse">
            [ SYSTEM AWAKENING IN PROGRESS ]
          </div>

          <div className="font-['Orbitron'] text-4xl sm:text-6xl font-black text-white tracking-[8px] drop-shadow-[0_0_25px_rgba(45,212,255,0.9)]">
            AWAKENING
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-full my-4"></div>

          <p className="text-base sm:text-xl text-cyan-200 italic font-serif tracking-widest leading-relaxed drop-shadow-[0_0_8px_rgba(45,212,255,0.4)] text-balance">
            "The weak are consumed by their excuses. The strong adapt, train, and overcome. I am the only one who levels up."
          </p>

          <div className="text-xs text-slate-400 tracking-[3px] uppercase pt-4 animate-pulse">
            [ HUNTER {hunterName.toUpperCase()} RECOGNIZED • INITIALIZING STATUS WINDOW... ]
          </div>
        </div>
      )}

    </div>
  );
};

export default BootScreen;