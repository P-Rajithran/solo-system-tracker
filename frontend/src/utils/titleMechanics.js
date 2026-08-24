export const HUNTER_TITLES = [
  {
    id: 'e_rank_novice',
    name: 'E-RANK NOVICE',
    reqLvl: 1,
    buff: '+0% All Stats',
    description: 'Granted to all newly awakened hunters.'
  },
  {
    id: 'wolf_slayer',
    name: 'WOLF SLAYER',
    reqLvl: 5,
    buff: '+2 STR Boost',
    description: 'Earned by clearing D-Rank wolf pack dungeons.'
  },
  {
    id: 'demon_slayer',
    name: 'DEMON SLAYER',
    reqLvl: 15,
    buff: '+5% XP Multiplier',
    description: 'Earned by conquering the Demon Castle Dungeon.'
  },
  {
    id: 'monarch_successor',
    name: 'IRON SOVEREIGN',
    reqLvl: 30,
    buff: '+10% All Stats & Army Power',
    description: 'Granted upon inheriting supreme System power.'
  }
];

export const getActiveTitle = (level = 1) => {
  const available = HUNTER_TITLES.filter(t => level >= t.reqLvl);
  return available[available.length - 1] || HUNTER_TITLES[0];
};