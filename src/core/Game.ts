import * as PIXI from 'pixi.js';
import { GameConfig, QualitySetting } from '../config';
import { Hero } from '../entities/Hero';
import { Yard } from '../entities/Yard';
import { Animal } from '../entities/Animal';
import { AnimalManager } from '../managers/AnimalManager';
import { SoundManager } from '../managers/SoundManager';
import { ComboSystem } from '../managers/ComboSystem';
import { HUD } from '../ui/HUD';
import { StartScreen } from '../ui/StartScreen';
import { TutorialSystem } from '../ui/TutorialSystem';
import { SettingsPanel } from '../ui/SettingsPanel';
import { ParticleSystem } from '../effects/ParticleSystem';
import { ScreenShake } from '../effects/ScreenShake';

export class Game {
  private static instance: Game | null = null;
  
  private app: PIXI.Application | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private gameStarted: boolean = false;
  private isPaused: boolean = false;
  private gameTime: number = 0;
  
  private hero: Hero | null = null;
  private yard: Yard | null = null;
  
  private animalManager: AnimalManager | null = null;
  private soundManager: SoundManager | null = null;
  private comboSystem: ComboSystem | null = null;
  
  private hud: HUD | null = null;
  private startScreen: StartScreen | null = null;
  private tutorialSystem: TutorialSystem | null = null;
  private settingsPanel: SettingsPanel | null = null;
  
  private particleSystem: ParticleSystem | null = null;
  private screenShake: ScreenShake | null = null;
  
  private background: PIXI.TilingSprite | null = null;
  private gameContainer: PIXI.Container | null = null;

  private qualitySetting: QualitySetting = 'HIGH';

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
    
