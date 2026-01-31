import * as PIXI from 'pixi.js';
import { BaseEntity } from './BaseEntity';
import { GameConfig } from '../config';

export class Hero extends BaseEntity {
  private sprite: PIXI.Sprite | null = null;
  private graphics: PIXI.Graphics | null = null;
  private targetPosition: PIXI.Point | null = null;
  private speed: number;
  private shadow: PIXI.Graphics;

  constructor(x: number, y: number) {
    super();

    this.position.set(x, y);
    this.speed = GameConfig.HERO_SPEED;

    this.shadow = new PIXI.Graphics();
    this.shadow.ellipse(0, GameConfig.HERO_RADIUS + 5, 
                       GameConfig.HERO_RADIUS * 0.8, 
                       GameConfig.HERO_RADIUS * 0.3);
    this.shadow.fill({ color: 0x000000, alpha: 0.3 });
    this.addChild(this.shadow);

    this.createVisual();
  }

  private async createVisual(): Promise<void> {
    try {
      const texture = await PIXI.Assets.load(GameConfig.ASSETS.TEXTURES.HERO);
      
      this.sprite = new PIXI.Sprite(texture);
      this.sprite.anchor.set(0.5);
      this.sprite.width = GameConfig.HERO_RADIUS * 2;
      this.sprite.height = GameConfig.HERO_RADIUS * 2;
      this.addChild(this.sprite);
    } catch (error) {
      this.createGraphicsFallback();
    }
  }

  private createGraphicsFallback(): void {
    this.graphics = new PIXI.Graphics();
    
    this.graphics.circle(0, 0, GameConfig.HERO_RADIUS);
    this.graphics.fill({ color: GameConfig.HERO_COLOR, alpha: 1.0 });
    
    this.graphics.circle(0, 0, GameConfig.HERO_RADIUS);
    this.graphics.stroke({ color: 0xFFFFFF, width: 3 });
    
    this.graphics.ellipse(0, -GameConfig.HERO_RADIUS - 5, 
                         GameConfig.HERO_RADIUS * 0.9, 8);
    this.graphics.fill({ color: 0x8B4513 });
    
    this.graphics.roundRect(-12, -GameConfig.HERO_RADIUS - 20, 24, 15, 3);
    this.graphics.fill({ color: 0xA0522D });
    
    this.graphics.rect(-12, -GameConfig.HERO_RADIUS - 6, 24, 3);
    this.graphics.fill({ color: 0x654321 });
    
    this.graphics.circle(GameConfig.HERO_RADIUS * 0.5, 0, 4);
    this.graphics.fill({ color: 0xFFFFFF });
    
    this.addChild(this.graphics);
  }

  public setTargetPosition(x: number, y: number): void {
    this.targetPosition = new PIXI.Point(x, y);
  }

  public isMoving(): boolean {
    return this.targetPosition !== null;
  }

  public update(dt: number): void {
    if (!this.targetPosition) {
      this.velocity.set(0, 0);
      return;
    }

    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 2) {
      this.targetPosition = null;
      this.velocity.set(0, 0);
      return;
    }

    const moveDistance = this.speed * dt;

    if (moveDistance >= distance) {
      this.position.set(this.targetPosition.x, this.targetPosition.y);
      this.targetPosition = null;
      this.velocity.set(0, 0);
      return;
    }

    const dirX = dx / distance;
    const dirY = dy / distance;

    this.velocity.set(dirX * this.speed, dirY * this.speed);
    this.position.x += dirX * moveDistance;
    this.position.y += dirY * moveDistance;

    const angle = Math.atan2(dy, dx);
    if (this.sprite) {
      this.sprite.rotation = angle;
    }
    if (this.graphics) {
      this.graphics.rotation = angle;
    }
  }

  public getCollectionRadius(): number {
    return GameConfig.FOLLOW_DISTANCE;
  }

  public override destroy(options?: PIXI.DestroyOptions | boolean): void {
    super.destroy(options);
  }
}
