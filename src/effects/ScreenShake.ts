import * as PIXI from 'pixi.js';
import { GameConfig } from '../config';

export class ScreenShake {
  private container: PIXI.Container;
  private shakeTimer: number = 0;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private originalX: number = 0;
  private originalY: number = 0;
  private enabled: boolean = true;

  constructor(container: PIXI.Container) {
    this.container = container;
    this.originalX = container.position.x;
    this.originalY = container.position.y;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  public shake(intensity: number = GameConfig.SCREEN_SHAKE_INTENSITY, duration: number = GameConfig.SCREEN_SHAKE_DURATION): void {
    if (!this.enabled || !GameConfig.SCREEN_SHAKE_ENABLED) return;

    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  public update(dt: number): void {
    if (this.shakeTimer >= this.shakeDuration) {
      if (this.shakeTimer > 0) {
        this.reset();
      }
      return;
    }

    this.shakeTimer += dt;
    const progress = this.shakeTimer / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * (1 - progress);

    const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
    const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;

    this.container.position.set(
      this.originalX + offsetX,
      this.originalY + offsetY
    );
  }

  private reset(): void {
    this.shakeTimer = this.shakeDuration + 1;
    this.container.position.set(this.originalX, this.originalY);
  }

  public destroy(): void {
    this.reset();
  }
}