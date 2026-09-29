import * as THREE from 'three';
import { HUD } from '../ui/HUD';
import { GameState } from './GameState';
import { PlayerController } from './PlayerController';
import { Weapon } from '../weapons/Weapon';
import { Zombie } from '../zombies/Zombie';

const WEAPON = {
  id: 'ranger-9',
  name: 'Ranger-9',
  damage: 22,
  fireRate: 7,
  magazineSize: 24,
  reserveAmmo: 120,
  reloadTime: 1.5,
  spread: 0.02,
  recoil: 0.06,
  range: 35,
  automatic: true,
  cost: 0,
};

export class Game {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public raycaster: THREE.Raycaster;
  public player: PlayerController;
  public hud: HUD;
  public state: GameState;
  public weapon: Weapon;
  public zombies: Zombie[] = [];
  public keys = new Set<string>();
  public pointerLocked = false;
  public round = 1;
  public score = 0;
  public currency = 0;
  public health = 100;
  public enemiesRemaining = 0;
  public spawnTimer = 0;
  public spawnCountdown = 0;
  public roundStarted = false;

  constructor() {
    this.state = GameState.MAIN_MENU;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1018);
    this.scene.fog = new THREE.Fog(0x0a1018, 8, 42);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.7, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.player = new PlayerController();
    this.weapon = new Weapon(WEAPON);
    this.hud = new HUD();

    this.buildEnvironment();
    this.bindInput();
    this.startRound();
  }

  private buildEnvironment() {
    const ambient = new THREE.AmbientLight(0x88a1b8, 1.4);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xe7d7b5, 1.8);
    keyLight.position.set(6, 12, 3);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(48, 1, 48),
      new THREE.MeshStandardMaterial({ color: 0x212b34, roughness: 0.95, metalness: 0.18 }),
    );
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const lab = new THREE.Mesh(
      new THREE.BoxGeometry(20, 7, 14),
      new THREE.MeshStandardMaterial({ color: 0x2a3139, roughness: 0.8 }),
    );
    lab.position.set(0, 3.5, 0);
    lab.castShadow = true;
    lab.receiveShadow = true;
    this.scene.add(lab);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3d454f, roughness: 0.9 });
    const walls = [
      { pos: [0, 3, -7.2], size: [20, 6, 0.8] },
      { pos: [0, 3, 7.2], size: [20, 6, 0.8] },
      { pos: [-9.6, 3, 0], size: [0.8, 6, 14] },
      { pos: [9.6, 3, 0], size: [0.8, 6, 14] },
    ];

    for (const wall of walls) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]), wallMaterial);
      mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    const redLight = new THREE.PointLight(0xff5b4d, 3, 12, 1.8);
    redLight.position.set(0, 5, 0);
    this.scene.add(redLight);
  }

  private bindInput() {
    document.addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      if (event.code === 'KeyR') {
        this.weapon.beginReload();
      }
      if (event.code === 'Escape') {
        document.exitPointerLock();
        this.pointerLocked = false;
      }
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.player.isSprinting = true;
      }
      if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
        this.player.isCrouching = true;
      }
      if (event.code === 'Space') {
        if (this.player.onGround) {
          this.player.velocity.y = 5.8;
          this.player.onGround = false;
        }
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.player.isSprinting = false;
      }
      if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
        this.player.isCrouching = false;
      }
    });

    document.addEventListener('mousedown', () => {
      if (!this.pointerLocked) {
        this.renderer.domElement.requestPointerLock();
      } else {
        this.fire();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    });

    document.addEventListener('mousemove', (event) => {
      if (this.pointerLocked) {
        this.player.handlePointerMove(event.movementX, event.movementY);
      }
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public startRound() {
    this.roundStarted = true;
    this.spawnCountdown = 0.4;
    const total = 6 + this.round * 2;
    this.enemiesRemaining = total;
    this.zombies = [];

    for (let i = 0; i < total; i += 1) {
      const variant = i % 8 === 0 ? 'runner' : i % 10 === 0 ? 'brute' : i % 6 === 0 ? 'screamer' : 'walker';
      const spawnPos = new THREE.Vector3(
        (Math.random() - 0.5) * 24,
        1.2,
        (Math.random() - 0.5) * 24,
      );
      const zombie = new Zombie(spawnPos, variant);
      this.scene.add(zombie.mesh);
      this.zombies.push(zombie);
    }
  }

  private fire() {
    if (!this.weapon.fire()) {
      return;
    }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits: THREE.Intersection[] = [];
    this.zombies.forEach((zombie) => {
      if (zombie.alive) {
        const hit = this.raycaster.intersectObject(zombie.mesh, true)[0];
        if (hit) {
          hits.push(hit);
        }
      }
    });

    if (hits.length > 0) {
      hits.sort((a, b) => a.distance - b.distance);
      const target = hits[0].object;
      const zombie = this.zombies.find((entry) => entry.mesh === target.parent || entry.mesh === target || entry.mesh === target.parent?.parent);
      if (zombie) {
        const headshot = hits[0].point.y > zombie.mesh.position.y + 0.9;
        const damage = this.weapon.config.damage * (headshot ? 2.1 : 1);
        zombie.applyDamage(damage, headshot);
        this.score += headshot ? 150 : 75;
        this.currency += headshot ? 12 : 8;
        if (!zombie.alive) {
          this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);
          this.score += 200;
          this.currency += 20;
        }
      }
    }
    this.hud.update(this.round, this.health, this.score, this.currency, this.weapon.getLabel(), this.weapon.currentAmmo, this.weapon.reserveAmmo, this.enemiesRemaining, '');
  }

  private updateZombies(delta: number) {
    for (const zombie of this.zombies) {
      if (!zombie.alive) continue;
      zombie.update(delta, this.player.position.clone());

      const distance = zombie.mesh.position.distanceTo(this.player.position);
      if (distance < 1.7 && zombie.attackCooldown <= 0) {
        this.health = Math.max(0, this.health - zombie.damage);
        zombie.attackCooldown = 1.1;
        if (this.health <= 0) {
          this.state = GameState.GAME_OVER;
        }
      }
    }

    this.zombies = this.zombies.filter((zombie) => zombie.alive);
    this.scene.children = this.scene.children.filter((child) => !(child instanceof THREE.Group && child.userData.zombie === true));
  }

  public update(delta: number) {
    this.player.update(delta, this.keys);
    this.weapon.update(delta);

    this.camera.position.set(this.player.position.x, this.player.position.y + 0.1, this.player.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    if (this.state === GameState.GAME_OVER) {
      return;
    }

    if (this.roundStarted) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0 && this.enemiesRemaining > 0) {
        const spawnPos = new THREE.Vector3(
          (Math.random() - 0.5) * 18,
          1.2,
          (Math.random() - 0.5) * 18,
        );
        const variant = this.round > 4 && Math.random() < 0.25 ? 'brute' : Math.random() < 0.2 ? 'runner' : 'walker';
        const zombie = new Zombie(spawnPos, variant); 
        this.scene.add(zombie.mesh);
        this.zombies.push(zombie);
        this.spawnTimer = Math.max(0.5, 1.8 - this.round * 0.09);
      }
    }

    if (this.enemiesRemaining <= 0 && this.zombies.length === 0) {
      this.round += 1;
      this.startRound();
    }

    this.updateZombies(delta);
    this.hud.update(this.round, this.health, this.score, this.currency, this.weapon.getLabel(), this.weapon.currentAmmo, this.weapon.reserveAmmo, this.enemiesRemaining, this.state);
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }
}
