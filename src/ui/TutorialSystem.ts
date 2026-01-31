import * as PIXI from 'pixi.js';
import { GameConfig } from '../config';

interface TutorialStep {
  text: string;
  duration: number;
}

export class TutorialSystem {
  private container: PIXI.Container;
  private textDisplay: PIXI.Text;
  private background: PIXI.Graphics;
  private currentStep: number = 0;
  private stepTimer: number = 0;
  private isActive: boolean = false;
  private enabled: boolean = true;

  private onComplete?: () => void;

  constructor(width: number, height: number) {
    this.container = new PIXI.Container();
    this.container.visible = false;

    this.background = new PIXI.Graphics();
    this.background.rect(0, height - 120, width, 120);
    this.background.fill({ color: 0x000000, alpha: 0.8 });
    this.container.addChild(this.background);

    this.textDisplay = new PIXI.Text({
      text: '',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 24,
        fill: { color: 0xFFFFFF, alpha: 1 },
        align: 'center',
        wordWrap: true,
        wordWrapWidth: width - 40,
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 4,
          color: 0x000000,
          distance: 2,
        },
      },
    });

    this.textDisplay.anchor.set(0.5);
    this.textDisplay.position.set(width / 2, height - 60);
    this.container.addChild(this.textDisplay);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.skip();
    }
  }

  public start(): void {
    if (!this.enabled || !GameConfig.TUTORIAL_ENABLED) {
      if (this.onComplete) {
        this.onComplete();
      }
      return;
    }

    this.isActive = true;
    this.currentStep = 0;
    this.stepTimer = 0;
    this.showCurrentStep();
  }

  private showCurrentStep(): void {
    if (this.currentStep >= GameConfig.TUTORIAL_STEPS.length) {
      this.complete();
      return;
    }

    const step = GameConfig.TUTORIAL_STEPS[this.currentStep];
    this.textDisplay.text = step.text;
    this.container.visible = true;

    // Fade in animation
    this.container.alpha = 0;
    this.fadeIn();
  }

  private fadeIn(): void {
    const duration = 0.3;
    let elapsed = 0;
    
    const animate = (delta: number) => {
      elapsed += delta / 60;
      this.container.alpha = Math.min(1, elapsed / duration);
      
      if (elapsed < duration) {
        requestAnimationFrame(() => animate(delta));
      }
    };
    
    requestAnimationFrame(() => animate(1));
  }

  private fadeOut(callback: () => void): void {
    const duration = 0.3;
    let elapsed = 0;
    
    const animate = (delta: number) => {
      elapsed += delta / 60;
      this.container.alpha = Math.max(0, 1 - elapsed / duration);
      
      if (elapsed < duration) {
        requestAnimationFrame(() => animate(delta));
      } else {
        callback();
      }
    };
    
    requestAnimationFrame(() => animate(1));
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.stepTimer += dt * 1000;

    const currentStepData = GameConfig.TUTORIAL_STEPS[this.currentStep];
    if (this.stepTimer >= currentStepData.duration) {
      this.nextStep();
    }
  }

  private nextStep(): void {
    this.fadeOut(() => {
      this.currentStep++;
      this.stepTimer = 0;
      
      if (this.currentStep < GameConfig.TUTORIAL_STEPS.length) {
        this.showCurrentStep();
      } else {
        this.complete();
      }
    });
  }

  private complete(): void {
    this.isActive = false;
    this.container.visible = false;
    
    if (this.onComplete) {
      this.onComplete();
    }
  }

  public skip(): void {
    this.isActive = false;
    this.container.visible = false;
  }

  public setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public resize(width: number, height: number): void {
    this.background.clear();
    this.background.rect(0, height - 120, width, 120);
    this.background.fill({ color: 0x000000, alpha: 0.8 });

    this.textDisplay.position.set(width / 2, height - 60);
    this.textDisplay.style.wordWrapWidth = width - 40;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}