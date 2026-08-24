export const getHunterRank = (level) => {
  if (level >= 50) return { rank: 'S-RANK', title: 'IRON SOVEREIGN', color: 'text-purple-400 border-purple-500' };
  if (level >= 30) return { rank: 'A-RANK', title: 'NATIONAL LEVEL HUNTER', color: 'text-yellow-400 border-yellow-500' };
  if (level >= 20) return { rank: 'B-RANK', title: 'HIGH-RANK GUILD MASTER', color: 'text-cyan-400 border-cyan-500' };
  if (level >= 10) return { rank: 'C-RANK', title: 'ELITE STRIKER', color: 'text-blue-400 border-blue-500' };
  if (level >= 5)  return { rank: 'D-RANK', title: 'RAID MEMBER', color: 'text-green-400 border-green-500' };
  return { rank: 'E-RANK', title: 'WEAKEST WEAPON OF MANKIND', color: 'text-slate-400 border-slate-600' };
};