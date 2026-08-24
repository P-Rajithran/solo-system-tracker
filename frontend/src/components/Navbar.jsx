
import { NavLink } from 'react-router-dom';
import { playSystemSound } from '../utils/hunterUtils';

const Navbar = () => {
  const navItems = [
    { path: '/', label: 'STATUS' },
    { path: '/quests', label: 'DAILY QUESTS' },
    { path: '/achievements', label: '🏆 ACHIEVEMENTS' },
    { path: '/nutrition', label: 'WEIGHT LOG' },
    { path: '/trainer', label: 'AI COACH' },
    { path: '/shop', label: '🛒 SYSTEM SHOP' }
  ];

  return (
    <nav className="flex gap-[6px] mb-4 overflow-x-auto pb-[4px] custom-scrollbar">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => playSystemSound('click')}
          className={({ isActive }) =>
            `font-['Orbitron'] text-[11px] tracking-[1.5px] px-[14px] py-[10px] cursor-pointer whitespace-nowrap transition-all duration-200 border ${
              isActive
                ? 'text-[#04141c] bg-[var(--glow)] border-[var(--glow)] shadow-[0_0_16px_rgba(45,212,255,0.5)]'
                : 'bg-[var(--panel)] text-[var(--text-dim)] border-[var(--line)] hover:text-[var(--text)] hover:border-[var(--glow-dim)]'
            }`
          }
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navbar;