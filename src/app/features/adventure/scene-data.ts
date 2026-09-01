export interface Refuge {
  id: string;
  label: string;
  route: string;
  x: number;
  y: number;
  stat: string;
}

export interface SignpostPanel {
  direction: 'left' | 'right' | 'up-left' | 'up-right' | 'down-left';
  label: string;
  distance: string;
}

export interface Signpost {
  x: number;
  y: number;
  panels: SignpostPanel[];
}

export interface TerrainZone {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const CANVAS_W = 480;
export const CANVAS_H = 300;
export const SPAWN_X = 55;
export const SPAWN_Y = 278;
export const PLAYER_W = 10;
export const PLAYER_H = 22;
export const PLAYER_SPEED = 120; // px/s
export const PROXIMITY_RADIUS = 40;

export const REFUGES: Refuge[] = [
  {
    id: 'contact',
    label: 'Contact',
    route: '/contact',
    x: 137,
    y: 215,
    stat: 'Envoyez un message',
  },
  {
    id: 'experience',
    label: 'Expériences',
    route: '/experience',
    x: 210,
    y: 120,
    stat: '4 expériences · 2021–2024',
  },
  {
    id: 'projects',
    label: 'Projets',
    route: '/projects',
    x: 250,
    y: 72,
    stat: '6 projets · Angular · Python',
  },
  {
    id: 'skills',
    label: 'Compétences',
    route: '/skills',
    x: 370,
    y: 55,
    stat: '14 compétences',
  },
];

export const SIGNPOSTS: Signpost[] = [
  {
    x: 90,
    y: 195,
    panels: [{ direction: 'up-right', label: 'Expériences', distance: '~200m' }],
  },
  {
    x: 230,
    y: 168,
    panels: [
      { direction: 'up-right', label: 'Expériences / Projets / Compétences', distance: '→' },
      { direction: 'down-left', label: 'Contact', distance: '~80m' },
    ],
  },
  {
    x: 310,
    y: 148,
    panels: [
      { direction: 'up-left', label: 'Projets', distance: '~120m' },
      { direction: 'up-left', label: 'Compétences', distance: '~250m' },
    ],
  },
];

// Trail segments: each connects two points on the lacet path
export const TRAIL_SEGMENTS: [number, number, number, number][] = [
  [55, 278, 180, 240],   // Spawn → Virage 1
  [180, 240, 90, 195],   // Virage 1 → Virage 2
  [90, 195, 230, 168],   // Virage 2 → Bifurcation
  [230, 168, 310, 148],  // Bifurcation → Virage 3 (main branch)
  [230, 168, 137, 215],  // Bifurcation → Contact (secondary branch)
  [310, 148, 210, 120],  // Virage 3 → Expériences
  [210, 120, 330, 95],   // Expériences → Virage 4
  [330, 95, 250, 72],    // Virage 4 → Projets
  [250, 72, 370, 55],    // Projets → Compétences (summit)
];

export const TERRAIN_ZONES: TerrainZone[] = [
  { xMin: 20, xMax: 100, yMin: 165, yMax: 285 },
  { xMin: 100, xMax: 180, yMin: 140, yMax: 265 },
  { xMin: 180, xMax: 260, yMin: 120, yMax: 240 },
  { xMin: 260, xMax: 330, yMin: 90, yMax: 210 },
  { xMin: 330, xMax: 400, yMin: 68, yMax: 175 },
  { xMin: 400, xMax: 480, yMin: 45, yMax: 145 },
];

export const STAR_POSITIONS: [number, number, number][] = [
  [8, 6, 0.7], [40, 14, 0.4], [90, 5, 0.8], [140, 18, 0.5],
  [210, 9, 0.9], [270, 4, 0.5], [340, 12, 0.7], [400, 6, 0.4],
  [450, 16, 0.8], [470, 8, 0.5], [60, 20, 0.6], [170, 8, 0.7],
  [310, 15, 0.4], [380, 22, 0.9], [25, 30, 0.5],
];
