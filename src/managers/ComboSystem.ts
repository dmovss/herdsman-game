import { GameConfig } from '../config';

export class ComboSystem {
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private multiplier: number = 1.0;
  private enabled: boolean = true;

  private onComboChange?: (combo: number, multiplier: number) => void;
  private onComboBreak?: () => void;

  constructor() {
    this.reset();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  public addScore(): void {
    if (!this.enabled || !GameConfig.COMBO_ENABLED) return;

    this.comboCount++;
    this.comboTimer = GameConfig.COMBO_TIME_WINDOW / 1000;
    
    this.multiplier = Math.min(
      GameConfig.COMBO_MULTIPLIER_BASE + (this.comboCount - 1) * GameConfig.COMBO_MULTIPLIER_INCREMENT,
      GameConfig.COMBO_MAX_MULTIPLIER
    );

    if (this.onComboChange) {
      this.onComboChange(this.comboCount, this.multiplier);
    }
  }

  public update(dt: number): void {
    if (!this.enabled || this.comboCount === 0) return;

    this.comboTimer -= dt;

    if (this.comboTimer <= 0) {
      this.breakCombo();
    }
  }

  private breakCombo(): void {
    if (this.comboCount > 0 && this.onComboBreak) {
      this.onComboBreak();
    }
    this.reset();
  }

  private reset(): void {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.multiplier = 1.0;
  }

  public getComboCount(): number {
    return this.comboCount;
  }

  public getMultiplier(): number {
    return this.multiplier;
  }

  public getTimeRemaining(): number {
    return Math.max(0, this.comboTimer);
  }

  public isActive(): boolean {
    return this.comboCount > 0;
  }

  public setOnComboChange(callback: (combo: number, multiplier: number) => void): void {
    this.onComboChange = callback;
  }

  public setOnComboBreak(callback: () => void): void {
    this.onComboBreak = callback;
  }
}