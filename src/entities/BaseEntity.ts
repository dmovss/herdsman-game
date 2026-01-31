import * as PIXI from 'pixi.js';

export abstract class BaseEntity extends PIXI.Container {
  protected _isActive: boolean = true;
  protected velocity: PIXI.Point;

  constructor() {
    super();
    this.velocity = new PIXI.Point(0, 0);
  }

  abstract update(dt: number): void;

  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(value: boolean) {
    this._isActive = value;
  }

  public getVelocity(): PIXI.Point {
    return this.velocity;
  }

  public setVelocity(x: number, y: number): void {
    this.velocity.set(x, y);
  }

  public distanceTo(other: BaseEntity): number {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public distanceToPoint(x: number, y: number): number {
    const dx = this.position.x - x;
    const dy = this.position.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public destroy(options?: PIXI.DestroyOptions | boolean): void {
    this._isActive = false;
    super.destroy(options);
  }
}