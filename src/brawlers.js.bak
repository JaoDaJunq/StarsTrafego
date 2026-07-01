export const BRAWLERS = [
  {
    id: 'joao',
    name: 'João',
    title: 'Rosa Azul',
    role: 'Atirador de dano',
    color: 0x2f8cff,
    accent: 0x8fd6ff,
    hp: 250,
    speed: 5.4,
    reloadTime: 1.45,
    fireRate: 0.9,
    damage: 25,
    attack: 'Rosa azul de média distância',
    super: 'Prisão de correntes em área'
  },
  {
    id: 'luan',
    name: 'Luan',
    title: 'Lâmina em Cone',
    role: 'Lutador de curta distância',
    color: 0x111318,
    accent: 0xe5484d,
    hp: 350,
    speed: 5.8,
    reloadTime: 1.05,
    fireRate: 0.54,
    damage: 15,
    attack: 'Corte de espada em cone',
    super: 'Avanço giratório em área'
  },
  {
    id: 'djonga',
    name: 'Djonga',
    title: 'Combo de Socos',
    role: 'Tanque agressivo',
    color: 0xe5484d,
    accent: 0xff9d8e,
    hp: 450,
    speed: 5.7,
    reloadTime: 0.95,
    fireRate: 0.42,
    damage: 8,
    attack: 'Sequência de 3 socos',
    super: 'Salto com impacto na aterrissagem'
  },
  {
    id: 'thomas',
    name: 'Thomas',
    title: 'Estilo Leon',
    role: 'Assassino móvel',
    color: 0x0f2446,
    accent: 0x74d8ff,
    hp: 220,
    speed: 6.2,
    reloadTime: 0.95,
    fireRate: 0.5,
    damage: 6,
    attack: '4 lâminas em leque',
    super: 'Invisibilidade temporária'
  },
  {
    id: 'gui',
    name: 'Gui',
    title: 'Estilo Eugênio',
    role: 'Controlador',
    color: 0x8a6de0,
    accent: 0xff8de8,
    hp: 280,
    speed: 5.4,
    reloadTime: 1.55,
    fireRate: 1.1,
    damage: 18,
    attack: 'Orbe mágico de longo alcance',
    super: 'Mão mágica de controle'
  },
  {
    id: 'lorenzo',
    name: 'Lorenzo',
    title: 'Estilo Pam',
    role: 'Suporte tanque',
    color: 0xff8a4c,
    accent: 0xffd58f,
    hp: 400,
    speed: 5.1,
    reloadTime: 1.05,
    fireRate: 0.5,
    damage: 6,
    attack: 'Rajada larga de 9 estilhaços',
    super: 'Torreta de cura em área'
  },
  {
    id: 'ministro',
    name: 'Ministro',
    title: 'Estilo Byron',
    role: 'Suporte frágil',
    color: 0x62d3ff,
    accent: 0xf4b740,
    hp: 200,
    speed: 5.5,
    reloadTime: 0.9,
    fireRate: 0.55,
    damage: 30,
    attack: 'Dardo de longo alcance com efeito contínuo',
    super: 'Frasco lançado em área'
  }
];

export const DEFAULT_BRAWLER_ID = BRAWLERS[0].id;

export function getBrawler(id) {
  return BRAWLERS.find(b => b.id === id) || BRAWLERS[0];
}

export function brawlerTaken(roster, brawlerId, myId) {
  return roster.some(entry => entry.id !== myId && entry.brawlerId === brawlerId);
}
