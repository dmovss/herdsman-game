import * as PIXI from 'pixi.js';
import { GameConfig } from '../config';

interface Particle {
  sprite: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleSystem {
  private container: PIXI.Container;
  private particles: Particle[] = [];
  private enabled: boolean = true;

  constructor() {
    this.container = new PIXI.Container();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public createCollectEffect(x: number, y: number): void {
    if (!this.enabled || !GameConfig.PARTICLES_ENABLED) return;

    const count = GameConfig.PARTICLE_COUNT_COLLECT;
    const colors = [0x4CAF50, 0x8BC34A, 0xCDDC39, 0xFFEB3B];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.createParticle(x, y, 
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        3 + Math.random() * 3
      );
    }
  }

  public createScoreEffect(x: number, y: number): void {
    if (!this.enabled || !GameConfig.PARTICLES_ENABLED) return;

    const count = GameConfig.PARTICLE_COUNT_SCORE;
    const colors = [0xFFD700, 0xFFA500, 0xFF8C00, 0xFFEB3B];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 120;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.createParticle(x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        4 + Math.random() * 4
      );
    }
  }

  public createBurstEffect(x: number, y: number, color: number = 0xFFFFFF): void {
    if (!this.enabled || !GameConfig.PARTICLES_ENABLED) return;

    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;

      this.createParticle(x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2 + Math.random() * 2
      );
    }
  }

  private createParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: number,
    size: number
  ): void {
    const sprite = new PIXI.Graphics();
    sprite.circle(0, 0, size);
    sprite.fill({ color, alpha: 1.0 });
    sprite.position.set(x, y);

    this.container.addChild(sprite);

    const particle: Particle = {
      sprite,
      vx,
      vy,
      life: GameConfig.PARTICLE_LIFETIME,
      maxLife: GameConfig.PARTICLE_LIFETIME,
      scale: 1.0,
    };

    this.particles.push(particle);
  }

  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.sprite.position.x += particle.vx * dt;
      particle.sprite.position.y += particle.vy * dt;
      
      particle.vy += 200 * dt; // Gravity
      particle.vx *= 0.98; // Air resistance
      
      particle.life -= dt;
      
      const lifeRatio = particle.life / particle.maxLife;
      particle.sprite.alpha = lifeRatio;
      particle.sprite.scale.set(lifeRatio * particle.scale);

      if (particle.life <= 0) {
        this.container.removeChild(particle.sprite);
        particle.sprite.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public clear(): void {
    for (const particle of this.particles) {
      this.container.removeChild(particle.sprite);
      particle.sprite.destroy();
    }
    this.particles = [];
  }

  public destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}