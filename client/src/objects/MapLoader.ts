import * as THREE from 'three';
import { Techs } from './Technical';

export interface MapConfig {
    name: string;
    modelPath: string;        // Путь к 3D модели
    collisionData?: any;       // Данные коллизий (если нужны на клиенте)
    spawnPoints: Array<{       // Точки спавна для визуализации
        position: { x: number; y: number; z: number };
        rotation?: { x: number; y: number; z: number };
    }>;
    environment?: {            // Настройки окружения
        skyboxPath?: string;
        ambientLight?: {
            color: number;
            intensity: number;
        };
        directionalLight?: {
            color: number;
            intensity: number;
            position: { x: number; y: number; z: number };
        };
        fog?: {
            color: number;
            density: number;
        };
    };
    props?: Array<{            // Дополнительные объекты на карте
        modelPath: string;
        position: { x: number; y: number; z: number };
        rotation?: { x: number; y: number; z: number };
        scale?: { x: number; y: number; z: number };
    }>;
}

export class MapLoader {
    private scene: THREE.Scene;
    private loadedObjects: THREE.Object3D[] = [];
    private currentMap: MapConfig | null = null;
    private spawnMarkers: THREE.Mesh[] = [];
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }
    
    /**
     * Загружает карту по конфигу
     */
    async loadMap(mapConfig: MapConfig): Promise<void> {
        console.log(`Loading map: ${mapConfig.name}`);
        
        // Очищаем предыдущую карту
        this.clearMap();
        
        this.currentMap = mapConfig;
        
        try {
            // Загружаем основную модель карты
            const mapModel = await Techs.loadModel(mapConfig.modelPath);
            this.scene.add(mapModel);
            this.loadedObjects.push(mapModel);
            
            // Настраиваем тени для всех объектов карты
            mapModel.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Загружаем пропсы (дополнительные объекты)
            if (mapConfig.props) {
                await this.loadProps(mapConfig.props);
            }
            
            // Создаем маркеры точек спавна (для отладки)
            if (mapConfig.spawnPoints) {
                this.createSpawnMarkers(mapConfig.spawnPoints);
            }
            
            // Настраиваем окружение
            if (mapConfig.environment) {
                this.setupEnvironment(mapConfig.environment);
            }
            
            console.log(`Map ${mapConfig.name} loaded successfully`);
            
        } catch (error) {
            console.error(`Failed to load map ${mapConfig.name}:`, error);
            throw error;
        }
    }
    
    /**
     * Загружает дополнительные пропсы на карту
     */
    private async loadProps(props: MapConfig['props']): Promise<void> {
        if (!props) return;
        
        for (const prop of props) {
            try {
                const model = await Techs.loadModel(prop.modelPath);
                
                model.position.set(
                    prop.position.x,
                    prop.position.y,
                    prop.position.z
                );
                
                if (prop.rotation) {
                    model.rotation.set(
                        prop.rotation.x * Math.PI / 180,
                        prop.rotation.y * Math.PI / 180,
                        prop.rotation.z * Math.PI / 180
                    );
                }
                
                if (prop.scale) {
                    model.scale.set(
                        prop.scale.x,
                        prop.scale.y,
                        prop.scale.z
                    );
                }
                
                // Настраиваем тени
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                this.scene.add(model);
                this.loadedObjects.push(model);
                
            } catch (error) {
                console.error(`Failed to load prop ${prop.modelPath}:`, error);
            }
        }
    }
    
    /**
     * Создает визуальные маркеры точек спавна
     */
    private createSpawnMarkers(spawnPoints: MapConfig['spawnPoints']): void {
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });
        const markerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        
        for (const spawn of spawnPoints) {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(
                spawn.position.x,
                spawn.position.y,
                spawn.position.z
            );
            
            // Добавляем стрелку направления если есть rotation
            if (spawn.rotation) {
                const arrowGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
                const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
                arrow.position.y = 0.2;
                arrow.rotation.set(
                    spawn.rotation.x * Math.PI / 180,
                    spawn.rotation.y * Math.PI / 180,
                    spawn.rotation.z * Math.PI / 180
                );
                marker.add(arrow);
            }
            
            this.scene.add(marker);
            this.spawnMarkers.push(marker);
        }
    }
    
    /**
     * Настраивает освещение и окружение
     */
    private setupEnvironment(env: MapConfig['environment']): void {
        if (!env) return;
        
        // Загружаем скайбокс
        if (env.skyboxPath) {
            const loader = new THREE.TextureLoader();
            loader.load(env.skyboxPath, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.scene.background = texture;
            });
        }
        
        // Настраиваем туман
        if (env.fog) {
            this.scene.fog = new THREE.FogExp2(env.fog.color, env.fog.density);
        }
        
        // Освещение уже есть в сцене, но можно обновить параметры
        // Здесь можно добавить логику обновления существующего освещения
    }
    
    /**
     * Скрывает маркеры спавна (для релиза)
     */
    toggleSpawnMarkers(visible: boolean): void {
        for (const marker of this.spawnMarkers) {
            marker.visible = visible;
        }
    }
    
    /**
     * Очищает текущую карту
     */
    clearMap(): void {
        for (const obj of this.loadedObjects) {
            this.scene.remove(obj);
        }
        this.loadedObjects = [];
        
        for (const marker of this.spawnMarkers) {
            this.scene.remove(marker);
        }
        this.spawnMarkers = [];
        
        this.currentMap = null;
        
        console.log('Map cleared');
    }
    
    /**
     * Возвращает текущую карту
     */
    getCurrentMap(): MapConfig | null {
        return this.currentMap;
    }
    
    /**
     * Возвращает точки спавна
     */
    getSpawnPoints(): MapConfig['spawnPoints'] {
        return this.currentMap?.spawnPoints || [];
    }
}