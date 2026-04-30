import * as THREE from 'three';

export class Player {
    mesh: THREE.Mesh;

    constructor(color: number = 0x00ff00, name: string) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.createTextLabel(name);
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
        
        sprite.position.y = 1.5; // Чуть выше кубика
        sprite.scale.set(2, 0.5, 1);
        
        this.mesh.add(sprite); // Привязываем к мешу игрока
    }

    setPosition(position: THREE.Vector3) {
        this.mesh.position.set(position.x, position.y, position.z);
    }
}
