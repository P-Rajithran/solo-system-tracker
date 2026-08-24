// CHANGE THIS:
// export className EQUIPMENT_ITEMS = [

// TO THIS:
export const EQUIPMENT_ITEMS = [
  {
    id: 'dagger_1',
    name: 'KNIGHT KILLER DAGGER',
    slot: 'WEAPON',
    statBonus: { STR: 5 },
    reqLvl: 1,
    icon: '🗡️',
    description: 'Increases Strength by +5.'
  },
  {
    id: 'armor_1',
    name: 'IRON SOVEREIGN CLOAK',
    slot: 'ARMOR',
    statBonus: { VIT: 5 },
    reqLvl: 5,
    icon: '🛡️',
    description: 'Increases Vitality by +5.'
  },
  {
    id: 'ring_1',
    name: "DEMON MONARCH'S RING",
    slot: 'ACCESSORY',
    statBonus: { MEN: 5 },
    reqLvl: 10,
    icon: '💍',
    description: 'Increases Mentality by +5.'
  },
  {
    id: 'boots_1',
    name: 'HERMES SPEED BOOTS',
    slot: 'BOOTS',
    statBonus: { DIS: 5 },
    reqLvl: 15,
    icon: '🥾',
    description: 'Increases Discipline by +5.'
  }
];

export const SHADOW_ARMY_ROSTER = [
  {
    id: 'igris',
    name: 'COMMANDER IGRIS',
    rank: 'Knight Grade',
    reqLvl: 5,
    icon: '⚔️',
    passiveBuff: '+10% XP Multiplier on Workouts',
    bonusPower: 150
  },
  {
    id: 'iron',
    name: 'TANK IRON',
    rank: 'Elite Grade',
    reqLvl: 10,
    icon: '🛡️',
    passiveBuff: '+15% Damage Reduction vs Penalties',
    bonusPower: 300
  },
  {
    id: 'tank',
    name: 'SHADOW TANK',
    rank: 'Beast Grade',
    reqLvl: 15,
    icon: '🐺',
    passiveBuff: '+5 Base Vitality Boost',
    bonusPower: 450
  },
  {
    id: 'beru',
    name: 'GENERAL BERU',
    rank: 'General Grade',
    reqLvl: 25,
    icon: '👑',
    passiveBuff: '+25% Overall XP Multiplier',
    bonusPower: 1000
  }
];

export const calculateEffectiveStats = (baseStats = {}, equippedIds = []) => {
  const effective = {
    STR: baseStats.STR || 10,
    VIT: baseStats.VIT || 10,
    MEN: baseStats.MEN || 10,
    DIS: baseStats.DIS || 10
  };

  equippedIds.forEach((itemId) => {
    const item = EQUIPMENT_ITEMS.find((e) => e.id === itemId);
    if (item && item.statBonus) {
      Object.keys(item.statBonus).forEach((statKey) => {
        effective[statKey] = (effective[statKey] || 0) + item.statBonus[statKey];
      });
    }
  });

  return effective;
};

export const calculateArmyPower = (currentLevel = 1) => {
  return SHADOW_ARMY_ROSTER.filter((s) => currentLevel >= s.reqLvl).reduce(
    (total, shadow) => total + shadow.bonusPower,
    0
  );
};