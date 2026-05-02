import { MapData } from '../rooms/objects/ServerTechnicals.js';
import { testMap } from './test.js';
import { map1 } from './map1.js';

export const maps: { [key: string]: MapData } = {
    'test_arena': testMap,
    'map1': map1
};

export function getMap(mapName: string): MapData | null {
    return maps[mapName] || null;
}