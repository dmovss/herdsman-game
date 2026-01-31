export const GameConfig = {
  BACKGROUND_COLOR: 0x7CB342,
  
  HERO_RADIUS: 25,
  HERO_COLOR: 0x1976D2,
  HERO_SPEED: 250,
  
  ANIMAL_RADIUS: 20,
  ANIMAL_COLOR: 0xFFFFFF,
  ANIMAL_PATROL_SPEED: 80,
  ANIMAL_FOLLOW_SPEED: 180,
  ANIMAL_SQUASH_AMOUNT: 0.08,
  
  YARD_RADIUS: 80,
  YARD_COLOR: 0xFFD54F,
  YARD_BORDER_COLOR: 0x8D6E63,
  
  FOLLOW_DISTANCE: 120,
  MAX_HERD_SIZE: 5,
  HERD_SPACING: 45,
  
  PATROL_MIN_DISTANCE: 50,
  PATROL_MAX_DISTANCE: 150,
  PATROL_CHANGE_DIRECTION_TIME: 3000,
  
  INITIAL_ANIMAL_COUNT: 7,
  MAX_TOTAL_ANIMALS: 20,
  SPAWN_INTERVAL_MIN: 5000,
  SPAWN_INTERVAL_MAX: 10000,
  SPAWN_MARGIN: 100,
  
  UI_FONT_FAMILY: 'Arial, sans-serif',
  UI_FONT_SIZE: 48,
  UI_TEXT_COLOR: 0xFFFFFF,
  UI_PADDING: 20,
  UI_BUTTON_COLOR: 0x43A047,
  UI_BUTTON_HOVER_COLOR: 0x66BB6A,
  UI_BUTTON_TEXT_COLOR: 0xFFFFFF,
  
  SCORE_BOUNCE_DURATION: 300,
  SCORE_BOUNCE_SCALE: 1.3,
  
  BG_MUSIC_VOLUME: 0.3,
  SFX_VOLUME: 0.5,
  
  ASSETS: {
    TEXTURES: {
      BARN: '/assets/textures/barn.png',
      GRASS: '/assets/textures/grass.png',
      SHEEP: '/assets/textures/sheep.png',
      HERO: '/assets/textures/hero.png',
    },
    SOUNDS: {
      BG_MUSIC: '/assets/sounds/bg_music.mp3',
      COLLECT: '/assets/sounds/collect.mp3',
      SCORE: '/assets/sounds/score.mp3',
    },
  },
} as const;

export type GameConfigType = typeof GameConfig;
