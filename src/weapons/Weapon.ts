import * as THREE from 'three';

export class PlayerController {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public yaw: number;
  public pitch: number;
  public onGround: boolean;
  public isSprinting: boolean;
  public isCrouching: boolean;
  public sensitivity: number;

  constructor() {
    this.position = new THREE.Vector3(0, 1.7, 10);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = true;
    this.isSprinting = false;
    this.isCrouching = false;
    this.sensitivity = 0.0022;
  }

  public handlePointerMove(dx: number, dy: number): void {
    this.yaw -= dx * this.sensitivity;
    this.pitch -= dy * this.sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.45, 1.45);
  }

  public update(delta: number, keys: Set<string>): void {
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    if (keys.has('KeyW')) moveDir.add(forward);
    if (keys.has('KeyS')) moveDir.sub(forward);
    if (keys.has('KeyA')) moveDir.sub(right);
    if (keys.has('KeyD')) moveDir.add(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    const movementSpeed = this.isSprinting ? 8.2 : this.isCrouching ? 2.5 : 5.3;
    this.velocity.x = moveDir.x * movementSpeed;
    this.velocity.z = moveDir.z * movementSpeed;

    if (!this.onGround) {
      this.velocity.y -= 18 * delta;
    } else {
      this.velocity.y = Math.min(this.velocity.y, 0);
    }

    this.position.addScaledVector(this.velocity, delta);
    this.position.x = THREE.MathUtils.clamp(this.position.x, -16, 16);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -16, 16);

    if (this.position.y <= 1.7) {
      this.position.y = 1.7;
      this.onGround = true;
    }
  }
}
