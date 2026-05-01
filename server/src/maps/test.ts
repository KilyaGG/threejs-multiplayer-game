import { MapData } from '../rooms/objects/ServerTechnicals.js';

export const testMap: MapData = {
    name: "Test Arena",
    version: "1.0",
    collisionBoxes: [
        // Пол
        {
            position: { x: 0, y: -0.5, z: 0 },
            size: { width: 20, height: 1, depth: 20 }
        },
        // Стены
        {
            position: { x: 0, y: 2, z: -10 },
            size: { width: 20, height: 4, depth: 1 }
        },
        {
            position: { x: 0, y: 2, z: 10 },
            size: { width: 20, height: 4, depth: 1 }
        },
        {
            position: { x: -10, y: 2, z: 0 },
            size: { width: 1, height: 4, depth: 20 }
        },
        {
            position: { x: 10, y: 2, z: 0 },
            size: { width: 1, height: 4, depth: 20 }
        },
        // Препятствия
        {
            position: { x: -3, y: 0.5, z: -3 },
            size: { width: 2, height: 1, depth: 2 }
        },
        {
            position: { x: 3, y: 0.5, z: 3 },
            size: { width: 2, height: 1, depth: 2 }
        },
        {
            position: { x: 0, y: 1, z: 0 },
            size: { width: 3, height: 2, depth: 3 }
        }
    ],
    spawnPoints: [
        { position: { x: -5, y: 30, z: -5 } },
        { position: { x: 5, y: 30, z: -5 } },
        { position: { x: -5, y: 30, z: 5 } },
        { position: { x: 5, y: 30, z: 5 } }
    ],
    boundaries: {
        min: { x: -10, y: -0.5, z: -10 },
        max: { x: 10, y: 5, z: 10 }
    }
};