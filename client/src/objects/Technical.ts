import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Techs {
    static getRandomColor() {
        return Math.random() * 0xffffff | 0;
    }
    
    // Кеш для загруженных моделей
    private static modelCache: Map<string, THREE.Group> = new Map();
    private static gltfLoader = new GLTFLoader();
    
    /**
     * Загружает 3D модель и кеширует её
     */
    static async loadModel(path: string): Promise<THREE.Group> {
        // Проверяем кеш
        if (this.modelCache.has(path)) {
            console.log(`Model ${path} loaded from cache`);
            return this.modelCache.get(path)!.clone();
        }
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;

                    // Проходим по всем объектам модели
                    model.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const mesh = child as THREE.Mesh;
                            const material = mesh.material as THREE.MeshStandardMaterial;

                            if (material) {
                                // 1. Убираем металлический блеск
                                material.metalness = 0; 
                                material.shadowSide = THREE.FrontSide; // Считать тени только для лицевой стороны
                                // 2. Делаем поверхность максимально матовой (рассеивающей)
                                material.roughness = 1; 
                                
                                // Дополнительно для "мультяшности":
                                // Отключаем влияние карты окружения, если она есть
                                material.envMapIntensity = 0;
                            }
                        }
                    });

                    this.modelCache.set(path, model);
                    resolve(model.clone());
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100);
                    console.log(`Loading ${path}: ${percent.toFixed(0)}%`);
                },
                (error) => {
                    console.error(`Error loading model ${path}:`, error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Предзагрузка нескольких моделей
     */
    static async preloadModels(paths: string[]): Promise<void> {
        const promises = paths.map(path => this.loadModel(path));
        await Promise.all(promises);
        console.log('All models preloaded');
    }
    
    /**
     * Очистка кеша моделей
     */
    static clearModelCache(): void {
        this.modelCache.clear();
        console.log('Model cache cleared');
    }
}