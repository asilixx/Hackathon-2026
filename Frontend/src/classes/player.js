import * as THREE from "three";
import { getDirection } from "three/tsl";

export class Player {
  constructor(camera, scene, collisionManager, controls) {
    this.controls = controls;
    this.camera = camera;
    this.collisionManager = collisionManager;
    this.playerDirection = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.PlayerSpeedFoward = 0;
    this.PlayerSpeedRight = 0;
    this.PlayerSpeed = 5;
    this.PlayerHitBox = new THREE.Box3(); 
    this.velocityY = 0;
    this.Gravity = 7;
    this.onGround = false;

    this.hitbox = new THREE.Box3Helper(this.PlayerHitBox, 0xffff00);
    scene.add(this.hitbox);

    document.body.addEventListener("click", () => this.controls.lock());

    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW": this.PlayerSpeedFoward = 1; break;
        case "KeyA": this.PlayerSpeedRight = -1; break;
        case "KeyD": this.PlayerSpeedRight = 1; break;
        case "KeyS": this.PlayerSpeedFoward = -1; break;
        case "Space": if (this.onGround) {
          this.velocityY = 3.5; 
          this.onGround = false;
        }
        break;
      }
    });

    document.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW": this.PlayerSpeedFoward = 0; break;
        case "KeyA": this.PlayerSpeedRight = 0; break;
        case "KeyD": this.PlayerSpeedRight = 0; break;
        case "KeyS": this.PlayerSpeedFoward = 0; break;
      }
    });
  }

  update(dt, lastRenderTime) {
    this.controls.getDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();

    const previousPosition = this.camera.position.clone();

    this.camera.position.addScaledVector(this.playerDirection, this.PlayerSpeedFoward * this.PlayerSpeed * dt);
    this.right.crossVectors(this.playerDirection, this.camera.up).normalize();
    this.camera.position.addScaledVector(this.right, this.PlayerSpeedRight * this.PlayerSpeed * dt);


    this.PlayerHitBox.setFromCenterAndSize(
      this.camera.position,
      new THREE.Vector3(1, 2, 1)
    );

    if (this.collisionManager.check(this.PlayerHitBox)) {
      this.camera.position.copy(previousPosition);
      this.PlayerHitBox.setFromCenterAndSize(
        this.camera.position,
        new THREE.Vector3(1, 2, 1)
      );
    }
      this.velocityY -= this.Gravity * dt;
      this.camera.position.y += this.velocityY * dt;

    if (this.camera.position.y < 2.7) {
      this.camera.position.y = 2.7;
      this.velocityY = 0;
      this.onGround = true;
    }
    // console.log("playerHitBox:", this.PlayerHitBox);
  }
}