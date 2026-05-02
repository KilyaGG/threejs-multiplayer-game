import type { MapConfig } from '../objects/MapLoader.js';

export const map1Config: MapConfig = {
    name: "Map 1",
    modelPath: '/maps/map1test.glb',
    
    spawnPoints: [
        { position: { x: -5, y: 0.5, z: -5 } },
        { position: { x: 5, y: 0.5, z: -5 } },
        { position: { x: -5, y: 0.5, z: 5 } },
        { position: { x: 5, y: 0.5, z: 5 } }
    ],
    
    environment: {
        ambientLight: {
            color: 0x404040,
            intensity: 0.5
        },
        directionalLight: {
            color: 0xffffff,
            intensity: 0.8,
            position: { x: 10, y: 10, z: 10 }
        },
        fog: {
            color: 0x020205,
            density: 0.01
        }
    },
    
    props: [
        // Пример дополнительных объектов
        // {
        //     modelPath: '/src/models/crate.glb',
        //     position: { x: 2, y: 0, z: 2 },
        //     scale: { x: 1, y: 1, z: 1 }
        // }
    ]
};