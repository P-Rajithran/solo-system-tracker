import { useEffect } from 'react';

const SavedDataToast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="pointer-events-auto w-full animate-fade-in">
      <div 
        className="relative bg-gradient-to-r from-[#031c15] via-[#062c21] to-[#031c15] border-2 border-emerald-500/80 p-3 shadow-[0_0_25px_rgba(16,185,129,0.5)] text-left flex items-center justify-between gap-3"
        style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-emerald-950 border border-emerald-400 text-emerald-300 font-['Orbitron'] font-extrabold text-[10px] tracking-wider px-2 py-1 rounded-2xs shrink-0 flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>[ SAVED ]</span>
          </div>

          <div className="min-w-0 flex-1 font-['Share_Tech_Mono'] text-xs text-emerald-100 font-bold truncate">
            {toast.message}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-emerald-400/70 hover:text-emerald-200 font-mono text-xs p-1 shrink-0 cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default SavedDataToast;
