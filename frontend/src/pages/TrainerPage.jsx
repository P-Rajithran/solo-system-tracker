import { useState, useEffect, useRef } from 'react';
import { playSystemSound } from '../utils/hunterUtils';

const QUICK_PROMPTS = [
  { label: '📊 Analyze 7-Day Weight & Macro Trend', text: 'Analyze my 7-day weight and calorie trend. Provide exact micro-adjustments for today.' },
  { label: '🏋️ Suggest Today\'s Workout Routine', text: 'Suggest today\'s workout routine based on my current STR, VIT, and weight mission.' },
  { label: '⚖️ Calorie & Macro Micro-Adjustment', text: 'Should I adjust my daily calories or protein today based on my goal weight?' },
  { label: '⚡ Full System Status Analysis', text: 'Give me a full analytical System report on my level, HP, discipline, and gate clear progress.' }
];

const TrainerPage = ({ player, weight, analyticsData }) => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('shadow_coach_chat');
    return saved ? JSON.parse(saved) : [
      {
        role: 'system',
        text: `Greetings, Hunter ${player?.name || 'Player'}. I am the Shadow System AI Personal Trainer. I have analyzed your physical metrics: Level ${player?.level || 1}, Current Weight ${weight || player?.currentWeight || 70}kg, Goal Weight ${player?.targetWeight || 65}kg. Select a quick command or transmit custom directives for workout, nutrition, or stat micro-adjustments.`
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const last7DaysLog = analyticsData?.['7']?.timeline || [];

  useEffect(() => {
    localStorage.setItem('shadow_coach_chat', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageWithText = async (textToSend) => {
    if (!textToSend.trim() || isTyping) return;

    playSystemSound('click');
    const userMsg = { role: 'user', text: textToSend.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:5000/api/trainer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          playerContext: {
            name: player?.name || 'Player',
            level: player?.level || 1,
            stats: player?.stats || { STR: 10, VIT: 10, MEN: 10, DIS: 10 },
            currentWeight: Number(weight) || player?.currentWeight || player?.startWeight || 70,
            startWeight: player?.startWeight || 70,
            goalWeight: player?.targetWeight || 65,
            targetWeight: player?.targetWeight || 65,
            goalType: player?.goalType || 'lose',
            dailyCalorieTarget: player?.dailyCalorieTarget || 2000,
            dailyProteinTarget: player?.dailyProteinTarget || 140,
            last7DaysLog: last7DaysLog
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        playSystemSound('add');
        setMessages([...updatedMessages, { role: 'ai', text: data.reply }]);
      } else {
        throw new Error(data.error || 'AI Personal Trainer unavailable');
      }
    } catch (err) {
      console.error('[AI CHAT ERROR]:', err);
      setMessages([
        ...updatedMessages,
        {
          role: 'ai',
          text: `[ SYSTEM WARNING ]: ${err.message || 'Shadow AI network signal disrupted.'}`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessageWithText(input);
  };

  const handleClearChat = () => {
    playSystemSound('click');
    localStorage.removeItem('shadow_coach_chat');
    setMessages([
      {
        role: 'system',
        text: `Chat logs purged. Ready for new directive, Hunter ${player?.name || 'Player'}.`
      }
    ]);
  };

  return (
    <div className="space-y-[14px]">
      <div className="system-card border-2 border-[var(--glow-dim)] flex flex-col h-[560px] shadow-[0_0_30px_rgba(45,212,255,0.25)] bg-[#070d19]/90 backdrop-blur-md">
        
        {/* CHAT HEADER */}
        <div className="font-['Orbitron'] text-[13px] tracking-[2px] text-[var(--glow)] pb-[12px] border-b border-[var(--line)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[var(--glow)] rounded-full animate-ping"></span>
            <span className="before:content-['◆'] before:text-[10px] uppercase">
              SHADOW SYSTEM AI PERSONAL TRAINER
            </span>
          </div>

          <button
            onClick={handleClearChat}
            className="text-[10px] text-[var(--text-dim)] hover:text-[var(--danger)] border border-[var(--line)] hover:border-[var(--danger)] px-2 py-0.5 uppercase tracking-wider font-['Share_Tech_Mono'] transition-colors cursor-pointer"
          >
            [ PURGE LOGS ]
          </button>
        </div>

        {/* QUICK ACTION PROMPT BUTTONS */}
        <div className="flex items-center gap-2 pt-3 pb-2 overflow-x-auto custom-scrollbar">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => sendMessageWithText(qp.text)}
              disabled={isTyping}
              className="font-['Orbitron'] text-[10px] tracking-wider bg-[var(--panel-2)] border border-[var(--line)] hover:border-[var(--glow)] text-[var(--glow)] px-3 py-1.5 rounded-sm whitespace-nowrap transition-all hover:scale-[1.02] cursor-pointer shadow-[0_0_8px_rgba(45,212,255,0.15)]"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* MESSAGES DISPLAY CONTAINER */}
        <div className="flex-1 overflow-y-auto my-2 space-y-3 pr-2 custom-scrollbar font-['Share_Tech_Mono'] text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 border rounded-sm max-w-[88%] transition-all ${
                msg.role === 'user'
                  ? 'ml-auto bg-[rgba(45,212,255,0.1)] border-[var(--glow)] text-white shadow-[0_0_12px_rgba(45,212,255,0.25)]'
                  : 'mr-auto bg-[var(--panel-2)] border-[var(--purple)] text-[var(--text)] shadow-[0_0_12px_rgba(139,92,246,0.2)]'
              }`}
            >
              <div className="font-['Orbitron'] text-[9px] mb-1 uppercase tracking-widest flex justify-between items-center">
                <span className={msg.role === 'user' ? 'text-[var(--glow)] font-bold' : 'text-[var(--purple)] font-bold'}>
                  {msg.role === 'user' ? `👤 HUNTER ${player?.name?.toUpperCase() || 'PLAYER'}` : '🤖 SHADOW SYSTEM AI TRAINER'}
                </span>
                <span className="text-[8px] text-[var(--text-faint)] font-mono">ANALYTICAL LOG</span>
              </div>
              <div className="leading-relaxed whitespace-pre-wrap font-['Rajdhani'] text-sm tracking-wide">
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="p-3 bg-[var(--panel-2)] border border-[var(--glow-dim)] rounded-sm max-w-[60%] mr-auto text-[var(--glow)] font-['Orbitron'] text-[10px] animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--glow)] rounded-full animate-bounce"></span>
              [ COMPUTING 7-DAY TREND ANALYTICS & MICRO-ADJUSTMENTS... ]
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* CHAT INPUT FORM */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-[var(--line)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type directive for AI Personal Trainer..."
            className="flex-1 bg-[#0a0f1c] border border-[var(--line)] text-white px-3 py-2 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono'] rounded-sm"
          />
          <button
            type="submit"
            disabled={isTyping}
            className="bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-bold text-xs tracking-[1px] px-5 py-2 uppercase transition-all shadow-[0_0_12px_rgba(45,212,255,0.4)] cursor-pointer"
          >
            [ TRANSMIT ]
          </button>
        </form>

      </div>
    </div>
  );
};

export default TrainerPage;