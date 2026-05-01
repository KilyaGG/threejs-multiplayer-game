import { MapData } from '../rooms/objects/ServerTechnicals.js';
import { testMap } from './test.js';

export const maps: { [key: string]: MapData } = {
    'test_arena': testMap,
};

export function getMap(mapName: string): MapData | null {
    return maps[mapName] || null;
}