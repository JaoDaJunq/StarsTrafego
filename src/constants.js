export const ARENA_W = 34;
export const ARENA_D = 24;

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
  { type: 'wall', x: 6.2, z: 4.2, w: 4.2, d: 0.9, label: 'Pilar de Report' },
  { type: 'wall', x: 27.8, z: 4.2, w: 4.2, d: 0.9, label: 'Pilar de Report' },
  { type: 'wall', x: 6.2, z: 19.8, w: 4.2, d: 0.9, label: 'Pilar de Report' },
  { type: 'wall', x: 27.8, z: 19.8, w: 4.2, d: 0.9, label: 'Pilar de Report' },
  { type: 'wall', x: 17.0, z: 12.0, w: 1.0, d: 5.0, label: 'Pilar de Report' },
  { type: 'wall', x: 17.0, z: 5.8, w: 4.2, d: 0.9, label: 'Pilar de Report' },
  { type: 'wall', x: 17.0, z: 18.2, w: 4.2, d: 0.9, label: 'Pilar de Report' },

  { type: 'crate', x: 10.5, z: 8.0, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 23.5, z: 8.0, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 10.5, z: 16.0, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 23.5, z: 16.0, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 14.0, z: 12.0, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 20.0, z: 12.0, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },

  { type: 'bush', x: 3.2, z: 12.0, w: 4.4, d: 3.2, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 30.8, z: 12.0, w: 4.4, d: 3.2, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 17.0, z: 2.2, w: 4.5, d: 2.2, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 17.0, z: 21.8, w: 4.5, d: 2.2, label: 'Zona de Baixo CTR' }
];
