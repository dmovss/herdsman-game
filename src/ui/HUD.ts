import * as PIXI from 'pixi.js';
import { GameConfig } from '../config';

export class HUD {
  private container: PIXI.Container;
  private scoreText!: PIXI.Text;
  private muteButton!: PIXI.Container;
  private muteIcon!: PIXI.Text;
  private score: number = 0;
  
  private bounceTimer: number = 0;
  private bounceActive: boolean = false;
  private bounceDirection: number = 1;
  
  private onMuteToggle?: () => void;

  constructor() {
    this.container = new PIXI.Container();
    this.createScoreDisplay();
    this.muteButton = this.createMuteButton();
    this.container.addChild(this.muteButton);
  }

  private createScoreDisplay(): void {
    this.scoreText = new PIXI.Text({
      text: 'Score: 0',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: GameConfig.UI_FONT_SIZE,
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

  private createMuteButton(): PIXI.Container {
    const button = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 60, 60, 10);
    bg.fill({ color: GameConfig.UI_BUTTON_COLOR, alpha: 0.9 });
    bg.stroke({ color: 0xFFFFFF, width: 2 });
    button.addChild(bg);
    
    this.muteIcon = new PIXI.Text({
      text: '🔊',
      style: {
        fontSize: 30,
        align: 'center',
      },
    });
    this.muteIcon.anchor.set(0.5);
    this.muteIcon.position.set(30, 30);
    button.addChild(this.muteIcon);
    
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
    
    button.on('pointerdown', () => {
      if (this.onMuteToggle) {
        this.onMuteToggle();
      }
    });
    
    return button;
  }

  public updateScore(score: number): void {
    const oldScore = this.score;
    this.score = score;
    this.scoreText.text = `Score: ${this.score}`;
    
    if (score > oldScore) {
      this.startBounceAnimation();
    }
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

  public setMuteState(isMuted: boolean): void {
    this.muteIcon.text = isMuted ? '🔇' : '🔊';
  }

  public setOnMuteToggle(callback: () => void): void {
    this.onMuteToggle = callback;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public update(dt: number): void {
    this.updateBounceAnimation(dt);
  }

  public resize(width: number, height: number): void {
    this.muteButton.position.set(
      width - 60 - GameConfig.UI_PADDING,
      GameConfig.UI_PADDING
    );
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
