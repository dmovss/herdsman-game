import * as PIXI from 'pixi.js';
import { BaseEntity } from './BaseEntity';
import { Hero } from './Hero';
import { GameConfig } from '../config';

enum AnimalState {
  Patrol = 'Patrol',
  Follow = 'Follow',
  Delivered = 'Delivered',
}

export class Animal extends BaseEntity {
  private sprite: PIXI.Sprite | null = null;
  private graphics: PIXI.Graphics | null = null;
  private shadow: PIXI.Graphics;
  private state: AnimalState;
  private hero: Hero;
  
  private patrolTarget: PIXI.Point;
  private patrolChangeTimer: number;
  
  private herdIndex: number;
  
  private hopOffset: number = 0;
  private hopSpeed: number = 3;
  
  private id: string;

  constructor(x: number, y: number, hero: Hero) {
    super();

    this.id = Math.random().toString(36).substring(7);
    this.position.set(x, y);
    this.hero = hero;
    this.state = AnimalState.Patrol;
    this.herdIndex = -1;
    
    this.patrolTarget = this.generatePatrolTarget();
    this.patrolChangeTimer = 0;

    this.shadow = new PIXI.Graphics();
    this.shadow.ellipse(0, GameConfig.ANIMAL_RADIUS + 3, 
                       GameConfig.ANIMAL_RADIUS * 0.8, 
                       GameConfig.ANIMAL_RADIUS * 0.3);
    this.shadow.fill({ color: 0x000000, alpha: 0.3 });
    this.addChild(this.shadow);

    this.createVisual();
  }

  private async createVisual(): Promise<void> {
    try {
      const texture = await PIXI.Assets.load(GameConfig.ASSETS.TEXTURES.SHEEP);
      
      this.sprite = new PIXI.Sprite(texture);
      this.sprite.anchor.set(0.5);
      this.sprite.width = GameConfig.ANIMAL_RADIUS * 2.2;
      this.sprite.height = GameConfig.ANIMAL_RADIUS * 2.2;
      this.addChild(this.sprite);
    } catch (error) {
      this.createGraphicsFallback();
    }
  }

  private createGraphicsFallback(): void {
    this.graphics = new PIXI.Graphics();
    
    this.graphics.circle(0, 0, GameConfig.ANIMAL_RADIUS);
    this.graphics.fill({ color: GameConfig.ANIMAL_COLOR });
    
    this.graphics.circle(0, 0, GameConfig.ANIMAL_RADIUS);
    this.graphics.stroke({ color: 0x999999, width: 2 });
    
    this.graphics.circle(-6, -5, 2);
    this.graphics.fill({ color: 0x000000 });
    this.graphics.circle(6, -5, 2);
    this.graphics.fill({ color: 0x000000 });
    
    this.graphics.circle(0, 3, 4);
    this.graphics.fill({ color: 0xFFB6C1 });
    
    this.graphics.ellipse(-GameConfig.ANIMAL_RADIUS * 0.7, -GameConfig.ANIMAL_RADIUS * 0.7, 
                         6, 10);
    this.graphics.fill({ color: 0xFFB6C1, alpha: 0.8 });
    this.graphics.ellipse(GameConfig.ANIMAL_RADIUS * 0.7, -GameConfig.ANIMAL_RADIUS * 0.7, 
                         6, 10);
    this.graphics.fill({ color: 0xFFB6C1, alpha: 0.8 });
    
    if (this.state === AnimalState.Follow) {
      this.graphics.circle(0, -GameConfig.ANIMAL_RADIUS, 4);
      this.graphics.fill({ color: 0x4CAF50 });
    }
    
    this.addChild(this.graphics);
  }

  public update(dt: number): void {
    switch (this.state) {
      case AnimalState.Patrol:
        this.updatePatrol(dt);
        break;
      case AnimalState.Follow:
        this.updateFollow(dt);
        break;
      case AnimalState.Delivered:
        break;
    }
    
    this.updateHopAnimation(dt);
    this.updateSquashStretch();
  }

