export const ARENA_W = 24;
export const ARENA_D = 15;

export const COLORS = {
  grassBase: 0x6dbf3e,
  grassShade: 0x4e9a2c,
  grassHighlight: 0x8fdb5e,
  dirt: 0xe0b169,
  dirtShade: 0xc0925022,

  sky: 0xbfe8ff,
  fog: 0xbfe8ff,

  playerBody: 0x22e0c2,
  playerShade: 0x0e9e88,
  playerVisor: 0x102033,
  gunMetal: 0x33465a,

  pilarBase: 0x4d6a89,
  pilarShade: 0x33455c,
  pilarGold: 0xf4b740,

  crateWood: 0xd79a46,
  crateShade: 0x9c6a2c,
  cratePaper: 0xf7f2e6,
  crateSeal: 0xe5484d,

  bushLeaf: 0x2fa98c,
  bushShade: 0x1d7a64,

  gold: 0xf4b740,
  crimson: 0xe5484d,
  outline: 0x0c1420
};

export const OBSTACLES = [
  { type: 'wall', x: 3.4, z: 3, w: 3.2, d: 0.8, label: 'Pilar de Report' },
  { type: 'wall', x: 17.4, z: 3, w: 3.2, d: 0.8, label: 'Pilar de Report' },
  { type: 'wall', x: 3.4, z: 11.4, w: 3.2, d: 0.8, label: 'Pilar de Report' },
  { type: 'wall', x: 17.4, z: 11.4, w: 3.2, d: 0.8, label: 'Pilar de Report' },
  { type: 'wall', x: 10.4, z: 6.6, w: 0.8, d: 3.4, label: 'Pilar de Report' },

  { type: 'crate', x: 7.2, z: 5, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 15.6, z: 5, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 7.2, z: 9, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 15.6, z: 9, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 11.6, z: 12, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },

  { type: 'bush', x: 1.6, z: 6.5, w: 3, d: 2.3, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 19.4, z: 6.5, w: 3, d: 2.3, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 10.6, z: 0.9, w: 3.1, d: 1.7, label: 'Zona de Baixo CTR' }
];
