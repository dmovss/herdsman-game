import * as PIXI from 'pixi.js';
import { GameConfig } from '../config';
import { Hero } from '../entities/Hero';
import { Yard } from '../entities/Yard';
import { Animal } from '../entities/Animal';
import { AnimalManager } from '../managers/AnimalManager';
import { SoundManager } from '../managers/SoundManager';
import { HUD } from '../ui/HUD';
import { StartScreen } from '../ui/StartScreen';

export class Game {
  private static instance: Game | null = null;
  
  private app: PIXI.Application | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private gameStarted: boolean = false;
  
  private hero: Hero | null = null;
  private yard: Yard | null = null;
  
  private animalManager: AnimalManager | null = null;
  private soundManager: SoundManager | null = null;
  
  private hud: HUD | null = null;
  private startScreen: StartScreen | null = null;
  
  private background: PIXI.TilingSprite | null = null;

  private constructor() {}

  public static getInstance(): Game {
    if (!Game.instance) {
      Game.instance = new Game();
    }
    return Game.instance;
  }

  public async initialize(parent: HTMLElement): Promise<void> {
    if (this.app) {
      return;
    }

    this.app = new PIXI.Application();
    
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: GameConfig.BACKGROUND_COLOR,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      resizeTo: window,
    });

    parent.appendChild(this.app.canvas);

    await this.loadAssets();
    
    await this.initializeSoundSystem();
    this.createBackground();
    this.initializeEntities();
    this.initializeStartScreen();
    this.setupInputHandlers();
    this.setupResizeHandler();
  }

  private async loadAssets(): Promise<void> {
    const assets = [
      { alias: 'barn', src: GameConfig.ASSETS.TEXTURES.BARN },
      { alias: 'sheep', src: GameConfig.ASSETS.TEXTURES.SHEEP },
      { alias: 'hero', src: GameConfig.ASSETS.TEXTURES.HERO },
      { alias: 'grass', src: GameConfig.ASSETS.TEXTURES.GRASS },
    ];

    for (const asset of assets) {
      PIXI.Assets.add(asset);
    }

    try {
      await PIXI.Assets.load(assets.map(a => a.alias));
    } catch (error) {
    }
  }

  private createBackground(): void {
    if (!this.app) return;

    try {
      const texture = PIXI.Assets.get('grass');
      if (texture) {
        this.background = new PIXI.TilingSprite({
          texture: texture,
          width: this.app.screen.width,
          height: this.app.screen.height,
        });
        this.app.stage.addChildAt(this.background, 0);
      }
    } catch (error) {
    }
  }

  private async initializeSoundSystem(): Promise<void> {
    try {
      this.soundManager = SoundManager.getInstance();
      await this.soundManager.initialize();
    } catch (error) {
    }
  }

  private initializeEntities(): void {
    if (!this.app) return;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    this.hero = new Hero(screenWidth / 2, screenHeight / 2);
    this.app.stage.addChild(this.hero);

    const yardX = screenWidth - GameConfig.YARD_RADIUS - 80;
    const yardY = screenHeight / 2;
    this.yard = new Yard(yardX, yardY);
    this.app.stage.addChild(this.yard);

    this.animalManager = new AnimalManager(
      this.hero,
      this.yard,
      screenWidth,
      screenHeight
    );

    this.animalManager.setOnAnimalAdded((animal: Animal) => {
      this.app!.stage.addChild(animal);
    });

    this.animalManager.setOnAnimalRemoved((animal: Animal) => {
      this.app!.stage.removeChild(animal);
      animal.destroy();
    });

    this.animalManager.setOnScoreChange((score: number) => {
      this.hud?.updateScore(score);
    });

    this.animalManager.setOnAnimalCollected(() => {
      this.soundManager?.playCollectSound();
    });

    this.animalManager.setOnAnimalScored(() => {
      this.soundManager?.playScoreSound();
    });

    this.hud = new HUD();
    this.hud.setOnMuteToggle(() => {
      if (this.soundManager) {
        const isMuted = this.soundManager.toggleMute();
        this.hud!.setMuteState(isMuted);
      }
    });
    
    this.app.stage.addChild(this.hud.getContainer());
    this.hud.resize(screenWidth, screenHeight);
  }

  private initializeStartScreen(): void {
    if (!this.app) return;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    this.startScreen = new StartScreen(screenWidth, screenHeight);
    this.startScreen.setOnStart(() => {
      this.onGameStart();
    });
    
    this.app.stage.addChild(this.startScreen.getContainer());
  }

  private onGameStart(): void {
    if (this.gameStarted) return;
    
    this.gameStarted = true;
    
    if (this.startScreen) {
      this.startScreen.hide();
    }
    
    if (this.animalManager) {
      this.animalManager.spawnInitialAnimals();
    }
    
    if (this.soundManager && this.soundManager.isReady()) {
      try {
        this.soundManager.playBackgroundMusic();
      } catch (error) {
      }
    }
    
    if (!this.isRunning) {
      this.start();
    }
  }

  private setupInputHandlers(): void {
    if (!this.app) return;

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    
    this.app.stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      if (!this.hero || !this.gameStarted) return;

      const globalPos = event.global;
      this.hero.setTargetPosition(globalPos.x, globalPos.y);
    });
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      if (this.app && this.animalManager) {
        const width = this.app.screen.width;
        const height = this.app.screen.height;
        
        if (this.background) {
          this.background.width = width;
          this.background.height = height;
        }
        
        this.animalManager.updateScreenBounds(width, height);
        this.hud?.resize(width, height);
        this.startScreen?.resize(width, height);
      }
    });
  }

  public start(): void {
    if (!this.app) {
      throw new Error('Game must be initialized before starting');
    }

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.app.ticker.add(this.update, this);
  }

  public stop(): void {
    if (!this.app || !this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.app.ticker.remove(this.update, this);
  }

  private update(ticker: PIXI.Ticker): void {
    const currentTime = performance.now();
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    const clampedDt = Math.min(dt, 0.1);

    if (this.background && this.gameStarted) {
      this.background.tilePosition.x -= 20 * clampedDt;
      this.background.tilePosition.y -= 10 * clampedDt;
    }

    if (this.gameStarted && this.hero) {
      this.hero.update(clampedDt);
    }

    if (this.yard) {
      this.yard.update(clampedDt);
    }

    if (this.gameStarted && this.animalManager) {
      const animals = this.animalManager.getAnimals();
      for (const animal of animals) {
        animal.update(clampedDt);
      }
      
      this.animalManager.update(clampedDt);
    }

    if (this.hud) {
      this.hud.update(clampedDt);
    }
  }

  public getApp(): PIXI.Application {
    if (!this.app) {
      throw new Error('Game not initialized');
    }
    return this.app;
  }

  public getScore(): number {
    return this.animalManager?.getScore() ?? 0;
  }

  public getHero(): Hero | null {
    return this.hero;
  }

  public getAnimalManager(): AnimalManager | null {
    return this.animalManager;
  }

  public destroy(): void {
    this.stop();
    
    if (this.soundManager) {
      this.soundManager.destroy();
    }
    
    if (this.animalManager) {
      const animals = this.animalManager.getAnimals();
      for (const animal of animals) {
        animal.destroy();
      }
    }

    if (this.hud) {
      this.hud.destroy();
    }
    
    if (this.startScreen) {
      this.startScreen.destroy();
    }

    if (this.hero) {
      this.hero.destroy();
    }
    
    if (this.yard) {
      this.yard.destroy();
    }

    if (this.background) {
      this.background.destroy();
    }

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }

    Game.instance = null;
  }
}
