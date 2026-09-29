import * as THREE from 'three';

export interface WeaponConfig {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  magazineSize: number;
  reserveAmmo: number;
  reloadTime: number;
  spread: number;
  recoil: number;
  range: number;
  automatic: boolean;
  cost: number;
}

export class Weapon {
  public config: WeaponConfig;
  public currentAmmo: number;
  public reserveAmmo: number;
  public cooldown: number;
  public isReloading: boolean;
  public reloadTimer: number;

  constructor(config: WeaponConfig) {
    this.config = config;
    this.currentAmmo = config.magazineSize;
    this.reserveAmmo = config.reserveAmmo;
    this.cooldown = 0;
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  public update(delta: number): void {
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }

    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        const missing = this.config.magazineSize - this.currentAmmo;
        const loaded = Math.min(missing, this.reserveAmmo);
        this.currentAmmo += loaded;
        this.reserveAmmo -= loaded;
        this.isReloading = false;
      }
    }
  }

  public beginReload(): void {
    if (this.isReloading || this.currentAmmo === this.config.magazineSize || this.reserveAmmo <= 0) {
      return;
    }

    this.isReloading = true;
    this.reloadTimer = this.config.reloadTime;
  }

  public fire(): boolean {
    if (this.isReloading || this.currentAmmo <= 0 || this.cooldown > 0) {
      return false;
    }

    this.currentAmmo -= 1;
    this.cooldown = 1 / this.config.fireRate;
    return true;
  }

  public getLabel(): string {
    return this.config.name.toUpperCase();
  }
}
