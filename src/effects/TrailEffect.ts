import * as PIXI from 'pixi.js';
import { GameConfig } from '../config';

interface TrailPoint {
  sprite: PIXI.Graphics;
  alpha: number;
}

export class TrailEffect {
  private container: PIXI.Container;
  private trail: TrailPoint[] = [];
  private enabled: boolean = true;
  private color: number;
  private radius: number;

  constructor(color: number, radius: number) {
    this.container = new PIXI.Container();
    this.color = color;
    this.radius = radius;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  public addPoint(x: number, y: number): void {
    if (!this.enabled || !GameConfig.TRAIL_ENABLED) return;

    const sprite = new PIXI.Graphics();
    sprite.circle(0, 0, this.radius * 0.8);
    sprite.fill({ color: this.color, alpha: 0.6 });
    sprite.position.set(x, y);

    this.container.addChild(sprite);

    this.trail.push({
      sprite,
      alpha: 0.6,
    });

    if (this.trail.length > GameConfig.TRAIL_LENGTH) {
      const old = this.trail.shift();
      if (old) {
        this.container.removeChild(old.sprite);
        old.sprite.destroy();
      }
    }
  }

  public update(dt: number): void {
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i];
      point.alpha -= GameConfig.TRAIL_ALPHA_DECAY * dt;
      point.sprite.alpha = point.alpha;

      if (point.alpha <= 0) {
        this.container.removeChild(point.sprite);
        point.sprite.destroy();
        this.trail.splice(i, 1);
      }
    }
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public clear(): void {
    for (const point of this.trail) {
      this.container.removeChild(point.sprite);
      point.sprite.destroy();
    }
    this.trail = [];
  }

  public destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}