    // Create game container for screen shake
    this.gameContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);

    await this.initializeSoundSystem();
    this.createBackground();
    this.initializeEntities();
    this.initializeEffects();
    this.initializeUI();
    this.setupInputHandlers();
    this.setupResizeHandler();
    
    this.applyQualitySettings();
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
      // Asset loading failed, will use fallback graphics
    }
  }

  private createBackground(): void {
    if (!this.app || !this.gameContainer) return;

    try {
      const texture = PIXI.Assets.get('grass');
      if (texture) {
        this.background = new PIXI.TilingSprite({
          texture: texture,
          width: this.app.screen.width,
          height: this.app.screen.height,
        });
        this.gameContainer.addChildAt(this.background, 0);
      }
    } catch (error) {
      // Background texture failed, use solid color
    }
  }

  private async initializeSoundSystem(): Promise<void> {
    try {
      this.soundManager = SoundManager.getInstance();
      await this.soundManager.initialize();
    } catch (error) {
      // Sound system initialization failed
    }
  }

  private initializeEntities(): void {
    if (!this.app || !this.gameContainer) return;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    // Hero
    this.hero = new Hero(screenWidth / 2, screenHeight / 2);
    this.gameContainer.addChild(this.hero);

    // Yard
    const yardX = screenWidth - GameConfig.YARD_RADIUS - 80;
    const yardY = screenHeight / 2;
    this.yard = new Yard(yardX, yardY);
    this.gameContainer.addChild(this.yard);

    // Animal Manager
    this.animalManager = new AnimalManager(
      this.hero,
      this.yard,
      screenWidth,
      screenHeight
    );

    // Add connection lines container
    this.gameContainer.addChildAt(this.animalManager.getConnectionLinesContainer(), 2);

    this.animalManager.setOnAnimalAdded((animal: Animal) => {
      this.gameContainer!.addChild(animal);
    });

    this.animalManager.setOnAnimalRemoved((animal: Animal) => {
      this.gameContainer!.removeChild(animal);
      animal.destroy();
    });

    this.animalManager.setOnScoreChange((score: number) => {
      this.hud?.updateScore(score);
    });

    this.animalManager.setOnHerdCountChange((count: number) => {
      this.hud?.updateHerdCount(count);
    });

    this.animalManager.setOnAnimalCollected(() => {
      this.soundManager?.playCollectSound();
      if (this.particleSystem && this.hero) {
        this.particleSystem.createCollectEffect(
          this.hero.position.x,
          this.hero.position.y
        );
      }
    });

    this.animalManager.setOnAnimalScored(() => {
      this.soundManager?.playScoreSound();
      this.comboSystem?.addScore();
      
      if (this.particleSystem && this.yard) {
        this.particleSystem.createScoreEffect(
          this.yard.position.x,
          this.yard.position.y
        );
      }
      
      if (this.screenShake) {
        this.screenShake.shake();
      }
    });

    // Combo System
    this.comboSystem = new ComboSystem();
    this.comboSystem.setOnComboChange((count: number, multiplier: number) => {
      this.hud?.updateCombo(count, multiplier);
    });

    this.comboSystem.setOnComboBreak(() => {
      this.hud?.updateCombo(0, 1.0);
    });
  }

  private initializeEffects(): void {
    if (!this.app || !this.gameContainer) return;

    // Particle System
    this.particleSystem = new ParticleSystem();
    this.gameContainer.addChild(this.particleSystem.getContainer());

    // Screen Shake
    this.screenShake = new ScreenShake(this.gameContainer);
  }

  private initializeUI(): void {
    if (!this.app) return;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    // HUD
    this.hud = new HUD();
    this.hud.setOnMuteToggle(() => {
      if (this.soundManager) {
        const isMuted = this.soundManager.toggleMute();
        this.hud!.setMuteState(isMuted);
      }
    });

    this.hud.setOnSettingsOpen(() => {
      this.openSettings();
    });

    this.hud.setOnPauseToggle(() => {
      this.togglePause();
    });
    
    this.app.stage.addChild(this.hud.getContainer());
    this.hud.resize(screenWidth, screenHeight);

    // Tutorial System
    this.tutorialSystem = new TutorialSystem(screenWidth, screenHeight);
    this.tutorialSystem.setOnComplete(() => {
      // Tutorial completed
    });
    this.app.stage.addChild(this.tutorialSystem.getContainer());

    // Settings Panel
    this.settingsPanel = new SettingsPanel(screenWidth, screenHeight);
    
    this.settingsPanel.setOnClose(() => {
      if (this.isPaused) {
        this.togglePause();
      }
    });

    this.settingsPanel.setOnQualityChange((quality: QualitySetting) => {
      this.qualitySetting = quality;
      this.applyQualitySettings();
    });

    this.settingsPanel.setOnMusicVolumeChange((volume: number) => {
      // Apply music volume change
      if (this.soundManager) {
        // Would need to add setVolume method to SoundManager
      }
    });

    this.settingsPanel.setOnSfxVolumeChange((volume: number) => {
      // Apply SFX volume change
    });

    this.app.stage.addChild(this.settingsPanel.getContainer());

    // Start Screen
    this.initializeStartScreen();
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

    if (this.tutorialSystem) {
      this.tutorialSystem.start();
    }
    
    if (this.soundManager && this.soundManager.isReady()) {
      try {
        this.soundManager.playBackgroundMusic();
      } catch (error) {
        // Audio playback failed
      }
    }
    
    if (!this.isRunning) {
      this.start();
    }
  }

  private applyQualitySettings(): void {
    const settings = GameConfig.QUALITY_SETTINGS[this.qualitySetting];

    if (this.particleSystem) {
      this.particleSystem.setEnabled(settings.particles);
    }

    if (this.hero) {
      this.hero.setTrailEnabled(settings.trails);
    }

    if (this.screenShake) {
      this.screenShake.setEnabled(settings.glow);
    }

    // Could add more quality-dependent settings here
  }

  private openSettings(): void {
    if (!this.settingsPanel) return;

    if (!this.isPaused) {
      this.togglePause();
    }

    this.settingsPanel.show();
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    
    if (this.hud) {
      this.hud.setPauseState(this.isPaused);
    }

    if (this.isPaused) {
      // Could add pause overlay here
    }
  }

  private setupInputHandlers(): void {
    if (!this.app) return;

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    
    this.app.stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      if (!this.hero || !this.gameStarted || this.isPaused) return;

      // Check if click is on UI elements
      if (this.settingsPanel?.getContainer().visible) return;

      const globalPos = event.global;
      this.hero.setTargetPosition(globalPos.x, globalPos.y);
    });

    // Keyboard controls
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!this.gameStarted) return;

      switch (event.key) {
        case 'Escape':
          if (this.settingsPanel?.getContainer().visible) {
            this.settingsPanel.close();
          } else {
            this.togglePause();
          }
          break;
        case 'p':
        case 'P':
          this.togglePause();
          break;
      }
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
        this.tutorialSystem?.resize(width, height);
        this.settingsPanel?.resize(width, height);
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

    if (this.isPaused) {
      return;
    }

    // Update game time
    if (this.gameStarted) {
      this.gameTime += clampedDt;
      this.hud?.updateTime(this.gameTime);
    }

    // Background animation
    if (this.background && this.gameStarted) {
      this.background.tilePosition.x -= 20 * clampedDt;
      this.background.tilePosition.y -= 10 * clampedDt;
    }

    // Update entities
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

    // Update systems
    if (this.comboSystem) {
      this.comboSystem.update(clampedDt);
    }

    if (this.tutorialSystem) {
      this.tutorialSystem.update(clampedDt);
    }

    // Update effects
    if (this.particleSystem) {
      this.particleSystem.update(clampedDt);
    }

    if (this.screenShake) {
      this.screenShake.update(clampedDt);
    }

    // Update UI
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

    if (this.particleSystem) {
      this.particleSystem.destroy();
    }

    if (this.screenShake) {
      this.screenShake.destroy();
    }

    if (this.hud) {
      this.hud.destroy();
    }
    
    if (this.startScreen) {
      this.startScreen.destroy();
    }

    if (this.tutorialSystem) {
      this.tutorialSystem.destroy();
    }

    if (this.settingsPanel) {
      this.settingsPanel.destroy();
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

    if (this.gameContainer) {
      this.gameContainer.destroy();
    }

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }

    Game.instance = null;
  }
}