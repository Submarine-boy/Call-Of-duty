import * as THREE from 'three';

export type ZombieVariant = 'walker' | 'runner' | 'brute' | 'screamer';

export class Zombie {
  public mesh: THREE.Group;
  public health: number;
  public speed: number;
  public damage: number;
  public alive: boolean;
  public attackCooldown: number;
  public variant: ZombieVariant;

  constructor(position: THREE.Vector3, variant: ZombieVariant = 'walker') {
    this.variant = variant;
    this.alive = true;
    this.attackCooldown = 0;

    if (variant === 'runner') {
      this.health = 36;
      this.speed = 3.5;
      this.damage = 8;
    } else if (variant === 'brute') {
      this.health = 140;
      this.speed = 1.7;
      this.damage = 18;
    } else if (variant === 'screamer') {
      this.health = 50;
      this.speed = 2.6;
      this.damage = 10;
    } else {
      this.health = 62;
      this.speed = 2.3;
      this.damage = 12;
    }

    const bodyColor = variant === 'runner' ? 0x9fd36d : variant === 'brute' ? 0x5f7f63 : variant === 'screamer' ? 0x7e6ad8 : 0x7aa56a;

    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 1.3, 4, 8),
      new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.9, metalness: 0.1 }),
    );
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xdad7c5, roughness: 1 }),
    );
    head.position.y = 1.05;

    this.mesh.add(body, head);
    this.mesh.position.copy(position);
    this.mesh.userData.zombie = true;
  }

  public applyDamage(amount: number, headshot = false): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
      this.mesh.visible = false;
    }
    const material = (this.mesh.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    material.emissive = new THREE.Color(headshot ? 0xffde99 : 0xff6d5a);
    material.emissiveIntensity = 0.3;
  }

  public update(delta: number, target: THREE.Vector3): void {
    if (!this.alive) {
      return;
    }

    const toTarget = target.clone().sub(this.mesh.position);
    const distance = toTarget.length();
    toTarget.normalize();

    const move = new THREE.Vector3(toTarget.x, 0, toTarget.z);
    if (move.lengthSq() > 0.01) {
      this.mesh.position.x += move.x * this.speed * delta;
      this.mesh.position.z += move.z * this.speed * delta;
      this.mesh.rotation.y = Math.atan2(move.x, move.z);
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    if (distance < 1.5) {
      this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -16, 16);
      this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -16, 16);
    }
  }
}
