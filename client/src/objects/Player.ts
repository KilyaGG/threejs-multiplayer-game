import * as THREE from 'three';

export class Player {
    mesh: THREE.Group; // Изменено на Group для гибкости

    constructor(color: number = 0x00ff00, name: string) {
        this.mesh = new THREE.Group();
        
        // Временная модель куба
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.y = 0.5;
        this.mesh.add(cube);
        
        this.createTextLabel(name);
    }
    
    // Метод для будущей замены модели
    setModel(model: THREE.Object3D) {
        // Удаляем старую модель
        while(this.mesh.children.length > 0) {
            const child = this.mesh.children[0];
            if (child instanceof THREE.Sprite) {
                // Оставляем метку с именем
                break;
            }
            this.mesh.remove(child);
        }
        
        // Добавляем новую модель
        model.position.set(0, 0.5, 0); // Поднимаем модель выше
        this.mesh.add(model);
    }

    createTextLabel(name: string) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 256;
        canvas.height = 64;
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(name, 128, 48);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        sprite.position.y = 2; // Над игроком
        sprite.scale.set(2, 0.5, 1);
        
        this.mesh.add(sprite);
    }

    setPosition(position: any) {
        if (position.x !== undefined) {
            this.mesh.position.set(position.x, position.y || 0, position.z || 0);
        } else {
            this.mesh.position.copy(position);
        }
    }
}