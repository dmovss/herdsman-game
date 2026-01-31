import * as PIXI from 'pixi.js';
import { GameConfig, QualitySetting } from '../config';

export class SettingsPanel {
  private container: PIXI.Container;
  private background: PIXI.Graphics;
  private overlay: PIXI.Graphics;
  private isVisible: boolean = false;

  private qualitySetting: QualitySetting = 'HIGH';
  private musicVolume: number = GameConfig.BG_MUSIC_VOLUME;
  private sfxVolume: number = GameConfig.SFX_VOLUME;

  private onClose?: () => void;
  private onQualityChange?: (quality: QualitySetting) => void;
  private onMusicVolumeChange?: (volume: number) => void;
  private onSfxVolumeChange?: (volume: number) => void;

  constructor(width: number, height: number) {
    this.container = new PIXI.Container();
    this.container.visible = false;

    // Dark overlay
    this.overlay = new PIXI.Graphics();
    this.overlay.rect(0, 0, width, height);
    this.overlay.fill({ color: 0x000000, alpha: 0.7 });
    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => this.close());
    this.container.addChild(this.overlay);

    // Panel background
    this.background = new PIXI.Graphics();
    const panelWidth = 500;
    const panelHeight = 450;
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;

    this.background.roundRect(panelX, panelY, panelWidth, panelHeight, 20);
    this.background.fill({ color: 0x2C3E50, alpha: 0.95 });
    this.background.stroke({ color: 0xFFFFFF, width: 3 });
    this.background.eventMode = 'static';
    this.container.addChild(this.background);

    this.createTitle(width, height);
    this.createQualitySelector(width, height);
    this.createVolumeControls(width, height);
    this.createCloseButton(width, height);

    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const quality = localStorage.getItem('herdsman_quality') as QualitySetting;
      if (quality && ['HIGH', 'MEDIUM', 'LOW'].includes(quality)) {
        this.qualitySetting = quality;
      }
      
      const music = localStorage.getItem('herdsman_music_volume');
      if (music) {
        this.musicVolume = parseFloat(music);
      }
      
