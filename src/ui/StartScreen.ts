import * as PIXI from 'pixi.js';
import { GameConfig } from '../config';

export class StartScreen {
  private container: PIXI.Container;
  private overlay: PIXI.Graphics;
  private onStartCallback?: () => void;

  constructor(width: number, height: number) {
    this.container = new PIXI.Container();
    
    this.overlay = new PIXI.Graphics();
    this.overlay.rect(0, 0, width, height);
    this.overlay.fill({ color: 0x000000, alpha: 0.7 });
    this.container.addChild(this.overlay);
    
    this.createTitle();
    this.createStartButton();
    this.positionContent(width, height);
  }

  private createTitle(): void {
    const title = new PIXI.Text({
      text: 'HERDSMAN',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 80,
        fill: { color: 0xFFEB3B, alpha: 1 },
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 6 },
        dropShadow: {
          alpha: 0.9,
          angle: Math.PI / 4,
          blur: 10,
          color: 0x000000,
          distance: 5,
        },
        letterSpacing: 4,
      },
    });
    
    title.anchor.set(0.5);
    title.position.set(0, -100);
    this.container.addChild(title);
    
    const subtitle = new PIXI.Text({
      text: 'Guide your herd to glory!',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 24,
        fill: { color: 0xFFFFFF, alpha: 1 },
        fontStyle: 'italic',
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 4,
          color: 0x000000,
          distance: 2,
        },
      },
    });
    
    subtitle.anchor.set(0.5);
    subtitle.position.set(0, -30);
    this.container.addChild(subtitle);
  }

  private createStartButton(): void {
    const button = new PIXI.Container();
    button.position.set(0, 80);
    
    const bg = new PIXI.Graphics();
    const width = 280;
    const height = 80;
    bg.roundRect(-width / 2, -height / 2, width, height, 20);
    bg.fill({ color: GameConfig.UI_BUTTON_COLOR, alpha: 0.95 });
    bg.stroke({ color: 0xFFFFFF, width: 3 });
    button.addChild(bg);
    
    const text = new PIXI.Text({
      text: 'START GAME',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 36,
        fill: { color: GameConfig.UI_BUTTON_TEXT_COLOR, alpha: 1 },
        fontWeight: 'bold',
      },
    });
    text.anchor.set(0.5);
    button.addChild(text);
    
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 20);
      bg.fill({ color: GameConfig.UI_BUTTON_HOVER_COLOR, alpha: 0.95 });
      bg.stroke({ color: 0xFFFFFF, width: 3 });
      button.scale.set(1.05);
    });
    
    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 20);
      bg.fill({ color: GameConfig.UI_BUTTON_COLOR, alpha: 0.95 });
      bg.stroke({ color: 0xFFFFFF, width: 3 });
      button.scale.set(1.0);
    });
    
    button.on('pointerdown', () => {
      if (this.onStartCallback) {
        this.onStartCallback();
      }
    });
    
    this.container.addChild(button);
  }

  private positionContent(width: number, height: number): void {
    for (let i = 1; i < this.container.children.length; i++) {
      const child = this.container.children[i];
      child.position.x += width / 2;
      child.position.y += height / 2;
    }
  }

  public setOnStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public resize(width: number, height: number): void {
    this.overlay.clear();
    this.overlay.rect(0, 0, width, height);
    this.overlay.fill({ color: 0x000000, alpha: 0.7 });
    
    for (let i = 1; i < this.container.children.length; i++) {
      const child = this.container.children[i];
      child.position.x -= width / 2;
      child.position.y -= height / 2;
    }
    
    this.positionContent(width, height);
  }

  public show(): void {
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}