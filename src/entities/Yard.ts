import * as PIXI from 'pixi.js';
import { BaseEntity } from './BaseEntity';
import { GameConfig } from '../config';

export class Yard extends BaseEntity {
  private sprite: PIXI.Sprite | null = null;
  private graphics: PIXI.Graphics | null = null;
  private glow: PIXI.Graphics;
  private shadow: PIXI.Graphics;
  private radius: number;
  private pulseTimer: number = 0;

  constructor(x: number, y: number) {
    super();

    this.position.set(x, y);
    this.radius = GameConfig.YARD_RADIUS;

    this.shadow = new PIXI.Graphics();
    this.shadow.ellipse(0, this.radius + 10, this.radius * 0.9, this.radius * 0.3);
    this.shadow.fill({ color: 0x000000, alpha: 0.3 });
    this.addChild(this.shadow);

    this.glow = new PIXI.Graphics();
    this.drawGlow();
    this.addChild(this.glow);

    this.createVisual();
  }

  private async createVisual(): Promise<void> {
    try {
      const texture = await PIXI.Assets.load(GameConfig.ASSETS.TEXTURES.BARN);
      
      this.sprite = new PIXI.Sprite(texture);
      this.sprite.anchor.set(0.5, 0.8);
      
      const scale = (this.radius * 2.2) / Math.max(texture.width, texture.height);
      this.sprite.scale.set(scale);
      
      this.addChild(this.sprite);
    } catch (error) {
      this.createGraphicsFallback();
    }
  }

  private createGraphicsFallback(): void {
    this.graphics = new PIXI.Graphics();
    
    this.graphics.circle(0, 0, this.radius);
    this.graphics.fill({ color: 0xD4AF37, alpha: 0.6 });
    
    this.graphics.circle(0, 0, this.radius * 0.8);
    this.graphics.fill({ color: GameConfig.YARD_COLOR, alpha: 0.5 });
    
    for (let i = 0; i < 3; i++) {
      const ringRadius = this.radius - i * 3;
      this.graphics.circle(0, 0, ringRadius);
      this.graphics.stroke({ 
        color: i === 1 ? 0x8B4513 : GameConfig.YARD_BORDER_COLOR,
        width: i === 1 ? 4 : 2,
        alpha: 0.8 - i * 0.2 
      });
    }
    
    this.drawFencePosts();
    
    this.graphics.circle(0, 0, 12);
    this.graphics.fill({ color: 0xFFFFFF, alpha: 0.3 });
    this.graphics.circle(0, 0, 6);
    this.graphics.fill({ color: GameConfig.YARD_BORDER_COLOR, alpha: 0.5 });
    
    this.addChild(this.graphics);
  }

  private drawFencePosts(): void {
    if (!this.graphics) return;
    
    const postCount = 12;
    const postWidth = 8;
    const postHeight = 20;
    
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      
      this.graphics.rect(x - postWidth / 2, y - postHeight / 2, postWidth, postHeight);
      this.graphics.fill({ color: 0x8B4513, alpha: 0.7 });
      
      this.graphics.rect(x - postWidth / 2 + 1, y - postHeight / 2 + 1, 2, postHeight - 2);
      this.graphics.fill({ color: 0xD2691E, alpha: 0.5 });
    }
  }

  private drawGlow(): void {
    this.glow.clear();
    
    this.glow.circle(0, 0, this.radius + 15);
    this.glow.fill({ color: GameConfig.YARD_COLOR, alpha: 0.1 });
    
    this.glow.circle(0, 0, this.radius + 8);
    this.glow.fill({ color: GameConfig.YARD_COLOR, alpha: 0.15 });
  }

  public update(dt: number): void {
    this.pulseTimer += dt;
    
    const pulseScale = 1.0 + Math.sin(this.pulseTimer * 2) * 0.02;
    this.glow.scale.set(pulseScale);
    
    if (this.graphics) {
      this.graphics.rotation += dt * 0.03;
    }
  }

  public containsPoint(x: number, y: number): boolean {
    const distance = this.distanceToPoint(x, y);
    return distance < this.radius;
  }

  public getRadius(): number {
    return this.radius;
  }

  public override destroy(options?: PIXI.DestroyOptions | boolean): void {
    super.destroy(options);
  }
}