  private updatePatrol(dt: number): void {
    this.patrolChangeTimer += dt * 1000;

    const distanceToTarget = this.distanceToPoint(this.patrolTarget.x, this.patrolTarget.y);
    if (distanceToTarget < 10 || this.patrolChangeTimer >= GameConfig.PATROL_CHANGE_DIRECTION_TIME) {
      this.patrolTarget = this.generatePatrolTarget();
      this.patrolChangeTimer = 0;
    }

    const dx = this.patrolTarget.x - this.position.x;
    const dy = this.patrolTarget.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
      const dirX = dx / distance;
      const dirY = dy / distance;
      const moveDistance = GameConfig.ANIMAL_PATROL_SPEED * dt;

      this.position.x += dirX * moveDistance;
      this.position.y += dirY * moveDistance;
      
      this.velocity.set(dirX * GameConfig.ANIMAL_PATROL_SPEED, dirY * GameConfig.ANIMAL_PATROL_SPEED);
      
      if (this.sprite) this.sprite.scale.x = dirX > 0 ? 1 : -1;
      if (this.graphics) this.graphics.scale.x = dirX > 0 ? 1 : -1;
    }
  }

  private updateFollow(dt: number): void {
    const targetPos = this.calculateHerdPosition();
    
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const dirX = dx / distance;
      const dirY = dy / distance;
      const moveDistance = GameConfig.ANIMAL_FOLLOW_SPEED * dt;
      const actualMove = Math.min(moveDistance, distance);

      this.position.x += dirX * actualMove;
      this.position.y += dirY * actualMove;
      
      this.velocity.set(dirX * GameConfig.ANIMAL_FOLLOW_SPEED, dirY * GameConfig.ANIMAL_FOLLOW_SPEED);
      
      if (this.sprite) this.sprite.scale.x = dirX > 0 ? 1 : -1;
      if (this.graphics) this.graphics.scale.x = dirX > 0 ? 1 : -1;
    } else {
      this.velocity.set(0, 0);
    }
  }

  private calculateHerdPosition(): PIXI.Point {
    let targetX = this.hero.position.x;
    let targetY = this.hero.position.y;

    const spacing = GameConfig.HERD_SPACING;
    const offsetDistance = (this.herdIndex + 1) * spacing;

    const heroVel = this.hero.getVelocity();
    const velMag = Math.sqrt(heroVel.x * heroVel.x + heroVel.y * heroVel.y);

    if (velMag > 0.1) {
      const dirX = -heroVel.x / velMag;
      const dirY = -heroVel.y / velMag;
      targetX += dirX * offsetDistance;
      targetY += dirY * offsetDistance;
    } else {
      const angle = (this.herdIndex / GameConfig.MAX_HERD_SIZE) * Math.PI * 2;
      targetX += Math.cos(angle) * spacing;
      targetY += Math.sin(angle) * spacing;
    }

    return new PIXI.Point(targetX, targetY);
  }

  private generatePatrolTarget(): PIXI.Point {
    const angle = Math.random() * Math.PI * 2;
    const distance = GameConfig.PATROL_MIN_DISTANCE + 
                    Math.random() * (GameConfig.PATROL_MAX_DISTANCE - GameConfig.PATROL_MIN_DISTANCE);
    
    const x = this.position.x + Math.cos(angle) * distance;
    const y = this.position.y + Math.sin(angle) * distance;
    
    return new PIXI.Point(x, y);
  }

  private updateHopAnimation(dt: number): void {
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    
    if (speed > 10) {
      this.hopOffset = Math.sin(Date.now() * 0.01 * this.hopSpeed) * 3;
    } else {
      this.hopOffset = 0;
    }
    
    if (this.sprite) this.sprite.y = -this.hopOffset;
    if (this.graphics) this.graphics.y = -this.hopOffset;
  }

  private updateSquashStretch(): void {
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    
    if (speed < 10) {
      if (this.sprite) this.sprite.scale.y = 1.0;
      if (this.graphics) this.graphics.scale.y = 1.0;
      return;
    }
    
    const maxSpeed = GameConfig.ANIMAL_FOLLOW_SPEED;
    const speedRatio = Math.min(speed / maxSpeed, 1.0);
    const stretchAmount = GameConfig.ANIMAL_SQUASH_AMOUNT * speedRatio;
    
    const stretchY = 1.0 + stretchAmount;
    
    if (this.sprite) this.sprite.scale.y = stretchY;
    if (this.graphics) this.graphics.scale.y = stretchY;
  }

  public startFollowing(herdIndex: number): void {
    if (this.state !== AnimalState.Patrol) return;

    this.state = AnimalState.Follow;
    this.herdIndex = herdIndex;
    
    if (this.graphics) {
      this.removeChild(this.graphics);
      this.graphics.destroy();
      this.graphics = null;
      this.createGraphicsFallback();
    }
  }

  public stopFollowing(): void {
    if (this.state !== AnimalState.Follow) return;

    this.state = AnimalState.Patrol;
    this.herdIndex = -1;
    this.patrolTarget = this.generatePatrolTarget();
    this.patrolChangeTimer = 0;
    
    if (this.graphics) {
      this.removeChild(this.graphics);
      this.graphics.destroy();
      this.graphics = null;
      this.createGraphicsFallback();
    }
  }

  public markAsDelivered(): void {
    this.state = AnimalState.Delivered;
    this._isActive = false;
  }

  public getState(): string {
    return this.state;
  }

  public isFollowing(): boolean {
    return this.state === AnimalState.Follow;
  }

  public getHerdIndex(): number {
    return this.herdIndex;
  }

  public setHerdIndex(index: number): void {
    this.herdIndex = index;
  }

  public getId(): string {
    return this.id;
  }

  public override destroy(options?: PIXI.DestroyOptions | boolean): void {
    this._isActive = false;
    super.destroy(options);
  }
}
