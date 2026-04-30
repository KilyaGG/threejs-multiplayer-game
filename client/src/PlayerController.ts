import * as THREE from 'three';

export class PlayerController {
    camera: THREE.PerspectiveCamera;
    direction: THREE.Vector3;
    lookSpeed: number;
    euler: THREE.Euler;
    isLocked: boolean;
    room: any;
    
    keys: { [key: string]: boolean } = {};
    canJump: boolean = true;
    jumpCooldown: number = 0.5;
    lastJumpTime: number = 0;
    
    // Интерполяция
    previousPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    interpolationFactor: number = 0;
    readonly INTERPOLATION_SPEED = 10; // Скорость интерполяции
    
    constructor(camera: THREE.PerspectiveCamera, room: any) {
        this.camera = camera;
        this.room = room;
        this.direction = new THREE.Vector3();
        this.lookSpeed = 0.002;
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.isLocked = false;
        
        this.previousPosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
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
        
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === document.querySelector('canvas');
        });
        
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            if (event.code === 'Space') {
                event.preventDefault();
                this.jump();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
    }
    
    jump() {
        const now = performance.now() / 1000;
        
        if (this.canJump && (now - this.lastJumpTime) > this.jumpCooldown) {
            if (this.room) {
                this.room.send('jump', {});
                this.lastJumpTime = now;
            }
        }
    }
    
    update(deltaTime: number) {
        if (!this.isLocked) return;
        
        // Вычисляем направление движения
        this.direction.set(0, 0, 0);
        
        if (this.keys['KeyW']) this.direction.z += 1;
        if (this.keys['KeyS']) this.direction.z -= 1;
        if (this.keys['KeyA']) this.direction.x -= 1;
        if (this.keys['KeyD']) this.direction.x += 1;
        
        if (this.direction.length() > 0) {
            this.direction.normalize();
        }
        
        // Преобразуем направление относительно камеры
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();
        
        const moveDirection = new THREE.Vector3();
        moveDirection.add(forward.clone().multiplyScalar(this.direction.z));
        moveDirection.add(right.clone().multiplyScalar(this.direction.x));
        
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }
        
        // Отправляем направление на сервер
        if (this.room) {
            this.room.send('updatePosition', {
                direction: {
                    x: moveDirection.x,
                    y: 0,
                    z: moveDirection.z
                }
            });
        }
    }
    
    // Установка новой целевой позиции от сервера
    setServerPosition(x: number, y: number, z: number) {
        // Сохраняем текущую позицию как предыдущую
        this.previousPosition.copy(this.camera.position);
        
        // Устанавливаем новую целевую позицию
        this.targetPosition.set(x, y + 0.9, z); // +0.9 для высоты глаз
        
        // Сбрасываем фактор интерполяции
        this.interpolationFactor = 0;
    }
    
    // Интерполяция между предыдущей и целевой позицией
    interpolate(deltaTime: number) {
        if (this.interpolationFactor < 1.0) {
            // Увеличиваем фактор интерполяции
            this.interpolationFactor += deltaTime * this.INTERPOLATION_SPEED;
            
            if (this.interpolationFactor > 1.0) {
                this.interpolationFactor = 1.0;
            }
            
            // Применяем сглаживание (ease-out)
            const t = this.smoothStep(this.interpolationFactor);
            
            // Интерполируем позицию
            this.camera.position.lerpVectors(
                this.previousPosition,
                this.targetPosition,
                t
            );
        }
    }
    
    // Функция сглаживания для более плавного движения
    smoothStep(t: number): number {
        return t * t * (3 - 2 * t);
    }
    
    getPosition(): THREE.Vector3 {
        return this.camera.position;
    }
    
    getRotation(): THREE.Euler {
        return this.euler;
    }
}