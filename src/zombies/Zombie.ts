import * as THREE from 'three';

export class Zombie {
  public mesh: THREE.Group;
  public health: number;
  public speed: number;
  public damage: number;
  public radius: number;
  public alive: boolean;
  public attackCooldown: number;
  public isScreamer: boolean;

  constructor(position: THREE.Vector3, variant: 'walker' | 'runner' | 'brute' | 'screamer' = 'walker') {
    this.alive = true;
    this.attackCooldown = 0;
    this.isScreamer = variant === 'screamer';

    if (variant === 'runner') {
      this.health = 30;
      this.speed = 3.6;
      this.damage = 7;
      this.radius = 0.6;
    } else if (variant === 'brute') {
      this.health = 160;
      this.speed = 1.8;
      this.damage = 18;
      this.radius = 0.9;
    } else if (variant === 'screamer') {
      this.health = 50;
      this.speed = 2.5;
      this.damage = 9;
      this.radius = 0.7;
    } else {
      this.health = 60;
      this.speed = 2.4;
      this.damage = 12;
      this.radius = 0.7;
    }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: variant === 'brute' ? 0x4d7c5d : variant === 'runner' ? 0x8eb769 : variant === 'screamer' ? 0x755ad0 : 0x7ca66b,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.3, 3, 8), bodyMaterial);
    body.castShadow = true;
    body.rotation.z = Math.PI / 2;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd7d8c6, roughness: 1 }),
    );
    head.position.y = 1.1;

    this.mesh.add(body, head);
    this.mesh.position.copy(position);
    this.mesh.position.y = 1.2;
  }

  public applyDamage(amount: number, headshot = false) {
    this.health -= amount;
    const flash = new THREE.Color(headshot ? 0xffdd99 : 0xff6666);
    const material = this.mesh.children[0] as THREE.Mesh;
    const mat = material.material as THREE.MeshStandardMaterial;
    mat.emissive = flash;
    mat.emissiveIntensity = 0.25;
    if (this.health <= 0) {
      this.alive = false;
      this.mesh.visible = false;
    }
  }

  public update(delta: number, target: THREE.Vector3) {
    if (!this.alive) {
      return;
    }

    const vectorToTarget = target.clone().sub(this.mesh.position);
    const distance = vectorToTarget.length();
    vectorToTarget.normalize();
    const forward = new THREE.Vector3(vectorToTarget.x, 0, vectorToTarget.z);

    if (forward.lengthSq() > 0.01) {
      this.mesh.position.x += forward.x * this.speed * delta;
      this.mesh.position.z += forward.z * this.speed * delta;
      this.mesh.rotation.y = Math.atan2(forward.x, forward.z);
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    if (distance < 1.8) {
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1.1;
      }
    }
  }
}
