import * as PIXI from 'pixi.js';
import { GameConfig } from '../config';

export class HUD {
  private container: PIXI.Container;
  private scoreText!: PIXI.Text;
  private highScoreText!: PIXI.Text;
  private herdCountText!: PIXI.Text;
  private comboText!: PIXI.Text;
  private timeText!: PIXI.Text;
  private muteButton!: PIXI.Container;
  private settingsButton!: PIXI.Container;
  private pauseButton!: PIXI.Container;
  private muteIcon!: PIXI.Text;
  
  private score: number = 0;
  private highScore: number = 0;
  private herdCount: number = 0;
  private maxHerdSize: number = GameConfig.MAX_HERD_SIZE;
  private comboCount: number = 0;
  private comboMultiplier: number = 1.0;
  private gameTime: number = 0;
  
  private bounceTimer: number = 0;
  private bounceActive: boolean = false;
  private bounceDirection: number = 1;
  
  private comboVisible: boolean = false;
  private comboFadeTimer: number = 0;
  
  private onMuteToggle?: () => void;
  private onSettingsOpen?: () => void;
  private onPauseToggle?: () => void;

  constructor() {
    this.container = new PIXI.Container();
    this.loadHighScore();
    this.createScoreDisplay();
    this.createHighScoreDisplay();
    this.createHerdCounter();
    this.createComboDisplay();
    this.createTimeDisplay();
    this.createButtons();
  }

  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('herdsman_highscore');
      this.highScore = saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      this.highScore = 0;
    }
  }

  private saveHighScore(): void {
    try {
      localStorage.setItem('herdsman_highscore', this.highScore.toString());
    } catch (error) {
      // Silent fail
    }
  }

  private createScoreDisplay(): void {
    this.scoreText = new PIXI.Text({
      text: 'Score: 0',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 42,
        fill: { color: GameConfig.UI_TEXT_COLOR, alpha: 1 },
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 6,
          color: 0x000000,
          distance: 3,
        },
      },
    });
    
    this.scoreText.position.set(GameConfig.UI_PADDING, GameConfig.UI_PADDING);
    this.scoreText.anchor.set(0, 0);
    this.container.addChild(this.scoreText);
  }

  private createHighScoreDisplay(): void {
    this.highScoreText = new PIXI.Text({
      text: `Best: ${this.highScore}`,
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 24,
        fill: { color: 0xFFD700, alpha: 1 },
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
        dropShadow: {
          alpha: 0.7,
          angle: Math.PI / 4,
          blur: 4,
          color: 0x000000,
          distance: 2,
        },
      },
    });
    
    this.highScoreText.position.set(GameConfig.UI_PADDING, GameConfig.UI_PADDING + 50);
    this.highScoreText.anchor.set(0, 0);
    this.container.addChild(this.highScoreText);
  }

  private createHerdCounter(): void {
    this.herdCountText = new PIXI.Text({
      text: `Herd: 0/${this.maxHerdSize}`,
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 28,
        fill: { color: 0x4CAF50, alpha: 1 },
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
        dropShadow: {
          alpha: 0.7,
          angle: Math.PI / 4,
          blur: 4,
          color: 0x000000,
          distance: 2,
        },
      },
    });
    
    this.herdCountText.position.set(GameConfig.UI_PADDING, GameConfig.UI_PADDING + 90);
    this.herdCountText.anchor.set(0, 0);
    this.container.addChild(this.herdCountText);
  }

  private createComboDisplay(): void {
    this.comboText = new PIXI.Text({
      text: 'COMBO x2.0!',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 36,
        fill: { color: 0xFF5722, alpha: 1 },
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
          alpha: 0.9,
          angle: Math.PI / 4,
          blur: 8,
          color: 0x000000,
          distance: 4,
        },
      },
    });
    
    this.comboText.anchor.set(0.5, 0);
    this.comboText.alpha = 0;
    this.comboText.visible = false;
    this.container.addChild(this.comboText);
  }

  private createTimeDisplay(): void {
    this.timeText = new PIXI.Text({
      text: 'Time: 0:00',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 24,
        fill: { color: 0xFFFFFF, alpha: 0.9 },
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
        dropShadow: {
          alpha: 0.7,
          angle: Math.PI / 4,
          blur: 4,
          color: 0x000000,
          distance: 2,
        },
      },
    });
    
    this.timeText.position.set(GameConfig.UI_PADDING, GameConfig.UI_PADDING + 130);
    this.timeText.anchor.set(0, 0);
    this.container.addChild(this.timeText);
  }

  private createButtons(): void {
    // Mute button
    this.muteButton = this.createIconButton('🔊', 0);
    this.muteButton.on('pointerdown', () => {
      if (this.onMuteToggle) {
        this.onMuteToggle();
      }
    });
    this.container.addChild(this.muteButton);

    // Settings button
    this.settingsButton = this.createIconButton('⚙️', 1);
    this.settingsButton.on('pointerdown', () => {
      if (this.onSettingsOpen) {
        this.onSettingsOpen();
      }
    });
    this.container.addChild(this.settingsButton);

    // Pause button
    this.pauseButton = this.createIconButton('⏸️', 2);
    this.pauseButton.on('pointerdown', () => {
      if (this.onPauseToggle) {
        this.onPauseToggle();
      }
    });
    this.container.addChild(this.pauseButton);
  }

  private createIconButton(icon: string, index: number): PIXI.Container {
    const button = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 60, 60, 10);
    bg.fill({ color: GameConfig.UI_BUTTON_COLOR, alpha: 0.9 });
    bg.stroke({ color: 0xFFFFFF, width: 2 });
    button.addChild(bg);
    
    const iconText = new PIXI.Text({
      text: icon,
      style: {
        fontSize: 30,
        align: 'center',
      },
    });
    iconText.anchor.set(0.5);
    iconText.position.set(30, 30);
    button.addChild(iconText);
    
    if (icon === '🔊') {
      this.muteIcon = iconText;
    }
    
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, 60, 60, 10);
      bg.fill({ color: GameConfig.UI_BUTTON_HOVER_COLOR, alpha: 0.9 });
      bg.stroke({ color: 0xFFFFFF, width: 2 });
      button.scale.set(1.1);
    });
    
    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, 60, 60, 10);
      bg.fill({ color: GameConfig.UI_BUTTON_COLOR, alpha: 0.9 });
      bg.stroke({ color: 0xFFFFFF, width: 2 });
      button.scale.set(1.0);
    });
    
    return button;
  }

  public updateScore(score: number): void {
    const oldScore = this.score;
    this.score = score;
    this.scoreText.text = `Score: ${this.score}`;
    
    if (score > this.highScore) {
      this.highScore = score;
      this.highScoreText.text = `Best: ${this.highScore}`;
      this.saveHighScore();
    }
    
    if (score > oldScore) {
      this.startBounceAnimation();
    }
  }

  public updateHerdCount(count: number): void {
    this.herdCount = count;
    this.herdCountText.text = `Herd: ${count}/${this.maxHerdSize}`;
    
    // Change color based on fullness
    const ratio = count / this.maxHerdSize;
    if (ratio >= 1.0) {
      this.herdCountText.style.fill = { color: 0xFFD700, alpha: 1 }; // Gold when full
    } else if (ratio >= 0.6) {
      this.herdCountText.style.fill = { color: 0x8BC34A, alpha: 1 }; // Light green
    } else {
      this.herdCountText.style.fill = { color: 0x4CAF50, alpha: 1 }; // Green
    }
  }

  public updateCombo(count: number, multiplier: number): void {
    this.comboCount = count;
    this.comboMultiplier = multiplier;
    
    if (count > 1) {
      this.comboText.text = `COMBO x${multiplier.toFixed(1)}!`;
      this.showCombo();
    } else {
      this.hideCombo();
    }
  }

  private showCombo(): void {
    if (!this.comboVisible) {
      this.comboVisible = true;
      this.comboText.visible = true;
      this.comboFadeTimer = 0;
    }
    
    // Pulse effect
    const scale = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
    this.comboText.scale.set(scale);
  }

  private hideCombo(): void {
    this.comboVisible = false;
    this.comboText.visible = false;
    this.comboText.alpha = 0;
  }

  public updateTime(seconds: number): void {
    this.gameTime = seconds;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    this.timeText.text = `Time: ${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private startBounceAnimation(): void {
    this.bounceActive = true;
    this.bounceTimer = 0;
    this.bounceDirection = 1;
  }

  private updateBounceAnimation(dt: number): void {
    if (!this.bounceActive) return;
    
    this.bounceTimer += dt * 1000;
    
    const duration = GameConfig.SCORE_BOUNCE_DURATION;
    const halfDuration = duration / 2;
    
    let progress = this.bounceTimer / halfDuration;
    
    if (progress >= 1.0) {
      if (this.bounceDirection === 1) {
        this.bounceDirection = -1;
        this.bounceTimer = 0;
        progress = 0;
      } else {
        this.bounceActive = false;
        this.scoreText.scale.set(1.0);
        return;
      }
    }
    
    const eased = 1 - Math.pow(1 - progress, 3);
    
    let scale: number;
    if (this.bounceDirection === 1) {
      scale = 1.0 + (GameConfig.SCORE_BOUNCE_SCALE - 1.0) * eased;
    } else {
      scale = GameConfig.SCORE_BOUNCE_SCALE - (GameConfig.SCORE_BOUNCE_SCALE - 1.0) * eased;
    }
    
    this.scoreText.scale.set(scale);
  }

  private updateComboAnimation(dt: number): void {
    if (!this.comboVisible) return;
    
    this.comboFadeTimer += dt;
    
    // Fade in
    if (this.comboText.alpha < 1.0) {
      this.comboText.alpha = Math.min(1.0, this.comboText.alpha + dt * 3);
    }
  }

  public setMuteState(isMuted: boolean): void {
    this.muteIcon.text = isMuted ? '🔇' : '🔊';
  }

  public setPauseState(isPaused: boolean): void {
    const pauseIcon = this.pauseButton.children[1] as PIXI.Text;
    pauseIcon.text = isPaused ? '▶️' : '⏸️';
  }

  public setOnMuteToggle(callback: () => void): void {
    this.onMuteToggle = callback;
  }

  public setOnSettingsOpen(callback: () => void): void {
    this.onSettingsOpen = callback;
  }

  public setOnPauseToggle(callback: () => void): void {
    this.onPauseToggle = callback;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public update(dt: number): void {
    this.updateBounceAnimation(dt);
    this.updateComboAnimation(dt);
  }

  public resize(width: number, height: number): void {
    // Position buttons in top right
    this.pauseButton.position.set(
      width - 60 - GameConfig.UI_PADDING,
      GameConfig.UI_PADDING
    );
    
    this.settingsButton.position.set(
      width - 130 - GameConfig.UI_PADDING,
      GameConfig.UI_PADDING
    );
    
    this.muteButton.position.set(
      width - 200 - GameConfig.UI_PADDING,
      GameConfig.UI_PADDING
    );

    // Center combo text
    this.comboText.position.set(width / 2, GameConfig.UI_PADDING + 20);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}