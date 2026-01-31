# Setup Guide

## Prerequisites

- Node.js 16+ and npm
- Modern web browser with WebGL support

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- pixi.js (8.5.2)
- @pixi/sound (6.0.1)
- TypeScript (5.7.2)
- Vite (6.0.5)

### 2. (Optional) Add Assets

The game works perfectly without assets using fallback graphics. However, if you want to add custom textures and sounds:

#### Textures (PNG format)
Place in `public/assets/textures/`:
- `barn.png` - 512x512px recommended
- `sheep.png` - 256x256px recommended
- `hero.png` - 256x256px recommended
- `grass.png` - 256x256px tileable texture

#### Sounds (MP3 format)
Place in `public/assets/sounds/`:
- `bg_music.mp3` - Background music (looping)
- `collect.mp3` - Collection sound effect
- `score.mp3` - Scoring sound effect

### 3. Run Development Server

```bash
npm run dev
```

The game will automatically open at http://localhost:3000

### 4. Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### 5. Preview Production Build

```bash
npm run preview
```

## Troubleshooting

### White Screen

If you see a white screen:
1. Open browser console (F12)
2. Check for errors
3. Ensure all dependencies installed (`npm install`)
4. Try clearing browser cache

### Assets Not Loading

The game will automatically use fallback graphics if assets are missing. Check browser console for messages about which assets failed to load.

### TypeScript Errors

Make sure you're using Node.js 16 or higher:
```bash
node --version
```

### Port Already in Use

If port 3000 is in use, Vite will automatically try the next available port.

## Development

### Project Structure

```
src/
├── core/          # Game engine core
├── entities/      # Game entities (Hero, Animal, Yard)
├── managers/      # Game systems (Animals, Sound)
├── ui/            # User interface
├── config.ts      # Configuration
├── main.ts        # Entry point
└── style.css      # Styles
```

### Hot Module Replacement

Vite supports HMR. Save any file and see changes instantly without page reload.

### Code Quality

The project uses:
- Strict TypeScript mode
- ES2022 target
- Clean architecture
- SOLID principles

## Deployment

### Build

```bash
npm run build
```

### Deploy

Deploy the `dist/` folder to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- etc.

## Performance

- Target: 60 FPS
- Memory: < 50MB
- Load time: < 1s
- Bundle size: ~500KB

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebGL support

## Support

For issues:
1. Check browser console
2. Verify Node.js version
3. Clear npm cache: `npm cache clean --force`
4. Delete `node_modules` and reinstall

## License

MIT
