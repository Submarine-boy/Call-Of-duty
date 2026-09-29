export class HUD {
  public root: HTMLDivElement;
  public round: HTMLDivElement;
  public health: HTMLDivElement;
  public score: HTMLDivElement;
  public currency: HTMLDivElement;
  public weapon: HTMLDivElement;
  public ammo: HTMLDivElement;
  public enemies: HTMLDivElement;
  public status: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'hud';

    const topLeft = document.createElement('div');
    topLeft.className = 'hud-panel hud-panel-top-left';
    this.round = document.createElement('div');
    this.round.className = 'hud-label';
    topLeft.appendChild(this.round);

    const topRight = document.createElement('div');
    topRight.className = 'hud-panel hud-panel-top-right';
    this.enemies = document.createElement('div');
    this.enemies.className = 'hud-label';
    topRight.appendChild(this.enemies);

    const bottomLeft = document.createElement('div');
    bottomLeft.className = 'hud-panel hud-panel-bottom-left';
    this.health = document.createElement('div');
    this.health.className = 'hud-label';
    bottomLeft.appendChild(this.health);

    const bottomRight = document.createElement('div');
    bottomRight.className = 'hud-panel hud-panel-bottom-right';
    this.weapon = document.createElement('div');
    this.weapon.className = 'hud-label';
    this.ammo = document.createElement('div');
    this.ammo.className = 'hud-label';
    bottomRight.appendChild(this.weapon);
    bottomRight.appendChild(this.ammo);

    const center = document.createElement('div');
    center.className = 'crosshair';
    center.innerHTML = '<span></span><span></span>';

    this.status = document.createElement('div');
    this.status.className = 'status-banner';

    this.root.append(topLeft, topRight, bottomLeft, bottomRight, center, this.status);
    document.body.appendChild(this.root);
  }

  public update(round: number, health: number, score: number, currency: number, weaponName: string, currentAmmo: number, reserveAmmo: number, enemiesLeft: number, text: string) {
    this.round.textContent = `ROUND ${round}`;
    this.health.textContent = `HEALTH\n${Math.max(0, Math.ceil(health))}`;
    this.score.textContent = `SCORE ${score}`;
    this.currency.textContent = `CREDITS ${currency}`;
    this.weapon.textContent = weaponName;
    this.ammo.textContent = `${currentAmmo} / ${reserveAmmo}`;
    this.enemies.textContent = `REMAINING ${enemiesLeft}`;
    this.status.textContent = text;
  }
}
