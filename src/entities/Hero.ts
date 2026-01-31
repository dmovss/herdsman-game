import * as PIXI from 'pixi.js';
import { BaseEntity } from './BaseEntity';
import { GameConfig } from '../config';
import { TrailEffect } from '../effects/TrailEffect';

export class Hero extends BaseEntity {
  private sprite: PIXI.Sprite | null = null;
  private graphics: PIXI.Graphics | null = null;
  private targetPosition: PIXI.Point | null = null;
  private speed: number;
  private shadow: PIXI.Graphics;
  private collectionRadiusIndicator: PIXI.Graphics;
  private trailEffect: TrailEffect;
  private trailTimer: number = 0;
  private pulseTimer: number = 0;

  constructor(x: number, y: number) {
    super();

    this.position.set(x, y);
    this.speed = GameConfig.HERO_SPEED;

    // Collection radius indicator
    this.collectionRadiusIndicator = new PIXI.Graphics();
    this.updateCollectionRadiusIndicator();
    this.addChildAt(this.collectionRadiusIndicator, 0);

    // Shadow
    this.shadow = new PIXI.Graphics();
    this.shadow.ellipse(0, GameConfig.HERO_RADIUS + 5, 
                       GameConfig.HERO_RADIUS * 0.8, 
                       GameConfig.HERO_RADIUS * 0.3);
    this.shadow.fill({ color: 0x000000, alpha: 0.3 });
    this.addChild(this.shadow);

    // Trail effect
    this.trailEffect = new TrailEffect(GameConfig.HERO_COLOR, GameConfig.HERO_RADIUS);
    this.addChildAt(this.trailEffect.getContainer(), 0);

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
    
    // Main body
    this.graphics.circle(0, 0, GameConfig.HERO_RADIUS);
    this.graphics.fill({ color: GameConfig.HERO_COLOR, alpha: 1.0 });
    
    // Outline
    this.graphics.circle(0, 0, GameConfig.HERO_RADIUS);
    this.graphics.stroke({ color: 0xFFFFFF, width: 3 });
    
    // Hat brim
    this.graphics.ellipse(0, -GameConfig.HERO_RADIUS - 5, 
                         GameConfig.HERO_RADIUS * 0.9, 8);
    this.graphics.fill({ color: 0x8B4513 });
    
    // Hat top
    this.graphics.roundRect(-12, -GameConfig.HERO_RADIUS - 20, 24, 15, 3);
    this.graphics.fill({ color: 0xA0522D });
    
    // Hat band
    this.graphics.rect(-12, -GameConfig.HERO_RADIUS - 6, 24, 3);
    this.graphics.fill({ color: 0x654321 });
    
    // Direction indicator (eye)
    this.graphics.circle(GameConfig.HERO_RADIUS * 0.5, 0, 4);
    this.graphics.fill({ color: 0xFFFFFF });
    
    this.addChild(this.graphics);
  }

  private updateCollectionRadiusIndicator(): void {
    if (!GameConfig.COLLECTION_RADIUS_INDICATOR) {
      this.collectionRadiusIndicator.visible = false;
      return;
    }

    this.collectionRadiusIndicator.clear();
    
    const radius = GameConfig.FOLLOW_DISTANCE;
    
    // Outer ring
    this.collectionRadiusIndicator.circle(0, 0, radius);
    this.collectionRadiusIndicator.stroke({ 
      color: GameConfig.CONNECTION_LINE_COLOR, 
      width: 2,
      alpha: GameConfig.COLLECTION_RADIUS_ALPHA 
    });
    
    // Fill
    this.collectionRadiusIndicator.circle(0, 0, radius);
    this.collectionRadiusIndicator.fill({ 
      color: GameConfig.CONNECTION_LINE_COLOR, 
      alpha: GameConfig.COLLECTION_RADIUS_ALPHA * 0.3 
    });
  }

  public setTargetPosition(x: number, y: number): void {
    this.targetPosition = new PIXI.Point(x, y);
  }

  public isMoving(): boolean {
    return this.targetPosition !== null;
  }

  public update(dt: number): void {
    // Update pulse animation for collection radius
    if (GameConfig.COLLECTION_RADIUS_PULSE) {
      this.pulseTimer += dt * 2;
      const scale = 1.0 + Math.sin(this.pulseTimer) * 0.05;
      this.collectionRadiusIndicator.scale.set(scale);
      
      const alpha = GameConfig.COLLECTION_RADIUS_ALPHA * (0.8 + Math.sin(this.pulseTimer) * 0.2);
      this.collectionRadiusIndicator.alpha = alpha;
    }

    if (!this.targetPosition) {
      this.velocity.set(0, 0);
      this.trailEffect.update(dt);
      return;
    }

    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 2) {
      this.targetPosition = null;
      this.velocity.set(0, 0);
      this.trailEffect.update(dt);
      return;
    }

    const moveDistance = this.speed * dt;

    if (moveDistance >= distance) {
      this.position.set(this.targetPosition.x, this.targetPosition.y);
      this.targetPosition = null;
      this.velocity.set(0, 0);
      this.trailEffect.update(dt);
      return;
    }

    const dirX = dx / distance;
    const dirY = dy / distance;

    this.velocity.set(dirX * this.speed, dirY * this.speed);
    this.position.x += dirX * moveDistance;
    this.position.y += dirY * moveDistance;

    // Add trail point
    this.trailTimer += dt;
    if (this.trailTimer >= 0.05) { // Add trail point every 50ms
      this.trailEffect.addPoint(this.position.x, this.position.y);
      this.trailTimer = 0;
    }

    // Rotate towards movement direction
    const angle = Math.atan2(dy, dx);
    if (this.sprite) {
      this.sprite.rotation = angle;
    }
    if (this.graphics) {
      this.graphics.rotation = angle;
    }

    this.trailEffect.update(dt);
  }

  public getCollectionRadius(): number {
    return GameConfig.FOLLOW_DISTANCE;
  }

  public setTrailEnabled(enabled: boolean): void {
    this.trailEffect.setEnabled(enabled);
  }

  public setCollectionRadiusVisible(visible: boolean): void {
    this.collectionRadiusIndicator.visible = visible;
  }

  public override destroy(options?: PIXI.DestroyOptions | boolean): void {
    this.trailEffect.destroy();
    super.destroy(options);
  }
}