import * as PIXI from 'pixi.js';
import { Animal } from '../entities/Animal';
import { Hero } from '../entities/Hero';
import { Yard } from '../entities/Yard';
import { GameConfig } from '../config';

export class AnimalManager {
  private animals: Animal[] = [];
  private hero: Hero;
  private yard: Yard;
  private score: number = 0;
  
  private nextSpawnTime: number = 0;
  private currentTime: number = 0;
  
  private screenWidth: number;
  private screenHeight: number;
  
  private connectionLinesContainer: PIXI.Graphics;
  
  private onScoreChange?: (score: number) => void;
  private onAnimalAdded?: (animal: Animal) => void;
  private onAnimalRemoved?: (animal: Animal) => void;
  private onAnimalCollected?: () => void;
  private onAnimalScored?: () => void;
  private onHerdCountChange?: (count: number) => void;

  constructor(
    hero: Hero,
    yard: Yard,
    screenWidth: number,
    screenHeight: number
  ) {
    this.hero = hero;
    this.yard = yard;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    
    this.connectionLinesContainer = new PIXI.Graphics();
    
    this.scheduleNextSpawn();
  }

  public update(dt: number): void {
    this.currentTime += dt * 1000;
    
    this.updateHerdLogic();
    this.checkYardCollisions();
    this.updateSpawnSystem();
    this.updateConnectionLines();
  }

  private updateHerdLogic(): void {
    const followDistance = GameConfig.FOLLOW_DISTANCE;
    const maxHerdSize = GameConfig.MAX_HERD_SIZE;
    
    const candidateAnimals = this.animals.filter(animal => {
      if (animal.getState() === 'Delivered') return false;
      const distance = animal.distanceTo(this.hero);
      return distance <= followDistance;
    });
    
    candidateAnimals.sort((a, b) => {
      return a.distanceTo(this.hero) - b.distanceTo(this.hero);
    });
    
    const currentlyFollowing = this.animals.filter(a => a.isFollowing());
    const previousCount = currentlyFollowing.length;
    
    for (let i = 0; i < candidateAnimals.length; i++) {
      const animal = candidateAnimals[i];
      
      if (i < maxHerdSize) {
        if (!animal.isFollowing()) {
          animal.startFollowing(i);
          if (this.onAnimalCollected) {
            this.onAnimalCollected();
          }
        } else {
          animal.setHerdIndex(i);
        }
      } else {
        if (animal.isFollowing()) {
          animal.stopFollowing();
        }
      }
    }
    
    for (const animal of currentlyFollowing) {
      const distance = animal.distanceTo(this.hero);
      if (distance > followDistance && !candidateAnimals.includes(animal)) {
        animal.stopFollowing();
      }
    }

    // Notify herd count changes
    const newFollowingCount = this.animals.filter(a => a.isFollowing()).length;
    if (newFollowingCount !== previousCount && this.onHerdCountChange) {
      this.onHerdCountChange(newFollowingCount);
    }
  }

  private updateConnectionLines(): void {
    if (!GameConfig.CONNECTION_LINES_ENABLED) {
      this.connectionLinesContainer.clear();
      return;
    }

    this.connectionLinesContainer.clear();

    const followingAnimals = this.animals.filter(a => a.isFollowing());

    for (const animal of followingAnimals) {
      this.connectionLinesContainer.moveTo(this.hero.position.x, this.hero.position.y);
      this.connectionLinesContainer.lineTo(animal.position.x, animal.position.y);
      this.connectionLinesContainer.stroke({
        color: GameConfig.CONNECTION_LINE_COLOR,
        width: GameConfig.CONNECTION_LINE_WIDTH,
        alpha: GameConfig.CONNECTION_LINE_ALPHA,
      });
    }
  }

  private checkYardCollisions(): void {
    const followingAnimals = this.animals.filter(a => a.isFollowing());
    
    for (const animal of followingAnimals) {
      if (this.yard.containsPoint(animal.position.x, animal.position.y)) {
        this.collectAnimal(animal);
      }
    }
  }

