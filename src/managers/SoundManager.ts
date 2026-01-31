import { sound } from '@pixi/sound';
import { GameConfig } from '../config';

export class SoundManager {
  private static instance: SoundManager | null = null;
  
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  
  private readonly SOUND_ALIASES = {
    BG_MUSIC: 'bg_music',
    COLLECT: 'collect',
    SCORE: 'score',
  };

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const loadPromises = [
        this.loadSound(
          this.SOUND_ALIASES.BG_MUSIC,
          GameConfig.ASSETS.SOUNDS.BG_MUSIC,
          GameConfig.BG_MUSIC_VOLUME
        ),
        this.loadSound(
          this.SOUND_ALIASES.COLLECT,
          GameConfig.ASSETS.SOUNDS.COLLECT,
          GameConfig.SFX_VOLUME
        ),
        this.loadSound(
          this.SOUND_ALIASES.SCORE,
          GameConfig.ASSETS.SOUNDS.SCORE,
          GameConfig.SFX_VOLUME
        ),
      ];

      await Promise.all(loadPromises);
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = true;
    }
  }

  private async loadSound(alias: string, url: string, volume: number): Promise<void> {
    try {
      if (sound.exists(alias)) {
        return;
      }

      sound.add(alias, {
        url: url,
        preload: true,
        volume: volume,
      });
    } catch (error) {
      throw error;
    }
  }

  public playBackgroundMusic(): void {
    if (!this.isInitialized) return;

    try {
      const alias = this.SOUND_ALIASES.BG_MUSIC;
      const instance = sound.find(alias);
      
      if (!instance) {
        return;
      }

      if (instance.isPlaying) {
        instance.stop();
      }

      instance.play({
        loop: true,
        volume: this.isMuted ? 0 : GameConfig.BG_MUSIC_VOLUME,
      });
    } catch (error) {
    }
  }

  public stopBackgroundMusic(): void {
    try {
      const instance = sound.find(this.SOUND_ALIASES.BG_MUSIC);
      if (instance) {
        instance.stop();
      }
    } catch (error) {
    }
  }

  public playCollectSound(): void {
    this.playSoundEffect(this.SOUND_ALIASES.COLLECT);
  }

  public playScoreSound(): void {
    this.playSoundEffect(this.SOUND_ALIASES.SCORE);
  }

  private playSoundEffect(alias: string): void {
    if (!this.isInitialized || this.isMuted) return;

    try {
      const instance = sound.find(alias);
      if (!instance) return;

      if (instance.isPlaying) {
        instance.stop();
      }

      instance.play({
        volume: GameConfig.SFX_VOLUME,
      });
    } catch (error) {
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    Object.values(this.SOUND_ALIASES).forEach(alias => {
      const instance = sound.find(alias);
      if (instance) {
        const baseVolume = alias === this.SOUND_ALIASES.BG_MUSIC 
          ? GameConfig.BG_MUSIC_VOLUME 
          : GameConfig.SFX_VOLUME;
        instance.volume = this.isMuted ? 0 : baseVolume;
      }
    });

    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    if (this.isMuted !== muted) {
      this.toggleMute();
    }
  }

  public destroy(): void {
    try {
      sound.stopAll();
      sound.removeAll();
      this.isInitialized = false;
    } catch (error) {
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}
