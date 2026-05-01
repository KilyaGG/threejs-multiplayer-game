import CANNON from 'cannon';
import { MapData, CollisionBox, SpawnPoint } from './ServerTechnicals.js';

export class MapManager {
    private world: CANNON.World;
    private groundMaterial: CANNON.Material;
    private collisionBodies: CANNON.Body[] = [];
    private spawnPoints: SpawnPoint[] = [];
    private currentMap: MapData | null = null;
    
    constructor(world: CANNON.World) {
        this.world = world;
    }
    
    loadMap(mapData: MapData, groundMaterial: CANNON.Material): void {
        console.log(`Loading map: ${mapData.name} v${mapData.version}`);
        
        // Очищаем предыдущую карту
        this.clearMap();
        
        this.currentMap = mapData;
        
        // Создаем коллизии
        this.createCollisions(mapData.collisionBoxes, groundMaterial);

        this.createCollisions(mapData.collisionBoxes, groundMaterial);
    
        if (mapData.boundaries) {
            this.createBoundaries(mapData.boundaries, groundMaterial);
        }
        
        // Сохраняем точки спавна
        this.spawnPoints = mapData.spawnPoints || [];
        
        // Создаем границы карты (невидимые стены)
        if (mapData.boundaries) {
            this.createBoundaries(mapData.boundaries, groundMaterial);
        }
        
        // Создаем зоны смерти
        if (mapData.deathZones) {
            this.createDeathZones(mapData.deathZones);
        }
        
        console.log(`Loaded ${this.collisionBodies.length} collision bodies`);
    }
    
    private createCollisions(boxes: CollisionBox[], groundMaterial: CANNON.Material): void {
        
        for (const box of boxes) {
            const shape = new CANNON.Box(new CANNON.Vec3(
                box.size.width / 2,
                box.size.height / 2,
                box.size.depth / 2
            ));
            
        const body = new CANNON.Body({
            mass: 0,
            shape: shape,
            material: groundMaterial, // ИСПОЛЬЗУЕМ ПЕРЕДАННЫЙ МАТЕРИАЛ
            collisionFilterGroup: 1,
            collisionFilterMask: 2 | 4
        });
            
            body.position.set(
                box.position.x,
                box.position.y,
                box.position.z
            );
            
            // Применяем вращение если есть
            if (box.rotation) {
                const euler = new CANNON.Vec3(
                    box.rotation.x * Math.PI / 180,
                    box.rotation.y * Math.PI / 180,
                    box.rotation.z * Math.PI / 180
                );
                body.quaternion.setFromEuler(euler.x, euler.y, euler.z, 'XYZ');
            }
            
            (this.world as any).addBody(body);
            this.collisionBodies.push(body);
        }
    }
    
    private createBoundaries(boundaries: MapData['boundaries'], groundMaterial: CANNON.Material): void {
        if (!boundaries) return;
        
        // Создаем 4 стены по границам
        const thickness = 1;
        const min = boundaries.min;
        const max = boundaries.max;
        
        // Пол
        const floorShape = new CANNON.Box(new CANNON.Vec3(
            (max.x - min.x) / 2,
            0.5,
            (max.z - min.z) / 2
        ));
        const floor = new CANNON.Body({
            mass: 0,
            shape: floorShape,
            material: groundMaterial,
            collisionFilterGroup: 1,
            collisionFilterMask: 2
        });
        floor.position.set(
            (min.x + max.x) / 2,
            min.y - 0.5,
            (min.z + max.z) / 2
        );
        (this.world as any).addBody(floor);
        this.collisionBodies.push(floor);
    }
    
    private createDeathZones(zones: CollisionBox[]): void {
        // Создаем триггер-зоны для смерти (без физического тела)
        // Можно реализовать через проверку позиции игрока каждый тик
        console.log(`Created ${zones.length} death zones`);
    }
    
    clearMap(): void {
        for (const body of this.collisionBodies) {
            (this.world as any).removeBody(body);
        }
        this.collisionBodies = [];
        this.spawnPoints = [];
        this.currentMap = null;
    }
    
    getSpawnPoint(index: number): { x: number; y: number; z: number } | null {
        if (this.spawnPoints.length === 0) {
            // Если нет точек спавна, возвращаем позицию по умолчанию
            return { x: 0, y: 1, z: 0 };
        }
        
        // Выбираем точку спавна по кругу
        const spawnIndex = index % this.spawnPoints.length;
        const spawn = this.spawnPoints[spawnIndex];
        
        return {
            x: spawn.position.x,
            y: spawn.position.y,
            z: spawn.position.z
        };
    }
    
    getSpawnPoints(): SpawnPoint[] {
        return this.spawnPoints;
    }
    
    getMapData(): MapData | null {
        return this.currentMap;
    }
}