      const sfx = localStorage.getItem('herdsman_sfx_volume');
      if (sfx) {
        this.sfxVolume = parseFloat(sfx);
      }
    } catch (error) {
      // Silent fail
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('herdsman_quality', this.qualitySetting);
      localStorage.setItem('herdsman_music_volume', this.musicVolume.toString());
      localStorage.setItem('herdsman_sfx_volume', this.sfxVolume.toString());
    } catch (error) {
      // Silent fail
    }
  }

  private createTitle(width: number, height: number): void {
    const title = new PIXI.Text({
      text: 'SETTINGS',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 42,
        fill: { color: 0xFFFFFF, alpha: 1 },
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
      },
    });

    title.anchor.set(0.5);
    title.position.set(width / 2, height / 2 - 180);
    this.container.addChild(title);
  }

  private createQualitySelector(width: number, height: number): void {
    const label = new PIXI.Text({
      text: 'Graphics Quality:',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 24,
        fill: { color: 0xFFFFFF, alpha: 1 },
        fontWeight: 'bold',
      },
    });

    label.anchor.set(0.5);
    label.position.set(width / 2, height / 2 - 100);
    this.container.addChild(label);

    const qualities: QualitySetting[] = ['HIGH', 'MEDIUM', 'LOW'];
    const buttonWidth = 120;
    const spacing = 20;
    const startX = width / 2 - (buttonWidth * 1.5 + spacing);

    qualities.forEach((quality, index) => {
      const button = this.createButton(
        quality,
        startX + index * (buttonWidth + spacing),
        height / 2 - 50,
        buttonWidth,
        50,
        this.qualitySetting === quality
      );

      button.on('pointerdown', () => {
        this.qualitySetting = quality;
        this.saveSettings();
        if (this.onQualityChange) {
          this.onQualityChange(quality);
        }
        this.refresh(width, height);
      });

      this.container.addChild(button);
    });
  }

  private createVolumeControls(width: number, height: number): void {
    // Music volume
    const musicLabel = new PIXI.Text({
      text: `Music Volume: ${Math.round(this.musicVolume * 100)}%`,
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 20,
        fill: { color: 0xFFFFFF, alpha: 1 },
      },
    });

    musicLabel.anchor.set(0.5);
    musicLabel.position.set(width / 2, height / 2 + 30);
    this.container.addChild(musicLabel);

    this.createSlider(width / 2 - 150, height / 2 + 60, 300, this.musicVolume, (value) => {
      this.musicVolume = value;
      musicLabel.text = `Music Volume: ${Math.round(value * 100)}%`;
      this.saveSettings();
      if (this.onMusicVolumeChange) {
        this.onMusicVolumeChange(value);
      }
    });

    // SFX volume
    const sfxLabel = new PIXI.Text({
      text: `SFX Volume: ${Math.round(this.sfxVolume * 100)}%`,
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 20,
        fill: { color: 0xFFFFFF, alpha: 1 },
      },
    });

    sfxLabel.anchor.set(0.5);
    sfxLabel.position.set(width / 2, height / 2 + 110);
    this.container.addChild(sfxLabel);

    this.createSlider(width / 2 - 150, height / 2 + 140, 300, this.sfxVolume, (value) => {
      this.sfxVolume = value;
      sfxLabel.text = `SFX Volume: ${Math.round(value * 100)}%`;
      this.saveSettings();
      if (this.onSfxVolumeChange) {
        this.onSfxVolumeChange(value);
      }
    });
  }

  private createSlider(x: number, y: number, width: number, initialValue: number, onChange: (value: number) => void): void {
    const track = new PIXI.Graphics();
    track.roundRect(0, 0, width, 10, 5);
    track.fill({ color: 0x555555, alpha: 1 });
    track.position.set(x, y);
    this.container.addChild(track);

    const handle = new PIXI.Graphics();
    handle.circle(0, 0, 15);
    handle.fill({ color: GameConfig.UI_BUTTON_COLOR, alpha: 1 });
    handle.stroke({ color: 0xFFFFFF, width: 2 });
    handle.position.set(x + width * initialValue, y + 5);
    handle.eventMode = 'static';
    handle.cursor = 'pointer';

    let dragging = false;

    handle.on('pointerdown', () => {
      dragging = true;
    });

    this.container.on('pointerup', () => {
      dragging = false;
    });

    this.container.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      if (dragging) {
        const localX = Math.max(x, Math.min(x + width, event.global.x));
        handle.position.x = localX;
        const value = (localX - x) / width;
        onChange(value);
      }
    });

    this.container.addChild(handle);
  }

  private createButton(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    selected: boolean
  ): PIXI.Container {
    const button = new PIXI.Container();
    button.position.set(x, y);

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, width, height, 10);
    bg.fill({ 
      color: selected ? GameConfig.UI_BUTTON_HOVER_COLOR : GameConfig.UI_BUTTON_COLOR, 
      alpha: 0.9 
    });
    bg.stroke({ color: selected ? 0xFFEB3B : 0xFFFFFF, width: selected ? 3 : 2 });
    button.addChild(bg);

    const label = new PIXI.Text({
      text: text,
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 20,
        fill: { color: 0xFFFFFF, alpha: 1 },
        fontWeight: 'bold',
      },
    });

    label.anchor.set(0.5);
    label.position.set(width / 2, height / 2);
    button.addChild(label);

    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      if (!selected) {
        button.scale.set(1.05);
      }
    });

    button.on('pointerout', () => {
      button.scale.set(1.0);
    });

    return button;
  }

  private createCloseButton(width: number, height: number): void {
    const button = new PIXI.Container();
    const buttonWidth = 200;
    const buttonHeight = 60;

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, buttonWidth, buttonHeight, 15);
    bg.fill({ color: 0xE74C3C, alpha: 0.9 });
    bg.stroke({ color: 0xFFFFFF, width: 2 });
    button.addChild(bg);

    const text = new PIXI.Text({
      text: 'CLOSE',
      style: {
        fontFamily: GameConfig.UI_FONT_FAMILY,
        fontSize: 28,
        fill: { color: 0xFFFFFF, alpha: 1 },
        fontWeight: 'bold',
      },
    });

    text.anchor.set(0.5);
    text.position.set(buttonWidth / 2, buttonHeight / 2);
    button.addChild(text);

    button.position.set(
      width / 2 - buttonWidth / 2,
      height / 2 + 170
    );

    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, buttonWidth, buttonHeight, 15);
      bg.fill({ color: 0xC0392B, alpha: 0.9 });
      bg.stroke({ color: 0xFFFFFF, width: 2 });
      button.scale.set(1.05);
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, buttonWidth, buttonHeight, 15);
      bg.fill({ color: 0xE74C3C, alpha: 0.9 });
      bg.stroke({ color: 0xFFFFFF, width: 2 });
      button.scale.set(1.0);
    });

    button.on('pointerdown', () => {
      this.close();
    });

    this.container.addChild(button);
  }

  private refresh(width: number, height: number): void {
    // Remove all children and recreate
    this.container.removeChildren();
    
    this.overlay = new PIXI.Graphics();
    this.overlay.rect(0, 0, width, height);
    this.overlay.fill({ color: 0x000000, alpha: 0.7 });
    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => this.close());
    this.container.addChild(this.overlay);

    const panelWidth = 500;
    const panelHeight = 450;
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;

    this.background = new PIXI.Graphics();
    this.background.roundRect(panelX, panelY, panelWidth, panelHeight, 20);
    this.background.fill({ color: 0x2C3E50, alpha: 0.95 });
    this.background.stroke({ color: 0xFFFFFF, width: 3 });
    this.background.eventMode = 'static';
    this.container.addChild(this.background);

    this.createTitle(width, height);
    this.createQualitySelector(width, height);
    this.createVolumeControls(width, height);
    this.createCloseButton(width, height);
  }

  public show(): void {
    this.isVisible = true;
    this.container.visible = true;
  }

  public close(): void {
    this.isVisible = false;
    this.container.visible = false;
    if (this.onClose) {
      this.onClose();
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.close();
    } else {
      this.show();
    }
  }

  public getQualitySetting(): QualitySetting {
    return this.qualitySetting;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setOnClose(callback: () => void): void {
    this.onClose = callback;
  }

  public setOnQualityChange(callback: (quality: QualitySetting) => void): void {
    this.onQualityChange = callback;
  }

  public setOnMusicVolumeChange(callback: (volume: number) => void): void {
    this.onMusicVolumeChange = callback;
  }

  public setOnSfxVolumeChange(callback: (volume: number) => void): void {
    this.onSfxVolumeChange = callback;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public resize(width: number, height: number): void {
    this.refresh(width, height);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}