import * as THREE from 'three';
import { HUD } from '../ui/HUD';
import { GameState } from './GameState';
import { PlayerController } from '../player/PlayerController';
import { Weapon } from '../weapons/Weapon';
import { Zombie } from '../zombies/Zombie';

export class Game {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public hud: HUD;
  public player: PlayerController;
  public weapon: Weapon;
  public zombies: Zombie[] = [];

  public state: GameState;
  public keys = new Set<string>();
  public pointerLocked = false;
  public round = 1;
  public score = 0;
  public currency = 0;
  public health = 100;
  public enemiesRemaining = 0;
  public spawnTimer = 0;

  private menuOverlay: HTMLDivElement;
  private pauseOverlay: HTMLDivElement;
  private overlayTitle: HTMLHeadingElement;
  private overlayMessage: HTMLParagraphElement;
  private playButton: HTMLButtonElement;

  constructor() {
    this.state = GameState.MAIN_MENU;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1016);
    this.scene.fog = new THREE.Fog(0x0a1016, 12, 46);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.7, 12);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.player = new PlayerController();
    this.weapon = new Weapon({
      id: 'ranger-9',
      name: 'Ranger-9',
      damage: 22,
      fireRate: 7,
      magazineSize: 24,
      reserveAmmo: 120,
      reloadTime: 1.5,
      spread: 0.02,
      recoil: 0.08,
      range: 35,
      automatic: true,
      cost: 0,
    });
    this.hud = new HUD();

    this.buildEnvironment();
    this.createMenu();
    this.bindInput();
    this.updateHud();
  }

  private buildEnvironment(): void {
    const ambient = new THREE.AmbientLight(0x8ea3ba, 1.2);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xebd7b3, 1.7);
    keyLight.position.set(8, 12, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(keyLight);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(48, 1, 48),
      new THREE.MeshStandardMaterial({ color: 0x232b32, roughness: 0.95, metalness: 0.15 }),
    );
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const room = new THREE.Mesh(
      new THREE.BoxGeometry(22, 7, 18),
      new THREE.MeshStandardMaterial({ color: 0x2f3944, roughness: 0.85, metalness: 0.1 }),
    );
    room.position.set(0, 3.5, 0);
    room.castShadow = true;
    room.receiveShadow = true;
    this.scene.add(room);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3c4652, roughness: 0.9 });
    const walls = [
      { pos: [0, 3, -9.1], size: [22, 6, 0.8] },
      { pos: [0, 3, 9.1], size: [22, 6, 0.8] },
      { pos: [-11, 3, 0], size: [0.8, 6, 18] },
      { pos: [11, 3, 0], size: [0.8, 6, 18] },
    ];

    for (const wall of walls) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]), wallMaterial);
      mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    const redLight = new THREE.PointLight(0xff6f4d, 2.6, 22, 1.5);
    redLight.position.set(0, 5, 0);
    this.scene.add(redLight);
  }

  private createMenu(): void {
    this.menuOverlay = document.createElement('div');
    this.menuOverlay.className = 'overlay';

    const panel = document.createElement('div');
    panel.className = 'menu-panel';

    this.overlayTitle = document.createElement('h1');
    this.overlayTitle.textContent = 'Facility Siege';

    this.overlayMessage = document.createElement('p');
    this.overlayMessage.textContent = 'Hold the line against the breach.';

    const actions = document.createElement('div');
    actions.className = 'menu-actions';

    this.playButton = document.createElement('button');
    this.playButton.textContent = 'PLAY';
    this.playButton.className = 'menu-button';
    this.playButton.addEventListener('click', () => this.startGame());

    const helpButton = document.createElement('button');
    helpButton.textContent = 'HOW TO PLAY';
    helpButton.className = 'menu-button secondary';
    helpButton.addEventListener('click', () => {
      this.overlayMessage.textContent = 'WASD to move, Shift to sprint, Ctrl to crouch, R to reload, mouse to aim, left click to fire.';
    });

    const settingsButton = document.createElement('button');
    settingsButton.textContent = 'SETTINGS';
    settingsButton.className = 'menu-button secondary';
    settingsButton.addEventListener('click', () => {
      this.overlayMessage.textContent = 'Sensitivity and FOV are tuned in the settings panel soon.';
    });

    panel.append(this.overlayTitle, this.overlayMessage, actions);
    actions.append(this.playButton, helpButton, settingsButton);
    this.menuOverlay.appendChild(panel);
    document.body.appendChild(this.menuOverlay);

    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.className = 'overlay hidden';
    const pausePanel = document.createElement('div');
    pausePanel.className = 'menu-panel small';

    const pauseTitle = document.createElement('h2');
    pauseTitle.textContent = 'Paused';

    const resumeButton = document.createElement('button');
    resumeButton.textContent = 'RESUME';
    resumeButton.className = 'menu-button';
    resumeButton.addEventListener('click', () => this.resumeGame());

    const menuButton = document.createElement('button');
    menuButton.textContent = 'MAIN MENU';
    menuButton.className = 'menu-button secondary';
    menuButton.addEventListener('click', () => this.showMainMenu());

    pausePanel.append(pauseTitle, resumeButton, menuButton);
    this.pauseOverlay.appendChild(pausePanel);
    document.body.appendChild(this.pauseOverlay);
  }

  private bindInput(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      this.keys.add(event.code);

      if (event.code === 'KeyR') {
        this.weapon.beginReload();
      }

      if (event.code === 'Escape') {
        if (this.state === GameState.PLAYING) {
          this.pauseGame();
        } else if (this.state === GameState.PAUSED) {
          this.resumeGame();
        }
      }

      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.player.isSprinting = true;
      }

      if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
        this.player.isCrouching = true;
      }

      if (event.code === 'Space' && this.player.onGround) {
        this.player.velocity.y = 5.8;
        this.player.onGround = false;
      }
    });

    document.addEventListener('keyup', (event: KeyboardEvent) => {
      this.keys.delete(event.code);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.player.isSprinting = false;
      }
      if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
        this.player.isCrouching = false;
      }
    });

    document.addEventListener('mousedown', () => {
      if (!this.pointerLocked && this.state === GameState.PLAYING) {
        this.renderer.domElement.requestPointerLock();
      } else if (this.state === GameState.PLAYING) {
        this.fire();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    });

    document.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.pointerLocked && this.state === GameState.PLAYING) {
        this.player.handlePointerMove(event.movementX, event.movementY);
      }
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private showMainMenu(): void {
    this.state = GameState.MAIN_MENU;
    this.menuOverlay.classList.remove('hidden');
    this.pauseOverlay.classList.add('hidden');
    document.exitPointerLock();
    this.pointerLocked = false;
    this.overlayTitle.textContent = 'Facility Siege';
    this.overlayMessage.textContent = 'Hold the line against the breach.';
  }

  private startGame(): void {
    this.state = GameState.PLAYING;
    this.round = 1;
    this.health = 100;
    this.score = 0;
    this.currency = 0;
    this.weapon = new Weapon({
      id: 'ranger-9',
      name: 'Ranger-9',
      damage: 22,
      fireRate: 7,
      magazineSize: 24,
      reserveAmmo: 120,
      reloadTime: 1.5,
      spread: 0.02,
      recoil: 0.08,
      range: 35,
      automatic: true,
      cost: 0,
    });
    this.player = new PlayerController();
    this.zombies = [];
    this.menuOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.startRound();
    this.renderer.domElement.requestPointerLock();
    this.updateHud();
  }

  public resumeGame(): void {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.pauseOverlay.classList.add('hidden');
      this.renderer.domElement.requestPointerLock();
    }
  }

  public pauseGame(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.pauseOverlay.classList.remove('hidden');
      document.exitPointerLock();
      this.pointerLocked = false;
    }
  }

  private startRound(): void {
    const enemyCount = 6 + this.round * 2;
    this.enemiesRemaining = enemyCount;
    this.spawnTimer = 0.25;
    this.zombies = [];

    for (const child of Array.from(this.scene.children)) {
      if ((child as THREE.Mesh).userData.zombie) {
        this.scene.remove(child);
      }
    }

    this.updateHud();
  }

  private fire(): void {
    if (!this.weapon.fire()) {
      return;
    }

    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    this.camera.getWorldDirection(direction);

    const raycaster = new THREE.Raycaster(origin, direction, 0, this.weapon.config.range);
    const hitTargets: Zombie[] = [];

    for (const zombie of this.zombies) {
      if (zombie.alive) {
        const hit = raycaster.intersectObject(zombie.mesh, true)[0];
        if (hit) {
          hitTargets.push(zombie);
        }
      }
    }

    if (hitTargets.length > 0) {
      const target = hitTargets.sort(
        (a, b) => a.mesh.position.distanceTo(this.player.position) - b.mesh.position.distanceTo(this.player.position),
      )[0];
      const headshot = target.mesh.position.y + 0.7 < this.camera.position.y + 0.2;
      const damage = this.weapon.config.damage * (headshot ? 2.1 : 1);
      target.applyDamage(damage, headshot);
      this.score += headshot ? 150 : 80;
      this.currency += headshot ? 12 : 8;

      if (!target.alive) {
        this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);
        this.score += 200;
        this.currency += 25;
      }
    }

    this.updateHud();
  }

  private spawnZombie(): void {
    if (this.enemiesRemaining <= 0) {
      return;
    }

    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let z = 0;

    if (side === 0) {
      x = -18 + Math.random() * 36;
      z = -18;
    } else if (side === 1) {
      x = 18;
      z = -18 + Math.random() * 36;
    } else if (side === 2) {
      x = -18 + Math.random() * 36;
      z = 18;
    } else {
      x = -18;
      z = -18 + Math.random() * 36;
    }

    const variant = this.round > 5 && Math.random() < 0.25 ? 'brute' : this.round > 3 && Math.random() < 0.2 ? 'runner' : 'walker';
    const zombie = new Zombie(new THREE.Vector3(x, 1.2, z), variant);
    this.scene.add(zombie.mesh);
    this.zombies.push(zombie);
    this.enemiesRemaining -= 1;
  }

  private updateZombies(delta: number): void {
    for (const zombie of this.zombies) {
      if (!zombie.alive) {
        continue;
      }

      zombie.update(delta, this.player.position);

      const distance = zombie.mesh.position.distanceTo(this.player.position);
      if (distance < 1.8 && zombie.attackCooldown <= 0) {
        this.health = Math.max(0, this.health - zombie.damage);
        zombie.attackCooldown = 1.1;

        if (this.health <= 0) {
          this.state = GameState.GAME_OVER;
          this.menuOverlay.classList.remove('hidden');
          this.overlayTitle.textContent = 'RUN ENDED';
          this.overlayMessage.textContent = `Round ${this.round} • Score ${this.score} • Credits ${this.currency}`;
          this.playButton.textContent = 'PLAY AGAIN';
          this.pauseOverlay.classList.add('hidden');
          return;
        }
      }
    }

    this.zombies = this.zombies.filter((zombie) => zombie.alive);
    this.updateHud();
  }

  public update(delta: number): void {
    if (this.state === GameState.MAIN_MENU || this.state === GameState.GAME_OVER || this.state === GameState.PAUSED) {
      return;
    }

    this.player.update(delta, this.keys);
    this.weapon.update(delta);

    this.camera.position.set(this.player.position.x, this.player.position.y + 0.1, this.player.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && this.enemiesRemaining > 0 && this.zombies.length < 10) {
      this.spawnZombie();
      this.spawnTimer = Math.max(0.4, 1.4 - this.round * 0.08);
    }

    this.updateZombies(delta);

    if (this.enemiesRemaining <= 0 && this.zombies.length === 0) {
      this.round += 1;
      this.startRound();
      this.currency += 50;
      this.health = Math.min(100, this.health + 20);
      this.state = GameState.ROUND_COMPLETE;
      this.hud.status.textContent = `ROUND COMPLETE • +${Math.max(50, this.round * 25)}`;
      this.updateHud();
    }

    this.updateHud();
  }

  private updateHud(): void {
    this.hud.setRound(this.round);
    this.hud.setHealth(this.health);
    this.hud.setAmmo(this.weapon.currentAmmo, this.weapon.reserveAmmo);
    this.hud.setEnemies(this.zombies.length + this.enemiesRemaining);
    this.hud.setCurrency(this.currency);
    this.hud.setScore(this.score);
    this.hud.setWeapon(this.weapon.config.name);
    this.hud.setStatus(
      this.state === GameState.PLAYING ? 'SURVIVE' :
      this.state === GameState.MAIN_MENU ? 'READY' :
      this.state === GameState.GAME_OVER ? 'RUN ENDED' :
      this.state,
    );
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
