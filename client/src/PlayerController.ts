import * as THREE from 'three';

export class PlayerController {
    camera: THREE.PerspectiveCamera;
    velocity: THREE.Vector3;
    direction: THREE.Vector3;
    moveSpeed: number;
    lookSpeed: number;
    euler: THREE.Euler;
    isLocked: boolean;
    
    // Состояние клавиш
    keys: { [key: string]: boolean } = {};
    
    constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 5.0;
        this.lookSpeed = 0.002;
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.isLocked = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Управление мышью
        document.addEventListener('mousemove', (event) => {
            if (!this.isLocked) return;
            
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            this.euler.setFromQuaternion(this.camera.quaternion);
            this.euler.y -= movementX * this.lookSpeed;
            this.euler.x -= movementY * this.lookSpeed;
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            
            this.camera.quaternion.setFromEuler(this.euler);
        });
        
        // Блокировка курсора
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === document.querySelector('canvas');
        });
        
        // Управление клавиатурой
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
    }
    
    update(deltaTime: number) {
        if (!this.isLocked) return;
        
        // Сброс направления
        this.direction.set(0, 0, 0);
        
        // WASD управление
        if (this.keys['KeyW']) this.direction.z += 1;
        if (this.keys['KeyS']) this.direction.z -= 1;
        if (this.keys['KeyA']) this.direction.x -= 1;
        if (this.keys['KeyD']) this.direction.x += 1;
        
        // Нормализация направления
        if (this.direction.length() > 0) {
            this.direction.normalize();
        }
        
        // Применение направления относительно взгляда камеры
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();
        
        // Расчет скорости
        this.velocity.set(0, 0, 0);
        this.velocity.add(forward.clone().multiplyScalar(this.direction.z * this.moveSpeed * deltaTime));
        this.velocity.add(right.clone().multiplyScalar(this.direction.x * this.moveSpeed * deltaTime));
        
        // Перемещение камеры
        this.camera.position.add(this.velocity);
    }
    
    getPosition(): THREE.Vector3 {
        return this.camera.position;
    }
    
    getRotation(): THREE.Euler {
        return this.euler;
    }
}