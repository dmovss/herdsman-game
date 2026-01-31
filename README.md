# Herdsman Game

A professional-grade collection game built with PixiJS v8, TypeScript, and modern web development practices.

## Features

- **Click-to-move controls** - Intuitive hero movement
- **Intelligent AI** - Animals with patrol and follow behaviors
- **Progressive scoring** - Collect animals and bring them to the barn
- **Sound system** - Background music and sound effects
- **Responsive design** - Works on all screen sizes
- **Professional graphics** - Texture support with fallback rendering

## Quick Start

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Build for Production

```bash
npm run build
```

## Gameplay

1. Click **START GAME**
2. Click anywhere to move your hero
3. Get close to animals to collect them
4. Animals follow you in formation
5. Bring animals to the barn to score points
6. Collect up to 5 animals at once

## Project Structure

```
herdsman-game/
├── src/
│   ├── core/
│   │   └── Game.ts           # Main game loop
│   ├── entities/
│   │   ├── BaseEntity.ts     # Abstract base class
│   │   ├── Hero.ts           # Player character
│   │   ├── Animal.ts         # AI animals
│   │   └── Yard.ts           # Collection point
│   ├── managers/
│   │   ├── AnimalManager.ts  # Animal logic
│   │   └── SoundManager.ts   # Audio system
│   ├── ui/
│   │   ├── HUD.ts            # Score display
│   │   └── StartScreen.ts    # Welcome screen
│   ├── config.ts             # Game configuration
│   ├── main.ts               # Entry point
│   └── style.css             # Styling
├── public/
│   └── assets/               # Place textures and sounds here
│       ├── textures/
│       └── sounds/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Technical Stack

- **PixiJS 8.5.2** - WebGL rendering engine
- **TypeScript 5.7** - Type-safe development
- **Vite 6** - Fast build tool
- **@pixi/sound** - Audio management

## Assets (Optional)

Place assets in `public/assets/`:

### Textures
- `textures/barn.png` - Barn sprite
- `textures/sheep.png` - Animal sprite
- `textures/hero.png` - Hero sprite
- `textures/grass.png` - Background texture

### Sounds
- `sounds/bg_music.mp3` - Background music
- `sounds/collect.mp3` - Collection sound
- `sounds/score.mp3` - Scoring sound

**Note:** Game works without assets using fallback graphics.

## Configuration

Edit `src/config.ts` to adjust game parameters:

```typescript
export const GameConfig = {
  HERO_SPEED: 250,
  MAX_HERD_SIZE: 5,
  FOLLOW_DISTANCE: 120,
  // ... more options
}
```

## Architecture

### Design Patterns

- **Singleton** - Game and SoundManager
- **Manager** - AnimalManager for complex logic
- **State** - Animal AI states
- **Observer** - Event callbacks
- **Template Method** - BaseEntity

### Code Quality

- Strict TypeScript mode
- Clean architecture
- SOLID principles
- Production-ready error handling
- 60 FPS performance

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT
