import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Zombie {
    constructor(scene) {
        this.scene = scene;
        this.container = new THREE.Group();
        this.scene.add(this.container);

        this.mixer = null;
        this.model = null;
        this.hitbox = new THREE.Box3();

        this.hitboxHelper = new THREE.Box3Helper(this.hitbox, 0xff0000);
        scene.add(this.hitboxHelper);

        this.loader = new GLTFLoader();
        this.loader.load(
            '/animated_zombie_cop_running_loop/scene.gltf',
            (gltf) => {
                this.model = gltf.scene;

                this.container.add(this.model);

                this.mixer = new THREE.AnimationMixer(this.model);
                const action = this.mixer.clipAction(gltf.animations[0]);
                action.play();

            }
        );
    }

    update(dt) {
        if (this.mixer) this.mixer.update(dt);

        if (this.model) {
            const pos = new THREE.Vector3();
            this.model.getWorldPosition(pos);
            const size = new THREE.Vector3(0.5, 2.8, 1);
            this.hitbox.setFromCenterAndSize(
                pos.clone().add(new THREE.Vector3(0, size.y / 2, 0)),
                size
            );
        }
    }
}