  private collectAnimal(animal: Animal): void {
    animal.markAsDelivered();
    this.score++;
    
    if (this.onAnimalScored) {
      this.onAnimalScored();
    }
    
    if (this.onScoreChange) {
      this.onScoreChange(this.score);
    }
    
    const index = this.animals.indexOf(animal);
    if (index !== -1) {
      this.animals.splice(index, 1);
    }
    
    if (this.onAnimalRemoved) {
      this.onAnimalRemoved(animal);
    }

    // Update herd count
    const followingCount = this.animals.filter(a => a.isFollowing()).length;
    if (this.onHerdCountChange) {
      this.onHerdCountChange(followingCount);
    }
  }

  private updateSpawnSystem(): void {
    if (this.currentTime < this.nextSpawnTime) {
      return;
    }
    
    if (this.animals.length >= GameConfig.MAX_TOTAL_ANIMALS) {
      this.scheduleNextSpawn();
      return;
    }
    
    const spawnPos = this.findValidSpawnPosition();
    if (spawnPos) {
      this.spawnAnimal(spawnPos.x, spawnPos.y);
      this.scheduleNextSpawn();
    } else {
      this.nextSpawnTime = this.currentTime + 500;
    }
  }

  private findValidSpawnPosition(): { x: number; y: number } | null {
    const margin = GameConfig.SPAWN_MARGIN;
    const minDistance = 100;
    const maxAttempts = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = margin + Math.random() * (this.screenWidth - margin * 2);
      const y = margin + Math.random() * (this.screenHeight - margin * 2);
      
      const distToHero = Math.sqrt(
        (x - this.hero.position.x) ** 2 + 
        (y - this.hero.position.y) ** 2
      );
      if (distToHero < minDistance) continue;
      
      const distToYard = Math.sqrt(
        (x - this.yard.position.x) ** 2 + 
        (y - this.yard.position.y) ** 2
      );
      if (distToYard < minDistance + this.yard.getRadius()) continue;
      
      let tooClose = false;
      for (const animal of this.animals) {
        const distToAnimal = Math.sqrt(
          (x - animal.position.x) ** 2 + 
          (y - animal.position.y) ** 2
        );
        if (distToAnimal < minDistance) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      
      return { x, y };
    }
    
    return null;
  }

  private scheduleNextSpawn(): void {
    const min = GameConfig.SPAWN_INTERVAL_MIN;
    const max = GameConfig.SPAWN_INTERVAL_MAX;
    const delay = min + Math.random() * (max - min);
    this.nextSpawnTime = this.currentTime + delay;
  }

  public spawnAnimal(x: number, y: number): Animal {
    const animal = new Animal(x, y, this.hero);
    this.animals.push(animal);
    
    if (this.onAnimalAdded) {
      this.onAnimalAdded(animal);
    }
    
    return animal;
  }

  public spawnInitialAnimals(): void {
    const count = GameConfig.INITIAL_ANIMAL_COUNT;
    let spawned = 0;
    let attempts = 0;
    const maxAttempts = count * 5;
    
    while (spawned < count && attempts < maxAttempts) {
      const pos = this.findValidSpawnPosition();
      if (pos) {
        this.spawnAnimal(pos.x, pos.y);
        spawned++;
      }
      attempts++;
    }
  }

  public getAnimals(): Animal[] {
    return this.animals;
  }

  public getScore(): number {
    return this.score;
  }

  public getConnectionLinesContainer(): PIXI.Graphics {
    return this.connectionLinesContainer;
  }

  public setOnScoreChange(callback: (score: number) => void): void {
    this.onScoreChange = callback;
  }

  public setOnAnimalAdded(callback: (animal: Animal) => void): void {
    this.onAnimalAdded = callback;
  }

  public setOnAnimalRemoved(callback: (animal: Animal) => void): void {
    this.onAnimalRemoved = callback;
  }

  public setOnAnimalCollected(callback: () => void): void {
    this.onAnimalCollected = callback;
  }

  public setOnAnimalScored(callback: () => void): void {
    this.onAnimalScored = callback;
  }

  public setOnHerdCountChange(callback: (count: number) => void): void {
    this.onHerdCountChange = callback;
  }

  public updateScreenBounds(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }
}